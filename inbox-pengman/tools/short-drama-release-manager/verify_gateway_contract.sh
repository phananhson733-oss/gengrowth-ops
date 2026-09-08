#!/bin/bash
# Compare the provenance gate against the Hermes release that is actually running.
#
# READ THIS BEFORE BELIEVING A FAILURE.
#
# The suite builds its wrapper fixture by calling LocalEnvironment._wrap_command() on an
# instance made with object.__new__ and a few hand-set attributes. That construction is tied to
# Hermes internals and goes stale: on 2026-09-08 the running release raised
# _snapshot_excluded_passthrough_names() inside _wrap_command, so the test errored out while
# the gate itself was fine — verified by feeding it a wrapper the live gateway really emitted,
# which it ACCEPTED.
#
# So this script reports three outcomes, not two, and never claims the gate is broken on the
# strength of a fixture that would not build.
#
#   OK            gate matches the running release
#   INCONCLUSIVE  the fixture could not be generated for that release; run verify_gateway_live.mjs
#   BROKEN        the fixture built and the gate rejected it
#
# Run after every Hermes upgrade, and before concluding a Social refusal is the caller's fault.

set -u
cd "$(dirname "$0")"

running=$(ps -axo args -ww 2>/dev/null \
  | grep -oE '/Users/[^ ]*/\.hermes/versions/[^/]+/\.venv/bin/python' \
  | head -1)

if [ -z "$running" ]; then
  echo "SKIP  no running Hermes gateway found; nothing to compare against"
  exit 0
fi

root="${running%/.venv/bin/python}"
echo "running gateway : $root"
echo "suite default   : ${HERMES_SOURCE_ROOT:-/Users/awayer_mini/hermes-agent}"
echo

log=$(mktemp)
if HERMES_SOURCE_ROOT="$root" node --test tests/cli.test.mjs >"$log" 2>&1; then
  echo "OK    the gate matches the Hermes release that is actually running"
  rm -f "$log"
  exit 0
fi

# A fixture that cannot even be generated proves nothing about the gate.
if grep -q "Command failed:.*\.venv/bin/python" "$log"; then
  echo "INCONCLUSIVE  the wrapper fixture could not be generated for this release:"
  grep -oE "line [0-9]+, in [a-z_]+" "$log" | tail -2 | sed 's/^/              /'
  echo
  echo "              This says the test's construction of LocalEnvironment is out of date."
  echo "              It says NOTHING about whether the gate accepts real wrappers."
  echo "              To find out, capture a wrapper the live gateway emitted and run:"
  echo "                node verify_gateway_live.mjs <captured-bash-row.txt>"
  rm -f "$log"
  exit 2
fi

echo "BROKEN  the fixture built and the gate rejected it. Failing cases:"
grep -E '^✖' "$log" | sed 's/^/        /' | head
rm -f "$log"
exit 1
