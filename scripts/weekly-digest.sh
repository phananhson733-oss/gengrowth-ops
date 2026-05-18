#!/usr/bin/env bash
# 由 .github/workflows/weekly-inbox-digest.yml 调用。
# 生成过去 7 天 inbox/ 改动摘要, 写到 /tmp/digest-body.md, 并设置 GITHUB_OUTPUT。
#
# 环境变量:
#   GITHUB_REPOSITORY  例如 xdawayer/gengrowth-ops
#   GITHUB_OUTPUT      Actions 写步骤输出的目标 (自动设置)

set -euo pipefail

SINCE=$(date -u -d "7 days ago" +%Y-%m-%d 2>/dev/null || date -u -v-7d +%Y-%m-%d)
NOW=$(date -u +%Y-%m-%d)

CHANGES=$(git log --since="$SINCE" --pretty=format:"" --name-status -- 'inbox/' 2>/dev/null \
  | grep -vE '^\s*$' | sort -u || true)

if [ -z "$CHANGES" ]; then
  echo "has_changes=false" >> "${GITHUB_OUTPUT:-/dev/null}"
  echo "本周 inbox/ 无变化, 不开 issue。"
  exit 0
fi

# 三档 bucket
highlight=$(echo "$CHANGES" | grep -E "inbox/08-reports-and-feedback/" || true)
content=$(echo "$CHANGES" | grep -E "inbox/(01-keyword-research|03-content-briefs|04-production)/" || true)
other=$(echo "$CHANGES" | grep -vE "inbox/(08-reports-and-feedback|01-keyword-research|03-content-briefs|04-production)/" || true)

render() {
  local block="$1"
  if [ -z "$block" ]; then
    echo "_(无)_"
    return
  fi
  echo "$block" | while IFS=$'\t' read -r status file; do
    [ -z "$file" ] && continue
    case "$status" in
      A) icon="✨" ;;
      M) icon="✏️" ;;
      D) icon="🗑️" ;;
      *) icon="•" ;;
    esac
    echo "- $icon \`$file\`"
  done
}

OUT=/tmp/digest-body.md
{
  echo "> 时间窗: $SINCE → $NOW"
  echo "> 仓库: ${GITHUB_REPOSITORY:-unknown}"
  echo "> 触发: weekly-inbox-digest.yml"
  echo
  echo "## 🔔 反馈 & 周报 (重点看)"
  echo
  render "$highlight"
  echo
  echo "## ✍️ 内容产出 (调研 / 简报 / 草稿)"
  echo
  render "$content"
  echo
  echo "## 📦 其他"
  echo
  render "$other"
  echo
  echo "---"
  echo
  echo "## 怎么处理"
  echo
  echo "- **值得收编到 wiki 的 SOP / 反馈结论** → 去 \`xdawayer/gengrowth-wiki\` 提 PR"
  echo "- **只是过程记录** → 留在 inbox/ 即可, 或归档到 \`inbox/09-archive/\`"
  echo "- **status: ready_for_review 的内容** → 应该已经触发 dispatch 开过 PR, 检查 PR 列表"
} > "$OUT"

{
  echo "has_changes=true"
  echo "week_start=$SINCE"
  echo "week_end=$NOW"
} >> "${GITHUB_OUTPUT:-/dev/null}"

echo "✅ digest body 写入 $OUT ($(wc -l < "$OUT") 行)"
