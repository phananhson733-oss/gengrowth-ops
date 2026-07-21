# growth-data-pull

只读拉取 GSC / GA4 / 三张 Google Sheet 数据，供 growth-lead 使用。用 Lynne 自己的 Google 账号 OAuth 授权（非服务账号），最小权限、可随时撤销，密钥不入 git。

## 为什么不用 `gcloud auth application-default login`

试过，Google 直接拦截：gcloud 共享的 "Cloud SDK" OAuth client 不被允许申请 `analytics.readonly` / `spreadsheets.readonly` 这类产品级数据权限（gcloud 自己的警告：*"To use these scopes, you must provide your own client ID"*）。所以这里用**自己的 Desktop OAuth client**，走标准的一次性用户同意流程。

## 一次性设置（人工步骤，约 10 分钟）

已完成（Claude 侧）：GCP 项目 `gengrowth-growth-lead` 已建，Search Console API / Analytics Data API / Analytics Admin API / Sheets API 已启用。

**你需要做（浏览器操作）：**

1. 打开 OAuth 同意屏幕设置：
   https://console.cloud.google.com/apis/credentials/consent?project=gengrowth-growth-lead
   - User Type 选 **External** → Create
   - App name 填 `GenGrowth Growth Data`；User support email 和 Developer contact 都填你的邮箱
   - 一路 Save and Continue（Scopes 页面可以跳过，不用手动加）
   - **Test users** 页面：Add users，填 `wl.ecwhu@gmail.com`
   - 保存后停在 **Testing** 状态，**不要点 Publish App**（发布会触发 Google 正式审核，个人只读脚本用不着）

2. 创建 OAuth 客户端：
   https://console.cloud.google.com/apis/credentials?project=gengrowth-growth-lead
   - + Create Credentials → OAuth client ID
   - Application type 选 **Desktop app**，名字随意（如 `growth-lead-cli`）
   - Create 后点下载图标，把 JSON 存到本机路径：
     ```
     ~/.config/gengrowth/oauth_client.json
     ```
   - 这个文件不要贴进对话、不要拷进仓库任何目录

3. 跑一次性授权（会弹浏览器，选 `wl.ecwhu@gmail.com` 同意）：
   ```
   ./venv/bin/python auth_setup.py
   ```
   看到"此应用未经 Google 验证"的黄色警告是正常的——Testing 状态本来就这样，点"高级"→"转到 GenGrowth Growth Data（不安全）"继续即可，这是你自己的 app，跳过验证不影响安全性。

4. 验证连接：
   ```
   ./venv/bin/python verify_connection.py
   ```
   会列出 GSC 已验证站点、GA4 全部账号与媒体资源 ID、三张 Sheet 的标题与 tab 名——确认无误后把 astrologywiki 对应的 GA4 property_id 告诉 Claude。

## 撤销授权

- Google 账号 → 安全 → 第三方访问与应用 → 找到 `GenGrowth Growth Data`，移除
- 或本地删除 `~/.config/gengrowth/token.json` 后不再运行拉数脚本

## 目录结构

- `auth_setup.py` — 一次性同意流程，生成 `~/.config/gengrowth/token.json`
- `verify_connection.py` — 连接验证 + 列出可用 GA4 property / Sheet tabs
- 后续的正式拉数脚本（GSC 16 个月、GA4 90 天、Sheets 全量）验证通过后再加
