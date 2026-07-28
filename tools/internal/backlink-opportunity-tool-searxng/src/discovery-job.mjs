import { mergeOpportunities } from './core.mjs';
import { toAutoRegisterRows } from './auto-register-export.mjs';
import { selectTopOpportunities } from './quality-ranker.mjs';

function candidateLimitFor(requestedLimit) {
  return Math.min(Math.max(1, Number(requestedLimit) || 1) * 20, 2000);
}

export async function runDiscoveryJob({
  job,
  gateway,
  discoverKeyword,
  discoverCompetitor,
  inspectPages,
}) {
  const candidateLimit = candidateLimitFor(job.requestedLimit);
  let discoveryDiagnostics = {
    familyRequestCounts: {},
    familyCandidateCounts: {},
    queryErrors: [],
  };
  const onDiagnostics = (value) => { discoveryDiagnostics = value; };
  const candidates = job.mode === 'keyword'
    ? await discoverKeyword({
      keyword: job.input,
      language: job.language,
      region: job.region,
      limit: candidateLimit,
      onDiagnostics,
    })
    : await discoverCompetitor({
      competitorDomain: job.input,
      language: job.language,
      limit: candidateLimit,
      onDiagnostics,
    });
  const unique = mergeOpportunities([], candidates);
  const inspected = await inspectPages(unique);
  const ranking = selectTopOpportunities(inspected, {
    mode: job.mode === 'keyword' ? 'keyword' : 'competitor',
    input: job.input,
    limit: job.requestedLimit,
  });
  const resultRows = toAutoRegisterRows(ranking.selected, {
    targetDomain: job.targetDomain,
  });
  const summary = {
    retrieved: candidates.length,
    deduplicated: unique.length,
    qualified: ranking.diagnostics.qualifiedBeforeLimit,
    rejected: ranking.rejected.length,
    created: resultRows.length,
    exportRejected: ranking.selected.length - resultRows.length,
    qualityRuleVersion: ranking.diagnostics.ruleVersion,
    exclusionCounts: ranking.diagnostics.exclusionCounts,
    finalTypeCounts: ranking.diagnostics.finalTypeCounts,
    discoveryDiagnostics,
  };
  await gateway.completeJob({ jobId: job.id, summary, resultRows });
  return summary;
}
