# 飞书自建应用接入 —— step-by-step

报销工具用「自建应用 + tenant_access_token + Bitable REST」访问《报销表》。
这套只需做一次。做完跑 `feishu_probe.py` 验收,全绿才接 sync。

> 名词别混:
> - **应用**(自建应用):有 `App ID` / `App Secret`,用来换 token。下面步骤 1-4。
> - **多维表格(base)**:那张《报销表》,有自己的 `app_token` 和 `table_id`(从 URL 取)。步骤 6。
> 飞书后台菜单名偶尔会变,以控制台实际为准;权限名用搜索框搜关键词定位即可。

---

## 1. 新建自建应用

1. 打开 https://open.feishu.cn → 右上角进「开发者后台」。
2. 「创建企业自建应用」→ 名称填 **报销自动化**,简单描述,头像随意 → 创建。

## 2. 拿凭证(App ID / App Secret)

1. 进应用 → 左侧「凭证与基础信息」。
2. 复制 **App ID**(形如 `cli_xxxxxxxx`)和 **App Secret**(点显示/重置)。
3. App Secret 只在这里看得到,先存好(等下填进 `.env`)。**绝不要粘进 wiki 仓库任何文件。**

## 3. 加权限(scopes)

左侧「权限管理」→ 用搜索框逐个加,然后保存:

| 搜这个关键词     | 加的权限(读写多维表格 + 上传素材)                  |
| ---------- | ------------------------------------ |
| 多维表格       | 查看/新增/更新/删除 **多维表格记录**;查看 **多维表格字段** |
| 多维表格       | 查看/管理 **多维表格**(读 base 元信息)           |
| 上传素材 / 云空间 | **上传文件/素材**(附件两步上传要用)                |

> 若控制台是"细粒度权限"模式,把 record 的读+增+改、field 的读、media 上传都勾上即可;粗粒度模式直接勾「多维表格」读写 + 云空间上传。

## 4. 发布应用

左侧「版本管理与发布」→ 创建版本 → 提交发布。
**权限改动必须发布后才生效**;企业自建可能需企业管理员审批(或租户设置为自动通过)。
发布通过后再继续。

## 5. 在《报销表》里补齐工具要写的列

工具会写这些列(没有的先在多维表格里建好,类型如下)。`feishu_probe` 会列出缺哪些。

| 列名 | 类型 | 说明 |
|---|---|---|
| 自动化ID | 单行文本(可隐藏) | **必需**,content_sha256 幂等键 |
| 规范化发票号 | 单行文本(可隐藏) | 业务查重提示 |
| 数据待核 | 单选(是/否)或复选 | OCR 复核闸门,默认"是" |
| 自动附件 | 附件 | 程序上传的发票副本 |
| 人工附件 | 附件 | Lynne 手补材料(程序不碰) |
| 员工姓名/提交日期/发票所属期/报销类型/报销金额/币种/发票编号/发票对象/项目名称 | 按《报销表》现有 | 自动写入字段 |
| 审批状态/打款状态/报销事由/备注/报销打款时间 | 按现有 | 人工字段,程序只在 create 时给默认 |

> 列名要和上面**完全一致**(工具按中文列名写)。不一致就改列名或告诉我去改代码里的映射。

## 6. 把应用加为《报销表》协作者 + 取 app_token/table_id

1. 打开那张《报销表》多维表格。
2. 右上角「...」或「分享」→「**添加文档应用 / 添加协作者**」→ 搜 **报销自动化** → 给「**可编辑**」。
   (只授权限、不加进这张表,有 token 也读不到它。)
3. 看浏览器地址栏:
   ```
   https://xxx.feishu.cn/base/{APP_TOKEN}?table={TABLE_ID}&view=...
   ```
   - `base/` 后那段 = **APP_TOKEN**
   - `table=` 后那段(`tbl...`)= **TABLE_ID**

## 6b. 如果表在 wiki(知识库)里(常见!)

URL 形如 `https://xxx.feishu.cn/wiki/{WIKI_NODE}?table={TABLE_ID}&view=...` —— 这是
wiki 节点,`wiki/` 后那段**不是** APP_TOKEN。要多做两步:

1. 给应用加**「知识库读」权限**(权限管理搜「知识库」,加 `wiki:wiki:readonly` 或
   `wiki:node:read`)→ 重新发布。
2. 把应用**加进这个知识库的协作者**(知识库设置→成员,或该节点分享)→ 可编辑。
   (wiki 里的表,授权在知识库层,不是单张 base。)
3. 换出真正的 APP_TOKEN(obj_token):
   ```bash
   python3 resolve_app_token.py {WIKI_NODE}
   ```
   把打印的 `APP_TOKEN(obj_token)` 填进 .env;`TABLE_ID` 仍取 URL 里 `table=` 那段。

## 7. 填仓库外的 .env(600)

```bash
mkdir -p ~/.config/gengrowth-baoxiao
cat > ~/.config/gengrowth-baoxiao/.env <<'EOF'
APP_ID=cli_你的
APP_SECRET=你的secret
APP_TOKEN=报销表的app_token
TABLE_ID=tbl你的
EOF
chmod 600 ~/.config/gengrowth-baoxiao/.env
```

## 8. 跑探活验收

```bash
cd tools/internal/baoxiao
python3 feishu_probe.py
```

期望:A-G 全 [PASS],最后「探活全绿 ✅」。哪步 FAIL 看提示对应修:

| 报错 | 多半原因 | 修 |
|---|---|---|
| A 换 token 失败 | App ID/Secret 错,或应用没发布 | 核对凭证、确认已发布 |
| B 列字段 / 任意步 `code=1254302 Permission denied` | 权限没发布 / 应用没加进这张表 | 重做步骤 3-4-6 |
| B 缺自动字段 | 表里没那些列 | 按步骤 5 建列 |
| C 缺「自动化ID」列 | 没建隐藏键列 | 建单行文本列「自动化ID」 |
| D 上传素材失败 | 缺上传素材权限 / parent 参数 | 补权限;若仍失败把返回 msg 发我,按真实接口微调 |

全绿后告诉我,我接着写 `feishu.py` 的真实 HTTP + `sync.py`。
