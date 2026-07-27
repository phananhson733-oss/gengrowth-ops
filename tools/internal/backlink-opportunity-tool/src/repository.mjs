import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { mergeOpportunities, parseCsv, toCsv } from './core.mjs';

const RUN_HEADERS = ['run_id', 'mode', 'input', 'received_count', 'qualified_count', 'rejected_count', 'created_at'];

function isMissingFile(error) {
  return error && error.code === 'ENOENT';
}

function escapeCsv(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function parseFlatCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (char !== '\r') {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function stableRunId(createdAt, input) {
  let hash = 5381;
  for (const char of `${createdAt}:${input}`) {
    hash = ((hash << 5) + hash) ^ char.charCodeAt(0);
  }
  return `run_${(hash >>> 0).toString(36)}`;
}

export class OpportunityRepository {
  constructor({ dataDirectory, now = () => new Date().toISOString() }) {
    this.dataDirectory = dataDirectory;
    this.now = now;
    this.opportunitiesPath = join(dataDirectory, 'backlink-opportunities.csv');
    this.runsPath = join(dataDirectory, 'task-runs.csv');
  }

  async list() {
    try {
      return parseCsv(await readFile(this.opportunitiesPath, 'utf8'));
    } catch (error) {
      if (isMissingFile(error)) return [];
      throw error;
    }
  }

  async upsert(incomingRecords) {
    await mkdir(this.dataDirectory, { recursive: true });
    const existing = await this.list();
    const existingUrls = new Set(existing.map((record) => record.referring_page_url));
    const incomingUrls = new Set(incomingRecords.map((record) => record.referring_page_url));
    const now = this.now();
    const stampedIncoming = incomingRecords.map((record) => ({
      ...record,
      discovered_at: record.discovered_at || now,
      last_checked_at: now,
    }));
    const records = mergeOpportunities(existing, stampedIncoming);
    await writeFile(this.opportunitiesPath, toCsv(records), 'utf8');
    const created = [...incomingUrls].filter((url) => !existingUrls.has(url)).length;
    return {
      records,
      created,
      updated: incomingUrls.size - created,
    };
  }

  async listRuns() {
    try {
      const [headers = [], ...rows] = parseFlatCsv(await readFile(this.runsPath, 'utf8'));
      if (headers.join(',') !== RUN_HEADERS.join(',')) {
        throw new Error('Task run CSV headers do not match the backlink opportunity schema');
      }
      return rows.filter((row) => row.some(Boolean)).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
    } catch (error) {
      if (isMissingFile(error)) return [];
      throw error;
    }
  }

  async logRun({ mode, input, receivedCount, qualifiedCount, rejectedCount }) {
    await mkdir(this.dataDirectory, { recursive: true });
    const createdAt = this.now();
    const row = [
      stableRunId(createdAt, input),
      mode,
      input,
      receivedCount,
      qualifiedCount,
      rejectedCount,
      createdAt,
    ].map(escapeCsv).join(',');
    try {
      await readFile(this.runsPath, 'utf8');
      await appendFile(this.runsPath, `${row}\n`, 'utf8');
    } catch (error) {
      if (!isMissingFile(error)) throw error;
      await writeFile(this.runsPath, `${RUN_HEADERS.join(',')}\n${row}\n`, 'utf8');
    }
  }
}
