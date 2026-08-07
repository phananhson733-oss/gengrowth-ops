import fs from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const DEFAULT_TIMEZONE = "America/Los_Angeles";
const PRODUCTION_DIRS = [
  "04-production/07-content-production",
];
const IGNORE_NAME = /(README|Candidate|Prompt|候选|共享|已合并旧稿)/i;
const STOPWORDS = new Set([
  "about", "after", "again", "already", "also", "and", "are", "astrology", "astrologywiki",
  "because", "been", "before", "but", "chart", "content", "does", "every", "for", "from",
  "full", "have", "how", "into", "just", "make", "more", "post", "sign", "that", "the",
  "their", "them", "they", "this", "tiktok", "video", "what", "when", "where", "why",
  "will", "with", "you", "your", "zodiac",
]);

function scalar(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.*?)\\s*$`, "m"));
  if (!match) return "";
  const value = match[1].trim();
  if (!value || value === "null" || value === "~") return "";
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    try {
      return value.startsWith('"') ? JSON.parse(value) : value.slice(1, -1).replaceAll("''", "'");
    } catch {
      return value.slice(1, -1);
    }
  }
  return value.replace(/\s+#.*$/, "").trim();
}

function yamlValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return JSON.stringify(String(value));
}

function setScalar(frontmatter, key, value) {
  const nextLine = `${key}: ${yamlValue(value)}`;
  const pattern = new RegExp(`^${key}:.*$`, "m");
  if (pattern.test(frontmatter)) return frontmatter.replace(pattern, nextLine);
  return `${frontmatter.replace(/\s+$/, "")}\n${nextLine}\n`;
}

function frontmatterParts(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return null;
  return {
    body: match[1],
    prefixLength: match[0].length,
    eol: match[0].includes("\r\n") ? "\r\n" : "\n",
  };
}

function postIdFromUrl(value) {
  return String(value || "").match(/\/(?:video|photo)\/(\d+)/i)?.[1] || "";
}

function usernameFromUrl(value) {
  return String(value || "").match(/tiktok\.com\/@([^/?#]+)/i)?.[1]?.toLowerCase() || "";
}

function accountUsername(frontmatter) {
  const directUrl = scalar(frontmatter, "published_url");
  const directHandle = `${scalar(frontmatter, "account")} ${scalar(frontmatter, "scheduled_account")}`
    .match(/@([a-z0-9._]+)/i)?.[1]?.toLowerCase();
  if (directHandle) return directHandle;
  const fromUrl = usernameFromUrl(directUrl);
  if (fromUrl) return fromUrl;
  const text = `${scalar(frontmatter, "account")} ${scalar(frontmatter, "scheduled_account")}`.toLowerCase();
  if (/astrologywiki|①|官方/.test(text)) return "astrologywiki";
  if (/miraaastrology|②|ai 占星师/.test(text)) return "miraaastrology";
  if (/filestarsx|③|热点占星/.test(text)) return "filestarsx";
  if (/shirley527146|④|普通占星|素人/.test(text)) return "shirley527146";
  return "";
}

function stem(token) {
  if (token.length > 5 && token.endsWith("ing")) return token.slice(0, -3);
  if (token.length > 4 && token.endsWith("ed")) return token.slice(0, -2);
  if (token.length > 4 && token.endsWith("es")) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith("s")) return token.slice(0, -1);
  return token;
}

function tokens(value) {
  return new Set(
    String(value || "")
      .normalize("NFKD")
      .toLowerCase()
      .replace(/https?:\/\/\S+/g, " ")
      .replace(/[^a-z0-9\u3400-\u9fff]+/g, " ")
      .split(/\s+/)
      .map(stem)
      .filter((token) => token.length > 2 && !STOPWORDS.has(token)),
  );
}

function textMatch(expected, actual) {
  const expectedTokens = tokens(expected);
  const actualTokens = tokens(actual);
  const shared = [...expectedTokens].filter((token) => actualTokens.has(token));
  const denominator = Math.max(1, Math.min(expectedTokens.size, actualTokens.size, 10));
  return { score: shared.length / denominator, shared };
}

function bodySignals(text) {
  const signals = [];
  for (const match of text.matchAll(/(?:Hook|Description|Caption)[^`\n]{0,80}`([^`\n]{8,300})`/gi)) {
    signals.push(match[1]);
  }
  for (const match of text.matchAll(/^[-*]\s+\*\*(?:Hook|Description|Caption)[^*]*\*\*[:：]\s*(.+)$/gim)) {
    signals.push(match[1]);
  }
  for (const match of text.matchAll(/^##+\s+(?:TikTok Description|Caption)[^\n]*\n+([\s\S]{0,500}?)(?=\n##|\n---|$)/gim)) {
    signals.push(match[1].replace(/[`#>*_[\]()]/g, " "));
  }
  return signals.join(" ");
}

