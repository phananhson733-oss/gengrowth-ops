import { readFile } from 'node:fs/promises';

import { parseCsv } from '../src/core.mjs';

const RUN_HEADERS = ['run_id', 'mode', 'input', 'received_count', 'qualified_count', 'rejected_count', 'created_at'];

function parseRows(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(cell);
      cell = '';
    } else if (character === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (character !== '\r') {
      cell += character;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

export function parseRunsCsv(text) {
  const [headers = [], ...rows] = parseRows(text);
  if (headers.join(',') !== RUN_HEADERS.join(',')) {
    throw new Error('Task run CSV headers do not match the backlink opportunity schema');
  }
  return rows.filter((row) => row.some(Boolean)).map((row) => ({
    run_id: row[0] ?? '',
    mode: row[1] ?? '',
    input: row[2] ?? '',
    received_count: Number(row[3] ?? 0),
    qualified_count: Number(row[4] ?? 0),
    rejected_count: Number(row[5] ?? 0),
    created_at: row[6] ?? '',
  }));
}

export async function migrateCsv({ repository, opportunitiesPath, runsPath }) {
  const records = parseCsv(await readFile(opportunitiesPath, 'utf8'));
  const runs = parseRunsCsv(await readFile(runsPath, 'utf8'));
  const resources = await repository.upsertOpportunities(records);
  let created = 0;
  let skipped = 0;
  for (const run of runs) {
    const result = await repository.importRun(run);
    if (result.created) created += 1;
    else skipped += 1;
  }
  return { resources, runs: { created, skipped } };
}
