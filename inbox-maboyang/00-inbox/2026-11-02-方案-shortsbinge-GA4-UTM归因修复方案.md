---
title: 方案 · shortsbinge.com GA4 UTM归因修复方案
date: 2026-11-02
status: 待彪哥排期，P0
scope: GA4埋点代码page_location参数修复
依据: TikTok短链跳转链路、GA4埋点请求抓包，本人均已直接实测核实
---

# 方案 · shortsbinge.com GA4 UTM归因修复方案

## 一句话结论

TikTok bio链接的UTM参数其实一直都是对的，问题不在营销链路，**在网站自己的GA4埋点代码**：页面加载后，GA4上报给Google服务器的"页面地址"字段里完全不含UTM参数，导致不管URL上带了多完整的`utm_source`/`utm_medium`/`utm_campaign`，GA4都读不到，一律归成`(direct)/(none)`。这不是TikTok专属问题，是全站级别的渠道归因漏洞——任何带UTM访问本站的流量（Google Ads、邮件、其他社媒）理论上都会被同样误判。改一处代码，所有渠道的归因能一起修好。

---

## 一、问题：GA4埋点上报的页面地址不含UTM参数（已验证）

**完整复现链路（本人已实测）**：

1. TikTok主页短链：`shortsbinge.com/q122hu64kkc29r`（用户确认上周已上线）
2. 用户在TikTok App内点击该链接，先跳转到TikTok自己的中间页`tiktok.com/link/v2?aid=1988&...&target=shortsbinge.com%2Fq122hu64kkc29r`，需要再点击一次
3. 第二次点击后，正确跳转到最终URL：`https://shortsbinge.com/es/?utm_source=tiktok&utm_medium=social&utm_campaign=shirley5278789&utm_content=...`——UTM参数完整、正确，这一段本人已用curl和浏览器双重验证
4. 浏览器加载完这个URL后，地址栏上UTM参数依然完整显示（没有被前端路由清掉）
5. **但是**，本人抓取了页面实际发给Google Analytics服务器的请求（`google-analytics.com/g/collect`），请求参数里的`dl`字段（document location，GA4用来做页面归因判断的核心字段）是：

   ```
   dl=https://shortsbinge.com/es/
   ```

   **完全不含query string**，UTM参数在GA4自己构造埋点请求的这一步被丢弃了。

**根因推断**（未看到源码，按常见实现模式推断，需要彪哥对照代码确认）：大概率是GA4初始化代码或配置里，设置`page_location`时用了类似`window.location.pathname`这样只取路径、不含query string的变量，而不是完整的`window.location.href`（或Next.js场景下对应的完整path+search）。

**这不是TikTok或Referer的问题**：
- 此前怀疑"TikTok站内浏览器丢失Referer导致归因失败"，这个现象确实存在，但不是症结所在——GA4的默认渠道分组逻辑本该优先读取UTM参数做归因，不需要依赖Referer
- 这次实测证明，连UTM参数本身都没有被GA4读到，所以不管Referer在不在、来自哪个App，只要流量落地后由这段代码上报，一律会被误判成`(direct)/(none)`

**这不是TikTok专属问题**：任何带UTM参数访问这个网站的流量——未来如果跑Google Ads、邮件营销、其他社媒渠道——只要最终页面由这段代码上报埋点，都会遇到同样的误判。这是一个全站级别的渠道归因漏洞，优先级应该按"数据可信度"的基础设施问题处理，不只是"这次TikTok活动看不清效果"这么小的范围。

---

## 二、需要做的事

1. 找到网站GA4/gtag集成代码里设置`page_location`（或等效的`dl`参数来源）的那一处，确认当前取值的变量是否遗漏了query string
2. 改成使用完整地址（路径+query string），确保UTM参数能被GA4正常读取并上报
3. 修复后用本文档第一节同样的方法复测：访问一个带UTM参数的测试URL，抓取`google-analytics.com/g/collect`请求，确认`dl`字段里UTM参数完整存在
4. 如果网站使用了GA4的"增强型评估"自动页面跟踪（而非手动埋点），需要额外确认客户端路由（Next.js路由）切换页面时，是否也会用同样有问题的方式重新计算`page_location`——单页应用场景下，首次加载和后续客户端路由切换可能走两套不同的上报逻辑，需要都检查

---

## 三、达到的效果

- TikTok渠道流量能在GA4里被正确识别为`tiktok / social`，不再混入`(direct)/(none)`，后续每周报告可以直接看到渠道贡献，不用再靠"前后对比+业务判断"这种间接方法
- 为后续任何需要精确归因的营销活动（不限于TikTok）提供可信的数据基础
- 修复后可以追溯验证：11/2之后新增的`(direct)/(none)`流量如果仍然很高，说明确实有一部分是真实直接访问/未打标签的渠道，不再是归因漏洞导致的假象

---

## 四、验收标准

- 修复上线后，用测试UTM链接实测一次，确认GA4实时报告（或`google-analytics.com/g/collect`抓包）里能看到完整UTM参数
- 修复上线后的下一个完整自然日，检查GA4流量来源报告，确认`tiktok / social`这个来源/媒介组合开始出现，且量级与`(direct)/(none)`的下降幅度大致对应
- 后续周报的"流量来源"部分，不再需要"用户确认该阶段站内无其他推广活动"这种间接说明，可以直接引用GA4数据
