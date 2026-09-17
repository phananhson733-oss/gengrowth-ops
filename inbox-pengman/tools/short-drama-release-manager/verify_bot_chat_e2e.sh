#!/bin/bash
# End-to-end check of the goal: change a Feishu Base row by talking to the Social Bot.
#
# Everything up to the bot has been verified separately — the provenance gate accepts this
# host (verify_gateway_live.mjs), the Runner's app holds create/update/delete scope, and the
# preview -> apply path refuses replays. What this script proves is the part none of those
# cover: that a sentence in Feishu ends up as a changed cell in the Base.
#
#   ./verify_bot_chat_e2e.sh              read only  — asks for pool list, expects 61 rows
#   ./verify_bot_chat_e2e.sh --with-write read, then preview -> apply on one field, verify, revert
#
# The write target is 选剧池 SD-000001's 备注, which is empty, so a failed run leaves nothing
# ambiguous behind. The value written is a timestamped nonce: the bot cannot produce it from
# reading files, so seeing it in the Base is proof the command really ran.
#
# Verification never trusts the bot's own account of what it did. Every claim is checked by
# reading the Base directly through lark-cli, which does not go through the Runner at all.

set -u
CHAT="oc_a4dae18b4ffeedc2877fe21dc58633c7"    # SHORTDRAMA_OPS_CHAT_ID
BOT="ou_f381782d381cb4dd9ee747c81aa3ba0f"
BASE="OtnsbnRnwaLmnVsJByscTkFMntd"
POOL="tbl4efRfwhJRqryA"
REC="recvuxwd57tfNf"                           # 选剧池 SD-000001
RUNNER="/Users/awayer_mini/gengrowth-ops/inbox-pengman/tools/short-drama-release-manager/shortdrama_ctl.mjs"
CONFIG="/Users/awayer_mini/gengrowth-ops/inbox-pengman/tools/short-drama-release-manager/shortdrama.runtime.json"
WRITE=0
[ "${1:-}" = "--with-write" ] && WRITE=1

say () { lark-cli im +messages-send --as user --chat-id "$CHAT" --text "$1" >/dev/null 2>&1; }

# Wait for the bot's next message strictly after $1 (a "YYYY-MM-DD HH:MM" string).
await_bot () {
  local after="$1" waited=0
  while [ $waited -lt 180 ]; do
    local out
    out=$(lark-cli im +chat-messages-list --chat-id "$CHAT" --order desc --as user 2>/dev/null \
      | python3 -c "
import json,sys
try: d=json.load(sys.stdin)['data']['messages']
except Exception: sys.exit(0)
for m in d[:4]:
    if m['sender'].get('sender_type')=='app' and m['create_time'] > '$after':
        print(m['content']); break
")
    [ -n "$out" ] && { printf '%s' "$out"; return 0; }
    sleep 6; waited=$((waited+6))
  done
  return 1
}

remark () {
  lark-cli base +record-get --base-token "$BASE" --table-id "$POOL" --record-id "$REC" --as user 2>/dev/null \
    | sed -n 's/^- `备注`: *//p' | head -1
}

stamp () { date "+%Y-%m-%d %H:%M"; }

echo "=== 1. read chain ==="
t0=$(stamp); sleep 61
say "<at user_id=\"$BOT\"></at> 请原样执行这一条并把完整 stdout 贴回（不要加 cd，不要改写）：
/usr/bin/env node $RUNNER pool list --config $CONFIG"
reply=$(await_bot "$t0") || { echo "FAIL  bot did not answer within 180s"; exit 1; }
echo "$reply" | head -20
if printf '%s' "$reply" | grep -qiE "预授权|not in.*flow|不属于"; then
  echo
  echo "BLOCKED  §4.3 is not in effect. Add it to ~/.hermes/profiles/social/SOUL.md, then /reset."
  exit 2
fi
if printf '%s' "$reply" | grep -q "social_invoker_untrusted"; then
  echo
  echo "BLOCKED  the gate refused. Read details.stage: argv/payload = the command is wrong,"
  echo "         runner/shell/gateway = the process chain did not match this host."
  exit 3
fi
echo
echo "read chain answered. Confirm above that it lists 61 rows."
[ $WRITE -eq 0 ] && { echo; echo "Run with --with-write to exercise the write chain."; exit 0; }

echo
echo "=== 2. write chain (preview -> apply -> verify -> revert) ==="
before=$(remark)
nonce="链路验证-$(date +%H%M%S)"
echo "备注 before : '${before}'"
echo "will write  : '${nonce}'"
if [ -n "$before" ]; then
  echo "ABORT  备注 is not empty; refusing to overwrite an existing value."
  exit 4
fi

t1=$(stamp); sleep 61
say "<at user_id=\"$BOT\"></at> 请原样执行（不要加 cd）：
/usr/bin/env node $RUNNER pool preview-update --config $CONFIG --payload -
然后把回执原样贴回，先不要 apply。payload：
{\"key\":\"SD-000001\",\"patch\":{\"备注\":\"$nonce\"}}"
preview=$(await_bot "$t1") || { echo "FAIL  no preview reply"; exit 1; }
echo "$preview" | head -25
receipt=$(printf '%s' "$preview" | grep -oE '\brc[A-Za-z0-9_-]{6,}|"receipt_id"\s*:\s*"[^"]+"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
[ -z "$receipt" ] && { echo; echo "FAIL  no receipt id in the reply; not applying anything."; exit 5; }
echo; echo "receipt: $receipt"

t2=$(stamp); sleep 61
say "<at user_id=\"$BOT\"></at> 回执已确认，请执行 apply：
/usr/bin/env node $RUNNER pool apply-update --config $CONFIG --payload -
payload：
{\"receiptId\":\"$receipt\"}"
applied=$(await_bot "$t2") || { echo "FAIL  no apply reply"; exit 1; }
echo "$applied" | head -20

echo
echo "=== 3. independent verification (reads the Base directly, not through the Runner) ==="
after=$(remark)
echo "备注 after : '${after}'"
if [ "$after" = "$nonce" ]; then
  echo "PASS  a sentence in Feishu changed a cell in the Base."
else
  echo "FAIL  the Base does not carry the nonce; the bot's report was not the truth."
fi

echo
echo "=== 4. revert ==="
lark-cli base +record-batch-update --base-token "$BASE" --table-id "$POOL" --as user \
  --json "{\"update_records\":{\"$REC\":{\"备注\":\"\"}}}" >/dev/null 2>&1
echo "备注 now   : '$(remark)'   (expected empty)"
