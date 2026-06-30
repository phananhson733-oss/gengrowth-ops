# 外链生成工具 — Google Sheet 备份配置

「导入Google」按钮把本会话生成的所有外链记录（全部参数 + 长/短链接）追加到一个共享
Google Sheet，供 ops 查验、备份。写入走 **Google Apps Script Web App**，纯前端直连，
不依赖任何后端、不需要 OAuth。

## 目标表

- 名称：**Link Attribution 备份**
- ID：`1WVTg7zFAlkvO_CL6epaOTYpn6lVooTUpjxlcjZVBReI`
- 链接：<https://docs.google.com/spreadsheets/d/1WVTg7zFAlkvO_CL6epaOTYpn6lVooTUpjxlcjZVBReI/edit>
- 列：`imported_at, site, landing_url, utm_source, utm_medium, utm_campaign, utm_content, long_url, short_url, short_code`
- **按网站分标签页**：每个站点（GenGrowth / AstrologyWiki / AI Story Generator / Resume Template）写入**各自的 sheet 标签页**，标签名 = `site` 值。标签页不存在时由脚本自动创建并写表头。

## 一次性部署 Apps Script（约 3 分钟）

部署有两条等价路线。`.gs` 用 `SpreadsheetApp.openById(SHEET_ID)` 写表，**容器绑定和独立
脚本都能用**。如果某个账号里「扩展程序 → Apps 脚本」是灰的（连同插件/宏一起灰，多为账号
策略限制），直接走下面的「路线 B 独立脚本」即可绕开。

### 路线 A：容器绑定（菜单可用时）

1. 打开上面的 Sheet → 菜单 **扩展程序 → Apps 脚本**。
2. 把 `google-sheet-backup.gs` 的全部内容粘贴进编辑器（覆盖默认的 `Code.gs`），保存。
   - `SHEET_ID` 已写死成上面的表 ID，无需改。

### 路线 B：独立脚本（推荐，菜单变灰时用这个）

1. 打开 **<https://script.google.com>** → 左上「新建项目 / New project」。
2. 删掉默认 `Code.gs` 内容，粘贴 `google-sheet-backup.gs` 全部内容，保存。
   - `SHEET_ID` 已写死，无需改；首次部署授权时会要求 SpreadsheetApp 访问该表的权限，同意即可。

### 两条路线共用：部署为网页应用

1. 右上角 **部署 → 新建部署**：
   - 类型选 **网页应用 (Web app)**。
   - 「执行身份」选 **我 (your-account)**。
   - 「谁可以访问」选 **任何人 (Anyone)**。
   - 点 **部署**，首次会要求授权，按提示用你的 Google 账号授权。
4. 复制部署后给出的 **网页应用 URL**（形如 `https://script.google.com/macros/s/XXXX/exec`）。
5. 打开外链工具页面 `index.html`，把这个 `/exec` 地址粘贴到底部「Google Sheet Web App 地址」
   输入框。地址会存进浏览器 localStorage，下次自动带出，**只需配一次**。

## 使用

1. 在任意站点页签下生成链接，记录会自动累积到「本会话」（存浏览器 localStorage，刷新不丢）。
2. 点 **导入Google**，把所有尚未导入过的记录一次性追加到表里。
3. 已导入的记录会标记 `imported_at`，再次点不会重复导入；点「清空本会话记录」可重置累积。

## 说明 / 限制

- 浏览器对 Apps Script 的跨域 POST 用 `no-cors`，**无法读取返回值**，所以按钮成功后提示
  「请到表里核对」。若发现没写进去，先确认部署的「谁可以访问」是 **任何人**、URL 是 `/exec`
  结尾（不是 `/dev`）。
- 改了 `.gs` 代码后要 **管理部署 → 编辑 → 新版本** 重新部署，URL 不变。
- 这里只导出「本会话浏览器内累积」的记录；不拉取后端数据库历史（按当前需求范围）。
  以后要拉全量 DB，需要在 oracle 后端新增 `GET /api/link-attribution/redirects` 列表接口。
