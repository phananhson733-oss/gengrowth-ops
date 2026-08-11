# Google Sheet Curl 访问地址

通过 Apps Script Web App 部署，AI 可直接 curl 读取表格数据，无需 OAuth。

## Sheet 1（竞品视频分析）

- URL: `https://script.google.com/macros/s/AKfycbyBKT52vgqfnZN0opPL1z0aiB8gom3WlAGbuyyi2_bmSAF6a5khbLS_CYwUr0XseUxSOw/exec`
- 工作表: account_links, account_analysis, video_links, video_analysis

## Sheet 2（TikTok 自动抓取）

- URL: `https://script.google.com/macros/s/AKfycbyKsZCN5G8Ik-9bbh26GHPxfPflusxUy-13hNy9h-sb3qVdqf7KUoJZYvPTApapbKFS/exec`
- 工作表: accounts_latest, account_history, posts_latest, post_history, runs

### 数据源选择指南（重要）

| 需求 | 用哪个表 | 说明 |
|------|---------|------|
| 获取帖子指标（views/likes/comments/favorites/shares） | **`post_history`** | 有完整指标数据 |
| 获取账号粉丝数等 | `accounts_latest` | 正常 |
| 获取账号历史趋势 | `account_history` | 正常 |
| 获取帖子列表和 caption | `posts_latest` | ⚠️ **已知问题：caption 过长导致每行被截断为 200 字符，views/likes 等指标列全部丢失。分析帖子表现时请用 `post_history`** |

### 推荐的分析用法

```bash
# ⭐ 推荐：用 getAllData 获取全部数据（JSON 格式，不会截断）
curl -sL "<Sheet2_URL>?action=getAllData"
# 返回 JSON: {"accounts_latest":"csv...", "posts_latest":"csv...", "post_history":"csv...", ...}
# posts_latest 在 JSON 中数据完整（views/likes 等都有）

# 获取当前账号概况（CSV，正常可用）
curl -sL "<Sheet2_URL>?action=getData&sheet=accounts_latest"

# 获取历史快照指标（CSV，正常可用，但可能帖子不全）
curl -sL "<Sheet2_URL>?action=getData&sheet=post_history"

# 获取竞品/参考账号列表
curl -sL "<Sheet1_URL>?action=getData&sheet=account_links"
```

### 已知问题

- `getData&sheet=posts_latest`（CSV 格式）每行被截断为 200 字节，因为 caption 含有 emoji/Unicode 字符触发了 ContentService 的编码问题
- **同样的数据通过 `getAllData`（JSON 格式）获取时完整无截断**
- 根因：Apps Script CSV 手动拼接对含 emoji 的长字符串处理有 bug
- **解决方案：AI 分析时统一用 `getAllData`，从 JSON 中解析 `posts_latest` 字段**

## 通用用法

```bash
# 列出所有工作表
curl -sL "<URL>?action=listSheets"

# 读取指定工作表
curl -sL "<URL>?action=getData&sheet=account_links"

# 读取全部工作表数据
curl -sL "<URL>?action=getAllData"

# 检查最后编辑时间
curl -sL "<URL>?action=checkUpdate"
```

## 备注

- Apps Script 源码: `/Users/pengman/google-sheets-sync/apps_script_code.js`
- 部署方式: Google Sheet → 扩展程序 → Apps Script → 粘贴代码 → 部署为 Web 应用（访问权限: 任何人）
