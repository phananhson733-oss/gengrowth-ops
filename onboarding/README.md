# 入职引导

欢迎加入 GenGrowth！

## 第一步：环境准备

1. 下载并安装 [Obsidian](https://obsidian.md/)
2. 接受 GitHub 邀请（邮件中）
3. 下载 Lynne 发给你的 vault 压缩包，解压后用 Obsidian 打开

## 第二步：Obsidian 插件确认

打开 Obsidian 后，进入 设置 → 第三方插件 → 关闭"安全模式"，然后在"社区插件浏览"里安装并启用：

- **Obsidian Git** — 用来同步文件（F5 = 提交并推送）
- **Templater** — 用来一键生成文件模板

## 第三步：配置 Templater 与新文件位置

### 3.1 Templater 模板目录

设置 → **Templater** → **Template folder location** 填 `templates`

### 3.2 (关键) 新建笔记默认落到 inbox/

新文件位置不在 Templater 里设，而是在 Obsidian 全局：

**设置 → 文件与链接(Files & Links)** → **新建笔记的默认位置**：

| 选项 | 值 |
|---|---|
| 新建笔记的默认位置 | **"在指定文件夹中"**(In the folder specified below) |
| 文件夹位置 | `inbox` |

> 作用：保证从模板新建的文件**永远落到 `inbox/`**。机器人(`.github/workflows/dispatch.yml`)只监听 `inbox/**` 路径，**文件不在 inbox/ 下，target frontmatter 写得再对也不会被搬走**。

顺便建议：

| 设置项 | 推荐 |
|---|---|
| 附件的默认位置 | "在当前文件所在文件夹的指定子文件夹" → 填 `attachments` |
| 使用 [[Wikilinks]] | ✅ 开启 |

### 3.3 绑定 Templater 快捷键

1. 设置 → 快捷键，搜 `Templater: Create new note from template`
2. 点右侧 **+**，按下 `Cmd+Alt+N`(Mac)/ `Ctrl+Alt+N`(Win)

## 第四步：配置 Obsidian Git（F5 一键提交并推送）

### 4.1 绑定 F5

1. 设置 → 快捷键，搜索框输入 `commit-and-sync`（新版）或 `Create backup`（老版）
   - 完整命令名：**`Obsidian Git: Commit-and-sync`**（= `git add -A && git commit && pull && push`，一步到位）
   - 老版本（2024 之前）叫 `Obsidian Git: Create backup`，功能一样
   - ⚠️ **不要**绑 `Commit all changes`（那个不会推送）或 `Create new branch`（那个是建分支）
2. 点该命令右侧 **+**，按下 **F5**
3. 如果提示和默认命令冲突（默认 F5 = 重新加载窗口），选 **Force** 强制覆盖
4. 绑好后该命令右侧应显示 `F5` 而不是"未设置"

### 4.2 调插件参数

设置 → Obsidian Git，按下表配置：

| 选项 | 推荐值 | 说明 |
|---|---|---|
| Commit message on auto backup/commit | `vault: {{date}}` | 自动生成 commit 信息，不用手填 |
| Vault backup interval (minutes) | `1` | 多人多电脑协作默认 1 分钟自动提交 |
| Auto push interval (minutes) | `1` | 自动把本机提交推到 GitHub |
| Auto pull interval (minutes) | `1` | 自动拉取其它电脑 / 团队成员的更新 |
| Pull updates on startup | ✅ 开启 | 打开 Obsidian 自动拉最新 |
| Disable push | ❌ 关闭 | 别勾，否则 F5 不会推到 GitHub |
| Sync method | `merge` | 多人协作冲突更少 |

### 4.3 验证 F5 能用

1. 在 inbox/ 随便新建一个文件，写两个字
2. 按 **F5**
3. 通知栏弹出 "Committed and pushed" 即成功
4. 去 GitHub `xdawayer/gengrowth-ops` 看是否出现新文件

## 第五步（可选，更省心）：用 SSH 替代 PAT

PAT 90 天要换一次，SSH **永久不过期**。如果想一劳永逸，按下面配（终端里做）：

```bash
# 1. 生成密钥（连按 3 次回车，密码留空）
ssh-keygen -t ed25519 -C "yuiteatime@github"

# 2. 启动 agent 并写入钥匙串
eval "$(ssh-agent -s)"
ssh-add --apple-use-keychain ~/.ssh/id_ed25519

# 3. 复制公钥
pbcopy < ~/.ssh/id_ed25519.pub
```

然后打开 https://github.com/settings/ssh/new ：
- Title 随便填，Key 粘贴（`Cmd+V`），点 Add SSH key

回到终端：

```bash
# 4. 验证连通（第一次会问 yes/no）
ssh -T git@github.com
# 看到 "Hi Yuiteatime!" 就是通了

# 5. 仓库 remote 从 https 切到 ssh
cd /到/gengrowth-ops/路径
git remote set-url origin git@github.com:xdawayer/gengrowth-ops.git

# 6. 推送验证
git push
```

回 Obsidian 按 F5，通知 "Pushed N commits" 即成功，从此不再问账号密码。

> 还要在 `~/.ssh/config` 加几行让 macOS 自动加载密钥（开机不用再 `ssh-add`）：
> ```
> Host github.com
>   HostName github.com
>   User git
>   AddKeysToAgent yes
>   UseKeychain yes
>   IdentityFile ~/.ssh/id_ed25519
> ```

## 第六步（推荐）：安装后台同步兜底

Obsidian Git 只有在 Obsidian 打开时才会运行。多人多电脑协作时，建议每台常用电脑再加一个后台定时兜底。

如果同一台机器同时有 `gengrowth-wiki` 和 `gengrowth-ops`：

```bash
cd /到/gengrowth-ops/路径
bash scripts/obsidian-vault-git-sync.sh --verbose
```

这会调用 `gengrowth-wiki/tools/scripts/obsidian-vault-git-sync.py`，对本机能发现的 wiki / ops / agents 做安全的 `commit -> pull --rebase -> push`。可以把这条命令放进 launchd、cron 或本机自动化中每 1 分钟执行一次。

## 第七步：完整跑一遍

1. 按 `Cmd+Alt+N`（Mac）/ `Ctrl+Alt+N`（Win）
2. 选择"草稿-内容草稿"模板
3. 填写标题，写几行内容
4. 按 **F5** 提交
5. 去 GitHub 网页看看文件是不是出现了

## 遇到问题

| 现象 | 原因 / 解决 |
|---|---|
| 按 F5 完全没反应 | 快捷键没绑成功，回 设置 → 快捷键 重新绑 |
| 弹 "Please specify a remote" | 仓库没配 remote，找 wzb |
| 弹 "Authentication failed" / "Invalid username or token" / "Password authentication is not supported" | **GitHub 不再接受密码推送**，要用 PAT(Personal Access Token)。最简方案:① 去 https://github.com/settings/tokens/new(注意是 Classic Tokens，不是 Fine-grained) ② Note 填 `obsidian-gengrowth-ops`，Expiration 选 90 days，Scopes 只勾 `repo` ③ 点 Generate，复制出现的 `ghp_xxxxx...`(只显示一次) ④ 终端 `cd` 到 vault 目录，跑 `git config --global credential.helper osxkeychain && git push`，Username 填你的 GitHub 用户名，Password 粘贴 PAT ⑤ 回 Obsidian 按 F5。如果钥匙串有旧凭证先清掉:钥匙串访问.app → 搜 `github` → 删除所有相关条目 |
| 弹 "Nothing to commit" | 你没改任何文件，属于正常 |
| Obsidian 报错"冲突" | 截图发 wzb，**不要强推** |
| 模板里 `<% title %>` 没被替换 | Templater 没启用，或直接打开了模板文件本身。要走"从模板新建"流程 |
| 其他问题 | 飞书找 Lynne |
