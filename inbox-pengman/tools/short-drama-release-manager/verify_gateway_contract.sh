#!/bin/bash
# Does the Social provenance gate still match the Hermes that is actually running?
#
# inspectTrustedSocialInvoker matches the Hermes wrapper script line by line. The suite
# generates that wrapper by calling the real LocalEnvironment._wrap_command(), but from
# HERMES_SOURCE_ROOT, which defaults to ~/hermes-agent. The gateway that actually serves the
# bot runs from ~/.hermes/versions/<release>/. When those two diverge, every Social call is
# refused with social_invoker_untrusted / stage=shell while the whole suite stays green.
#
# That is exactly what happened on 2026-09-08.
#
# Run this after any Hermes upgrade, and before concluding that a refusal is the caller's fault.

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

if HERMES_SOURCE_ROOT="$root" node --test tests/cli.test.mjs >/tmp/gateway-contract.$$ 2>&1; then
  echo "OK    the gate matches the Hermes release that is actually running"
  rm -f /tmp/gateway-contract.$$
  exit 0
fi

echo "BROKEN  the gate does NOT match the running Hermes release."
echo "        Every Social bot call will fail with social_invoker_untrusted, stage=shell,"
echo "        no matter how the command is written. Failing cases:"
grep -E '^✖' /tmp/gateway-contract.$$ | sed 's/^/        /' | head
rm -f /tmp/gateway-contract.$$
exit 1
