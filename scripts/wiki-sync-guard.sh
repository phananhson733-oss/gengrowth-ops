#!/usr/bin/env bash
# 由 .github/workflows/wiki-sync-guard.yml 调用。
# 检测本次 push 范围内是否有非 wiki-sync[bot] 的 commit 触碰了 wiki 同步白名单目录,
# 有则生成 issue body 到 /tmp/guard-body.md。
#
# 环境变量:
#   BEFORE_SHA   push 前的 SHA (github.event.before, 首次 push 时为 zeros)
#   AFTER_SHA    push 后的 SHA (github.event.after)
#   GITHUB_OUTPUT  Actions 步骤输出

set -euo pipefail

ZEROS='0000000000000000000000000000000000000000'

# 决定 commit 范围
if [ -z "${BEFORE_SHA:-}" ] || [ "$BEFORE_SHA" = "$ZEROS" ]; then
  COMMITS=$(git log --pretty=format:"%H|%an" "$AFTER_SHA" 2>/dev/null | head -50)
else
  COMMITS=$(git log --pretty=format:"%H|%an" "${BEFORE_SHA}..${AFTER_SHA}" 2>/dev/null)
fi

BAD_COMMITS=$(echo "$COMMITS" | grep -v '|wiki-sync\[bot\]$' || true)

if [ -z "$BAD_COMMITS" ]; then
  echo "✅ 本次 push 仅含 wiki-sync[bot] 的 commit, 正常。"
  echo "violation=false" >> "${GITHUB_OUTPUT:-/dev/null}"
  exit 0
fi

# 白名单正则 (11 个目录)
WHITELIST_RE='^(docs/03-marketing/|内容资产/|docs/06-shared/assets/brand/|参考资料/产品分析/|docs/04-programs/|每日日报/|参考资料/tool-guides/|docs/05-governance/account-access/|docs/05-governance/people-ops/policies/|docs/05-governance/people-ops/team-collaboration/|task-collab/)'

REPORT=""
HAS_VIOLATION=0
while IFS='|' read -r sha author; do
  [ -z "$sha" ] && continue
  files=$(git diff-tree --no-commit-id --name-only -r "$sha" 2>/dev/null | grep -E "$WHITELIST_RE" || true)
  if [ -n "$files" ]; then
    HAS_VIOLATION=1
    short=$(echo "$sha" | cut -c1-7)
    REPORT="${REPORT}### commit ${short} — ${author}\n\n"
    while IFS= read -r f; do
      REPORT="${REPORT}- ${f}\n"
    done <<< "$files"
    REPORT="${REPORT}\n"
  fi
done <<< "$BAD_COMMITS"

if [ "$HAS_VIOLATION" -eq 0 ]; then
  echo "✅ 非 bot commit 但未触碰白名单目录, 跳过。"
  echo "violation=false" >> "${GITHUB_OUTPUT:-/dev/null}"
  exit 0
fi

OUT=/tmp/guard-body.md
ACTOR="${GITHUB_ACTOR:-unknown}"
REPO="${GITHUB_REPOSITORY:-unknown}"
RUN="${GITHUB_RUN_ID:-unknown}"

{
  echo "@${ACTOR}"
  echo
  echo "你刚推送了改动到 **wiki 同步目录**, 这些目录是 \`gengrowth-wiki\` 单向 rsync --delete 镜像, 修改**会在下次 wiki sync 触发时被静默覆盖或删除**。"
  echo
  echo "## 受影响的修改"
  echo
  printf "%b" "$REPORT"
  echo
  echo "## 怎么办"
  echo
  echo "- 如果这些修改重要 → **去 \`xdawayer/gengrowth-wiki\` 提 PR**, 让改动从源头流过来"
  echo "- 如果是临时草稿 → 移到 \`inbox/\` 下保留, 或直接放弃"
  echo "- 如果是 ops 独有内容 → 放在非同步目录 (\`onboarding/\`, \`templates/\`)"
  echo
  echo "## 设计原则"
  echo
  echo "ops 是运营视图, **wiki 是真相源**。inbox/ 之外的内容以 wiki 为准。"
  echo
  echo "> Run: https://github.com/${REPO}/actions/runs/${RUN}"
} > "$OUT"

echo "violation=true" >> "${GITHUB_OUTPUT:-/dev/null}"
echo "⚠️ 检测到 $(echo "$BAD_COMMITS" | wc -l | tr -d ' ') 个违规 commit, body 写入 $OUT"
