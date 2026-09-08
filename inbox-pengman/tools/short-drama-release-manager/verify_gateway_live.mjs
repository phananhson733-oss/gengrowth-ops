#!/usr/bin/env node
// Does the provenance gate accept the wrapper the running Hermes actually produces?
//
// This is the only check that answers that question honestly. The test suite generates its
// wrapper by calling LocalEnvironment._wrap_command() on a hand-built instance, and that
// construction goes stale across Hermes releases — on 2026-09-08 it raised
// _snapshot_excluded_passthrough_names() on the running release, which looks like a gate
// failure and is not one. Do not conclude anything from that.
//
// Instead, capture a wrapper the live gateway really emitted, and feed it to the gate with
// only the eval'd command swapped for the Runner:
//
//   1. while a bot command is running, capture its bash process:
//        ps -axo pid=,ppid=,comm=,args= -ww | awk '$3 ~ /bash$/ && /builtin cd --/'
//      (any command the bot is allowed to run will do — it is the wrapper that matters,
//       not what runs inside it)
//   2. write four lines to a file: pid, ppid, comm, args
//   3. node verify_gateway_live.mjs <that file>
//
// ACCEPT means the gate matches this host and a refusal is the caller's command shape.
// REJECT names the link that refused, which is the one to fix.
//
// Reads only: it inspects processes via the same /bin/ps path the gate itself uses, and
// starts nothing.

import { readFileSync } from "node:fs";
import {
  inspectTrustedSocialInvoker, SOCIAL_RUNTIME_CONFIG_PATH, parseCommand, readMacProcessRow,
} from "/Users/awayer_mini/gengrowth-ops/inbox-pengman/tools/short-drama-release-manager/shortdrama_ctl.mjs";

if (process.argv.length < 3) {
  console.error("usage: node verify_gateway_live.mjs <captured-bash-row.txt>   (4 lines: pid, ppid, comm, args)");
  process.exit(2);
}
const [shellPid, shellPpid, , shellArgs] = readFileSync(process.argv[2], "utf8").split("\n");
if (!shellPid || !shellPpid || !shellArgs) {
  console.error("the capture file needs exactly four lines: pid, ppid, comm, args");
  process.exit(2);
}
const runner = "/Users/awayer_mini/gengrowth-ops/inbox-pengman/tools/short-drama-release-manager/shortdrama_ctl.mjs";
const argv = ["pool", "list", "--config", SOCIAL_RUNTIME_CONFIG_PATH];
const direct = `/usr/bin/env node ${runner} ${argv.join(" ")}`;
const patched = shellArgs.replace(/eval '[^']*'/, `eval '${direct}'`);

const RUNNER_PID = 999001;
const SHELL = Number(shellPid);
const rows = new Map([
  [RUNNER_PID, { pid: RUNNER_PID, ppid: SHELL, command: process.execPath, args: `node ${runner} ${argv.join(" ")}` }],
  // shell 用抓到的真实 args；command 用 ps 报的真实值
  [SHELL, { pid: SHELL, ppid: Number(shellPpid), command: "/bin/bash", args: patched }],
]);
// 网关及其 launchd 锚点：用 Runner 自己的读法（不截断 comm）
let up = Number(shellPpid);
for (let i = 0; i < 2 && up > 1; i += 1) {
  const row = readMacProcessRow(up);
  if (!row) break;
  rows.set(up, row);
  up = row.ppid;
}
const stages = [];
const trusted = inspectTrustedSocialInvoker({
  argv, command: parseCommand(argv), configPath: SOCIAL_RUNTIME_CONFIG_PATH,
  pid: RUNNER_PID, runnerPath: runner, nodePath: process.execPath,
  readProcess: (pid) => rows.get(pid), stages,
});
console.log(trusted
  ? "ACCEPT  the gate matches this host; any refusal is the caller's command shape"
  : `REJECT  refused at: ${stages[0] ?? "unknown"}`);
process.exit(trusted ? 0 : 1);
