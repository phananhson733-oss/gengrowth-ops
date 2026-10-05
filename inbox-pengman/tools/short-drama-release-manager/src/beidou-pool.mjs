import { isDeepStrictEqual } from 'node:util';

import { findBeidouCandidates, chooseBeidouCandidate } from './beidou-catalog.mjs';
import { candidatePatch, formatCandidateList } from './beidou-enrichment.mjs';
import { ShortDramaError } from './errors.mjs';

const TABLE = '选剧池';
const FIELDS = Object.freeze(['剧ID', '剧名', '创建时间', '归档状态', '平台', '语言', '剧分类', '上线日期', '来源', '北斗候选', '北斗选定ID']);
const REQUIRED = Object.freeze({ 北斗候选: 'text', 北斗选定ID: 'text' });
const BUSINESS = Object.freeze(['平台', '语言', '剧分类', '上线日期']);

function fail(code, message) { throw new ShortDramaError(code, message); }
function text(value) { return typeof value === 'string' ? value.trim() : ''; }

function optionsFromSchema(schema) {
  if (schema?.complete !== true || !Array.isArray(schema.items)) fail('beidou_schema_invalid', 'Complete Base field catalog is required');
  const byName = new Map();
  for (const field of schema.items) {
    if (byName.has(field.name)) fail('beidou_schema_invalid', 'Duplicate Base field name');
    byName.set(field.name, field);
  }
  for (const [name, type] of Object.entries(REQUIRED)) {
    if (!byName.has(name)) return null;
    if (byName.get(name).type !== type) fail('beidou_schema_invalid', 'Beidou Base field type has drifted');
  }
  const choices = (name) => {
    const field = byName.get(name);
    if (field?.type !== 'select' || !Array.isArray(field.options)) fail('beidou_schema_invalid', 'Base business options are unavailable');
    return field.options.map((option) => option.name);
  };
  if (byName.get('上线日期')?.type !== 'datetime') fail('beidou_schema_invalid', 'Base launch-date field has drifted');
  return { platforms: choices('平台'), languages: choices('语言'), categories: choices('剧分类') };
}

function latestEvent(jobs, recordId) {
  const row = jobs.db.prepare("SELECT action,after_json FROM audit_events WHERE target_table=? AND target_key=? AND action IN ('beidou_intent','beidou_result','beidou_error') ORDER BY event_id DESC LIMIT 1").get(TABLE, recordId);
  return row ? { action: row.action, after: JSON.parse(row.after_json) } : null;
}

function sameInputs(event, title, selectedId) {
  return event?.after?.title === title && event?.after?.selected_id === selectedId;
}

function requestedFieldsMatch(fields, patch) {
  return Object.entries(patch).every(([name, value]) => isDeepStrictEqual(fields[name] ?? null, value));
}

async function readback(client, baseToken, tableId, recordId, patch, expectedTitle, expectedSelectedId, oldSelectedId, signal) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    const row = await client.getRecord(baseToken, tableId, recordId, { tableName: TABLE, selectFields: FIELDS, signal });
    if (row?.record_id !== recordId || !row.fields) fail('beidou_readback_invalid', 'Base record changed identity during enrichment');
    if (text(row.fields.剧名) !== expectedTitle) fail('beidou_human_change', 'Pool title changed during enrichment');
    const selected = text(row.fields.北斗选定ID);
    if (selected !== expectedSelectedId) {
      const ownWriteNotVisible = patch.北斗选定ID === expectedSelectedId && selected === oldSelectedId;
      if (!ownWriteNotVisible) fail('beidou_human_change', 'Pool selected candidate changed during enrichment');
    }
    if (selected === expectedSelectedId && requestedFieldsMatch(row.fields, patch)) return row;
    if (attempt < 5) await new Promise((resolve) => setTimeout(resolve, attempt * 500));
  }
  fail('beidou_readback_mismatch', 'Base enrichment write was not verified');
}

function chosenCandidate(title, selectedId, candidates) {
  if (selectedId) {
    const matched = candidates.filter((row) => row.sourceId === selectedId);
    return matched.length === 1 ? { status: 'selected', candidate: matched[0] } : { status: 'needs_review' };
  }
  return chooseBeidouCandidate(title, candidates);
}

function makePatch(current, candidates, decision, options) {
  const patch = {};
  let summary = candidates.length ? formatCandidateList(candidates, { prioritizeId: decision.candidate?.sourceId }) : '北斗未找到候选';
  if (candidates.length && decision.status !== 'selected') {
    summary += text(current.北斗选定ID)
      ? '\n所填北斗选定ID不在当前候选中，请改为上方的完整 ID。'
      : '\n请在「北斗选定ID」填写对应的完整 ID。';
  }
  if (current.北斗候选 !== summary) patch.北斗候选 = summary;
  if (decision.status === 'selected') {
    if (!text(current.北斗选定ID)) patch.北斗选定ID = decision.candidate.sourceId;
    Object.assign(patch, candidatePatch(decision.candidate, current, options));
  }
  return patch;
}

function audit(jobs, action, recordId, before, after, readbackFields, now) {
  jobs.appendAudit({ action, targetTable: TABLE, targetKey: recordId, before, after, readback: readbackFields, now: now() });
}

