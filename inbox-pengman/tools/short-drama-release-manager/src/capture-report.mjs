import { ALERT_TEXT_LIMIT, boundedAlert, captureIncompleteLines } from "./pipeline-health.mjs";

// The daily capture report is read by people who do not know the internal
// error codes, so every code a capture or its synchronisation can report is
// given in plain words. An unknown code is shown as it is.
const CODE_LABELS = Object.freeze({
  account_unavailable: "账号不可用（已注销、被封禁或设为私密）",
  account_entry_failed: "账号主页打不开",
  listing_timeout: "帖子列表读取超时",
  listing_output_truncated: "帖子列表输出被截断",
  listing_failed: "帖子列表读取失败",
  listing_incomplete: "帖子列表只读到一部分",
  listing_limit_reached: "帖子列表达到单次上限，更早的帖子可能没读到",
  listing_empty: "帖子列表为空",
  detail_budget_exhausted: "超出本次采集的时间预算，部分帖子没采",
  detail_circuit_open: "连续失败过多，该账号剩余帖子已跳过",
  detail_unavailable: "帖子详情取不到（可能已删除或不可见）",
  metrics_zero_suspect: "指标疑似异常归零，已按缺失处理",
  capture_identity_mismatch: "帖子与账号对不上",
  capture_failed: "采集没有产出任何数据",
  capture_partial: "采集不完整",
  sync_partial: "同步只完成了一部分",
  collector_failed: "采集程序异常退出",
  collector_timeout: "采集程序超时",
  account: "账号主页读取失败",
  embed: "账号嵌入页读取失败",
  listing: "帖子列表读取失败",
  detail: "帖子详情读取失败",
  detail_parse: "帖子详情解析失败",
  photo_detail: "图文帖详情读取失败",
  identity: "帖子与账号对不上",
  error: "未知错误",
  release_account_invalid: "发布账号缺失或无效",
  manual_url_invalid: "手填的视频链接格式不对",
  manual_account_mismatch: "手填视频链接里的账号与发布账号不一致",
  manual_post_invalid: "手填的 Post ID 格式不对",
  manual_identifier_conflict: "手填的视频链接与 Post ID 指向不同的帖子",
  manual_post_not_found: "手填的帖子在采集数据里找不到",
  manual_post_account_mismatch: "手填的帖子属于另一个账号",
  manual_post_claimed: "手填的帖子已被另一条发布记录占用",
  batch_review_required: "批次发布需要人工确认",
  release_date_missing: "发布记录没有填日期",
  release_datetime_invalid: "发布记录的日期格式不对",
  ambiguous_post_match: "同一账号同一时段有多条帖子，无法确定是哪一条",
  no_account_time_candidate: "该账号在发布日期附近没有采到帖子",
  release_capture_relation_conflict: "发布记录关联的采集记录异常（多条或格式不对）",
  release_claim_conflict: "发布记录填写的帖子与已关联的帖子不一致",
  readback_mismatch: "写入飞书后回读不一致",
  base_response_invalid: "飞书返回的数据异常",
});

const STEP_LABELS = Object.freeze({
  collector: "采集问题",
  accounts: "账号台账写入问题",
  captures: "采集数据写入问题",
  release_links: "发布记录关联问题",
});

const STATE_LABELS = Object.freeze({ success: "成功 ✅", partial: "部分成功 ⚠️", failed: "失败 ❌" });
const WRAPPER_CODES = new Set(["sync_partial", "sync_failed", "capture_partial"]);
const CAUSES_PER_STEP = 6;

export function describeCaptureCode(code) {
  if (typeof code !== "string" || code.length === 0) return "未知错误";
  return Object.hasOwn(CODE_LABELS, code) ? CODE_LABELS[code] : code;
}

function instant(value) {
  const ms = typeof value === "string" ? Date.parse(value) : NaN;
  return Number.isFinite(ms) ? ms : null;
}

