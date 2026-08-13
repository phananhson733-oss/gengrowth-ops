# Miraa Community Research Receipts

本目录只保存 Social OS 在 `@miraaastrology` Mode B/C 候选研究前产生的
UTF-8 JSON receipt。每次调研使用独立文件，不覆盖历史证据。

权威 schema 在：

`/Users/awayer_mini/.hermes/profiles/social/skills/social-media/social-pipeline-core/references/miraa-research-receipt-schema.md`

执行顺序固定为：

1. 打开直接社区页面并记录可读正文/评论。
2. 依 schema 写入 receipt，计算文件原始字节 SHA-256。
3. 先运行 `source-ingest --receipt ... --receipt-sha256 ...`。
4. 再以同一账号、mode、week 和 SHA 执行 `prepare-context` 与 `research`。

receipt 不得包含最终 Hook、Script、Caption、Hashtag 或自动选题结论。
它是运营者控制的抓取声明，不等于独立的浏览器录屏或密码学抓取证明。
