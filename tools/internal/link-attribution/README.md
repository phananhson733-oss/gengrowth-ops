# 外链生成工具（Link Attribution Tool）

一个**单文件、带页签**的内部工具，为多个自有站点生成带 UTM 的**长链接** + 注册**自有短链接**，并可一键把生成记录备份进 Google Sheet 供 ops 查验。

> 一份 HTML 管所有站点，新增站点 = 加一条配置。不再每个站单独做一个页面。

---

## 快速使用

1. **双击 `index.html` 用浏览器打开**（地址栏是 `file://…`）。
   - ⚠️ 不要用 `localhost`/本地 http server 打开——各站后端只放行 `file://` 的 `origin: null` 与站点自身域名，走 localhost 会 CORS 失败（`Failed to fetch`）。
2. 顶部**页签**切换站点（GenGrowth / AstrologyWiki / AI Story Generator / Resume Template）。
3. 填参数：
   - **落地页**：默认是该站主页，可改成任意本站页面（支持 `/相对路径` 或完整 URL；只允许本站域名）。
   - **utm_source**：具体平台。社媒用 `reddit / pinterest / x / tiktok`；KOL 用 `kol-{红人}`；外链用主域名如 `abc.com`。统一小写，同一来源不要两种写法。
   - **utm_medium**：`social / backlink / kol / newsletter`。
   - **utm_campaign / cluster_id**：共享表里的 cluster_id，如 `CL-AW-05`。
   - **utm_content / action_id**：这条分发动作/帖子的 action_id。
   - 留空的字段不会写入最终链接。
4. 点**生成链接** → 右侧出：
   - **长链接**：带 UTM 的完整落地页 URL。
   - **自有短链接**：注册到本站后端的 `域名/<code>` 短链（`<code>` 由长链接稳定哈希得到，同一长链接永远同一短码）。
   - 可复制 / 打开测试。
5. **备份**：底部「导入Google」把本会话生成的所有记录（参数 + 长/短链）追加到共享 Google Sheet。Web App 地址已内置默认值，直接点即可；已导入的记录不会重复推。

---

## 目录结构

```
link-attribution/
├── index.html                 # 工具本体（UI + 核心逻辑 LinkAttributionCore，配置驱动）
├── google-sheet-backup.gs     # Google Apps Script（「导入Google」的后端，按站点分标签页）
├── README.md                  # 本文件
├── README-google-sheet.md     # Google Sheet 备份的部署 & 使用说明
└── tests/
    └── link-attribution-tool.test.mjs   # 纯逻辑单测（node --test）
```

---

## 架构：配置驱动

所有站点差异都收敛在 `index.html` 里的 `SITES` 数组：

```js
const SITES = [
  {
    key: 'gengrowth',                 // 内部唯一标识（也用于 localStorage）
    name: 'GenGrowth',                // 页签显示名 / Sheet 标签页名
    domain: 'gengrowth.ai',           // 主域（用于短链域名正则）
    hosts: ['gengrowth.ai', 'www.gengrowth.ai'],   // 落地页白名单
    baseUrl: 'https://www.gengrowth.ai/',           // 短链 base / 默认落地页
    endpoint: 'https://www.gengrowth.ai/api/link-attribution/redirects', // 短链注册接口
  },
  // …每个站一条
];
```

`LinkAttributionCore.createSiteCore(siteKey)` 会按 config 返回一份**域名锁定**的核心（长链归一、短码生成、映射、显示短链等），各站互不串域。UI 切页签时重建当前站的 core。

---

## 如何新增一个站点

