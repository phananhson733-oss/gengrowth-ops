import fs from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { captureAccountUsernames, classifyListingResult, classifyProfileStatus, detailMatchesTarget, guardZeroMetrics, isExpiredPost, isPhotoPost, metricCount, parseProfileListing, planCaptureTargets, rotateByDate, runDetailPasses, validateExcludedPostIds, validateMaxPostAgeDays } from "../short-drama-release-manager/src/capture-policy.mjs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";
import { readViewHighWater, saveLocalHistory, syncGoogleSheets } from "./persistence.mjs";
import { reconcileProductionRecords } from "./reconcile_published_content.mjs";
import { syncFeishuFollowerMetrics } from "./feishu_sync.mjs";

// Used only by historical standalone calls; production Runner supplies Base accounts.
const legacyUsernames = [
  "astrologywiki",
  "dramapenelope",
  "miraaastrology",
  "shirley527146",
  "shirley5276973",
  "shirley5278789",
  "dramadetour0",
  "jolienqaq",
  "dramaclips0364",
  "dramavault163",
  "dramaexpedition",
  "ngphnggiang40",
  "lthung263",
  "hnlinhthng9678",
];
const fromRaw = process.argv.includes("--from-raw");
const ageArgument = process.argv.indexOf("--max-post-age-days");
const maxPostAgeDays = validateMaxPostAgeDays(ageArgument === -1 ? undefined : Number(process.argv[ageArgument + 1]));
let registeredTargets = { posts: [], issues: [] };
if (process.argv.includes("--registered-posts-stdin")) {
  const chunks = []; let bytes = 0;
  for await (const chunk of process.stdin) {
    bytes += chunk.length;
    if (bytes > 1024 * 1024) throw new Error("Registered capture targets exceed input limit");
    chunks.push(chunk);
  }
  registeredTargets = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (!registeredTargets || !Array.isArray(registeredTargets.posts) || !Array.isArray(registeredTargets.issues)) throw new Error("Invalid registered capture targets");
}
const usesAccountLedger = process.argv.includes("--registered-posts-stdin");
const excludedPostIds = validateExcludedPostIds(registeredTargets.excluded_post_ids);
const usernames = usesAccountLedger ? captureAccountUsernames(registeredTargets.accounts) : legacyUsernames;
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
      // The deadline covers the body as well as the headers: a stalled body
      // must not hang the whole capture run.
      const timer = setTimeout(() => controller.abort(), 30000);
      let response, text;
      try {
        response = await fetch(url, {
          headers: { "user-agent": userAgent, "accept-language": "en-US,en;q=0.9" },
          redirect: "follow",
          signal: controller.signal,
        });
        text = await response.text();
      } finally {
        clearTimeout(timer);
      }
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
      let response, payload;
      try {
        response = await fetch(
          "https://www.tikwm.com/api/?url=" + encodeURIComponent(photoUrl) + "&hd=1",
          {
            headers: { "user-agent": userAgent, "accept-language": "en-US,en;q=0.9" },
            signal: controller.signal,
          },
        );
        payload = await response.json();
      } finally {
        clearTimeout(timer);
      }
      if (!response.ok || payload?.code !== 0 || !payload?.data?.id) {
        throw new Error("HTTP " + response.status + ", API code=" + payload?.code + ", message=" + payload?.msg);
      }
      await fs.writeFile(destination, JSON.stringify(payload, null, 2) + "\n", "utf8");
      const data = payload.data;
      return {
        id: String(data.id),
        author_username: data.author?.unique_id ?? null,
        timestamp: asNumber(data.create_time),
        description: data.title ?? "",
        view_count: asNumber(data.play_count),
        like_count: asNumber(data.digg_count),
        comment_count: asNumber(data.comment_count),
        save_count: asNumber(data.collect_count),
        repost_count: asNumber(data.share_count),
        // The fallback is reached through a /photo/ URL for every failed video, so
        // the media type must come from the payload itself.
        content_type: Array.isArray(data.images) && data.images.length > 0 ? "photo" : "video",
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

const asNumber = metricCount;

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
const errors = registeredTargets.issues.filter(issue => issue.account_id).map(issue => ({
  username: issue.account_id, stage: "account_registry", code: issue.code,
}));

// The embed page only shows the newest ~10 posts, so discovery also pages
// through the profile with yt-dlp. Only three fields are printed per entry
// (~75 bytes) so a full page set stays far below the spawn buffer.
const LISTING_LIMIT = 300;
const DETAIL_BUDGET_MS = 4 * 60 * 60 * 1000;
// Real photo posts fail every fallback, so the breaker allows a short run of them.
const DETAIL_CIRCUIT_FAILURES = 8;
const LISTING_TIMEOUT_MS = 180000;
const LISTING_MAX_BUFFER = 16 * 1024 * 1024;
const listingCutoffSeconds = (Date.parse(capturedAt) - maxPostAgeDays * 86400000) / 1000;

async function listProfileVideos(username, expectedPosts) {
  const listingPath = path.join(rawDir, username + "_listing.ndjson");
  if (fromRaw) {
    try { return { ...parseProfileListing(await fs.readFile(listingPath, "utf8"), { limit: LISTING_LIMIT, cutoffSeconds: listingCutoffSeconds }), error: null }; }
    catch { return { items: [], rows: 0, truncated: false, error: null }; }
  }
  const result = spawnSync("yt-dlp", [
    "--flat-playlist", "--no-warnings", "--playlist-end", String(LISTING_LIMIT),
    "-O", "%(.{id,timestamp,view_count})j",
    "https://www.tiktok.com/@" + username,
  ], { encoding: "utf8", timeout: LISTING_TIMEOUT_MS, maxBuffer: LISTING_MAX_BUFFER });
  const stdout = result.stdout ?? "";
  const parsed = parseProfileListing(stdout, { limit: LISTING_LIMIT, cutoffSeconds: listingCutoffSeconds });
  // A failed listing must not replace a good file saved earlier the same day.
  if (parsed.rows > 0) await fs.writeFile(listingPath, stdout, "utf8");
  const error = classifyListingResult({ errorCode: result.error ? (result.error.code ?? "spawn_failed") : null, status: result.status,
    signal: result.signal, stderr: result.stderr, username, rows: parsed.rows, truncated: parsed.truncated, expectedPosts });
  return { ...parsed, error, stderr: String(result.stderr ?? "").trim().split("\n").at(-1)?.slice(0, 200) ?? "" };
}

for (const username of usernames) {
  const profilePath = path.join(rawDir, username + "_profile.html");
  const embedPath = path.join(rawDir, username + "_embed.html");
  // Profile, embed and listing fail independently. An account whose entry pages
  // fail still has its already-known posts captured below.
  let profile = null;
  let embed = null;
  try {
    const html = fromRaw ? await fs.readFile(profilePath, "utf8") : await fetchText("https://www.tiktok.com/@" + username, profilePath);
    profile = parseProfile(html);
  } catch (error) {
    errors.push({ username, stage: "account", code: "account_entry_failed", error: String(error).slice(0, 300) });
  }
  const profileStatus = profile === null ? "ok" : classifyProfileStatus(profile?.statusCode);
  const unavailable = profileStatus === "unavailable";
  if (profileStatus !== "ok") {
    // Unavailable: TikTok reports the account itself as gone (banned, deleted
    // or private), so discovery is pointless. Any other code only means this
    // page read failed; the embed page and the listing are still tried.
    const statusCode = Number(profile.statusCode);
    errors.push({ username, stage: "account", code: unavailable ? "account_unavailable" : "account_entry_failed",
      status_code: Number.isFinite(statusCode) ? statusCode : String(profile.statusCode).slice(0, 32) });
    profile = null;
  } else if (profile !== null && !profile?.userInfo) {
    // The page loaded but carries no account data (a changed layout or a wall).
    errors.push({ username, stage: "account", code: "account_entry_failed", error: "profile page without account data" });
    profile = null;
  }
  if (!fromRaw) await sleep(3000);
  if (!unavailable) {
    try {
      const html = fromRaw ? await fs.readFile(embedPath, "utf8") : await fetchText("https://www.tiktok.com/embed/@" + username, embedPath);
      embed = parseEmbed(html) ?? null;
      if (!embed) errors.push({ username, stage: "embed", code: "account_entry_failed", error: "embed page without account data" });
    } catch (error) {
      errors.push({ username, stage: "embed", code: "account_entry_failed", error: String(error).slice(0, 300) });
    }
    if (!fromRaw) await sleep(3000);
  }
  let listing = { items: [], rows: 0, truncated: false, error: null };
  if (!unavailable) {
    listing = await listProfileVideos(username, asNumber(profile?.userInfo?.stats?.videoCount));
    if (listing.error) errors.push({ username, stage: "listing", code: listing.error, rows: listing.rows, detail: listing.stderr || undefined });
  }
  sourceAccounts.push({ username, profile, embed, listing: listing.items, entryOk: Boolean(profile?.userInfo || embed?.userInfo) });
}

if (fromRaw && !sourceAccounts.some((account) => account.entryOk)) {
  throw new Error(`No readable raw TikTok account files found in ${rawDir}. Run a live capture first, then replay the same Beijing-date raw directory.`);
}

// Read historical identities and publication dates only, never copy stored metrics.
let knownPosts = [];
// Highest stored views per post are read only to recognise a suspicious drop
// to zero below; they are never written back as this run's metrics.
let previousViews = new Map();
const metricsPath = path.join(outputDir, "tiktok_metrics.sqlite");
try {
  await fs.access(metricsPath);
  const history = new DatabaseSync(metricsPath, { readOnly: true });
  try {
    knownPosts = history.prepare("SELECT post_id,username,post_url,published_at,caption FROM posts").all();
    previousViews = readViewHighWater(history, { captureDate, capturedAt });
  }
  finally { history.close(); }
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const targetPlan = planCaptureTargets({ accounts: sourceAccounts, knownPosts: [...registeredTargets.posts, ...knownPosts], now: capturedAt, maxAgeDays: maxPostAgeDays, excludedPostIds });
const skippedAfterDiscovery = [];
const expiredMetadata = [];
for (const account of sourceAccounts) account.captureTargets = targetPlan.targets.filter(item => item.username === account.username);
const detailPath = path.join(rawDir, "post_details.ndjson");
let detailRows = [];
if (fromRaw) {
  try {
    const text = await fs.readFile(detailPath, "utf8");
    detailRows = text.split(/\n/).filter(Boolean).map((line) => JSON.parse(line));
  } catch {}
} else {
  const fetchDetail = async (account, item) => {
    const detailsBefore = detailRows.length;
    const videoUrl = "https://www.tiktok.com/@" + account.username + "/video/" + item.id;
    const result = spawnSync("yt-dlp", [
      "--dump-single-json",
      "--skip-download",
      "--no-warnings",
      "--no-progress",
      videoUrl,
    ], { encoding: "utf8", timeout: 60000, maxBuffer: 16 * 1024 * 1024 });
    if (result.status === 0 && result.stdout.trim()) {
      try {
        detailRows.push(JSON.parse(result.stdout.trim().split(/\n/).at(-1)));
      } catch (error) {
        errors.push({ username: account.username, post_id: item.id, stage: "detail_parse", error: String(error) });
      }
    } else {
      const photoUrl = "https://www.tiktok.com/@" + account.username + "/photo/" + item.id;
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
    return detailRows.length > detailsBefore;
  };
  // Skipped posts are reported, not hidden.
  const skippedDetails = await runDetailPasses({
    accounts: rotateByDate(sourceAccounts, captureDate), deadlineMs: Date.parse(capturedAt) + DETAIL_BUDGET_MS,
    maxConsecutiveFailures: DETAIL_CIRCUIT_FAILURES, fetchDetail,
  });
  for (const { username, code, skipped } of skippedDetails) errors.push({ username, stage: "detail", code, skipped });
  await fs.writeFile(detailPath, detailRows.map((row) => JSON.stringify(row)).join("\n") + "\n", "utf8");
}

const detailById = new Map(detailRows.map((row) => [String(row.id), row]));
const accounts = [];
const posts = [];

for (const account of sourceAccounts) {
  // Without a readable profile or embed there is no fresh account snapshot;
  // the previous one stays in SQLite, but known posts are still captured.
  if (account.entryOk) {
    const userInfo = account.profile?.userInfo || {};
    const embedUser = account.embed?.userInfo || {};
    const user = userInfo.user || embedUser;
    const stats = userInfo.stats || {};
    accounts.push({
      account_url: "https://www.tiktok.com/@" + account.username,
      username: account.username,
      nickname: user.nickname ?? embedUser.nickname ?? "",
      followers: asNumber(stats.followerCount ?? embedUser.followerCount),
      following: asNumber(stats.followingCount ?? embedUser.followingCount),
      total_likes: asNumber(stats.heartCount ?? embedUser.heartCount),
      total_posts: asNumber(stats.videoCount),
      bio: user.signature ?? embedUser.signature ?? "",
      captured_at: capturedAt,
    });
  }

  for (const item of account.captureTargets) {
    const detail = detailById.get(String(item.id));
    if (detail && !detailMatchesTarget(detail, item)) {
      errors.push({ username: account.username, post_id: item.id, stage: "identity", code: "capture_identity_mismatch" });
      continue;
    }
    if (!detail && item.playCount === undefined) {
      errors.push({ username: account.username, post_id: item.id, stage: "detail", code: "detail_unavailable" });
      continue;
    }
    const isPhoto = isPhotoPost(detail, item.known_url);
    const publishedAt = detail?.timestamp ? new Date(detail.timestamp * 1000).toISOString() : item.published_at;
    if (isExpiredPost(publishedAt, capturedAt, maxPostAgeDays)) {
      skippedAfterDiscovery.push({ username: account.username, post_id: String(item.id), published_at: publishedAt, reason: "older_than_capture_window" });
      expiredMetadata.push({ username: account.username, post_id: String(item.id), published_at: publishedAt,
        post_url: `https://www.tiktok.com/@${account.username}/${isPhoto ? "photo" : "video"}/${item.id}`,
        content_type: isPhoto ? "photo" : "video", caption: detail?.description ?? item.desc ?? "" });
      continue;
    }
    const listedViews = asNumber(item.playCount);
    const previousMaxViews = previousViews.get(String(item.id)) ?? null;
    const { metrics, suspect } = guardZeroMetrics({
      views: asNumber(detail?.view_count) ?? listedViews,
      likes: asNumber(detail?.like_count),
      comments: asNumber(detail?.comment_count),
      favorites: asNumber(detail?.save_count),
      shares: asNumber(detail?.repost_count),
    }, { previousMaxViews, listedViews });
    if (suspect) errors.push({ username: account.username, post_id: String(item.id), stage: "detail", code: "metrics_zero_suspect", previous_views: previousMaxViews, listed_views: listedViews });
    posts.push({
      username: account.username,
      post_id: String(item.id),
      post_url: isPhoto
        ? "https://www.tiktok.com/@" + account.username + "/photo/" + item.id
        : "https://www.tiktok.com/@" + account.username + "/video/" + item.id,
      content_type: isPhoto ? "photo" : (detail ? "video" : "unknown"),
      published_at: publishedAt,
      caption: detail?.description ?? item.desc ?? "",
      ...metrics,
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
  metadataOnlyPosts: expiredMetadata,
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
    range: sheetName === "accounts" ? `A1:I${Math.min(accountValues.length, 21)}` : `A1:L${Math.min(postValues.length, 21)}`,
    scale: 1,
    format: "png",
  });
  await fs.writeFile(path.join(rawDir, "qa_" + sheetName + ".png"), new Uint8Array(await preview.arrayBuffer()));
}

const feishu = await syncFeishuFollowerMetrics({
  dbPath: localHistory.database_path,
  runId: localHistory.run_id,
  scriptDir,
});

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
  capture_policy: {
    max_age_days: maxPostAgeDays,
    excluded_post_ids: excludedPostIds,
    account_source: usesAccountLedger ? "base_account_ledger" : "legacy_standalone",
    registered_posts: registeredTargets.posts.length,
    registered_issues: registeredTargets.issues,
    cutoff: new Date(Date.parse(capturedAt) - maxPostAgeDays * 86400000).toISOString(),
    detail_targets: targetPlan.targets.length,
    skipped_expired: targetPlan.skipped.filter(item => item.reason === "older_than_capture_window").length + skippedAfterDiscovery.length,
    skipped_excluded: targetPlan.skipped.filter(item => item.reason === "excluded_post_id").length,
    skipped: [...targetPlan.skipped, ...skippedAfterDiscovery],
    unknown_publication_date: posts.filter(post => !post.published_at).length,
  },
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
  feishu,
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
