# Google Sheet Curl 访问地址

通过 Apps Script Web App 部署，AI 可直接 curl 读取表格数据，无需 OAuth。

## Sheet 1

- URL: `https://script.google.com/macros/s/AKfycbyBKT52vgqfnZN0opPL1z0aiB8gom3WlAGbuyyi2_bmSAF6a5khbLS_CYwUr0XseUxSOw/exec`
- 工作表: account_links, account_analysis, video_links, video_analysis

## Sheet 2

- URL: `https://script.google.com/macros/s/AKfycbyKsZCN5G8Ik-9bbh26GHPxfPflusxUy-13hNy9h-sb3qVdqf7KUoJZYvPTApapbKFS/exec`
- 工作表:  accounts_latest, account_history, posts_latest, post_history, runs

## 使用方法

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
