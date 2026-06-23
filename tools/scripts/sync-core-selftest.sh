#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/sync-core-selftest.XXXXXX")"
trap 'rm -rf "$TMP_ROOT"' EXIT

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

make_vault_sync_stub() {
  local stub="$TMP_ROOT/vault-sync-stub.sh"
  cat > "$stub" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$SYNC_CORE_SELFTEST_VAULT_LOG"
exit 0
STUB
  chmod +x "$stub"
  echo "$stub"
}

test_syncs_wiki_tools_into_ops_tools() {
  local wiki="$TMP_ROOT/wiki"
  local ops="$TMP_ROOT/ops"
  local vault_log="$TMP_ROOT/vault-sync.log"
  local log_file="$TMP_ROOT/sync.log"

  mkdir -p "$wiki/.git" "$ops/.git" "$ops/inbox" "$ops/onboarding"
  mkdir -p "$wiki/tools/internal/sample-tool" "$ops/tools/old-tool"
  printf 'tool payload\n' > "$wiki/tools/internal/sample-tool/run.sh"
  printf 'stale\n' > "$ops/tools/old-tool/old.txt"

  export SYNC_CORE_SELFTEST_VAULT_LOG="$vault_log"

  WIKI="$wiki"
  OPS_REPO="$ops"
  AGENTS_REPO="$TMP_ROOT/missing-agents"
  PYTHON="bash"
  VAULT_SYNC="$(make_vault_sync_stub)"
  LOG="$log_file"

  log() { echo "$1" >> "$LOG"; }

  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/_sync-core.sh"
  gengrowth_sync_core

  [ -f "$ops/tools/internal/sample-tool/run.sh" ] ||
    fail "wiki/tools content was not copied into ops/tools"
  [ ! -e "$ops/tools/old-tool/old.txt" ] ||
    fail "stale ops/tools content was not removed"

  local ops_sync_count
  ops_sync_count="$(grep -c -- "--repo $ops" "$vault_log" || true)"
  [ "$ops_sync_count" -ge 2 ] ||
    fail "ops repo should be synced again after tools mirror, saw $ops_sync_count sync call(s)"
}

test_repo_discovery_prefers_code_directory() {
  local previous_home="$HOME"
  local fake_home="$TMP_ROOT/home"
  mkdir -p "$fake_home/Code/gengrowth-ops"

  HOME="$fake_home"
  export HOME

  [ -f "$SCRIPT_DIR/_repo-discovery.sh" ] ||
    fail "repo discovery helper is missing"

  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/_repo-discovery.sh"

  local discovered
  discovered="$(gengrowth_find_repo gengrowth-ops)"

  HOME="$previous_home"
  export HOME

  [ "$discovered" = "$fake_home/Code/gengrowth-ops" ] ||
    fail "expected repo discovery to find $fake_home/Code/gengrowth-ops, got $discovered"
}

test_log_line_count_handles_missing_log_quietly() {
  local missing_log="$TMP_ROOT/missing-dir/frequent-sync.log"
  local stderr_file="$TMP_ROOT/log-line-count.stderr"
  local count

  [ -f "$SCRIPT_DIR/_shell-utils.sh" ] ||
    fail "shell utils helper is missing"

  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/_shell-utils.sh"

  count="$(gengrowth_log_line_count "$missing_log" 2>"$stderr_file")"

  [ "$count" = "0" ] ||
    fail "expected missing log line count to be 0, got $count"
  [ ! -s "$stderr_file" ] ||
    fail "missing log line count should not write stderr"
}

test_repo_discovery_prefers_code_directory
test_log_line_count_handles_missing_log_quietly
test_syncs_wiki_tools_into_ops_tools

echo "sync-core selftest: ok"
