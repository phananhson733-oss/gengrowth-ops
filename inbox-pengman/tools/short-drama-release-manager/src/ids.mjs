import { ShortDramaError } from "./errors.mjs";

const BUSINESS_IDS = Object.freeze({
  drama: Object.freeze({ prefix: "SD" }),
  release: Object.freeze({ prefix: "SR" }),
});

function definitionFor(kind) {
  const definition = BUSINESS_IDS[kind];
  if (!definition) {
    throw new ShortDramaError("business_id_kind_invalid", "Unsupported business ID kind", { kind });
  }
  return definition;
}

function stateStoreError(error) {
  if (error instanceof ShortDramaError) return error;
  if (/\b(?:busy|locked)\b/i.test(String(error?.message))) {
    return new ShortDramaError("state_store_busy", "SQLite state store remained busy after 5 seconds");
  }
  return error;
}

function ensureSequenceTable(db) {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS id_sequences (
        kind TEXT PRIMARY KEY,
        last_value INTEGER NOT NULL
      ) STRICT
    `);
  } catch (error) {
    throw stateStoreError(error);
  }
}

function immediate(db, operation) {
  let active = false;
  try {
    db.exec("BEGIN IMMEDIATE");
    active = true;
    const result = operation();
    db.exec("COMMIT");
    active = false;
    return result;
  } catch (error) {
    if (active) {
      try {
        db.exec("ROLLBACK");
      } catch {
        // Preserve the original failure.
      }
    }
    throw stateStoreError(error);
  }
}

function formatBusinessId(kind, value) {
  const { prefix } = definitionFor(kind);
  return `${prefix}-${String(value).padStart(6, "0")}`;
}

export function allocateBusinessId(db, kind) {
  definitionFor(kind);
  ensureSequenceTable(db);
  return immediate(db, () => {
    db.prepare("INSERT INTO id_sequences(kind, last_value) VALUES (?, 0) ON CONFLICT(kind) DO NOTHING").run(kind);
    const row = db.prepare(`
      UPDATE id_sequences
      SET last_value = last_value + 1
      WHERE kind = ?
      RETURNING last_value
    `).get(kind);
    return formatBusinessId(kind, row.last_value);
  });
}

export function seedBusinessIdSequence(db, kind, maxValue) {
  definitionFor(kind);
  if (!Number.isSafeInteger(maxValue) || maxValue < 0) {
    throw new ShortDramaError("business_id_seed_invalid", "Business ID seed must be a non-negative safe integer", {
      kind,
      max_value: maxValue,
    });
  }
  ensureSequenceTable(db);
  return immediate(db, () => {
    db.prepare(`
      INSERT INTO id_sequences(kind, last_value)
      VALUES (?, ?)
      ON CONFLICT(kind) DO UPDATE SET
        last_value = MAX(id_sequences.last_value, excluded.last_value)
    `).run(kind, maxValue);
    return peekNextBusinessId(db, kind);
  });
}

export function peekNextBusinessId(db, kind) {
  definitionFor(kind);
  ensureSequenceTable(db);
  const row = db.prepare("SELECT last_value FROM id_sequences WHERE kind = ?").get(kind);
  return formatBusinessId(kind, (row?.last_value ?? 0) + 1);
}

export function makeRunId(date = new Date()) {
  const instant = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(instant.getTime())) {
    throw new ShortDramaError("run_id_date_invalid", "Run ID date must be a valid instant");
  }
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(instant).map(({ type, value }) => [type, value])
  );
  return `SDRUN-${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}${parts.second}`;
}
