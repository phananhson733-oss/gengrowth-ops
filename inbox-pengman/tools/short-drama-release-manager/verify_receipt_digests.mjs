#!/usr/bin/env node
// Offline check: do the receipts on disk still hash to the digest they carry?
//
// Every gate in the migration pipeline binds on a digest. Changing what a digest function
// covers silently invalidates every receipt already written — and some of them cannot be
// regenerated: the canary receipt requires empty tables (count_before === 0), and the schema
// receipt requires the pre-write schema revision. Once the Base is non-empty, a broken digest
// on either of those strands the migration with no way forward.
//
// Run this after touching any digest helper, and treat a BROKEN line on the canary receipt,
// the schema receipt, or an already-applied manifest as a release blocker.
//
//   node verify_receipt_digests.mjs [dir]        # defaults to the standard migrations dir
//
// Reads only. Touches no Base, no network, no credentials.

import { readFile, readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve } from "node:path";

import {
  canaryReceiptDigest,
  manifestDigest,
  permissionAttestationDigest,
  presentationReceiptDigest,
  schemaReceiptDigest,
  verificationDigest,
} from "./src/migration.mjs";

// Regenerable? A false here means a broken digest is unrecoverable once the Base is non-empty.
const KINDS = [
  ["migration-plan-", manifestDigest, false],
  ["schema-receipt-", schemaReceiptDigest, false],
  ["canary-receipt-", canaryReceiptDigest, false],
  ["permission-attestation-", permissionAttestationDigest, true],
  ["presentation-receipt-", presentationReceiptDigest, true],
  ["verification-", verificationDigest, true],
];

const dir = resolve(process.argv[2] ?? resolve(homedir(), "gengrowth-ops/inbox-pengman/output/short-drama-release-manager/migrations"));
let names;
try {
  names = (await readdir(dir)).filter((name) => name.endsWith(".json")).sort();
} catch (error) {
  console.error(`cannot read ${dir}: ${error.message}`);
  process.exit(2);
}

let blocking = 0;
let broken = 0;
for (const name of names) {
  const kind = KINDS.find(([prefix]) => name.startsWith(prefix));
  if (!kind) continue;
  const [, digestOf, regenerable] = kind;
  let doc;
  try {
    doc = JSON.parse(await readFile(resolve(dir, name), "utf8"));
  } catch (error) {
    console.log(`UNREADABLE ${name} — ${error.message}`);
    broken += 1;
    continue;
  }
  let actual;
  try {
    actual = digestOf(doc);
  } catch (error) {
    console.log(`${regenerable ? "BROKEN    " : "BLOCKING  "} ${name} — digest threw: ${error.code ?? error.message}`);
    broken += 1;
    if (!regenerable) blocking += 1;
    continue;
  }
  if (actual === doc.sha256) {
    console.log(`OK         ${name}`);
  } else if (regenerable) {
    console.log(`STALE      ${name} — regenerable, re-run the command that produced it`);
    broken += 1;
  } else {
    console.log(`BLOCKING   ${name} — NOT regenerable once the Base is non-empty`);
    broken += 1;
    blocking += 1;
  }
}

console.log(`\n${names.length} files scanned, ${broken} no longer match, ${blocking} of them unrecoverable.`);
process.exit(blocking === 0 ? 0 : 1);
