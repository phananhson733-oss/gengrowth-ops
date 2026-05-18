今天读什么｜别把 Human-in-the-loop 做成“确认弹窗”，要把它设计成 Agent 的权限系统

**1. 适合谁读 / 预计阅读时间**  
适合正在做 AI Builder、智能体工作流、内容与增长自动化、企业内部工具、MCP 接入的人读。  
预计阅读时间：8–10 分钟。

**2. 为什么值得读**  
很多团队现在已经不再卡在“模型会不会用工具”，而是卡在更现实的一层：**Agent 到底什么能自己做，什么必须停下来等人确认，什么根本不该碰。**

最近几篇公开资料给了一个很一致的方向：Human-in-the-loop 不应该只是“每一步都弹窗让人点同意”，那样既慢，也会把人点麻。真正有效的做法，是把它设计成一套**分层权限 + 审批边界 + 可恢复状态 + 审计记录**的系统。

这对 GenGrowth 很重要。因为我们未来不只是让 Agent“会写”，而是要让它去读文档、查表、改内容、发消息、建任务、调外部系统。越接近真实业务，越不能只靠一句“谨慎一点”。

**3. 核心概念**  
第一，**审批不是越多越安全**。  
OpenAI 最近谈到 Auto-review：在人工审批模式下，很多越界动作都会频繁打断用户；换成独立审查 Agent 后，人工中断大幅减少，但仍能拦住高风险操作。关键启发不是“AI 替人审批”，而是**把执行者和审批者分离**，避免同一个 Agent 既想完成目标，又自己给自己放行。

第二，**默认只读，写入分级**。  
Anthropic 的思路很清楚：默认可读，不默认可写；修改代码、改系统、发邀请、调用敏感连接器时再进入审批。这个设计比“全开放再补救”稳得多。

第三，**认证不等于授权**。  
OAuth 只解决“它是谁、拿到什么 token”，但没解决“它此刻能不能对这个资源做这件事”。对 Agent 来说，更关键的是**细粒度授权**：哪个 Agent、代表谁、在什么条件下、能碰哪些对象。

第四，**审批必须可暂停、可恢复、可追责**。  
OpenAI 在 SDK 里强调，审批不是另起一套流程，而是同一个 run 的暂停与恢复。也就是说，Agent 被拦下后，状态要能存起来，等人批完继续跑；同时还要留下“谁批准了什么”的记录。

第五，**验证钩子比口头约束更有用**。  
HumanLayer 的经验很实用：不要只在提示词里写“别乱动”，而要用 hooks/规则把某些动作直接拒掉，比如禁止跑迁移、禁止直接碰生产、完成前自动跑 typecheck。把约束写进运行时，才是真正可执行的控制。

**4. 可复用方法**  
如果你要设计一个能上线的 Agent 权限层，可以直接用这个四层框架：

- **第 1 层：默认允许只读动作**  
  搜索、读取、总结、分类、草稿生成。
- **第 2 层：可逆写入动作需轻审批**  
  改文案、建任务、更新草稿、写测试分支。
- **第 3 层：高风险动作需强审批**  
  发外部消息、删数据、改权限、动生产配置、花钱。
- **第 4 层：禁止区**  
  触碰密钥、批量导出敏感数据、绕过审批链、访问越权资源。

再补三件事：  
1）每个工具都标记风险级别，不只在 Agent 总入口做 guardrail；  
2）所有审批都要记录理由、参数、操作者与时间；  
3）成功时尽量静默，失败时把错误明确返给 Agent 继续修。

**5. GenGrowth 可以怎么用**  
第一，用在多 Bot 协作。  
Hermes / PM / Ops / HR 未来如果接更多外部工具，最先要补的不是“更多连接器”，而是**谁能读、谁能写、谁要人工确认**。

第二，用在增长自动化。  
比如“收集线索 → 生成跟进建议 → 写入 CRM 草稿”可以自动；但“直接发客户消息”必须卡审批。这会让自动化真正可用，而不是永远停在 demo。

第三，用在内容生产。  
Agent 可以自动搜集资料、整理结构、生成初稿；但正式发布、批量改站点内容、改 SEO 页面时，要进入审批或预览环节。

**6. 今日行动**  
1. 先把你现有 Agent 工具按“只读 / 可逆写入 / 高风险 / 禁止”分四类。  
2. 给每个高风险工具补一个 `needs approval` 或等价的审批标记。  
3. 增加最小审计字段：调用人、代表用户、工具名、参数摘要、审批结果、时间。

**7. 参考来源**  
- OpenAI｜Auto-review of agent actions without synchronous human oversight  
  https://alignment.openai.com/auto-review/  
- OpenAI Developers｜Guardrails and human review  
  https://developers.openai.com/api/docs/guides/agents/guardrails-approvals  
- Anthropic｜Our framework for developing safe and trustworthy agents  
  https://www.anthropic.com/news/our-framework-for-developing-safe-and-trustworthy-agents  
- HumanLayer｜Skill Issue: Harness Engineering for Coding Agents  
  https://www.humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents  
- WorkOS｜The best authorization platforms for managing AI agent permissions in 2026  
  https://workos.com/blog/best-authorization-platforms-ai-agent-permissions-2026
