# Miraa 知识库 Schema（social-kb v1）

权威：本目录的 Markdown/JSON 文件。gbrain（Phase 2）只是可重建索引。
校验与写入的唯一入口：hermes-agent `social-pipeline-core/scripts/kb_pipeline.py`。
人工可以读一切文件；人工改动后必须跑 `kb_pipeline.py validate` 确认仍合规。

- Topic 页 `topics/<topic-id>.md`：schema_version social-research-topic/v1。
  frontmatter 字段与含义见 hermes-agent `references/miraa-kb.md`；正文六节
  （Current synthesis / Life situations / Language patterns /
  Counterviews and limitations / Source map / Timeline），Timeline 只增不改。
- Source 页 `sources/<source-id>.md`：schema_version social-research-source/v1。
  source_id = "src-" + sha256("user_voice|" + canonical_url)[:10]（与 Social OS
  Sheet 的证据行同一推导，天然幂等）。quote_verbatim 放 frontmatter（机器可校验，
  是对需求 §6.2 的一处刻意偏差）。
- Run 记录 `runs/<mode>/krun-*.json`：不可变；失败也留真实错误。
- `runs/selections/ksel_*.json`：选题执行凭证（social-kb-selection/v1），一次
  请求一份，绑定 kb_version；KB 变更后旧凭证自动失效。
- `index.json`：从 Topic frontmatter 自动生成，禁止手工维护。
- kb_version：schema.md + config.yaml + index.json + topics/ + sources/ 的
  SHA-256 manifest 哈希；runs/ 与锁文件不参与。
- 有效期：evergreen 7 天；访问失败只更新 last_checked_at，绝不延长 valid_until；
  只有成功读取直接来源才允许更新 last_verified_at。

## 字段速查（补充说明，不改变上面的权威定义）

Topic 页 frontmatter（完整字段清单）：`schema_version, type, product, account,
topic_id, title, aliases[], signs[]⊆12星座, themes[], formats[], tags[],
research_scope, evidence_strength∈{strong,medium,weak}, status∈{active,archived},
first_observed_at, last_checked_at, last_verified_at, valid_until, source_ids[],
used_content_ids[]`。`active` 状态的 topic 至少要有一个 `source_ids`。

Source 页 frontmatter（完整字段清单）：`schema_version, type, product, account,
source_id, canonical_url, url, platform, author_or_account, published_at,
first_observed_at, last_checked_at, last_verified_at,
access_status∈{readable,unavailable}, readable_layers[], supported_topic_ids[],
quote_verbatim, content_fingerprint`。`readable` 状态的 source 需要
`readable_layers` 含 body 或 comments，且必须有 `quote_verbatim`。

Run 记录字段：`run_id, schema_version:"social-kb-run/v1",
mode∈{weekly,daily,targeted,migration,usage},
status∈{success,partial,failed,no_new_signal}, started_at, finished_at, account,
receipt_path, receipt_sha256, created_topic_ids[], updated_topic_ids[],
created_source_ids[], updated_source_ids[], skipped[], failure_reason,
kb_version_before, kb_version_after, index_rebuilt, gbrain_sync_status:"skipped"`。

Phase 1 固定值：`search_backend: fallback_index`（gbrain 尚未接入）、Run 记录里
`gbrain_sync_status` 恒为 `"skipped"`。迁移产生的 Topic 一律 `themes: []`、
`formats: []`——迁移是确定性的，不允许 AI 现编分类，这两个字段等首次周更用
`--annotations` 补上。
