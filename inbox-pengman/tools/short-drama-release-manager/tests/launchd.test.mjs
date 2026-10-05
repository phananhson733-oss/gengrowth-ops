import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import { chmod, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const execFile = promisify(execFileCallback);

test("launchd assets use the ticker and preserve the old evidence label", async () => {
  const installer = await readFile(new URL("../install_launchd.sh", import.meta.url), "utf8");
  const runner = await readFile(new URL("../run_scheduled.sh", import.meta.url), "utf8");
  const plist = await readFile(new URL("../launchd/com.gengrowth.shortdrama-sync.plist", import.meta.url), "utf8");
  const old = await readFile(new URL("../launchd/com.gengrowth.shortdrama-feishu-sync.plist", import.meta.url), "utf8");
  for (const text of [installer, runner, plist]) assert.doesNotMatch(text, /\/Users\/pengman/);
  assert.match(old, /com\.gengrowth\.shortdrama-feishu-sync/);
  assert.match(runner, /TZ=Asia\/Shanghai/);
  assert.match(runner, /schedule tick/);
  assert.match(runner, /queue drain/);
  assert.match(runner, /schedule health/);
  assert.match(runner, /SHORTDRAMA_NODE_BIN/);
  assert.doesNotMatch(runner, /nohup|spawnWorker|detached/);
  assert.doesNotMatch(installer, /kickstart\s+-k/);
  assert.match(installer, /plutil\s+-lint/);
  assert.match(installer, /launchctl_bin.*bootout/s);
  assert.match(installer, /launchctl_bin.*bootstrap/s);
  assert.match(installer, /launchctl_bin.*print/s);
  assert.match(installer, /backup_plist/);
  assert.match(installer, /trap .*rollback/);
  assert.match(installer, /SHORTDRAMA_NODE_BIN/);
  assert.match(installer, /internal\.capability/);
  assert.match(installer, /expected-base-token/);
  assert.match(installer, /expected_base_token/);
  assert.match(installer, /privileged_actor_id/);
  assert.doesNotMatch(installer, /doctor="\$\(\$node_bin/);
  assert.match(installer, /chmod 600|chmod\s+0600/);
  assert.match(installer, /rollback_verification_failed/);
  assert.equal(installer.includes('launchctl_bin="/bin/launchctl"'), true);
  assert.doesNotMatch(installer, /SHORTDRAMA_INSTALL_TEST|SHORTDRAMA_TEST_LAUNCHCTL|TEST_FIXTURE_ROOT/);
  assert.match(runner, /SHORTDRAMA_INTERNAL_CAPABILITY/);
  assert.doesNotMatch(runner, /launchd:com\.gengrowth\.shortdrama-sync/);
  assert.match(plist, /<key>SHORTDRAMA_CAPABILITY_FILE<\/key>/);
  assert.doesNotMatch(plist, /SHORTDRAMA_INTERNAL_CAPABILITY|SHORTDRAMA_INTERNAL_MARKER/);
  assert.match(plist, /<string>com\.gengrowth\.shortdrama-sync<\/string>/);
  assert.match(plist, /<key>StartInterval<\/key>\s*<integer>300<\/integer>/s);
  assert.match(plist, /<key>SHORTDRAMA_NODE_BIN<\/key>/);
  assert.doesNotMatch(plist, /StartCalendarInterval/);
});

test("offline installer harness restores and re-verifies a previously loaded service after bootstrap failure", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shortdrama-installer-"));
  const home = path.join(root, "home");
  const targetDir = path.join(home, "Library", "LaunchAgents");
  await mkdir(targetDir, { recursive: true });
  const target = path.join(targetDir, "com.gengrowth.shortdrama-sync.plist");
  const oldRunner = path.join(root, "old", "bin", "zsh", "run_scheduled.sh");
  const oldConfig = path.join(root, "old", "config.json");
  const oldCwd = path.join(root, "old");
  await mkdir(oldCwd, { recursive: true });
  await writeFile(oldConfig, "{}\n");
  const oldPlist = `<?xml version="1.0" encoding="UTF-8"?>\n<plist version="1.0"><dict><key>Label</key><string>com.gengrowth.shortdrama-sync</string><key>ProgramArguments</key><array><string>/bin/zsh</string><string>${oldRunner}</string><string>${oldConfig}</string></array><key>WorkingDirectory</key><string>${oldCwd}</string></dict></plist>\n`;
  await writeFile(target, oldPlist);
  const rendered = path.join(root, "rendered.plist");
  await writeFile(rendered, oldPlist.replace(oldRunner, path.join(root, "new", "run_scheduled.sh")));
  const state = path.join(root, "loaded");
  const failed = path.join(root, "failed-once");
  const log = path.join(root, "launchctl.log");
  await writeFile(state, "loaded\n");
  const fake = path.join(root, "fake-launchctl.sh");
  await writeFile(fake, `#!/bin/zsh\nprint -- "$*" >> "$FAKE_LOG"\ncase "$1" in\nprint)\n  [[ -f "$FAKE_STATE" ]] || exit 1\n  if [[ "\${FAKE_BAD_RESTORE:-}" == "1" && -f "$FAKE_FAILED" && "$(/usr/bin/plutil -extract ProgramArguments.1 raw -o - "$FAKE_TARGET")" == "$FAKE_OLD_RUNNER" ]]; then print wrong; exit 0; fi\n  print -- "com.gengrowth.shortdrama-sync $(/usr/bin/plutil -extract ProgramArguments.1 raw -o - "$FAKE_TARGET") $(/usr/bin/plutil -extract ProgramArguments.2 raw -o - "$FAKE_TARGET") $(/usr/bin/plutil -extract WorkingDirectory raw -o - "$FAKE_TARGET")";;\nbootout) /bin/rm -f "$FAKE_STATE";;\nbootstrap)\n  if [[ ! -f "$FAKE_FAILED" ]]; then print x > "$FAKE_FAILED"; exit 9; fi\n  print loaded > "$FAKE_STATE";;\nenable) exit 0;;\n*) exit 2;;\nesac\n`);
  await chmod(fake, 0o700);
  const harness = new URL("fixtures/install_launchd_rollback_harness.sh", import.meta.url);
  let error;
  try {
    await execFile("/bin/zsh", [harness.pathname, root, fake, "gui/501", target, rendered], { env: {
      ...process.env, FAKE_LOG: log, FAKE_STATE: state,
      FAKE_FAILED: failed, FAKE_TARGET: target, FAKE_OLD_RUNNER: oldRunner,
    } });
  } catch (caught) { error = caught; }
  assert.equal(error?.code, 9, error?.stderr);
  assert.equal(await readFile(target, "utf8"), oldPlist);
  assert.match(await readFile(log, "utf8"), /bootstrap[\s\S]*bootstrap/);
  assert.match(await readFile(state, "utf8"), /loaded/);
  assert.doesNotMatch(error?.stderr ?? "", /rollback_verification_failed/);

  await rm(failed, { force: true });
  await writeFile(log, "");
  let verificationError;
  try {
    await execFile("/bin/zsh", [harness.pathname, root, fake, "gui/501", target, rendered], { env: {
      ...process.env, FAKE_LOG: log, FAKE_STATE: state,
      FAKE_FAILED: failed, FAKE_TARGET: target, FAKE_OLD_RUNNER: oldRunner, FAKE_BAD_RESTORE: "1",
    } });
  } catch (caught) { verificationError = caught; }
  assert.equal(verificationError?.code, 70);
  assert.match(verificationError?.stderr ?? "", /rollback_verification_failed: manual recovery required/);
});

test("offline installer harness rejects system or out-of-fixture launchctl binaries", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shortdrama-installer-isolation-"));
  const home = path.join(root, "home");
  await mkdir(home, { recursive: true });
  const target = path.join(home, "target.plist");
  const rendered = path.join(root, "rendered.plist");
  await writeFile(rendered, "fixture\n");
  const harness = new URL("fixtures/install_launchd_rollback_harness.sh", import.meta.url);
  for (const launchctl of ["/bin/launchctl", new URL("../install_launchd.sh", import.meta.url).pathname]) {
    await assert.rejects(execFile("/bin/zsh", [harness.pathname, root, launchctl, "gui/501", target, rendered]),
      (error) => error.code !== 0 && /Offline launchctl fixture is unsafe/.test(error.stderr));
  }
  await assert.rejects(readFile(target));
});


