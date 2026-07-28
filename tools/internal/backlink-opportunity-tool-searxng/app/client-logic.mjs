export function groupResources(records, view) {
  const mode = view === 'competitor' ? 'competitor_search' : 'keyword';
  return records.filter((record) => (record.sources || []).some((source) => source.mode === mode));
}

function emptyModeState() {
  return {
    records: [],
    summary: null,
    status: '',
    running: false,
    error: '',
  };
}

export function emptyViewStates() {
  return {
    keyword: emptyModeState(),
    competitor: emptyModeState(),
  };
}

export function replaceCompletedView(states, view, result) {
  return {
    ...states,
    [view]: {
      ...states[view],
      records: [...result.records],
      summary: result.summary,
      status: 'completed',
      running: false,
      error: '',
    },
  };
}

export function exportFilename({ view, targetDomain, now = new Date() }) {
  const digits = now.toISOString().replace(/\D/g, '').slice(0, 14);
  return `backlink-${view}-${targetDomain}-${digits.slice(0, 8)}-${digits.slice(8)}.csv`;
}

const MAX_TRANSIENT_NOT_FOUND_RETRIES = 300;

export async function pollJob({ jobId, fetchJob, wait, pollIntervalMs = 1_000 }) {
  let transientNotFoundRetries = 0;
  for (;;) {
    try {
      const job = await fetchJob(jobId);
      if (job.status === 'completed' || job.status === 'failed') return job;
    } catch (error) {
      if (error?.message !== 'Job not found' || transientNotFoundRetries >= MAX_TRANSIENT_NOT_FOUND_RETRIES) throw error;
      transientNotFoundRetries += 1;
    }
    await wait(pollIntervalMs);
  }
}