/** Poll only records created after activation; historical rows need an explicit separate backfill decision. */
export async function processBeidouPool({ client, jobs, baseToken, tableId, apiKey, startAt, now = () => new Date(),
  findCandidates = findBeidouCandidates, withMutationLock, maxRows = 5 } = {}) {
  if (!apiKey || !startAt) return { status: 'disabled', updated: 0, matched: 0, ambiguous: 0, not_found: 0, errors: 0 };
  const cutoff = Date.parse(startAt);
  if (!Number.isFinite(cutoff) || !Number.isSafeInteger(maxRows) || maxRows < 1 || maxRows > 20 ||
      !client || !jobs || !baseToken || !tableId || typeof withMutationLock !== 'function')
    fail('beidou_config_invalid', 'Beidou pool worker configuration is invalid');
  const options = optionsFromSchema(await client.listFields(baseToken, tableId));
  if (!options) return { status: 'schema_missing', updated: 0, matched: 0, ambiguous: 0, not_found: 0, errors: 0 };
  const result = await client.listRecords(baseToken, tableId, { tableName: TABLE, selectFields: FIELDS });
  if (result?.complete !== true || !Array.isArray(result.items)) fail('beidou_base_incomplete', 'Complete Base pool snapshot is required');
  const report = { status: 'success', updated: 0, matched: 0, ambiguous: 0, not_found: 0, errors: 0, skipped: 0 };
  let attempted = 0;
  for (const row of result.items) {
    if (attempted >= maxRows) break;
    const fields = row?.fields;
    const recordId = row?.record_id;
    const title = text(fields?.剧名);
    const selectedId = text(fields?.北斗选定ID);
    const created = Date.parse(fields?.创建时间 ?? '');
    if (!recordId || !title || !Number.isFinite(created) || created < cutoff || fields?.归档状态 === 'archived') {
      report.skipped++; continue;
    }
    const last = latestEvent(jobs, recordId);
    if (last?.action === 'beidou_error' && sameInputs(last, title, selectedId) &&
        Date.parse(last.after.retry_after ?? '') > now().getTime()) { report.skipped++; continue; }
    if (last?.action === 'beidou_intent') {
      const fresh = await client.getRecord(baseToken, tableId, recordId, { tableName: TABLE, selectFields: FIELDS });
      const plannedSelection = text(last.after.patch?.北斗选定ID);
      const businessAttempted = BUSINESS.some((field) => Object.hasOwn(last.after.patch ?? {}, field));
      const currentSelection = text(fresh?.fields?.北斗选定ID);
      const selectionSafe = !plannedSelection && !businessAttempted ||
        currentSelection === (plannedSelection || last.after.selected_id);
      if (text(fresh?.fields?.剧名) === last.after.title && selectionSafe && requestedFieldsMatch(fresh.fields, last.after.patch)) {
        const settledSelection = plannedSelection && text(fresh.fields.北斗选定ID) === plannedSelection
          ? plannedSelection : last.after.selected_id;
        audit(jobs, 'beidou_result', recordId, {},
          { title: last.after.title, selected_id: settledSelection, state: last.after.state }, fresh.fields, now);
        report.skipped++; continue;
      }
      report.errors++; report.status = 'partial'; continue;
    }
    if (sameInputs(last, title, selectedId) && last.action === 'beidou_result') { report.skipped++; continue; }
    attempted++;
    try {
      const candidates = await findCandidates(title, { apiKey });
      const decision = chosenCandidate(title, selectedId, candidates);
      let businessWritten = false;
      await withMutationLock(async (renew, signal) => {
        await renew?.();
        const fresh = await client.getRecord(baseToken, tableId, recordId, { tableName: TABLE, selectFields: FIELDS, signal });
        if (fresh?.record_id !== recordId || text(fresh.fields?.剧名) !== title ||
            text(fresh.fields?.北斗选定ID) !== selectedId || fresh.fields?.归档状态 === 'archived')
          fail('beidou_record_changed', 'Pool row changed before enrichment write');
        const patch = makePatch(fresh.fields, candidates, decision, options);
        if (Object.keys(patch).length) {
          const before = Object.fromEntries(Object.keys(patch).map((field) => [field, fresh.fields[field] ?? null]));
          audit(jobs, 'beidou_intent', recordId, before,
            { title, selected_id: selectedId, state: decision.status, patch }, {}, now);
          await renew?.();
          await client.updateRecords(baseToken, tableId, [{ record_id: recordId, fields: patch }], { tableName: TABLE, signal });
          const expectedSelectedId = decision.status === 'selected' ? decision.candidate.sourceId : selectedId;
          const verified = await readback(client, baseToken, tableId, recordId, patch, title, expectedSelectedId, selectedId, signal);
          audit(jobs, 'beidou_result', recordId, before,
            { title, selected_id: expectedSelectedId, state: decision.status }, verified.fields, now);
          businessWritten = BUSINESS.some((field) => Object.hasOwn(patch, field));
        } else audit(jobs, 'beidou_result', recordId, {}, { title, selected_id: selectedId, state: decision.status }, fresh.fields, now);
      });
      if (decision.status === 'selected') { report.matched++; if (businessWritten) report.updated++; }
      else if (decision.status === 'not_found') report.not_found++;
      else report.ambiguous++;
    } catch (error) {
      // An intent may mean the Base POST committed despite a lost response.
      // Keep it as the newest event so the next tick reconciles by readback.
      if (latestEvent(jobs, recordId)?.action !== 'beidou_intent') {
        const code = typeof error?.code === 'string' && /^[a-z][a-z0-9_]{0,63}$/.test(error.code)
          ? error.code : 'beidou_query_failed';
        audit(jobs, 'beidou_error', recordId, {}, { title, selected_id: selectedId, code,
          retry_after: new Date(now().getTime() + 60 * 60 * 1000).toISOString() }, {}, now);
      }
      report.errors++; report.status = 'partial';
    }
  }
  return report;
}