test("production plist rendering replaces the complete argument vector", async()=>{
 const installer=await readFile(new URL("../install_launchd.sh",import.meta.url),"utf8");
 const start=installer.indexOf('/bin/cp "$source_plist" "$rendered_plist"');
 const end=installer.indexOf('\ncleanup()');assert.ok(start>=0&&end>start);
 const dir=await mkdtemp(path.join(os.tmpdir(),"shortdrama-render-"));const rendered=path.join(dir,"output.plist"),runner=path.join(dir,"runner with spaces"),config=path.join(dir,"config with spaces.json");
 const script='set -euo pipefail\nfail() { print -u2 -- \"$1\"; exit 1; }\n'+installer.slice(start,end);
 await execFile("/bin/zsh",["-c",script],{env:{...process.env,source_plist:new URL("../launchd/com.gengrowth.shortdrama-sync.plist",import.meta.url).pathname,rendered_plist:rendered,script_dir:runner,config_path:config,node_bin:process.execPath,capability_file:path.join(dir,"capability")}});
 const result=await execFile("/usr/bin/plutil",["-extract","ProgramArguments","json","-o","-",rendered]);assert.deepEqual(JSON.parse(result.stdout),["/bin/zsh",runner+"/run_scheduled.sh",config]);assert.doesNotMatch(await readFile(rendered,"utf8"),/__RUNNER_DIR__|__CONFIG_PATH__|__NODE_BIN__|__CAPABILITY_FILE__/);
 await rm(dir,{recursive:true,force:true});
});
test("production cleanup succeeds on first install and preserves following success output",async()=>{
 const installer=await readFile(new URL("../install_launchd.sh",import.meta.url),"utf8");const cleanup=installer.match(/cleanup\(\) \{[\s\S]*?\n\}/)?.[0];assert.ok(cleanup);
 const dir=await mkdtemp(path.join(os.tmpdir(),"shortdrama-cleanup-")),rendered=path.join(dir,"rendered");await writeFile(rendered,"fixture");
 const result=await execFile("/bin/zsh",["-c",'set -euo pipefail\n'+cleanup+'\ncleanup\nprint -- "Installed and verified"'],{env:{...process.env,rendered_plist:rendered,backup_plist:""}});assert.match(result.stdout,/Installed and verified/);await assert.rejects(readFile(rendered));await rm(dir,{recursive:true,force:true});
});