function beijing(ms) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(ms)).map(({ type, value }) => [type, value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

function duration(startMs, endMs) {
  const minutes = Math.floor((endMs - startMs) / 60_000);
  if (minutes < 1) return "不足 1 分钟";
  if (minutes < 60) return `${minutes} 分钟`;
  return `${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分`;
}

const count = (value) => (Number.isSafeInteger(value) && value >= 0 ? value : null);
const shown = (value) => (count(value) === null ? "未知" : String(value));
const counted = (label, size) => `${label}${label.endsWith("）") ? "" : " "}${size} 条`;

// A summary file is kept per capture date, not per run: a run that died before
// writing one would otherwise be described with the figures of an earlier run.
export function summaryBelongsToJob(summary, job) {
  const captured = instant(summary?.captured_at);
  const started = instant(job?.started_at);
  const finished = instant(job?.finished_at);
  if (captured === null || started === null || finished === null) return false;
  return captured >= started && captured <= finished;
}

function reportDate(job) {
  const match = /^SDRUN-(\d{4})(\d{2})(\d{2})-\d{6}$/.exec(job?.run_id ?? "");
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const started = instant(job?.started_at);
  return started === null ? "日期未知" : beijing(started).date;
}

function timeLine(job) {
  const started = instant(job?.started_at);
  const finished = instant(job?.finished_at);
  if (started === null || finished === null || finished < started) return "时间：未知";
  return `时间：${beijing(started).time} 开始，${beijing(finished).time} 结束，用时 ${duration(started, finished)}`;
}

function jobErrors(job) {
  return (Array.isArray(job?.error?.errors) ? job.error.errors : [])
    .filter((item) => typeof item?.code === "string" && item.code.length > 0 && item.code.length <= 64);
}

function failureCodes(job) {
  const top = typeof job?.error?.code === "string" && job.error.code.length <= 64 ? [job.error.code] : [];
  const codes = [...top, ...jobErrors(job).map((item) => item.code)];
  // The wrapper codes say nothing once a specific cause is known.
  const specific = codes.filter((code) => !WRAPPER_CODES.has(code));
  return [...new Set(specific.length ? specific : codes)].slice(0, 5);
}

function captureLines(summary, previousSummary) {
  const requested = Array.isArray(summary.accounts_requested) ? summary.accounts_requested.length : null;
  const successful = Array.isArray(summary.accounts_successful) ? summary.accounts_successful.length : count(summary.account_count);
  const posts = count(summary.post_count);
  // The stored snapshot checks every metric; the collector's top-level figures only look at likes.
  const partial = count(summary.local_history?.partial_count);
  const split = posts !== null && partial !== null && partial <= posts ? `（指标完整 ${posts - partial} 条，不完整 ${partial} 条）` : "";
  const lines = ["采集情况", `· 账号：取得快照 ${shown(successful)}/${shown(requested)} 个`, `· 帖子：采到 ${shown(posts)} 条${split}`];
  const total = count(summary.local_history?.unique_posts_total);
  const before = count(previousSummary?.local_history?.unique_posts_total);
  // Measured against yesterday's capture, so a second run of the day includes what the first one found.
  if (total !== null && before !== null && total >= before) lines.push(`· 较昨日新增帖子：${total - before} 条（帖子库累计 ${total} 条）`);
  return lines;
}

function updateLines(job, drain) {
  const counters = job?.counters ?? {};
  const lines = [job?.state === "failed" ? "数据更新（失败前已完成的部分）" : "数据更新",
    `· 采集数据表写入 ${shown(counters.capture_rows_upserted)} 行`,
    `· 账号台账更新 ${shown(counters.accounts_updated)} 个`,
    `· 发布记录新关联 ${shown(counters.releases_linked)} 条`];
  // Only a failure is stated: a drain that did not fail is no proof that the report tables are current.
  if (count(drain?.consecutive_failures) > 0) {
    lines.push(`· 统计报表：同步失败（已连续 ${drain.consecutive_failures} 次，${describeCaptureCode(drain.last_error_code)}）`);
  }
  return lines;
}

// Problems the Runner met while writing, grouped by the step they belong to.
function syncProblemLines(job, { hasSummary }) {
  const steps = new Map();
  for (const item of jobErrors(job)) {
    const step = typeof item.step === "string" && item.step.length > 0 && item.step.length <= 64 ? item.step : "other";
    // With a capture summary the capture is described from it, post by post and account by account.
    if (hasSummary && (step === "collector" || (step === "captures" && item.code === "capture_partial"))) continue;
    if (!hasSummary && step === "collector" && WRAPPER_CODES.has(item.code)) continue;
    const codes = steps.get(step) ?? new Map();
    codes.set(item.code, (codes.get(item.code) ?? 0) + 1);
    steps.set(step, codes);
  }
  return [...steps].map(([step, codes]) => {
    const sorted = [...codes].sort(([, a], [, b]) => b - a);
    const total = sorted.reduce((sum, [, size]) => sum + size, 0);
    const title = Object.hasOwn(STEP_LABELS, step) ? STEP_LABELS[step] : `${step} 环节问题`;
    const named = sorted.slice(0, CAUSES_PER_STEP).map(([code, size]) => counted(describeCaptureCode(code), size));
    const rest = sorted.slice(CAUSES_PER_STEP);
    if (rest.length) named.push(`其余 ${rest.length} 种原因共 ${rest.reduce((sum, [, size]) => sum + size, 0)} 条`);
    return `${title} ${total} 条：${named.join("；")}`;
  });
}

const RUN_DATE = /^SDRUN-(\d{4})(\d{2})(\d{2})-\d{6}$/;

// Midnight at the end of the Beijing day the run was started on.
function endOfRunDay(job) {
  const match = RUN_DATE.exec(job?.run_id ?? "");
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  return Date.UTC(year, month - 1, day + 1) - 8 * 3_600_000;
}

const clock = (ms) => { const { time } = beijing(ms); return time === "00:00" ? "24:00" : time; };

// What follows a failed run, as the rule and its limits. All of it is fixed
// when the run ends, so the line reads the same whenever the report is
// written or sent; a forecast would be out of date in a report that is late.
function retryLine(job, { attempt, maxAttempts, retryDelayMinutes, retryDeadline, nextCaptureAt, scope }) {
  if (attempt >= maxAttempts) return `后续：${scope}第 ${attempt} 次仍失败，已达上限，不再自动补跑，需要人工处理`;
  const finished = instant(job?.finished_at);
  const deadline = Number.isFinite(retryDeadline) ? retryDeadline : endOfRunDay(job);
  if (finished === null || deadline === null) return null;
  const earliest = finished + retryDelayMinutes * 60_000;
  if (earliest >= deadline) {
    return Number.isFinite(nextCaptureAt) ? `后续：${scope}不再补跑，接下来是 ${beijing(nextCaptureAt).time} 的采集`
      : `后续：${scope}不再补跑，下一次采集由下一次定时任务执行`;
  }
  return `后续：按规则自动补跑，最早 ${beijing(earliest).time}、最晚 ${clock(deadline)} 前开始（${scope}第 ${attempt} 次尝试，最多 ${maxAttempts} 次）；补跑结果另发日报`;
}

export function buildCaptureReport({
  job, summary = null, previousSummary = null, drain = null,
  attempt = 1, maxAttempts = 3, retryDelayMinutes = 30, retryDeadline = null, nextCaptureAt = null, scope = "今日",
  limit = ALERT_TEXT_LIMIT,
} = {}) {
  const state = STATE_LABELS[job?.state] ?? String(job?.state ?? "未知");
  const own = summaryBelongsToJob(summary, job) ? summary : null;
  const head = [`【短剧数据采集日报】${reportDate(job)}`, `结果：${state}`, timeLine(job)];
  if (attempt > 1) head.push(`本次为补跑（${scope}第 ${attempt} 次尝试）`);
  if (job?.state === "failed") {
    const codes = failureCodes(job);
    head.push(`失败原因：${codes.length ? codes.map(describeCaptureCode).join("；") : "未知错误"}`);
    const next = retryLine(job, { attempt, maxAttempts, retryDelayMinutes, retryDeadline, nextCaptureAt, scope });
    if (next) head.push(next);
  }
  head.push("", ...(own ? captureLines(own, previousSummary) : ["采集情况", "· 采集明细不可用（本次没有生成采集汇总）"]));
  head.push("", ...updateLines(job, drain));
  const problems = [
    ...(own ? captureIncompleteLines(own, { label: describeCaptureCode }) ?? [] : []),
    ...syncProblemLines(job, { hasSummary: own !== null }),
  ];
  const footer = `\n\n${job?.run_id ?? ""}`;
  if (!problems.length) {
    const verdict = job?.state === "success" ? "问题：无" : job?.state === "failed" ? null : "问题：任务没有记录具体原因，请查看运行日志";
    const body = [...head, ...(verdict ? ["", verdict] : [])].join("\n");
    return (body.slice(0, limit - footer.length) + footer).trimEnd();
  }
  const header = [...head, "", `问题 ${problems.length} 项`].join("\n");
  return boundedAlert(header, problems.map((line) => `· ${line}`), limit - footer.length).text + footer;
}
