#!/bin/bash
# HR 文档导出脚本
# 用法见底部说明

HR_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${HR_DIR}/../../.." && pwd)"
PANDOC="$HOME/bin/pandoc"

if ! command -v "$PANDOC" &>/dev/null; then
  if [ -x "/opt/homebrew/bin/pandoc" ]; then
    PANDOC="/opt/homebrew/bin/pandoc"
  elif [ -x "/usr/local/bin/pandoc" ]; then
    PANDOC="/usr/local/bin/pandoc"
  else
  PANDOC="pandoc"
  fi
fi
if ! command -v "$PANDOC" &>/dev/null; then
  echo "❌ 未找到 pandoc，请联系技术支持重新安装"
  exit 1
fi

# 定位 soffice（LibreOffice，用于 docx → pdf）
find_soffice() {
  if [ -x "/opt/homebrew/bin/soffice" ]; then
    echo "/opt/homebrew/bin/soffice"
  elif [ -x "/Applications/LibreOffice.app/Contents/MacOS/soffice" ]; then
    echo "/Applications/LibreOffice.app/Contents/MacOS/soffice"
  elif command -v soffice &>/dev/null; then
    command -v soffice
  fi
}

# ── 核心：清洗 md 内容 ──
# 1. 去掉 YAML frontmatter
# 2. --- 分隔线转空行
# 3. 遇到内部备注锚点 <!-- INTERNAL-ONLY-BELOW ... --> 后，截断其后全部内容
#    （HR 内部留底段统一放文末该锚点之后，打印件/成品件一律不输出）
clean_md() {
  awk '
    NR==1 && /^---$/ { in_yaml=1; next }
    in_yaml && /^---$/ { in_yaml=0; next }
    in_yaml { next }
    /<!--[[:space:]]*INTERNAL-ONLY-BELOW/ { exit }
    /^---$/ { print ""; next }
    { print }
  '
}

postprocess_docx() {
  local file="$1"
  python3 "${HR_DIR}/postprocess_fill_lines.py" "$file"
}

