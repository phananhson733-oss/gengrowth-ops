#!/bin/bash
# 双击此文件，自动将所有 HR 模板导出为 Word 打印版

# 进入脚本所在目录
cd "$(dirname "$BASH_SOURCE")"

echo ""
echo "📄 GenGrowth HR 文档导出工具"
echo "================================"
echo "正在导出所有模板为打印版 Word..."
echo ""

bash hr-export.sh all

echo ""
echo "✅ 完成！请到各模板原始 md 所在目录查看对应的 docx 文件。"
echo ""
read -p "按 Enter 关闭此窗口..."
