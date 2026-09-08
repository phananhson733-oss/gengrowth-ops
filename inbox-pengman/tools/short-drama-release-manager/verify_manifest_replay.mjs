#!/usr/bin/env node
// Offline check: does this manifest still pass assertManifest under the current code?
//
// assertManifest replays the manifest from its own source_backup and compares the result to
// the stored rows. It is the first statement in verifyMigration, before any Base access, so
// an empty context isolates it: reaching base_target_mismatch means the replay reproduced
// every row; migration_manifest_invalid means it did not.
//
// Run this after any change to reconciliation, validation, or schema planning, against every
// manifest that has already been applied to a Base. A non-empty Base cannot be replanned, so
// a manifest that stops replaying is stranded — its remaining phases can never be applied.
//
//   node verify_manifest_replay.mjs <manifest.json> [...]
//
// Reads only. Touches no Base, no network, no credentials.

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { verifyMigration } from "./src/migration.mjs";

const paths = process.argv.slice(2);
if (paths.length === 0) {
  console.error("usage: node verify_manifest_replay.mjs <manifest.json> [...]");
  process.exit(2);
}

let failed = 0;
for (const path of paths) {
  const full = resolve(path);
  let manifest;
  try {
    manifest = JSON.parse(await readFile(full, "utf8"));
  } catch (error) {
    console.log(`UNREADABLE ${path} — ${error.message}`);
    failed += 1;
    continue;
  }
  const policy = manifest?.source_evidence?.policy ?? "(none)";
  try {
    await verifyMigration({}, manifest);
    console.log(`UNEXPECTED  ${path} — no error; the empty context should have been rejected`);
    failed += 1;
  } catch (error) {
    if (error.code === "base_target_mismatch") {
      console.log(`REPLAY OK   ${path}  policy=${policy}`);
    } else {
      console.log(`REPLAY FAIL ${path}  policy=${policy}  ${error.code}: ${error.message}`);
      failed += 1;
    }
  }
}
process.exit(failed === 0 ? 0 : 1);
