#!/usr/bin/env bash
#
# 新人工作台 · 本地首次设置（稀疏检出 sparse-checkout）
# ---------------------------------------------------------------
# 在【新人自己的电脑】上运行一次（通常由管理员 wzb 协助跑）。需先装好 Git（git-scm.com）。
#
# 作用：把团队仓库 clone 下来，但本地【只检出该新人自己的工作台目录】，
#       其余目录（别人的工作台、docs、图片…）不下载到本地。
#       —— 新人既看不到也碰不到别人的东西；而 .git 仍是完整仓库、
#          Obsidian 打开的还是仓库根，所以【自动同步完全不受影响】。
#
# 说明：仓库里的 .obsidian/ 已被 .gitignore 忽略，所以每个人的 Obsidian
#       配置只存在本地、互不干扰，无需额外处理。
#
# 用法（在想存放仓库的父目录里运行，例如先 cd ~/Documents）：
#   bash setup-workspace-local.sh                # 默认工作台 inbox-pengman
#   bash setup-workspace-local.sh inbox-xxx      # 指定别的工作台
#
# clone 时会要求登录：用户名填 GitHub 账号，密码栏【粘贴 Token】（不是密码）。
# ---------------------------------------------------------------
set -euo pipefail

WORKSPACE="${1:-inbox-pengman}"
REPO_URL="https://github.com/xdawayer/gengrowth-ops.git"
DIR_NAME="gengrowth-ops"

echo "▶ 即将 clone 到 ./${DIR_NAME}/ ，本地只检出 ${WORKSPACE}/"
echo "  登录时：用户名 = 你的 GitHub 账号；密码栏 = 粘贴 Token。"
echo

# 1) 稀疏 + 部分克隆：工作区先不铺开，也不下载用不到的大文件
git clone --filter=blob:none --sparse "$REPO_URL" "$DIR_NAME"
cd "$DIR_NAME"

# 2) 只检出自己的工作台目录（cone 模式）
git sparse-checkout set "$WORKSPACE"

# 3) 多人共用一个库：合并式 pull，自动拉取时不容易卡
git config pull.rebase false

echo
echo "✅ 完成！本地 ${DIR_NAME}/ 现在只检出了 ${WORKSPACE}/（外加少量根级文件）。"
echo "   下一步：用 Obsidian「打开文件夹作为库」，选这个 ${DIR_NAME} 文件夹。"
