import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";
import { saveLocalHistory, syncGoogleSheets } from "./persistence.mjs";
import { reconcileProductionRecords } from "./reconcile_published_content.mjs";

const usernames = ["astrologywiki", "shirley527146", "miraaastrology", "filestarsx"];
const fromRaw = process.argv.includes("--from-raw");
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../../..");
const outputDir = path.join(repoRoot, "inbox-pengman", "output");
const captureDate = (() => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type).value;
  return get("year") + "-" + get("month") + "-" + get("day");
})();
const rawDir = path.join(outputDir, "raw", "tiktok_" + captureDate);
const capturedAt = new Date().toISOString();
const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/138.0.0.0 Safari/537.36";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchText(url, destination) {
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      const response = await fetch(url, {
        headers: { "user-agent": userAgent, "accept-language": "en-US,en;q=0.9" },
        redirect: "follow",
        signal: controller.signal,
      });
      clearTimeout(timer);
      const text = await response.text();
      if (!response.ok || text.length < 1000) {
        throw new Error("HTTP " + response.status + ", bytes=" + text.length);
      }
      await fs.writeFile(destination, text, "utf8");
      return text;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await sleep(3000);
    }
  }
  throw lastError;
}

async function fetchPhotoDetail(photoUrl, destination) {
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      const response = await fetch(
        "https://www.tikwm.com/api/?url=" + encodeURIComponent(photoUrl) + "&hd=1",
        {
          headers: { "user-agent": userAgent, "accept-language": "en-US,en;q=0.9" },
          signal: controller.signal,
        },
      );
      clearTimeout(timer);
      const payload = await response.json();
      if (!response.ok || payload?.code !== 0 || !payload?.data?.id) {
        throw new Error("HTTP " + response.status + ", API code=" + payload?.code + ", message=" + payload?.msg);
      }
      await fs.writeFile(destination, JSON.stringify(payload, null, 2) + "\n", "utf8");
      const data = payload.data;
      return {
        id: String(data.id),
        timestamp: asNumber(data.create_time),
        description: data.title ?? "",
        view_count: asNumber(data.play_count),
        like_count: asNumber(data.digg_count),
        comment_count: asNumber(data.comment_count),
        save_count: asNumber(data.collect_count),
        repost_count: asNumber(data.share_count),
        extractor: "tikwm-photo-fallback",
        webpage_url: photoUrl,
      };
    } catch (error) {
      lastError = error;
      if (attempt < 2) await sleep(3000);
    }
  }
  throw lastError;
}

function parseScriptJson(html, id) {
  const re = new RegExp("<script[^>]+id=[\\\"']" + id + "[\\\"'][^>]*>([\\s\\S]*?)<\\/script>");
  const match = html.match(re);
  if (!match) throw new Error("Missing script #" + id);
  return JSON.parse(match[1]);
}

function parseEmbed(html) {
  const state = parseScriptJson(html, "__FRONTITY_CONNECT_STATE__");
  return Object.values(state.source.data).find((value) => value && value.pageName === "creator");
}

function parseProfile(html) {
  const state = parseScriptJson(html, "__UNIVERSAL_DATA_FOR_REHYDRATION__");
  return state.__DEFAULT_SCOPE__["webapp.user-detail"];
}

