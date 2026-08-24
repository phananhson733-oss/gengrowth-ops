# Miraa 知识库（miraa-knowledge-base）

## 这是什么

这里是 Miraa（`@miraaastrology`）选题研究的**本地权威资料库**——过去每一次
调研（Social bot 抓的帖子、评论、共鸣点）沉淀下来的结论，都会变成这里的一份
「主题」（Topic）和若干「来源」（Source），供以后选题时直接复用，不用每次都
从零重新调研。

它只是文件：一堆 Markdown 加几个 JSON，全在这个目录下面，没有数据库，没有
外部服务。谁都能直接打开看。**但只有一个程序被允许往这里写东西**——
hermes-agent 仓库里的 `kb_pipeline.py`；人工不要手改 `topics/`、`sources/`、
`runs/`、`index.json` 里的文件，改了也要立刻用下面的「排障」步骤跑一次
`validate` 确认没有破坏格式。

## 运营会用到的四件事

1. **飞书触发周更**：按 SOP 在飞书里发起「Miraa 知识库周更」，机器人会重新
   核验上一批研究是否还站得住、把过期的替换掉，并给主题补上
   `themes`/`formats` 分类标签。这是让知识库保持新鲜的常规动作，按
   `config.yaml` 里的 `weekly_refresh`（周日 21:00）节奏跑。
2. **「生成 Miraa 选题」会自动优先用这个知识库**：只要库里有还没过期、证据
   强度够（`strong`/`medium`）的相关主题，出选题时会先复用它们，不用每次
   都重新调研，出活更快。不需要额外操作，正常发起选题请求即可。
3. **手动查一下库里有什么** —— 想知道某个话题库里有没有存过研究，用
   `kb_pipeline.py search` 直接查（中文、英文关键词都支持）：

   ```bash
   /Users/awayer_mini/hermes-agent/.venv/bin/python \
     /Users/awayer_mini/hermes-agent/skills/social-media/social-pipeline-core/scripts/kb_pipeline.py \
     search --kb "/Users/awayer_mini/gengrowth-ops/inbox-pengman/01-调研资料/候选与热点研究/miraa-knowledge-base" \
     --query "关键词"
   ```

   返回的每条命中都会标 `eligible: true/false`——`false` 通常是过期
   （`expired`）或证据强度不够（`strength_below_gate`），不代表数据坏了。

4. **出问题先跑 `validate` 排障**：

   ```bash
   /Users/awayer_mini/hermes-agent/.venv/bin/python \
     /Users/awayer_mini/hermes-agent/skills/social-media/social-pipeline-core/scripts/kb_pipeline.py \
     validate --kb "/Users/awayer_mini/gengrowth-ops/inbox-pengman/01-调研资料/候选与热点研究/miraa-knowledge-base"
   ```

   跑通会打印 `"ok": true` 和一个 `kb_version`。如果报错，错误信息会逐条列出
   是哪个文件、哪个字段不对。

## 出问题该看哪里

任何一次写入知识库的动作（周更、抓取、迁移）都会在 `runs/<动作类型>/` 下面
留一份不可变的记录，文件名是 `krun-<时间戳>-<随机码>.json`。**先看
`runs/` 下面按修改时间排序最新的那份文件**：

```bash
ls -t "/Users/awayer_mini/gengrowth-ops/inbox-pengman/01-调研资料/候选与热点研究/miraa-knowledge-base"/runs/*/*.json | head -1
```

打开它，重点看两个字段：

- `status`：`success` 全部成功；`partial` 部分成功部分跳过（通常正常，比如
  跳过了几份格式不对的中间文件）；`failed` 这一轮写入失败，知识库内容没变；
  `no_new_signal` 这一轮没有新东西可写。
- `failure_reason`：只要不是空字符串，就是失败的具体原因，照着描述反馈给
  技术同学即可，不用自己排查。

这份记录写下去之后不会再被改动，所以历史上每一轮到底发生了什么，永远可以
回头查。

## 目录长什么样

```
miraa-knowledge-base/
├── README.md          ← 你在看的这份
├── RESOLVER.md         ← 一条信息该记在哪：Topic 还是 Source 还是 Run
├── schema.md            ← 每种文件的字段定义（给技术同学看的）
├── config.yaml           ← 有效期、证据门槛等配置
├── index.json             ← 所有 Topic 的索引，程序自动生成，人工不要手改
├── topics/                 ← 一个可复用研究结论 = 一个 Topic 页
├── sources/                 ← 一个调研到的原始网页/帖子 = 一个 Source 页
└── runs/                     ← 每一次写入知识库的动作留下的不可变记录
    ├── weekly/                  ← 周更
    ├── daily/                    ← 每日巡逻（Phase 2 才启用）
    ├── targeted/                  ← 针对某个缺口的定向调研
    ├── migration/                   ← 历史 receipts 的一次性迁移
    ├── selections/                    ← 选题时从库里挑中了哪些 Topic/Source
    └── usage/                          ← 某个 Topic 被哪次实际产出用过
```

## 不该出现在这里的东西

候选选题、脚本文案、人工审批状态——这些一直都只在 Social OS 的 Google
Sheet 里，知识库不存这些，也不会存。详见 `RESOLVER.md`。
