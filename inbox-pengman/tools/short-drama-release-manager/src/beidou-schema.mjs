import { createHash } from 'node:crypto';

import { OPTIONAL_POOL_FIELDS } from './schema.mjs';
import { ShortDramaError } from './errors.mjs';

const TABLE = '选剧池';

function fail(code, message) { throw new ShortDramaError(code, message); }

async function snapshot(client, baseToken, tableId) {
  const result = await client.listFields(baseToken, tableId);
  if (result?.complete !== true || !Array.isArray(result.items)) fail('beidou_schema_invalid', 'Complete Base field catalog is required');
  const fields = result.items.map((field) => ({ id: field.field_id ?? field.id ?? null, name: field.name, type: field.type }))
    .sort((left, right) => left.name.localeCompare(right.name) || String(left.id).localeCompare(String(right.id)));
  const names = new Set();
  for (const field of fields) {
    if (typeof field.name !== 'string' || !field.name || typeof field.type !== 'string' || names.has(field.name))
      fail('beidou_schema_invalid', 'Base field catalog is malformed or duplicate');
    names.add(field.name);
  }
  const byName = new Map(fields.map((field) => [field.name, field]));
  for (const spec of OPTIONAL_POOL_FIELDS) {
    const present = byName.get(spec.name);
    if (present && present.type !== 'text') fail('beidou_schema_invalid', 'Beidou field has the wrong Base type');
  }
  return fields;
}

function digest(fields) { return createHash('sha256').update(JSON.stringify(fields)).digest('hex'); }

export async function planBeidouFields({ client, baseToken, tableId } = {}) {
  if (!client || !baseToken || !tableId) fail('beidou_schema_invalid', 'Beidou schema target is missing');
  const fields = await snapshot(client, baseToken, tableId);
  const names = new Set(fields.map((field) => field.name));
  return { status: 'planned', table: TABLE, sha256: digest(fields), current_fields: fields.length,
    create: OPTIONAL_POOL_FIELDS.map((field) => field.name).filter((name) => !names.has(name)) };
}

export async function applyBeidouFields({ client, jobs, baseToken, tableId, expectedSha256, actorId, now = () => new Date() } = {}) {
  if (!jobs?.appendAudit || typeof actorId !== 'string' || !actorId || !/^[a-f0-9]{64}$/.test(expectedSha256 ?? ''))
    fail('beidou_schema_invalid', 'Beidou schema apply requires actor and plan digest');
  const current = await snapshot(client, baseToken, tableId);
  if (digest(current) !== expectedSha256) fail('beidou_schema_stale', 'Base fields changed after the Beidou schema plan');
  const created = [];
  for (const spec of OPTIONAL_POOL_FIELDS) {
    if (current.some((field) => field.name === spec.name)) continue;
    // Preserve the prewrite field set and attempt. A timed-out create may have
    // committed; the following fresh list is the only retry decision input.
    jobs.appendAudit({ actorId, action: 'beidou_schema_intent', targetTable: TABLE, targetKey: spec.name,
      before: { fields: current }, after: { create: spec.name, type: 'text' }, now: now() });
    let writeError = null;
    try { await client.createField(baseToken, tableId, TABLE, spec.name); }
    catch (error) { writeError = error; }
    const after = await snapshot(client, baseToken, tableId);
    const matches = after.filter((field) => field.name === spec.name && field.type === 'text');
    if (matches.length !== 1) {
      if (writeError) fail('beidou_schema_write_uncertain', 'Beidou field create result is uncertain; inspect Base before retrying');
      fail('beidou_schema_readback_mismatch', 'New Beidou field was not verified');
    }
    jobs.appendAudit({ actorId, action: 'beidou_schema_result', targetTable: TABLE, targetKey: spec.name,
      before: { fields: current }, after: { created: spec.name }, readback: { field: matches[0] }, now: now() });
    created.push(spec.name);
  }
  return { status: 'verified', created };
}
