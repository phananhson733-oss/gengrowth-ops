# SEO Content Variable Pre-processor (v1.0) — SUPERSEDED

> ⚠️ **本版已于 2026-06-26 作废，改用 [变量预处理器-pre-processor-v2.0.md](变量预处理器-pre-processor-v2.0.md)。**
>
> v1.0 只产出 `Friction` + `Content_Angle` 两个字段，但下游 T2 写作闸门
> （flow-mvp `tools/scripts/gg-content-draft.mjs`）硬要求 `Entity`(col H) 与
> `Logic`(col J)——照 v1.0 字面跑出的 brief 会直接卡 gate。v2.0 已补齐
> `Entity / Entity_Topology / Logic` 三个承重字段，并加入占星科学边界、
> prompt-injection 防御、SERP<5 硬 abort、可证伪 gap、Draft_Angle 假设处置、
> 证据/置信度锚点；输出拆成 SHEET_FIELDS / REVIEW_METADATA 两层。
>
> **单一事实源**：flow-mvp `tools/scripts/lib/preprocessor-prompt.mjs`
> （自动化 `gg-brief-suggest.mjs` 与手动 v2.0 同源渲染）。

（历史 v1.0 全文见 git 历史。）