function expectedText(frontmatter, filename, text) {
  return [
    scalar(frontmatter, "title"),
    scalar(frontmatter, "hook"),
    scalar(frontmatter, "topic"),
    scalar(frontmatter, "pillar"),
    scalar(frontmatter, "series"),
    filename.replace(/^\d{4}-\d{2}-\d{2}\s*/, "").replace(/内容生产记录|视频制作方案|制作方案/g, ""),
    bodySignals(text),
  ].filter(Boolean).join(" ");
}

function dateAnchor(frontmatter) {
  for (const key of ["scheduled_at", "scheduled_publish_at", "published_at"]) {
    const value = scalar(frontmatter, key);
    if (!value) continue;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return { date: parsed, precision: "time", key };
  }
  for (const key of ["publish_date", "planned_publish", "published_date"]) {
    const value = scalar(frontmatter, key);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) continue;
    const parsed = new Date(`${value}T12:00:00`);
    if (!Number.isNaN(parsed.getTime())) return { date: parsed, precision: "date", key };
  }
  return null;
}

function hoursBetween(left, right) {
  return Math.abs(left.getTime() - right.getTime()) / 3_600_000;
}

function laDate(value) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DEFAULT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const get = (type) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

async function markdownFiles(root) {
  const files = [];
  async function visit(directory) {
    let entries = [];
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!/(已合并旧稿|历史记录)/.test(entry.name)) await visit(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".md") && !IGNORE_NAME.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  for (const relative of PRODUCTION_DIRS) await visit(path.join(root, relative));
  return [...new Set(files)];
}

function latestPosts(db) {
  return db.prepare([
    "SELECT p.post_id,p.username,p.post_url,p.content_type,p.published_at,p.caption,",
    "s.captured_at,s.views,s.likes,s.comments,s.favorites,s.shares",
    "FROM posts p JOIN post_snapshots s ON s.post_id=p.post_id",
    "WHERE s.snapshot_date=(SELECT MAX(snapshot_date) FROM post_snapshots x WHERE x.post_id=p.post_id)",
    "ORDER BY COALESCE(p.published_at,'') DESC",
  ].join(" ")).all().map((row) => ({ ...row, post_id: String(row.post_id) }));
}

function chooseCandidate(note, posts, claimedIds) {
  const existingId = scalar(note.frontmatter, "platform_post_id") ||
    postIdFromUrl(scalar(note.frontmatter, "published_url"));
  if (existingId) {
    const exact = posts.find((post) => post.post_id === existingId);
    return exact ? { post: exact, method: "exact_id_or_url", confidence: 1 } : null;
  }

  const requestedId = scalar(note.frontmatter, "publish_match_post_id");
  if (requestedId) {
    const exact = posts.find((post) => post.post_id === requestedId);
    return exact ? { post: exact, method: "explicit_match_id", confidence: 1 } : null;
  }

  const username = accountUsername(note.frontmatter);
  if (!username) return null;
  const anchor = dateAnchor(note.frontmatter);
  const expected = expectedText(note.frontmatter, note.filename, note.text);
  const candidates = posts
    .filter((post) => post.username.toLowerCase() === username && !claimedIds.has(post.post_id))
    .map((post) => {
      const match = textMatch(expected, post.caption);
      const published = post.published_at ? new Date(post.published_at) : null;
      const hours = anchor && published && !Number.isNaN(published.getTime())
        ? hoursBetween(anchor.date, published)
        : null;
      return { post, ...match, hours };
    })
    .filter((item) => item.hours === null || item.hours <= (anchor?.precision === "time" ? 72 : 96))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return (left.hours ?? Number.MAX_SAFE_INTEGER) - (right.hours ?? Number.MAX_SAFE_INTEGER);
    });
  if (!candidates.length) return null;

  const best = candidates[0];
  const second = candidates[1];
  const margin = best.score - (second?.score || 0);
  const preciseTime = anchor?.precision === "time" && best.hours !== null && best.hours <= 6 &&
    (!second || second.hours === null || best.hours * 2 < second.hours);
  const strongText = best.shared.length >= 2 && best.score >= 0.45 && margin >= 0.12;
  const datedText = anchor && best.shared.length >= 3 && best.score >= 0.3 && margin >= 0.1;
  if (preciseTime || strongText || datedText) {
    const confidence = Math.min(0.99, 0.55 + best.score * 0.35 + (preciseTime ? 0.2 : 0));
    return {
      post: best.post,
      method: preciseTime ? "account_time" : "account_caption",
      confidence,
      evidence: {
        shared_tokens: best.shared,
        text_score: Number(best.score.toFixed(3)),
        hours_from_anchor: best.hours === null ? null : Number(best.hours.toFixed(2)),
        anchor_field: anchor?.key || null,
      },
    };
  }
  return {
    ambiguous: true,
    candidates: candidates.slice(0, 3).map((item) => ({
      post_id: item.post.post_id,
      post_url: item.post.post_url,
      caption: item.post.caption,
      shared_tokens: item.shared,
      text_score: Number(item.score.toFixed(3)),
      hours_from_anchor: item.hours === null ? null : Number(item.hours.toFixed(2)),
    })),
  };
}

