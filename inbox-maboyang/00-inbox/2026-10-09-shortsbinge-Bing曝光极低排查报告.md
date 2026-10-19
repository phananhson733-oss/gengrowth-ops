---
title: ShortsBinge.com Bing曝光极低排查报告
date: 2026-10-09
依据: 用户提供的Bing site:搜索截图（真实浏览器会话，非自动化）· Vercel防火墙日志（彪哥10/8回复，Bingbot数据）· 现场核查robots.txt、sitemap.xml、具体剧目收录情况
方法: 本文档是排查报告，不是交办文档——结论里区分"已确认""有直接证据支持的推测""排除掉的猜测（含我自己之前的一个误判）"三类，不混为一谈
---

# ShortsBinge.com Bing曝光极低排查报告

## 一、核心结论

Bing确实收录了shortsbinge.com的内容，**不是零收录，是收录了但曝光被严重压低**。排查到两个具体、有证据支持的原因：

1. **内容和已死亡但仍被Bing深度收录的姊妹站dramashortstv.com高度重叠，至少有1个剧目被直接实锤同时收录在两边**，Bing大概率在重复判定里压低了shortsbinge的展示优先级
2. **国内版（严格SafeSearch）Bing把shortsbinge的内容完全过滤成0条结果**，这部分受众群体曝光是结构性归零的

此外排除了一条我自己之前怀疑过、但精确核查后发现不成立的猜测（见第四节），如实记录，不回避自己的错误推断。

## 二、收录量对比——差距巨大，而且对比对象本身已经是个死站

| | shortsbinge.com | dramashortstv.com |
|---|---:|---:|
| 当前状态 | 正常运行 | **已暂停**（Vercel `DEPLOYMENT_PAUSED`，返回503，自2026-09-28起） |
| Bing国际版`site:`收录数 | **约17条** | **约105-108条** |
| Bing国内版`site:`收录数 | **0条**（被SafeSearch过滤，见第三节） | 有结果（未精确计数，截图可见多条） |

dramashortstv已经死了12天，Bing里还留着100多个页面的深度收录；shortsbinge是活的、还在每天发blog和新剧，收录数只有对方的六分之一不到。这个差距本身就是最直接的信号。

## 三、国内版SafeSearch把shortsbinge过滤成0条——新发现，之前没查到过

国内版Bing搜`site:shortsbinge.com`，返回的不是结果列表，是一段提示：

> "您所在的国家或地区需要严格的Bing安全搜索设置，该设置会过滤掉可能包含成人内容的搜索结果。"

shortsbinge的剧集里有相当比例标注"explicit romance"等官方描述（比如之前写过的"How to Break a DILF"），大概率是这类内容整体把域名在严格SafeSearch规则下判定成需要过滤的类别。**这条只影响被归类到严格SafeSearch地区/账号设置的搜索者，不能解释全部曝光缺失，但是一个真实存在、此前完全没有排查到的减分项**，建议记录下来，不代表"修复后曝光就能完全恢复"，只是众多因素之一。

## 四、重复内容证据——直接找到了同一部剧两边都收录的实例

不是推测，是直接比对出来的：

| 剧名 | shortsbinge.com | dramashortstv.com |
|---|---|---|
| Daddy Left His Baby to Die | 已收录，`/drama/...`，ReelShort来源，55集，7集免费 | 已收录，`/en/观看.../第一集`，50集，14集免费 |

**两边确实是同一部剧（片源都是ReelShort），集数和免费集数标注略有差异（55集/7免费 vs 50集/14免费），但核心是同一个内容**。这是从Bing搜索结果截图里直接比对出来的，不是"猜测两站内容重叠"，是**实锤看到了至少一个具体案例**。虽然样本只有1个，但考虑到两站都是ReelShort/DramaBox片源的聚合站、片库重叠度在当初排查时就已经确认过（见`project-drama-sites-bing.md`里的历史判断"两站同剧目疑被判重复"），这个实例可以当成验证了那条历史推测，不是孤证瞎猜。

## 五、已排除的原因