test("production scheduled command loop executes all stages and returns the worst exit",async()=>{
 const source=await readFile(new URL("../run_scheduled.sh",import.meta.url),"utf8");const start=source.indexOf('export PATH=');assert.ok(start>=0);
 const dir=await mkdtemp(path.join(os.tmpdir(),"shortdrama-loop-"));const fake=path.join(dir,"fake-node"),log=path.join(dir,"calls");
 await writeFile(fake,'#!/bin/zsh\nprint -- "$2 $3" >> "$TASK_TEST_LOG"\ncase "$2 $3" in\n"schedule tick") exit 0;;\n"queue drain") exit 2;;\n"schedule health") exit 1;;\n*) exit 9;;\nesac\n');await chmod(fake,0o700);
 let caught;try{await execFile("/bin/zsh",["-c",'set -u\n'+source.slice(start)],{env:{...process.env,node_bin:fake,runner:path.join(dir,"fixture.mjs"),config_path:path.join(dir,"config.json"),TASK_TEST_LOG:log}});}catch(error){caught=error;}
 assert.equal(caught?.code,2,caught?.stderr);assert.deepEqual((await readFile(log,"utf8")).trim().split("\n"),["schedule tick","queue drain","schedule health"]);await rm(dir,{recursive:true,force:true});
});
