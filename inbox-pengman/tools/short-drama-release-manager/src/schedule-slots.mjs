// A Beijing day has one scheduled capture, or several when extra capture
// times are configured. Each capture time opens a slot that lasts until the
// next one; enqueueing, retries and the health check are decided per slot.

const BEIJING_OFFSET_MS = 8 * 3_600_000;
const DAY_MS = 86_400_000;
const RUN_ID_TIME = /^SDRUN-\d{8}-(\d{2})(\d{2})\d{2}$/;
const RUN_ID_START = /^SDRUN-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/;

const pad = (value) => String(value).padStart(2, "0");

export function captureSlots(schedule = {}) {
  const first = (schedule.captureHour ?? 8) * 60 + (schedule.captureMinute ?? 0);
  // Every slot is checked as long after its capture time as the first one.
  const healthDelay = (schedule.healthHour ?? 10) * 60 + (schedule.healthMinute ?? 0) - first;
  const extras = Array.isArray(schedule.extraCaptures) ? schedule.extraCaptures.map((time) => time.hour * 60 + time.minute) : [];
  return [first, ...extras].map((minutes, index) => ({
    index, minutes, label: `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`,
    start: `${pad(Math.floor(minutes / 60))}${pad(minutes % 60)}00`, healthMinutes: minutes + healthDelay,
  }));
}

// The slot that is open at a Beijing minute of the day; null before the first capture time.
export function slotAt(schedule, minuteOfDay) {
  return captureSlots(schedule).filter((slot) => slot.minutes <= minuteOfDay).at(-1) ?? null;
}

// A run belongs to the slot it started in. Without a usable run id, and for a
// run started before the first capture time, that is the first slot.
export function slotOfRun(schedule, job) {
  const slots = captureSlots(schedule);
  const match = RUN_ID_TIME.exec(job?.run_id ?? "");
  if (!match || slots.length === 1) return slots[0];
  const minute = Number(match[1]) * 60 + Number(match[2]);
  return slots.filter((slot) => slot.minutes <= minute).at(-1) ?? slots[0];
}

// The instant of the first capture time after the given instant.
export function nextCaptureAfter(schedule, instantMs) {
  const local = instantMs + BEIJING_OFFSET_MS;
  const dayStart = Math.floor(local / DAY_MS) * DAY_MS;
  const minutes = captureSlots(schedule).map((slot) => slot.minutes);
  for (const day of [dayStart, dayStart + DAY_MS]) {
    for (const minute of minutes) {
      const candidate = day + minute * 60_000 - BEIJING_OFFSET_MS;
      if (candidate > instantMs) return candidate;
    }
  }
  return dayStart + DAY_MS + minutes[0] * 60_000 - BEIJING_OFFSET_MS;
}

// The instant by which a retry of a run has to start: the next capture time
// after the run was started, and midnight at the latest, because no run is
// started between midnight and the first capture time. null without a usable
// run id.
export function retryDeadlineOfRun(schedule, job) {
  const match = RUN_ID_START.exec(job?.run_id ?? "");
  if (!match) return null;
  const [year, month, day, hour, minute, second] = match.slice(1).map(Number);
  const started = Date.UTC(year, month - 1, day, hour, minute, second) - BEIJING_OFFSET_MS;
  if (!Number.isFinite(started)) return null;
  const midnight = Date.UTC(year, month - 1, day) + DAY_MS - BEIJING_OFFSET_MS;
  return Math.min(nextCaptureAfter(schedule, started), midnight);
}