| 原因 | 排查结果 |
|---|---|
| Bingbot被防火墙拦截 | **排除**。彪哥10/8给的Vercel防火墙日志：Bingbot 57次请求，全部allow，不是拦截问题 |
| Bingbot被robots.txt限制抓取 | **排除**，但过程中我自己有一个误判，必须更正，见下 |

### 五之一：我自己的一个误判，精确核查后收回

之前怀疑`robots.txt`里的`Crawl-delay: 10`可能在限制Bingbot的抓取速度（10秒才能抓一次，严重拖慢收录进度）。**这个怀疑经过精确的分组解析后，是错的，现在收回**：

```
User-Agent: *
Allow: /
Allow: /api/play/
Disallow: /api/
Disallow: /admin/

...（GPTBot等AI爬虫组）...

User-Agent: OAI-SearchBot
User-Agent: Claude-SearchBot
User-Agent: PerplexityBot
User-Agent: meta-webindexer
User-Agent: Amzn-SearchBot
Allow: /
...
Crawl-delay: 10

Sitemap: https://shortsbinge.com/sitemap.xml
```

按robots.txt标准分组规则，`Crawl-delay: 10`这一行紧跟在`OAI-SearchBot`/`Claude-SearchBot`/`PerplexityBot`/`meta-webindexer`/`Amzn-SearchBot`这五个AI搜索爬虫的规则块后面，中间没有新的`User-Agent`行把它和前面分开——**这条限速只对这五个AI爬虫生效，不适用于`User-Agent: *`这个分组，而Bingbot没有被单独列出姓名，是落在`User-Agent: *`这个分组下的，这个分组里完全没有`Crawl-delay`**。Bingbot的抓取速度没有被我们自己的robots.txt限制。

（之前10/8查Google那份"Googlebot忽略的规则"截图时，GSC把这条Crawl-delay标成和Googlebot相关，当时没深究是不是精确对应分组——现在看，Google的robots.txt检测工具大概率是对整份文件里任何不支持的指令类型做提示，不代表这条规则真的落在Googlebot/通用分组里。这个细节在这里一并澄清。）

## 六、还没确认、需要问彪哥的部分

1. **shortsbinge有没有实现IndexNow协议**。这是Bing（和Yandex）官方力推的新站收录加速机制——允许网站主动把新发布的URL推送给Bing，不用等Bing自己来爬。对于一个新站、内容又在持续更新（每天发blog、不断上新剧），IndexNow对Bing收录速度的影响通常比被动等待自然抓取大得多。这个只能从后台配置确认，外部查不到有没有实现，是本次排查最大的未知项，也是最值得优先问的一条。
2. **sitemap.xml里是否包含了具体剧集/blog的URL**，还是只有`/`、`/trending/`、`/browse/genres/*`这类顶层聚合页（之前在Google那条线里查sitemap.xml时，看到的内容就是顶层页面为主，没有确认过有没有包含到具体剧集页/blog文章这一层——如果sitemap本身就没把新内容纳入，Bing即使想优先抓也无从发现）。
3. **dramashortstv.com现在的robots.txt/索引状态要不要主动处理**。它已经暂停12天，Bing还在显示100多条旧收录，如果继续放任不管，Bing可能会一直拿它的旧内容当"已经有这个内容了"的参照，持续压低shortsbinge对应内容的优先级。建议评估：要不要通过Bing Webmaster Tools对dramashortstv.com提交URL移除请求，或者至少确认它现在的技术状态会不会让Bing自然地逐步清出索引（比如503持续返回多久后Bing会判定为永久下线）。

## 七、本次排查方法的局限，如实说明

- `site:`运算符本身不是Bing官方认可的精确收录统计工具（和Google的`site:`局限性质类似），本文档引用的"17条""105条"这些数字是实际搜索看到的展示数，不是Bing Webmaster Tools后台的权威收录总数，精确数字仍需去BWT核对
- 我自己用自动化方式查`site:`会被Bing的人机验证拦截（已经在之前的排查里确认过），这次能拿到真实数据是因为你用自己的真实浏览器会话查的，这个方法上的差异要记录清楚，不代表我这边的工具突然能用了