function updatedFrontmatter(frontmatter, post, sync) {
  const checkedAt = sync.checkedAt;
  const alreadyLinked =
    scalar(frontmatter, "content_stage").toLowerCase() === "published" &&
    scalar(frontmatter, "platform_post_id") === post.post_id &&
    scalar(frontmatter, "published_url") === post.post_url;
  const values = {
    content_stage: "published",
    published_url: post.post_url,
    platform_post_id: post.post_id,
    published_at: post.published_at || checkedAt,
    published_date: laDate(post.published_at || checkedAt),
    publish_sync_status: "matched",
    publish_sync_method: scalar(frontmatter, "publish_sync_method") || sync.method,
    publish_sync_last_checked_at: scalar(frontmatter, "publish_sync_last_checked_at") || checkedAt,
    updated: alreadyLinked ? (scalar(frontmatter, "updated") || laDate(checkedAt)) : laDate(checkedAt),
  };
  let next = frontmatter;
  for (const [key, value] of Object.entries(values)) next = setScalar(next, key, value);
  return next;
}

export async function reconcileProductionRecords({
  dbPath,
  vaultRoot,
  checkedAt = new Date().toISOString(),
  dryRun = false,
  reportPath = "",
}) {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  const posts = latestPosts(db);
  db.close();

  const files = await markdownFiles(vaultRoot);
  const notes = [];
  for (const filePath of files) {
    const text = await fs.readFile(filePath, "utf8");
    const parts = frontmatterParts(text);
    if (!parts) continue;
    const type = scalar(parts.body, "type");
    const contentId = scalar(parts.body, "content_id");
    if (!contentId && !/content-production|video-production-guide|daily-content-package/i.test(type)) continue;
    notes.push({
      filePath,
      filename: path.basename(filePath, ".md"),
      text,
      parts,
      frontmatter: parts.body,
    });
  }

  const claimedIds = new Set();
  for (const note of notes) {
    const id = scalar(note.frontmatter, "platform_post_id") ||
      postIdFromUrl(scalar(note.frontmatter, "published_url")) ||
      scalar(note.frontmatter, "publish_match_post_id");
    if (id) claimedIds.add(id);
  }

  const matched = [];
  const ambiguous = [];
  const unmatched = [];
  for (const note of notes) {
    const result = chooseCandidate(note, posts, claimedIds);
    const relativePath = path.relative(vaultRoot, note.filePath);
    if (!result) {
      const stage = scalar(note.frontmatter, "content_stage").toLowerCase();
      if (/ready|scheduled|edited|已完成|已预约|已排期|已发布|published/.test(stage) &&
          !scalar(note.frontmatter, "published_url")) {
        unmatched.push({
          content_id: scalar(note.frontmatter, "content_id") || null,
          file: relativePath,
          account: accountUsername(note.frontmatter) || null,
          reason: "no_safe_candidate",
        });
      }
      continue;
    }
    if (result.ambiguous) {
      ambiguous.push({
        content_id: scalar(note.frontmatter, "content_id") || null,
        file: relativePath,
        candidates: result.candidates,
      });
      continue;
    }

    claimedIds.add(result.post.post_id);
    const nextFrontmatter = updatedFrontmatter(note.frontmatter, result.post, {
      method: result.method,
      checkedAt,
    });
    const changed = nextFrontmatter !== note.frontmatter;
    if (changed && !dryRun) {
      const nextHeader = `---${note.parts.eol}${nextFrontmatter.replace(/\n/g, note.parts.eol).replace(/\s+$/, "")}${note.parts.eol}---${note.parts.eol}`;
      await fs.writeFile(note.filePath, nextHeader + note.text.slice(note.parts.prefixLength), "utf8");
    }
    matched.push({
      content_id: scalar(note.frontmatter, "content_id") || null,
      file: relativePath,
      post_id: result.post.post_id,
      post_url: result.post.post_url,
      published_at: result.post.published_at,
      method: result.method,
      confidence: Number(result.confidence.toFixed(3)),
      changed,
      evidence: result.evidence || null,
    });
  }

  const report = {
    checked_at: checkedAt,
    dry_run: dryRun,
    source: {
      sqlite: dbPath,
      posts_available: posts.length,
      production_directories: PRODUCTION_DIRS,
    },
    counts: {
      notes_scanned: notes.length,
      matched: matched.length,
      changed: matched.filter((item) => item.changed).length,
      ambiguous: ambiguous.length,
      unmatched_ready_or_claimed_published: unmatched.length,
    },
    matched,
    ambiguous,
    unmatched,
  };
  if (reportPath) await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  return report;
}

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(scriptDir, "../../..");
  const vaultRoot = path.join(repoRoot, "inbox-pengman");
  const dbPath = path.join(vaultRoot, "output", "tiktok_metrics.sqlite");
  const dryRun = process.argv.includes("--dry-run");
  const reportPath = path.join(vaultRoot, "output", `publish_sync_${laDate(new Date())}.json`);
  const report = await reconcileProductionRecords({ dbPath, vaultRoot, dryRun, reportPath });
  console.log(JSON.stringify(report, null, 2));
}