# ── 模式一：打印版（{{xxx}} → 可填写下边线） ──
# 默认连带导出打印用 pdf（供现场打印）。
# 注意：此打印 pdf 仅用于现场打印，签字前不计入归档；归档 pdf 仍只在签字完成后另行生成。
# 如确实只需 docx，可加第二参数 nopdf：export_blank <md> nopdf
export_blank() {
  local input="$1"
  local nopdf="$2"
  if [[ "$input" != /* ]]; then
    input="${REPO_ROOT}/${input}"
  fi
  local filename=$(basename "$input" .md)
  local out_dir
  out_dir="$(dirname "$input")"
  local output="${out_dir}/${filename}-打印版.docx"
  local pdf_output="${out_dir}/${filename}-打印版.pdf"

  clean_md < "$input" \
    | sed 's/{{[^}]*}}/＿＿＿＿＿＿＿＿/g' \
    | sed 's/&nbsp;/ /g' \
    | "$PANDOC" -f markdown -t docx \
        --metadata title="" \
        --reference-doc="${HR_DIR}/reference.docx" \
        -o "$output"
  postprocess_docx "$output"

  echo "✅ 打印版 docx 已生成：$output"

  # 默认连带导出打印用 pdf（供现场打印；签字前不计入归档）
  if [ "$nopdf" = "nopdf" ]; then
    echo "ℹ️  已按 nopdf 跳过打印 pdf 导出"
    return
  fi
  local SOFFICE
  SOFFICE=$(find_soffice)
  if [ -z "$SOFFICE" ]; then
    echo "⚠️  未找到 LibreOffice (soffice)，跳过打印 pdf 导出（docx 已生成）。安装：brew install --cask libreoffice"
    return
  fi
  rm -f "$pdf_output"
  "$SOFFICE" --headless --convert-to pdf "$output" --outdir "$out_dir" >/dev/null 2>&1
  if [ ! -s "$pdf_output" ]; then
    echo "⚠️  打印 pdf 转换失败（docx 已生成）"
    return
  fi
  echo "✅ 打印版 pdf 已生成（供现场打印，签字前不计入归档）：$pdf_output"
}

# ── 模式二：存档版（保留 {{}} 占位符，在 Word 里替换；已有空白位转为下边线） ──
export_archive() {
  local input="$1"
  if [[ "$input" != /* ]]; then
    input="${REPO_ROOT}/${input}"
  fi
  local filename=$(basename "$input" .md)
  local out_dir
  out_dir="$(dirname "$input")"
  local output="${out_dir}/${filename}-存档版.docx"

  clean_md < "$input" \
    | sed 's/&nbsp;/ /g' \
    | "$PANDOC" -f markdown -t docx \
        --metadata title="" \
        --reference-doc="${HR_DIR}/reference.docx" \
        -o "$output"
  postprocess_docx "$output"

  echo "✅ 存档版已生成：$output"
  echo "   提示：Word 中按 Cmd+H，逐一替换 {{姓名}} 等占位符"
}

# ── 模式四：成品版（已填好的 md → docx + pdf，同样式，文件名无后缀） ──
# 用于 offer/合同等已经把占位符填好的文档：一行命令生成 docx 和与之样式一致的 pdf
export_pdf() {
  local input="$1"
  if [[ "$input" != /* ]]; then
    input="${REPO_ROOT}/${input}"
  fi
  local filename
  filename=$(basename "$input" .md)
  local out_dir
  out_dir="$(dirname "$input")"
  local docx_output="${out_dir}/${filename}.docx"
  local pdf_output="${out_dir}/${filename}.pdf"

  local SOFFICE
  SOFFICE=$(find_soffice)
  if [ -z "$SOFFICE" ]; then
    echo "❌ 未找到 LibreOffice (soffice)，无法转 PDF。安装：brew install --cask libreoffice"
    exit 1
  fi

  clean_md < "$input" \
    | sed 's/&nbsp;/ /g' \
    | "$PANDOC" -f markdown -t docx \
        --metadata title="" \
        --reference-doc="${HR_DIR}/reference.docx" \
        -o "$docx_output"
  postprocess_docx "$docx_output"

  rm -f "$pdf_output"
  "$SOFFICE" --headless --convert-to pdf "$docx_output" --outdir "$out_dir" >/dev/null 2>&1

  if [ ! -s "$pdf_output" ]; then
    echo "❌ PDF 转换失败"
    exit 1
  fi

  echo "✅ docx 已生成：$docx_output"
  echo "✅ pdf  已生成：$pdf_output"
}

# ── 模式三：批量导出所有模板（打印版） ──
export_all_blank() {
  echo "📁 批量导出所有模板为打印版..."
  # 注：offer 类（录用通知 / 实习生录用通知）不放在这里——offer 走邮件发 PDF，
  # 从不打印空白件。每位候选人的填好版用 `hr-export.sh pdf <md>` 单独导出。
  local files=(
    "${REPO_ROOT}/docs/05-governance/contracts/employment/templates/劳动合同-模板.md"
    "${REPO_ROOT}/docs/05-governance/contracts/employment/templates/保密与竞业限制协议-模板.md"
    "${REPO_ROOT}/docs/05-governance/people-ops/onboarding/templates/入职登记表-模板.md"
    "${REPO_ROOT}/docs/05-governance/people-ops/policies/员工手册.md"
  )
  for f in "${files[@]}"; do
    [ -f "$f" ] || continue
    export_blank "$f"
  done
  echo "🎉 完成！文件已写回各自模板所在目录。"
}

# ── 入口 ──
case "$1" in
  blank)
    [ -z "$2" ] && { echo "用法：$0 blank <文件.md>"; exit 1; }
    export_blank "$2"
    ;;
  archive)
    [ -z "$2" ] && { echo "用法：$0 archive <文件.md>"; exit 1; }
    export_archive "$2"
    ;;
  pdf)
    [ -z "$2" ] && { echo "用法：$0 pdf <文件.md>"; exit 1; }
    export_pdf "$2"
    ;;
  all)
    export_all_blank
    ;;
  *)
    echo ""
    echo "📄 HR 文档导出工具"
    echo "用法："
    echo "  $0 blank   <文件.md>   → 打印版（空白下划线）docx + 打印 pdf（默认连带，nopdf 跳过）"
    echo "  $0 archive <文件.md>   → 存档版（保留占位符）"
    echo "  $0 pdf     <文件.md>   → 成品版（已填好的 md → docx + 同样式 pdf）"
    echo "  $0 all                 → 批量导出全部模板（打印版）"
    echo ""
    ;;
esac
