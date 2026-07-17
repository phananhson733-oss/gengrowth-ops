---
title: company-survey skill 更新方案
date: 2026-07-06
type: skill-update-proposal
target-file: tools/internal/skills/company-survey-skill/company-survey.skill → company-survey/SKILL.md
status: 待应用
---

# company-survey skill 更新方案

## 更新目的

做具体调研时，结论必须区分"已验证"和"推断"，并注明数据来源。当前skill没有强制这一规范。

---

## 改动一：报告质量规范（新增两条）

在 `## 报告质量规范` 的列表中，在"来源可溯"之后新增：

```markdown
- **可信度分级**：对每个关键结论明确标注可信度等级：
  - ✅ **已验证**：有直接截图/原始数据支撑
  - ⚠️ **推断**：基于间接数据或对比逻辑推导
  - ❓ **假设**：无数据支撑，基于行业常识或经验判断
- **结论内联来源**：每个结论性语句后注明数据来源，格式：`（来源：[平台/工具]，[数据截止时间]）`
```

---

## 改动二：报告结构模板（新增章节）

在 `## 十一、结论与展望` 之后新增：

```markdown
## 十二、信息可信度与数据缺口

### 12.1 本次调研的数据来源汇总

| 来源 | 覆盖内容 | 可信度 |
|---|---|---|
| （如：Ahrefs截图） | （如：有机流量/关键词） | ✅ 一手数据 |
| （如：SimilarWeb） | （如：全渠道流量） | ✅ 一手数据 |
| （如：行业常识） | （如：竞争格局判断） | ❓ 经验推断 |

### 12.2 尚未获取的关键数据

| 缺失数据 | 影响哪个结论 | 查询方式 |
|---|---|---|
| | | |

### 12.3 本次调研最不确定的3个结论

1. [结论内容]——[为什么不确定]
2. 
3. 
```

---

## 应用方式

```bash
# 解压skill文件
cd /tmp && mkdir company-survey-edit && cd company-survey-edit
unzip /Users/letty/gengrowth-ops/tools/internal/skills/company-survey-skill/company-survey.skill

# 编辑 company-survey/SKILL.md，按上述改动修改

# 重新打包
zip -r company-survey-updated.skill company-survey/

# 替换原文件
cp company-survey-updated.skill /Users/letty/gengrowth-ops/tools/internal/skills/company-survey-skill/company-survey.skill
```