1. **前端**：往 `index.html` 的 `SITES` 数组加一条 config（key / name / domain / hosts / baseUrl / endpoint）。加完自动多一个页签，`tests` 里补一条断言即可。
2. **后端**：给这个站实现短链注册接口 `POST /api/link-attribution/redirects`（入参 `{code, destination_url}`）+ 根路径 `/<code>` → 302 跳转 + 一套存储。三种现成范式可抄：
   - **Next.js + Supabase**（见 `gengrowth-agents`、`ai-story-generator`）：`link_redirects` 表 + service-role 写入 + `proxy.ts`/middleware 把 `/<code>` 改写到 `/go/<code>`。
   - **Express + Supabase/Redis**（见 `oracle`）。
   - **Cloudflare Pages Functions + KV**（见 `google-docs-resume-template`：`functions/api/link-attribution/redirects.ts` 写 KV，`functions/[code].ts` 读 KV 跳转）。
   - **CORS 必须放行 `"null"`**（file:// 的 origin），否则工具调不通。
3. **备份**：无需改 `.gs`——它按记录的 `site` 字段自动把新站路由到同名标签页（不存在则自动创建）。

---

## 各站点后端映射（截至 2026-07）

| 页签 | 域名 | 后端仓库 | 存储 |
|---|---|---|---|
| GenGrowth | gengrowth.ai | `gengrowth-agents`（Next.js） | Supabase 项目 `qeeocwurjslqppjxlsbk`，表 `link_redirects` |
| AstrologyWiki | astrologywiki.com | `oracle`（Express） | Supabase 项目 `snpkanwonccndjtvjmvh`（与 AI Story 共用）表 `link_redirects` |
| AI Story Generator | aistorygenerator.work | `ai-story-generator`（Next.js 16） | Supabase 项目 `snpkanwonccndjtvjmvh`（共用）表 `link_redirects` |
| Resume Template | googledocsresumetemplate.com | `google-docs-resume-template`（Astro + CF Pages） | Cloudflare KV，binding `LINK_REDIRECTS` |

> ⚠️ AstrologyWiki 与 AI Story Generator **共用同一张 `link_redirects` 表**（按 `code` 区分，code 按完整目标 URL 哈希，两站不会撞）。**不要在这张共享表上加单域名的 destination CHECK 约束**——域名校验交给各 app 代码层。

---

## Google Sheet 备份

「导入Google」按钮把记录 POST 到一个 **Google Apps Script Web App**（`google-sheet-backup.gs`），追加到共享表：

- 表：**Link Attribution 备份**（`1WVTg7zFAlkvO_CL6epaOTYpn6lVooTUpjxlcjZVBReI`）
- **按网站分标签页**：每个站写入以 `site` 命名的独立标签页（不存在自动建 + 写表头）。
- 列：`imported_at, site, landing_url, utm_source, utm_medium, utm_campaign, utm_content, long_url, short_url, short_code`

部署 / 更新 Apps Script 的详细步骤见 **[README-google-sheet.md](./README-google-sheet.md)**。改了 `.gs` 后记得在 Apps Script「管理部署 → 编辑 → 新版本」重新部署（`/exec` 地址不变）。

---

## 为什么必须用 file:// 打开

各站短链注册接口的 CORS 白名单里放的是 `"null"`（file:// 页面的 origin）+ 站点自身域名。这样把 `index.html` 当本地文件双击打开就能直接调所有站的接口，**无需托管、无需登录**。用 localhost 起服务时 origin 变成 `http://localhost:xxxx`，不在白名单，会被浏览器挡成 `Failed to fetch`。

---

## 测试

纯逻辑单测（不联网，加载 `index.html` 里的 `LinkAttributionCore` 在 Node 里跑）：

```bash
node --test tools/internal/link-attribution/tests/link-attribution-tool.test.mjs
```

覆盖：长链 UTM 归一、域名锁定、短码稳定性/唯一性、四站配置、导入入口等。

---

## 注意事项

- **只产出、不自动发布**：工具生成的短链会注册进各站后端（供跳转），但「导入Google」只是备份到表，不会对外发布任何内容。
- **短码稳定**：同一长链接永远得到同一短码；不同长链接（含不同 UTM）得到不同短码。
- **导入去重**：同一会话内已导入的记录标 `imported_at`，再点不会重复；换设备/清缓存后会重新累积。
- **落地页域名锁定**：只能填本站域名的落地页，填别站会报错，防止误把短链指向站外。
