import { ShortDramaError } from "./errors.mjs";
import { parseQualifiedInstantMs } from "./qualified-iso.mjs";
import { normalizeAccountId } from "./source-sqlite.mjs";

const POST_ID = /^\d+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

function fail(code, message, details = {}) {
  throw new ShortDramaError(code, message, details);
}

function plainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clone(value) {
  return structuredClone(value);
}

function sortPosts(rows) {
  return [...rows].sort((left, right) =>
    (left.published_at ?? "").localeCompare(right.published_at ?? "") ||
    left.post_id.localeCompare(right.post_id),
  );
}

function unmatched(reason, candidates = []) {
  return { status: "unmatched", reason, candidates: sortPosts(candidates).map(clone) };
}

function ambiguous(reason, candidates = []) {
  return { status: "ambiguous", reason, candidates: sortPosts(candidates).map(clone) };
}

function matched(method, reason, post, confidence) {
  return {
    status: "matched",
    method,
    reason,
    ...(confidence === undefined ? {} : { confidence }),
    post: clone(post),
  };
}

function validQualifiedTimestamp(value) {
  return parseQualifiedInstantMs(value) !== null;
}

function validDate(value) {
  if (typeof value !== "string" || !DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validateCapture(raw) {
  if (!plainObject(raw) || typeof raw.post_id !== "string" || !POST_ID.test(raw.post_id)) {
    fail("matcher_capture_invalid", "Capture is malformed");
  }
  let username;
  try {
    username = normalizeAccountId(raw.username);
  } catch {
    fail("matcher_capture_invalid", "Capture account is invalid", { post_id: raw.post_id });
  }
  if (raw.published_at !== null && raw.published_at !== undefined && !validQualifiedTimestamp(raw.published_at)) {
    fail("matcher_capture_invalid", "Capture publish time is invalid", { post_id: raw.post_id });
  }
  if (raw.post_url !== null && raw.post_url !== undefined && typeof raw.post_url !== "string") {
    fail("matcher_capture_invalid", "Capture URL is invalid", { post_id: raw.post_id });
  }
  return { ...clone(raw), username };
}

function validateInputs(release, captures, claimedPostIds) {
  if (!plainObject(release)) fail("matcher_release_invalid", "Release must be an object");
  if (!Array.isArray(captures)) fail("matcher_captures_invalid", "Captures must be an array");
  if (!(claimedPostIds instanceof Set)) fail("matcher_claimed_invalid", "Claimed Post IDs must be a Set");
  for (const postId of claimedPostIds) {
    if (typeof postId !== "string" || !POST_ID.test(postId)) {
      fail("matcher_claimed_invalid", "Claimed Post ID is invalid");
    }
  }
  const normalized = captures.map(validateCapture);
  const seen = new Set();
  for (const post of normalized) {
    if (seen.has(post.post_id)) fail("matcher_capture_duplicate", "Captures contain duplicate Post IDs");
    seen.add(post.post_id);
  }
  return normalized;
}

function parseManualUrl(value) {
  if (typeof value !== "string" || value.trim() !== value || !value) return null;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if ((url.protocol !== "https:" && url.protocol !== "http:") ||
        (hostname !== "tiktok.com" && !hostname.endsWith(".tiktok.com"))) return null;
    const match = url.pathname.match(/^\/@([^/]+)\/(?:video|photo)\/(\d+)\/?$/);
    if (!match) return null;
    return { accountId: normalizeAccountId(match[1]), postId: match[2] };
  } catch {
    return null;
  }
}

function beijingDate(timestamp) {
  return new Date(parseQualifiedInstantMs(timestamp) + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function matchReleaseToCapture(release, captures, claimedPostIds) {
  const normalizedCaptures = validateInputs(release, captures, claimedPostIds);
  let accountId;
  try {
    accountId = normalizeAccountId(release["账号ID"]);
  } catch {
    return unmatched("release_account_invalid");
  }
  const accountCaptures = normalizedCaptures.filter((post) => post.username === accountId);
  const available = accountCaptures.filter((post) => !claimedPostIds.has(post.post_id));

  const hasManualUrl = release["视频链接"] !== undefined && release["视频链接"] !== null && release["视频链接"] !== "";
  const hasManualPostId = release["Post ID"] !== undefined && release["Post ID"] !== null && release["Post ID"] !== "";
  let manualUrl = null;
  if (hasManualUrl) {
    manualUrl = parseManualUrl(release["视频链接"]);
    if (!manualUrl) return unmatched("manual_url_invalid");
    if (manualUrl.accountId !== accountId) return unmatched("manual_account_mismatch");
  }
  let manualPostId = null;
  if (hasManualPostId) {
    if (typeof release["Post ID"] !== "string" || !POST_ID.test(release["Post ID"])) {
      return unmatched("manual_post_invalid");
    }
    manualPostId = release["Post ID"];
  }
  if (manualUrl && manualPostId && manualUrl.postId !== manualPostId) {
    return ambiguous("manual_identifier_conflict");
  }
  const selectedPostId = manualUrl?.postId ?? manualPostId;
  if (selectedPostId !== null && selectedPostId !== undefined) {
    const post = normalizedCaptures.find((candidate) => candidate.post_id === selectedPostId);
    if (!post) return unmatched("manual_post_not_found");
    if (post.username !== accountId) return unmatched("manual_post_account_mismatch");
    if (claimedPostIds.has(selectedPostId)) return unmatched("manual_post_claimed");
    if (manualUrl) return matched("manual_url", "manual_url_exact", post);
    return matched("exact_post_id", "explicit_post_id_exact", post);
  }

  const releaseDate = release["日期"];
  if (releaseDate === undefined || releaseDate === null || releaseDate === "") {
    return unmatched("release_date_missing", available);
  }
  let candidates;
  if (validDate(releaseDate)) {
    candidates = available.filter((post) => post.published_at && beijingDate(post.published_at) === releaseDate);
  } else if (validQualifiedTimestamp(releaseDate)) {
    const releaseMs = parseQualifiedInstantMs(releaseDate);
    candidates = available.filter((post) =>
      post.published_at && Math.abs(parseQualifiedInstantMs(post.published_at) - releaseMs) <= SIX_HOURS_MS,
    );
  } else {
    return unmatched("release_datetime_invalid");
  }
  if (candidates.length === 1) {
    return matched("account_time", "unique_account_time_candidate", candidates[0], 0.8);
  }
  if (candidates.length > 1) return ambiguous("ambiguous_post_match", candidates);
  return unmatched("no_account_time_candidate");
}