function asNumber(value) {
  return value === null || value === undefined || value === "" ? null : Number(value);
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const text = value instanceof Date ? value.toISOString() : String(value);
  return /[",\n\r]/.test(text) ? "\"" + text.replaceAll("\"", "\"\"") + "\"" : text;
}

async function writeCsv(filePath, headers, rows) {
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(headers.map((header) => csvEscape(row[header])).join(","));
  await fs.writeFile(filePath, "\uFEFF" + lines.join("\n") + "\n", "utf8");
}

await fs.mkdir(rawDir, { recursive: true });
await fs.mkdir(outputDir, { recursive: true });

const sourceAccounts = [];
const errors = [];

for (const username of usernames) {
  try {
    let profileHtml;
    let embedHtml;
    const profilePath = path.join(rawDir, username + "_profile.html");
    const embedPath = path.join(rawDir, username + "_embed.html");
    if (fromRaw) {
      [profileHtml, embedHtml] = await Promise.all([
        fs.readFile(profilePath, "utf8"),
        fs.readFile(embedPath, "utf8"),
      ]);
    } else {
      profileHtml = await fetchText("https://www.tiktok.com/@" + username, profilePath);
      await sleep(3000);
      embedHtml = await fetchText("https://www.tiktok.com/embed/@" + username, embedPath);
      await sleep(3000);
    }
    sourceAccounts.push({
      username,
      profile: parseProfile(profileHtml),
      embed: parseEmbed(embedHtml),
    });
  } catch (error) {
    errors.push({ username, stage: "account", error: String(error) });
  }
}

if (fromRaw && sourceAccounts.length === 0) {
  throw new Error(`No readable raw TikTok account files found in ${rawDir}. Run a live capture first, then replay the same Beijing-date raw directory.`);
}

const detailPath = path.join(rawDir, "post_details.ndjson");
let detailRows = [];
if (fromRaw) {
  try {
    const text = await fs.readFile(detailPath, "utf8");
    detailRows = text.split(/\n/).filter(Boolean).map((line) => JSON.parse(line));
  } catch {}
} else {
  for (const account of sourceAccounts) {
    for (const item of account.embed.videoList || []) {
      const videoUrl = "https://www.tiktok.com/@" + account.username + "/video/" + item.id;
      const result = spawnSync("yt-dlp", [
        "--dump-single-json",
        "--skip-download",
        "--no-warnings",
        "--no-progress",
        videoUrl,
      ], { encoding: "utf8", timeout: 60000 });
      if (result.status === 0 && result.stdout.trim()) {
        try {
          detailRows.push(JSON.parse(result.stdout.trim().split(/\n/).at(-1)));
        } catch (error) {
          errors.push({ username: account.username, post_id: item.id, stage: "detail_parse", error: String(error) });
        }
      } else {
        const photoUrl = "https://www.tiktok.com/@" + account.username + "/photo/" + item.id;
        try {
          await fetchText(photoUrl, path.join(rawDir, account.username + "_" + item.id + ".html"));
        } catch (error) {
          errors.push({ username: account.username, post_id: item.id, stage: "photo_fallback", error: String(error) });
        }
        try {
          const photoDetail = await fetchPhotoDetail(
            photoUrl,
            path.join(rawDir, account.username + "_" + item.id + "_photo_detail.json"),
          );
          detailRows.push(photoDetail);
        } catch (error) {
          errors.push({ username: account.username, post_id: item.id, stage: "photo_detail", error: String(error) });
        }
      }
      await sleep(2000);
    }
  }
  await fs.writeFile(detailPath, detailRows.map((row) => JSON.stringify(row)).join("\n") + "\n", "utf8");
}

const detailById = new Map(detailRows.map((row) => [String(row.id), row]));
const accounts = [];
const posts = [];

for (const account of sourceAccounts) {
  const userInfo = account.profile.userInfo || {};
  const user = userInfo.user || account.embed.userInfo || {};
  const stats = userInfo.stats || {};
  accounts.push({
    account_url: "https://www.tiktok.com/@" + account.username,
    username: account.username,
    nickname: user.nickname ?? account.embed.userInfo.nickname ?? "",
    followers: asNumber(stats.followerCount ?? account.embed.userInfo.followerCount),
    following: asNumber(stats.followingCount ?? account.embed.userInfo.followingCount),
    total_likes: asNumber(stats.heartCount ?? account.embed.userInfo.heartCount),
    total_posts: asNumber(stats.videoCount),
    bio: user.signature ?? account.embed.userInfo.signature ?? "",
    captured_at: capturedAt,
  });

  for (const item of account.embed.videoList || []) {
    const detail = detailById.get(String(item.id));
    const photoFile = path.join(rawDir, account.username + "_" + item.id + ".html");
    let isPhoto = false;
    try {
      await fs.access(photoFile);
      isPhoto = true;
    } catch {}
    posts.push({
      username: account.username,
      post_id: String(item.id),
      post_url: isPhoto
        ? "https://www.tiktok.com/@" + account.username + "/photo/" + item.id
        : "https://www.tiktok.com/@" + account.username + "/video/" + item.id,
      content_type: isPhoto ? "photo" : (detail ? "video" : "unknown"),
      published_at: detail && detail.timestamp ? new Date(detail.timestamp * 1000).toISOString() : null,
      caption: detail?.description ?? item.desc ?? "",
      views: asNumber(detail?.view_count ?? item.playCount),
      likes: asNumber(detail?.like_count),
      comments: asNumber(detail?.comment_count),
      favorites: asNumber(detail?.save_count),
      shares: asNumber(detail?.repost_count),
      captured_at: capturedAt,
    });
  }
}

const dedupedPosts = [...new Map(posts.map((post) => [post.post_id, post])).values()];
posts.length = 0;
posts.push(...dedupedPosts);

posts.sort((a, b) => {
  if (a.username !== b.username) return a.username.localeCompare(b.username);
  return (b.published_at || "").localeCompare(a.published_at || "");
});

const accountHeaders = [
  "account_url", "username", "nickname", "followers", "following",
  "total_likes", "total_posts", "bio", "captured_at",
];
const postHeaders = [
  "username", "post_id", "post_url", "content_type", "published_at", "caption",
  "views", "likes", "comments", "favorites", "shares", "captured_at",
];

await writeCsv(path.join(outputDir, "accounts_" + captureDate + ".csv"), accountHeaders, accounts);
await writeCsv(path.join(outputDir, "posts_" + captureDate + ".csv"), postHeaders, posts);

const localHistory = saveLocalHistory({
  outputDir,
  snapshotDate: captureDate,
  capturedAt,
  usernames,
  accounts,
  posts,
  errors,
});

const workbook = Workbook.create();
const accountSheet = workbook.worksheets.add("accounts");
const postSheet = workbook.worksheets.add("posts");

const accountValues = [
  accountHeaders,
  ...accounts.map((row) => accountHeaders.map((header) => {
    if (header === "captured_at") return new Date(row[header]);
    return row[header];
  })),
];
const postValues = [
  postHeaders,
  ...posts.map((row) => postHeaders.map((header) => {
    if ((header === "published_at" || header === "captured_at") && row[header]) return new Date(row[header]);
    return row[header];
  })),
];

accountSheet.getRangeByIndexes(0, 0, accountValues.length, accountHeaders.length).values = accountValues;
postSheet.getRangeByIndexes(0, 0, postValues.length, postHeaders.length).values = postValues;
if (posts.length > 0) {
  postSheet.getRangeByIndexes(1, 1, posts.length, 1).formulas = posts.map((row) => ["=\"" + row.post_id + "\""]);
}

for (const sheet of [accountSheet, postSheet]) {
  sheet.showGridLines = false;
  sheet.freezePanes.freezeRows(1);
}
const headerStyle = {
  fill: "#111827",
  font: { bold: true, color: "#FFFFFF" },
  verticalAlignment: "center",
  wrapText: true,
  borders: { preset: "outside", style: "thin", color: "#6B7280" },
};
accountSheet.getRange("A1:I1").format = headerStyle;
postSheet.getRange("A1:L1").format = headerStyle;
accountSheet.getRange("A1:I" + accountValues.length).format.autofitRows();
postSheet.getRange("A1:L" + postValues.length).format.autofitRows();

if (accounts.length > 0) {
  accountSheet.getRange("D2:G" + accountValues.length).format.numberFormat = "#,##0";
  accountSheet.getRange("I2:I" + accountValues.length).format.numberFormat = "yyyy-mm-dd hh:mm";
}
if (posts.length > 0) {
  postSheet.getRange("G2:K" + postValues.length).format.numberFormat = "#,##0";
  postSheet.getRange("E2:E" + postValues.length).format.numberFormat = "yyyy-mm-dd hh:mm";
  postSheet.getRange("L2:L" + postValues.length).format.numberFormat = "yyyy-mm-dd hh:mm";
}

accountSheet.getRange("A:A").format.columnWidth = 34;
accountSheet.getRange("B:B").format.columnWidth = 18;
accountSheet.getRange("C:C").format.columnWidth = 20;
accountSheet.getRange("D:G").format.columnWidth = 13;
accountSheet.getRange("H:H").format.columnWidth = 46;
if (accounts.length > 0) accountSheet.getRange("H2:H" + accountValues.length).format.wrapText = true;
accountSheet.getRange("I:I").format.columnWidth = 22;

postSheet.getRange("A:A").format.columnWidth = 18;
postSheet.getRange("B:B").format.columnWidth = 22;
if (posts.length > 0) postSheet.getRange("B2:B" + postValues.length).format.numberFormat = "@";
postSheet.getRange("C:C").format.columnWidth = 46;
postSheet.getRange("D:D").format.columnWidth = 14;
postSheet.getRange("E:E").format.columnWidth = 20;
postSheet.getRange("F:F").format.columnWidth = 72;
if (posts.length > 0) {
  postSheet.getRange("F2:F" + postValues.length).format.wrapText = true;
  postSheet.getRange("A2:L" + postValues.length).format.rowHeight = 54;
}
postSheet.getRange("G:K").format.columnWidth = 12;
postSheet.getRange("L:L").format.columnWidth = 22;

if (accounts.length > 0) accountSheet.tables.add("A1:I" + accountValues.length, true, "TikTokAccounts");
if (posts.length > 0) postSheet.tables.add("A1:L" + postValues.length, true, "TikTokPosts");

const accountCheck = await workbook.inspect({ kind: "table", range: "accounts!A1:I5", include: "values,formulas", tableMaxRows: 10, tableMaxCols: 12 });
const postCheck = await workbook.inspect({ kind: "table", range: "posts!A1:L20", include: "values,formulas", tableMaxRows: 25, tableMaxCols: 15, maxChars: 12000 });
const formulaErrors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 100 }, summary: "formula error scan" });
console.log(accountCheck.ndjson);
console.log(postCheck.ndjson);
console.log(formulaErrors.ndjson);

