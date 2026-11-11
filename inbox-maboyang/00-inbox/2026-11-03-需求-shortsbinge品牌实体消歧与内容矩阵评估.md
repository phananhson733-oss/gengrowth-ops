---
title: 需求 · shortsbinge.com TikTok账号统一与AI问答入口
date: 2026-11-03
status: 待排期
scope: TikTok账号规范化、主页社媒链接、首页"问AI"按钮；附品牌实体消歧（sameAs）与YouTube同名核实
---

# 需求 · shortsbinge.com TikTok账号统一与AI问答入口

## 一句话结论

TikTok账号统一规范（ID/名称/头像）+ 对应语言主页挂账号链接，两项是明确的技术执行任务，直接给表格。"问AI"按钮经过三轮实测问法对比，最终方案是品牌导航型问法（"我可以在shortsbinge看到什么剧"）+ Perplexity（自动执行查询，无需二次点击），同时满足"回答准确正面"和"一键体验"两个要求。YouTube同名频道确认不是公司账号，相关实体消歧动作可以执行。

---

## 一、TikTok账号统一规范

| 语言   | 账号ID                | 账号名         | 账号网址                                                                                    | 对应网站路径       |
| ---- | ------------------- | ----------- | --------------------------------------------------------------------------------------- | ------------ |
| 英语   | @shortsbinge_detour | ShortsBinge | [https://www.tiktok.com/shortsbinge_detour](https://www.tiktok.com/@shortsbinge_detour) | `/`（站点默认无前缀） |
| 西语   | @shortsbinge_es     | ShortsBinge | [https://www.tiktok.com/@shortsbinge_es](https://www.tiktok.com/@shortsbinge_es)        | `/es/`       |
| 阿拉伯语 | @drama.binge.ar     | ShortsBinge | [https://www.tiktok.com/@drama.binge.ar](https://www.tiktok.com/@drama.binge.ar)        | `/ar/`       |
| 繁体中文 | @shortsbinge.tw     | ShortsBinge | [https://www.tiktok.com/@shortsbinge.tw](https://www.tiktok.com/@shortsbinge.tw)        | `/zh-TW/`    |

**要做什么**：4个账号的名称统一改成"ShortsBinge"，头像统一换成官网logo（`https://shortsbinge.com/brand/shortsbinge-mark-20260916.png`，首页Organization schema里已经在用这张）。

**验收标准**：4个账号的名称、头像在TikTok后台肉眼核对一致。

---

## 二、主页挂TikTok账号按钮

**要做什么**：做成一个可点击的按钮元素（TikTok图标+可点击区域，不是正文里一句带下划线的文字超链接），点击后新标签页跳转到对应语言的TikTok账号主页（`https://www.tiktok.com/@shortsbinge_en`等）。上述4个语言的首页（`/`、`/es/`、`/ar/`、`/zh-TW/`）各放一个，指向各自语言对应的账号。其余15个没有专属账号的语言首页不加这个按钮，不要都指向英语账号。

**验收标准**：4个语言首页各有一个可点击的TikTok按钮（图标形式即可，不要求文字标签），点击后跳转到对应语言的正确账号主页；其余语言首页不受影响。

**位置建议**：放首页显眼位置，不放footer——和问AI按钮（见第三节）一起放在Hero区域附近，具体是在Hero卡片组下方单独一行、还是作为主按钮组的一部分，待设计稿确认。两个按钮都要显眼，但建议视觉权重上问AI按钮略高于TikTok按钮（前者是新增互动功能，后者是社媒关注入口），避免和"Watch episode 1 free"这个核心转化按钮抢视觉焦点。

---

## 三、首页"问AI"按钮

**问法实测结论（11/3，实际测试用语为英文/西语，下表如实列出，不做中文翻译示例）**：

| 问法类型 | 实际测试问句 | 实测结果 |
| ------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 品类对比词 | "best short drama website" | **不能用**：Perplexity自动执行后直接推荐ReelShort、DramaBox、GoodShort，不出现shortsbinge。和10/26已验证的GEO结论一致（品类词三个引擎都不认shortsbinge） |
| 评价型 | "Is ShortsBinge legit and good?" | **不建议用**：Perplexity给出犹豫的回答——"reasonable...但unverified，没找到有意义的独立评测"，容易在用户心里种下怀疑 |
| 品牌导航型英文（**推荐**） | "What dramas can I watch on ShortsBinge?" | **效果最好**：Perplexity和ChatGPT都给出准确、正面的回答，直接点名真实在架剧目（The Great and Powerful Genie、Rejecting My Five Female Mates等），标注shortsbinge为信息来源，ChatGPT还直接附上`shortsbinge.com`链接 |
| 品牌导航型西语（已验证） | "¿Qué series puedo ver en ShortsBinge?" | **效果同样好**：Perplexity直接引用shortsbinge.com，西语回答，列出真实剧名（The Secret of My Billion-dollar...、Taste of the Wild）和准确集数/免费集数，证明这个问法打法不只对英文有效 |

**技术实现**：

| 要做什么                                                                                                                                                                                                                                                                                   | 目的                                                                   | 验收标准                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------- |
| 按钮跳转目标用**Perplexity**：`https://www.perplexity.ai/search?q=<编码后的问题>`。Perplexity的`?q=`会**直接自动执行查询**，不需要用户二次点击确认                                                                                                                                                                          | 换成品牌导航型问法后，Perplexity已验证会给出准确正面的回答，同时原生支持自动发送，不需要在"回答质量"和"一键体验"之间二选一 | 点击按钮后新标签页打开Perplexity，查询已自动执行并显示结果，用户无需再点击发送 |
| 问题模板按首页语言各自固定，不混用中文或其他语言，4个版本见下表 | 品牌导航型问法在4个目标语言上实测都表现好，且回答确实包含可点击的本站链接，按钮问题要用该语言首页自己的语言 | 4个语言首页各自生成对应语言的问题，均已实测验证回答中包含真实shortsbinge.com链接 |
| 按钮出现在4个有专属TikTok账号的语言首页（`/`、`/es/`、`/ar/`、`/zh-TW/`，如th确认加入账号规范则一并加上），其余语言首页和非首页页面不加                                                                                                                                                                                                   | 控制范围，优先验证效果，不一次性铺全站                                                  | 仅上述语言首页出现该按钮                                 |

**4个语言的回答实测，用JS直接抓取回答页面里所有`href`含`shortsbinge.com`的链接数验证**（不是凭截图印象判断"提到了品牌名"，是实测确认回答里真的带了可点击的本站链接）：

| 语言    | 问题                                        | 真实shortsbinge.com链接数 | 链接示例                                                                                                             |
| ----- | ----------------------------------------- | -------------------: | ---------------------------------------------------------------------------------------------------------------- |
| EN    | "What dramas can I watch on ShortsBinge?" |                   8个 | 首页、`/this-week/2026-10-19/`、`/browse/`                                                                           |
| ES    | "¿Qué series puedo ver en ShortsBinge?"   |                   9个 | 同上 + `/best-short-dramas/best-short-drama-apps-in-2026.../`                                                      |
| AR    | "ما الدراما التي يمكنني مشاهدتها على ShortsBinge؟"                              |                   6个 | **直接链到具体剧目页**：`/drama/offside-.../`、`/drama/the-alpha-and-his-nanny-luna-.../`、`/ar/browse/platforms/reelshort/` |
| zh-TW | "我可以在ShortsBinge上看什麼短劇？"                  |                   6个 | 首页、`/this-week/2026-10-19/`                                                                                      |

四个语言的回答里都确认带有真实可点击的shortsbinge.com链接，不只是提到"ShortsBinge"这个名字不带链接。

**位置建议**：放首页显眼位置，和TikTok按钮一起放在Hero区域附近（具体是卡片组下方单独一行、还是并入主按钮组，待设计稿确认），不要分开放到footer——两个按钮都要显眼，建议问AI按钮视觉权重略高于TikTok按钮，同时注意不要和"Watch episode 1 free"这个核心转化按钮抢焦点，四个按钮（主CTA+次CTA+问AI+TikTok）同时出现时的视觉层级需要设计配合取舍。

---

## 四、品牌实体消歧：补充`sameAs`字段

**现状**：首页已有Organization结构化数据（`name`/`url`/`description`/`logo`/`contactPoint`齐全），唯独缺`sameAs`字段。

**要做什么**：在现有Organization JSON-LD里加`sameAs`数组，把第一节统一后的4个TikTok账号链接全部列进去：

```json
"sameAs": [
  "https://www.tiktok.com/@shortsbinge_en",
  "https://www.tiktok.com/@shortsbinge_es",
  "https://www.tiktok.com/@shortsbinge_ar",
  "https://www.tiktok.com/@shortsbinge_tw"
]
```

**目的**：帮助Google在品牌/实体识别层面确认shortsbinge.com和这4个官方TikTok账号的归属关系。

**验收标准**：curl首页，Organization JSON-LD块里`sameAs`数组存在且为上述4个账号链接。

---

## 五、YouTube同名频道：前提已确认

已确认该YouTube频道不属于公司。第四节`sameAs`字段按原计划执行，同时建议在About Us/Contact/Footer加一句英文声明（如"ShortsBinge's only official channels are shortsbinge.com and the TikTok accounts listed above"），帮助AI引擎和用户做实体区分，不要和那个同名YouTube频道混淆。

---

## 六、不在本次范围内

排行榜、专题页、深度影评Blog这几类新内容形式，仍然建议放在B档恢复之后评估，不和本次TikTok账号规范化一起做。