const xlsxPath = path.join(outputDir, "tiktok_account_data_" + captureDate + ".xlsx");
const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(xlsxPath);

for (const sheetName of ["accounts", "posts"]) {
  const preview = await workbook.render({
    sheetName,
    autoCrop: "all",
    scale: 1,
    format: "png",
  });
  await fs.writeFile(path.join(rawDir, "qa_" + sheetName + ".png"), new Uint8Array(await preview.arrayBuffer()));
}

const googleSheets = await syncGoogleSheets({
  dbPath: localHistory.database_path,
  runId: localHistory.run_id,
  scriptDir,
});

let productionSync;
try {
  const report = await reconcileProductionRecords({
    dbPath: localHistory.database_path,
    vaultRoot: path.join(repoRoot, "inbox-pengman"),
    checkedAt: capturedAt,
    reportPath: path.join(outputDir, "publish_sync_" + captureDate + ".json"),
  });
  productionSync = {
    status: "success",
    counts: report.counts,
    report: path.join(outputDir, "publish_sync_" + captureDate + ".json"),
  };
} catch (error) {
  productionSync = {
    status: "failed",
    error: error instanceof Error ? error.message : String(error),
  };
}

const summary = {
  run_id: localHistory.run_id,
  captured_at: capturedAt,
  capture_date: captureDate,
  accounts_requested: usernames,
  accounts_successful: accounts.map((row) => row.username),
  account_count: accounts.length,
  post_count: posts.length,
  posts_by_account: Object.fromEntries(usernames.map((username) => [
    username,
    posts.filter((row) => row.username === username).length,
  ])),
  detail_complete_posts: posts.filter((row) => row.likes !== null).length,
  partial_posts: posts.filter((row) => row.likes === null).length,
  errors,
  local_history: localHistory,
  google_sheets: googleSheets,
  production_sync: productionSync,
  files: {
    xlsx: xlsxPath,
    accounts_csv: path.join(outputDir, "accounts_" + captureDate + ".csv"),
    posts_csv: path.join(outputDir, "posts_" + captureDate + ".csv"),
    raw_dir: rawDir,
    sqlite: localHistory.database_path,
  },
};
await fs.writeFile(path.join(outputDir, "capture_summary_" + captureDate + ".json"), JSON.stringify(summary, null, 2) + "\n", "utf8");

console.log(JSON.stringify(summary, null, 2));
