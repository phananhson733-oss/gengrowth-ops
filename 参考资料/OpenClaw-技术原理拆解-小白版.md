---
title: "OpenClaw 技术原理完全拆解（小白友好版）"
created: 2026-02-28
updated: 2026-03-03
type: reference
aliases:
  - OpenClaw技术拆解
  - OpenClaw小白版
tags:
  - research
  - AI
  - agents
  - OpenClaw
  - technical-breakdown
---

# 🦞 OpenClaw 技术原理完全拆解（小白友好版）

> 📅 编写日期：2026-02-28
> 🎯 目标读者：技术小白，想深入理解 OpenClaw 的工作原理
> 📖 阅读方式：每个技术概念都会用**生活比喻**先解释，再给技术细节
> 📝 已有参考：[[docs/OpenClaw 完整技术架构与应用详解.md]]（进阶版，可对照阅读）

---

## 目录

1. [OpenClaw 到底是什么？](#一openclaw-到底是什么)
2. [快速上手：5分钟跑起来](#二快速上手5分钟跑起来)
3. [核心架构：三层蛋糕模型](#三核心架构三层蛋糕模型)
4. [Gateway：整个系统的大脑](#四gateway整个系统的大脑)
5. [消息如何流动：六步流水线](#五消息如何流动六步流水线)
6. [工具系统：AI 的双手](#六工具系统ai-的双手)
7. [记忆系统：OpenClaw 的核心创新](#七记忆系统openclaw-的核心创新)
8. [多模型调度：让合适的AI做合适的事](#八多模型调度让合适的ai做合适的事)
9. [Skills 技能系统：即插即用的能力模块](#九skills-技能系统即插即用的能力模块)
10. [主动工作：心跳与定时任务](#十主动工作心跳与定时任务)
11. [多 Agent 协作：从单兵到团队](#十一多-agent-协作从单兵到团队)
12. [安全模型：防护与风险](#十二安全模型防护与风险)
13. [真实案例：别人怎么用的](#十三真实案例别人怎么用的)
14. [与竞品对比](#十四与竞品对比)
15. [关键术语速查表](#十五关键术语速查表)
16. [参考资料](#参考资料)

---

## 一、OpenClaw 到底是什么？

### 1.1 一句话定义

> **OpenClaw 是一个运行在你自己电脑上的 AI 管家。**
> 它能连接你的微信/Telegram/Slack 等聊天工具，替你执行任务——搜索信息、写代码、发邮件、管理日历、浏览网页——而且**它有记忆，能记住你说过什么**。

### 1.2 和 ChatGPT 的区别

| 你已经知道的           | OpenClaw 的区别                                                |
| ---------------- | ----------------------------------------------------------- |
| ChatGPT 在浏览器里用   | OpenClaw 装在**你自己的电脑**上                                      |
| ChatGPT 只能聊天     | OpenClaw 能**执行命令**（打开浏览器、操作文件、跑代码）                          |
| ChatGPT 关掉浏览器就忘了 | OpenClaw **永久记忆**，下次还记得你说过什么                                |
| ChatGPT 你问它才回答   | OpenClaw 能**主动工作**（定时检查邮件、监控网站）                             |
| ChatGPT 只用一个模型   | OpenClaw 能**同时调度多个 AI 模型**                                  |
| ChatGPT 只在网页上    | OpenClaw 连接 **50+ 消息平台**（WhatsApp/Telegram/Slack/Discord 等） |

### 1.3 生活比喻

把 OpenClaw 想象成你雇了一个**全能管家**：

```
你（老板）
  │
  ├── 你可以通过微信/Telegram/Slack 发消息给管家
  │
  ├── 管家有一本"记事本"（记忆系统）
  │     记着你的偏好、之前的对话、重要决定
  │
  ├── 管家有一个"工具箱"（工具系统）
  │     能上网搜索、操作电脑、发邮件、写文件
  │
  ├── 管家有"脑子"（LLM 大语言模型）
  │     能思考、推理、做决策
  │
  └── 管家还能"雇临时工"（多 Agent）
        把大任务分给多个 AI 同时干
```

### 1.4 基本信息

| 项目 | 详情 |
|------|------|
| 名称 | OpenClaw（曾用名 Clawdbot / Moltbot） |
| 开发者 | Peter Steinberger |
| 开源协议 | MIT（完全免费） |
| 编程语言 | TypeScript（Node.js） |
| GitHub Stars | 175,000+（两周内达成，史上最快之一） |
| 上线时间 | 2026年1月 |
| 当前状态 | 创始人已加入 OpenAI，项目将移交至开源基金会 |

---

## 二、快速上手：5分钟跑起来

### 2.1 你需要什么

| 条件 | 说明 |
|------|------|
| 电脑 | Mac / Linux / Windows 都行 |
| Node.js | 版本 22 以上（[下载地址](https://nodejs.org)） |
| AI 模型的 API Key | 至少一个：OpenAI / Anthropic / Google Gemini / DeepSeek 的密钥 |
| 聊天工具（可选） | Telegram / WhatsApp / Slack 等 |

### 2.2 安装三步走

```bash
# 第1步：安装 OpenClaw
npm install -g openclaw@latest

# 第2步：运行设置向导（会引导你配置 API Key、选模型）
openclaw onboard --install-daemon

# 第3步：开始对话！
openclaw chat
```

设置向导会做这些事：
1. 创建配置文件 `~/.openclaw/openclaw.json`
2. 安装后台守护进程（系统服务，开机自启）
3. 让你填写 API Key
4. 选择默认的 AI 模型

### 2.3 配置文件长什么样

```jsonc
// ~/.openclaw/openclaw.json
{
  // 默认使用的 AI 模型
  "models": {
    "default": "anthropic/claude-sonnet-4-20250514"
  },

  // Agent 配置
  "agents": {
    "defaults": {
      "name": "Hal",              // 你的 AI 管家叫什么名字
      "model": "anthropic/claude-sonnet-4-20250514"
    }
  },

  // 消息平台连接
  "channels": {
    "telegram": {
      "adapter": "telegram",
      "token": "your-bot-token"   // Telegram Bot Token
    }
  }
}
```

### 2.4 目录结构

```
~/.openclaw/                    ← OpenClaw 的"家"
├── openclaw.json               ← 主配置文件
├── MEMORY.md                   ← 持久记忆（AI 的长期笔记本）
├── memory/                     ← 每日记忆
│   ├── 2026-02-27.md          ← 昨天发生的事
│   └── 2026-02-28.md          ← 今天发生的事
├── sessions/                   ← 对话记录
│   └── {sessionId}.jsonl      ← 每行一条消息
├── agents/                     ← Agent 相关数据
│   └── {agentId}/
│       ├── sessions/          ← 该 Agent 的会话
│       └── sqlite 数据库       ← 向量索引
├── skills/                     ← 安装的技能
│   └── {skill-name}/
│       └── SKILL.md           ← 技能定义文件
└── workspace/                  ← 工作区
    ├── AGENTS.md              ← 操作指令
    ├── SOUL.md                ← 人格设定
    └── USER.md                ← 用户信息
```

---

## 三、核心架构：三层蛋糕模型

### 3.1 整体架构（生活比喻版）

想象一个三层蛋糕 🎂：

```
🎂 第三层（最上面）：Channel 层 —— "前台接待"
   你通过各种渠道（微信/Telegram/Slack）发消息
   前台负责把各种格式的消息统一翻译成"标准格式"

🎂 第二层（中间）：Gateway 层 —— "总管家"
   收到统一消息后，决定交给谁处理、怎么处理
   管理所有对话、调度工具、控制安全

🎂 第一层（最底下）：LLM Provider 层 —— "智囊团"
   真正"思考"的AI大脑们（Claude/GPT/Gemini...）
   总管家把问题发给智囊团，拿回答案
```

### 3.2 技术架构图

```
┌──────────────────────────────────────────────────────────┐
│              📱 Channel 层（前台接待）                      │
│                                                           │
│  WhatsApp │ Telegram │ Slack │ Discord │ Signal │ iMessage │
│  Google Chat │ MS Teams │ Matrix │ 飞书 │ WebChat │ CLI    │
│                                                           │
│  🎯 核心职责：把50+平台的不同消息格式统一翻译成一种格式     │
└────────────────────────┬─────────────────────────────────┘
                         │ StandardMessage（统一格式）
                         ▼
┌──────────────────────────────────────────────────────────┐
│              🧠 Gateway 层（总管家）                        │
│                                                           │
│  运行在: ws://127.0.0.1:18789                             │
│                                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ 会话管理  │ │ 消息路由  │ │ 工具执行  │ │ 记忆系统  │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ 安全认证  │ │ 并发控制  │ │ 插件加载  │ │ 定时调度  │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│                                                           │
│  🎯 核心职责：所有事情的中枢——收消息、做决策、调工具、存记忆 │
└────────────────────────┬─────────────────────────────────┘
                         │ 结构化请求
                         ▼
┌──────────────────────────────────────────────────────────┐
│              🤖 LLM Provider 层（智囊团）                   │
│                                                           │
│  Anthropic Claude │ OpenAI GPT │ Google Gemini            │
│  DeepSeek │ Ollama(本地) │ Groq │ Mistral │ xAI          │
│  OpenRouter(代理) │ 自定义端点                              │
│                                                           │
│  🎯 核心职责：提供"思考能力"，不同任务可以用不同的AI       │
└──────────────────────────────────────────────────────────┘
```

### 3.3 为什么这么设计？

用一个比喻来理解三层分离的好处：

```
❌ 没有分层的设计（糟糕）：
   你直接把 Telegram 消息发给 ChatGPT → 换成 WhatsApp 就得全部重写

✅ 三层分层的设计（OpenClaw）：
   Telegram → [统一格式] → Gateway → [统一接口] → 任意AI模型
   WhatsApp → [统一格式] → Gateway → [统一接口] → 任意AI模型
   Slack    → [统一格式] → Gateway → [统一接口] → 任意AI模型

   好处：
   1. 加一个新平台？只需写一个"翻译器"（Channel适配器）
   2. 换一个AI模型？只需改配置文件
   3. Gateway 的逻辑完全不用动
```

---

## 四、Gateway：整个系统的大脑

### 4.1 Gateway 是什么？

**Gateway = 一个运行在你电脑上的后台程序。**

它的角色就像一个公司的**总调度中心**：

| 公司比喻 | Gateway 功能 |
|---------|-------------|
| 前台接电话 → 转到对应部门 | 收消息 → 路由到对应 Agent |
| 人力资源部管员工档案 | 管理所有会话/对话的状态 |
| 安保部门验证来访者身份 | 认证和访问控制 |
| 仓库管理物资 | 管理工具和插件 |
| CEO 做决策 | 决定调用哪个 AI 模型 |
| 秘书安排日程 | 定时任务和心跳调度 |

### 4.2 WebSocket 通信协议

> 💡 **什么是 WebSocket？**
> 普通网页是"你问我答"——你发一个请求，服务器回一个响应，结束。
> WebSocket 是"保持通话"——建立连接后，双方可以随时互发消息，就像打电话一样。

OpenClaw 的所有组件都通过 WebSocket 和 Gateway 通信：

```
┌──────────┐  WebSocket  ┌──────────┐  WebSocket  ┌──────────┐
│ Telegram │◄───────────►│          │◄───────────►│  Web UI  │
│  适配器   │             │ Gateway  │             │          │
└──────────┘             │          │             └──────────┘
┌──────────┐             │ (大脑)   │             ┌──────────┐
│  Slack   │◄───────────►│          │◄───────────►│   CLI    │
│  适配器   │             │          │             │          │
└──────────┘             └──────────┘             └──────────┘
```

消息只有三种类型：

| 类型 | 方向 | 用途 | 比喻 |
|------|------|------|------|
| **Request（请求）** | 客户端→Gateway | "我想问个问题" | 你给管家发微信 |
| **Response（响应）** | Gateway→客户端 | "这是答案" | 管家回复你 |
| **Event（事件）** | Gateway→客户端 | "有新情况通知你" | 管家主动提醒你 |

### 4.3 并发控制（小白解释）

> 💡 **什么是并发问题？**
> 想象你同时在微信和 Telegram 给管家发了两条消息。如果两条消息同时处理同一个对话，就会"打架"——比如一个在存数据，另一个也在存，结果互相覆盖。

**OpenClaw 的规则**："同一个对话串行（排队），不同对话并行（同时）"

```
你的对话 A：消息1 → 等处理完 → 消息2 → 等处理完 → 消息3  ← 排队
你的对话 B：消息1 → 等处理完 → 消息2                     ← 排队
同事的对话：消息1 → 消息2 → 消息3                         ← 和你同时处理
```

技术实现：用 Redis 分布式锁（redlock）确保同一个 Session 不会被并发处理。

---

## 五、消息如何流动：六步流水线

当你发一条消息给 OpenClaw，它会经历**六个步骤**：

### 5.1 完整流程图

```
你在 Telegram 发了一条消息："帮我查一下明天北京的天气"
     │
     ▼
┌─────────────────────────────────────────────────────┐
│ Step 1: 📥 摄入（Ingestion）                          │
│                                                       │
│ Telegram 适配器收到原始消息                             │
│ → 提取文本："帮我查一下明天北京的天气"                    │
│ → 提取元数据：用户ID、时间戳、聊天ID                     │
│ → 转换为 StandardMessage 格式                          │
└───────────────────────┬─────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│ Step 2: 🔒 访问控制（Access Control）                   │
│                                                       │
│ → 这个用户在白名单里吗？                                │
│ → 还是需要配对码验证？                                  │
│ → 是群消息吗？有没有 @提到我？                           │
│ → ✅ 通过验证                                          │
└───────────────────────┬─────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│ Step 3: 💬 会话解析（Session Resolution）               │
│                                                       │
│ → 这个用户之前和我聊过吗？                               │
│ → 用键 "telegram-主agent-用户ID" 查找已有会话            │
│ → 找到了！加载之前的对话历史                              │
│ →（没找到就创建新会话）                                  │
└───────────────────────┬─────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│ Step 4: 📦 上下文组装（Context Assembly）⭐ 关键步骤     │
│                                                       │
│ → 加载会话历史（之前聊了什么）                            │
│ → 构建系统提示词：                                      │
│   ├── AGENTS.md（你给AI定的规矩）                       │
│   ├── SOUL.md（AI的性格设定）                           │
│   ├── USER.md（你的个人信息）                            │
│   └── 运行时信息（当前时间、操作系统等）                   │
│ → 搜索记忆系统："之前用户问过天气吗？有什么偏好？"          │
│ → 注入相关 Skills 指引                                  │
│ → 所有信息打包成一个完整的"上下文包裹"                     │
└───────────────────────┬─────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│ Step 5: 🤖 模型调用（Model Invocation）                 │
│                                                       │
│ → 把上下文包裹发给 AI 模型（如 Claude）                   │
│ → AI 开始思考...                                       │
│ → AI 说："我需要搜索天气信息"                             │
│ → 🔧 触发工具调用：web_search("北京明天天气")             │
│ → 搜索工具返回结果                                      │
│ → 结果注入对话 → AI 继续思考                             │
│ → AI 生成最终回答                                       │
│ →（整个过程是流式的：AI一边想一边输出）                    │
└───────────────────────┬─────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│ Step 6: 📤 响应投递（Response Delivery）                │
│                                                       │
│ → 格式化回答（适配 Telegram 的消息格式）                  │
│ → 发送回 Telegram                                     │
│ → 保存这轮对话到会话文件（JSONL）                        │
│ → 更新记忆系统                                         │
│ → ✅ 完成！                                            │
└─────────────────────────────────────────────────────┘

你收到回复："明天北京天气晴，温度-2°C到8°C，建议穿厚外套。"
```

### 5.2 关键理解

**Step 4（上下文组装）是最核心的步骤。** 它决定了 AI "知道什么"：

```
AI 实际收到的不是你的一条消息，而是一个"大包裹"：

┌─────────────────────────────────────────┐
│  📦 上下文包裹                            │
│                                          │
│  📜 系统设定：                            │
│  "你是一个名叫 Hal 的 AI 助手..."          │
│  "你应该用中文回答..."                     │
│  "当前时间：2026-02-28 14:30..."          │
│                                          │
│  💭 对话历史：                             │
│  [昨天] 用户：帮我查查上海天气              │
│  [昨天] AI：上海今天25°C，晴天             │
│  [今天] 用户：帮我查一下明天北京的天气       │
│                                          │
│  🧠 相关记忆：                            │
│  "用户偏好：喜欢简洁的天气预报"             │
│  "用户位置：通常关注北京和上海的天气"        │
│                                          │
│  🔧 可用工具列表：                         │
│  - web_search: 搜索互联网                 │
│  - web_fetch: 获取网页内容                │
│  - ...                                   │
└─────────────────────────────────────────┘
```

---

## 六、工具系统：AI 的双手

### 6.1 工具是什么？

如果 LLM 是 AI 的"大脑"，那**工具**就是 AI 的"双手"——让它能**做事情**，而不仅仅是说话。

> 💡 **比喻**：你让一个聪明的朋友帮你做事。
> - 没有工具：朋友只能用嘴告诉你怎么做（ChatGPT 模式）
> - 有工具：朋友可以直接帮你操作电脑、上网搜索、发邮件（OpenClaw 模式）

### 6.2 八大工具组

OpenClaw 的工具按功能分成八个组：

| 工具组 | 包含什么 | 通俗解释 | 日常比喻 |
|--------|---------|---------|---------|
| 🖥️ **runtime** | `exec`, `bash`, `process` | 执行电脑命令 | 管家能操作电脑 |
| 📁 **fs** | `read`, `write`, `edit`, `apply_patch` | 读写文件 | 管家能翻阅和修改文件柜 |
| 🌐 **web** | `web_search`, `web_fetch`, `image` | 上网搜索 | 管家能上网查资料 |
| 🖼️ **ui** | `browser`, `canvas` | 浏览器操作 | 管家能帮你操作浏览器 |
| ✉️ **messaging** | `message` | 跨平台发消息 | 管家能帮你发消息 |
| 👥 **sessions** | `sessions_spawn`, `sessions_send` | 创建子Agent | 管家能雇临时工 |
| 🧠 **memory** | `memory_search`, `memory_get` | 检索记忆 | 管家能翻笔记本 |
| ⏰ **automation** | `cron`, `gateway` | 定时任务 | 管家设闹钟提醒自己干活 |

### 6.3 工具调用是怎么工作的？

以"搜索天气"为例：

```
Step 1: AI 收到问题后思考
   AI 想："用户要查天气，我需要搜索引擎"

Step 2: AI 输出"工具调用请求"（不是普通文本）
   {
     "tool": "web_search",
     "arguments": { "query": "北京明天天气预报" }
   }

Step 3: OpenClaw 拦截这个请求
   Gateway 看到 AI 要用工具 → 暂停 AI 输出 → 执行搜索

Step 4: 工具执行并返回结果
   搜索结果："北京明天晴，-2°C到8°C..."

Step 5: 结果注入对话
   Gateway 把搜索结果作为新消息放回对话

Step 6: AI 继续思考
   AI 基于搜索结果生成最终回答
```

**关键理解**：AI 本身不会"上网"——它只是告诉 OpenClaw "我想搜索"，OpenClaw 帮它搜，再把结果反馈给 AI。这就是 **Function Calling（函数调用）** 的本质。

### 6.4 浏览器工具详解

OpenClaw 能**操控浏览器**，就像有人在帮你点鼠标：

```
你："帮我在淘宝搜索蓝牙耳机，找价格最低的3个"

AI 调用 browser 工具：
  → 打开 Chrome 浏览器（通过 CDP 协议控制）
  → 访问 taobao.com
  → 在搜索框输入"蓝牙耳机"
  → 按价格排序
  → 读取前3个商品的名称和价格
  → 返回结果给你
```

> 💡 **什么是 CDP？**
> Chrome DevTools Protocol——Chrome 浏览器提供的一套"遥控接口"。开发者可以通过代码控制浏览器的每一个动作：打开网页、点击按钮、填写表单、截图等。

### 6.5 工具安全：五级权限控制

OpenClaw 用"五级权限"控制谁能用什么工具：

```
最高优先 → ┌─────────────────────────────────┐
          │ Level 1: 全局拒绝列表             │ 这些工具谁都不能用
          ├─────────────────────────────────┤
          │ Level 2: 模型级别限制             │ 某些模型能用的工具不同
          ├─────────────────────────────────┤
          │ Level 3: Agent 级别限制           │ 不同Agent有不同权限
          ├─────────────────────────────────┤
          │ Level 4: 沙箱策略                │ 沙箱内的限制
          ├─────────────────────────────────┤
最低优先 → │ Level 5: 仅管理员工具             │ 只有你能触发的工具
          └─────────────────────────────────┘

⚠️ 规则：拒绝列表永远优先。被拒绝的工具，无论谁都用不了。
```

---

## 七、记忆系统：OpenClaw 的核心创新

> ⭐ **这是 OpenClaw 和其他 AI 工具最本质的区别。**
> 普通 AI：你关掉窗口就全忘了。OpenClaw：永远记得你说过什么。

### 7.1 三层记忆（生活比喻）

```
┌─────────────────────────────────────────────────────────┐
│  📒 第三层：会话记忆 —— "聊天记录"                         │
│                                                          │
│  就像微信的聊天记录，自动保存每一次对话                      │
│  文件：sessions/2026-02-28-查天气.md                      │
│  特点：每次对话自动保存，AI 给每段对话起个描述性名字          │
├──────────────────────────────────────────────────────────┤
│  📓 第二层：临时记忆 —— "今天的工作日志"                    │
│                                                          │
│  像秘书每天写的工作日志，记录今天发生了什么                   │
│  文件：memory/2026-02-28.md                              │
│  特点：追加式写入，启动时自动加载"今天+昨天"的日志            │
├──────────────────────────────────────────────────────────┤
│  📕 第一层：持久记忆 —— "人生笔记本"                       │
│                                                          │
│  像你的个人笔记本，记录所有重要的长期信息                    │
│  文件：MEMORY.md                                         │
│  内容：重要决策、个人偏好、项目信息、关键经验                 │
│  ⚠️ 安全：仅在私聊时加载，群聊中绝不暴露你的隐私信息         │
└──────────────────────────────────────────────────────────┘
```

### 7.2 记忆如何被搜索？（混合搜索）

当 AI 需要回忆过去的信息时，OpenClaw 用**两种方法同时搜索**：

#### 方法一：向量搜索（理解含义）—— 权重 70%

> 💡 **什么是向量搜索？**
> 把文字转成一串数字（向量），数字越接近 = 含义越相似。
>
> 比如：
> - "我喜欢吃苹果" → [0.8, 0.2, 0.5, ...]
> - "我爱吃水果" → [0.78, 0.22, 0.48, ...]  ← 数字很接近！含义相似
> - "苹果公司股票" → [0.1, 0.9, 0.3, ...]    ← 数字差很远，含义不同

**特长**：能理解"同义词"。搜索"网关的机器"能找到"运行 Gateway 的主机"。

#### 方法二：关键词搜索（精确匹配）—— 权重 30%

> 💡 就是传统的"搜索引擎"方式——你搜什么词，它就找包含那个词的文档。

**特长**：精确匹配错误代码、函数名等。搜索"ERR_CONNECTION_REFUSED"就找"ERR_CONNECTION_REFUSED"。

#### 最终得分公式

```
最终得分 = 0.7 × 向量相似度 + 0.3 × 关键词得分
```

#### 后处理优化

| 技术 | 作用 | 比喻 |
|------|------|------|
| **MMR 重排序** | 搜索结果要既相关又多样化 | 不能10条结果全说同一件事 |
| **时间衰减** | 最近的记忆排名更高 | 昨天的事比去年的事更重要 |

### 7.3 向量数据库实现

```
存储：SQLite + sqlite-vec 扩展（轻量级，不需要额外装数据库）

数据库位置：~/.openclaw/memory/{agentId}.sqlite

核心表：
┌────────────────┬────────────────────────────────────┐
│ files          │ 跟踪哪些文件被索引了                   │
├────────────────┼────────────────────────────────────┤
│ chunks         │ 文本被切成的小块 + 对应的向量           │
├────────────────┼────────────────────────────────────┤
│ embedding_cache│ 缓存已计算过的向量（避免重复计算）       │
├────────────────┼────────────────────────────────────┤
│ chunks_fts     │ FTS5 全文搜索索引（关键词搜索用）       │
├────────────────┼────────────────────────────────────┤
│ vec_chunks     │ 向量索引（语义搜索用）                  │
└────────────────┴────────────────────────────────────┘
```

**文本切分策略**：

```
一篇长文档
    │
    ▼ 切分
┌─────────┐  ┌─────────┐  ┌─────────┐
│ 块1      │  │ 块2      │  │ 块3      │
│ ~400 token│  │ ~400 token│  │ ~400 token│
│ (~1600字) │  │ (~1600字) │  │ (~1600字) │
└────┬────┘  └────┬────┘  └────┬────┘
     └──重叠80token──┘          │
          └──────重叠80token──────┘

为什么要重叠？
→ 防止一句话被切成两半后丢失上下文
→ 比如"张三是CEO"如果正好被切在"张三"和"是CEO"之间，
  重叠部分能保留完整信息
```

### 7.4 ⭐ 核心创新：压缩前记忆刷写

**这是 OpenClaw 记忆系统最精妙的设计。**

> 💡 **问题是什么？**
> AI 的"短期记忆"（上下文窗口）是有限的，比如 200K token ≈ 约15万字。
> 当对话太长超出限制时，旧消息必须被删掉。
> **但删掉就忘了！重要信息也跟着丢了！**

> 💡 **OpenClaw 的解决方案**：在删除旧消息之前，让 AI 先把重要信息"抄"到笔记本里。

```
长对话快要超限了...（已用 80% 的上下文窗口）
    │
    ▼
🔔 系统触发一个"静默回合"
    │
    ▼
系统对 AI 说：
  "⚠️ 你即将丢失上下文。现在把所有重要信息写入记忆文件。"
    │
    ▼
AI 开始提取关键信息：
  "用户说他要做一个相亲网站..."
  "我们讨论了匹配算法的设计..."
  "用户决定用 React + Node.js..."
  → 全部写入 memory/2026-02-28.md
    │
    ▼
旧消息被安全删除/压缩
    │
    ▼
后续每一轮对话，系统都会自动搜索记忆
  → "之前我们讨论过什么？" → 从记忆文件中找回！

✨ 结果：即使对话被截断，重要信息永远不会丢失！
```

**为什么这很厉害？**

| 传统AI | OpenClaw |
|--------|---------|
| 对话太长？删掉旧消息，永远失忆 | 删之前先"抄笔记"，永不失忆 |
| 重新开始对话？从零开始 | 自动搜索记忆，延续上下文 |
| 跨对话？完全不记得 | 通过持久记忆，跨对话记住一切 |

---

## 八、多模型调度：让合适的AI做合适的事

### 8.1 为什么不只用一个模型？

就像公司不会让 CEO 去扫地，也不会让保洁去做战略决策：

```
任务太简单 → 用便宜的小模型 → 省钱
任务很复杂 → 用强大的大模型 → 保质量
```

### 8.2 模型引用格式

```
provider/model-name

例如：
anthropic/claude-sonnet-4    ← Anthropic 的 Claude Sonnet 模型
openai/gpt-4o                ← OpenAI 的 GPT-4o 模型
google/gemini-2.5-pro        ← Google 的 Gemini Pro 模型
deepseek/deepseek-r1         ← DeepSeek 的推理模型
ollama/llama4                ← 本地运行的 Llama 模型（免费！）
```

### 8.3 多模型路由策略

```
                         用户消息进来
                              │
                              ▼
                    ┌─────────────────┐
                    │  这是什么任务？   │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
     ┌──────────┐    ┌──────────┐     ┌──────────┐
     │ 简单任务  │    │ 中等任务  │     │ 复杂任务  │
     │          │    │          │     │          │
     │ 日常闲聊 │    │ 代码编写  │     │ 架构设计  │
     │ 简单查询 │    │ 报告写作  │     │ 复杂推理  │
     │ 格式转换 │    │ 数据分析  │     │ 多步任务  │
     └────┬─────┘    └────┬─────┘     └────┬─────┘
          ▼               ▼               ▼
   ┌────────────┐ ┌──────────────┐ ┌─────────────┐
   │ Gemini     │ │ Claude Sonnet│ │ Claude Opus │
   │ Flash-Lite │ │ / GPT-4o    │ │ / GPT-5     │
   │            │ │              │ │             │
   │ $0.50/百万 │ │ ~$3/百万     │ │ ~$15/百万   │
   │ token      │ │ token       │ │ token       │
   └────────────┘ └──────────────┘ └─────────────┘
```

### 8.4 API Key 管理

```
OpenClaw 按优先级查找 API Key：

1. OPENCLAW_LIVE_ANTHROPIC_KEY    ← 最高优先级（生产环境专用）
2. ANTHROPIC_API_KEYS             ← 多个 key 用逗号分隔（自动轮换）
3. ANTHROPIC_API_KEY              ← 标准的单个 key

💡 多 key 轮换：
   key1,key2,key3 → 正常用 key1
   → key1 遇到速率限制？自动切换到 key2
   → key2 也限制了？自动切换到 key3
```

### 8.5 Fallback（后备）机制

```json
// 配置后备模型
{
  "models": {
    "default": "anthropic/claude-sonnet-4",
    "fallbacks": [
      "openai/gpt-4o",
      "google/gemini-2.5-pro"
    ]
  }
}
```

当主模型不可用时，自动按顺序尝试后备模型——用户无感知。

---

## 九、Skills 技能系统：即插即用的能力模块

### 9.1 什么是 Skill？

> 💡 **比喻**：如果工具（Tool）是管家的"双手"，那技能（Skill）就是管家的"培训手册"。

Skill 不是代码，而是**一个 Markdown 文件**，里面写着 AI 应该怎么做某件事。

```
~/.openclaw/skills/weather-reporter/SKILL.md

---
name: weather-reporter
description: 专业天气预报技能
triggers:
  - "天气"
  - "气温"
  - "下雨"
---

# 天气预报技能

当用户问天气时，你应该：
1. 使用 web_search 搜索该城市的天气预报
2. 提供今天和未来3天的天气
3. 包含温度、降水概率、穿衣建议
4. 如果有极端天气，特别提醒
```

**关键设计**：
- 技能是 **Markdown 文件**，不是代码——非程序员也能写！
- 放到 `skills/` 目录就自动生效，**不需要重启**
- AI 不会把所有技能都塞进提示词——只在**相关时才注入**，避免浪费 token

### 9.2 技能生态

| 指标 | 数据 |
|------|------|
| ClawHub 社区技能数 | 5,700+ |
| 技能格式 | YAML frontmatter + Markdown |
| 安装方式 | 放入 `skills/` 目录即可 |
| 安全提醒 | ⚠️ 约12%的社区技能被发现有恶意内容，请谨慎使用 |

### 9.3 AGENTS.md 和 SOUL.md

这两个文件定义了 AI 的"性格"和"行为规范"：

| 文件 | 作用 | 比喻 |
|------|------|------|
| **AGENTS.md** | 操作指令和行为规则 | 员工手册——管家应该怎么做事 |
| **SOUL.md** | 人格、语气、操作边界 | 性格设定——管家是什么性格的人 |
| **USER.md** | 用户身份和偏好 | 雇主档案——老板是什么样的人 |
| **IDENTITY.md** | Agent 名称、特征 | 身份证——管家叫什么名字 |

---

## 十、主动工作：心跳与定时任务

### 10.1 六种触发方式

普通 AI 只有你问它才回答。OpenClaw 有**六种触发方式**：

```
┌─────────────────────────────────────────────────┐
│                  OpenClaw 的六种触发源             │
├─────────────────────────────────────────────────┤
│                                                  │
│  ① 💬 聊天消息        ← 你主动找它（被动）         │
│                                                  │
│  ② 💓 心跳（Heartbeat）← 每30分钟自动检查（主动）   │
│                                                  │
│  ③ ⏰ Cron 定时任务    ← 在指定时间执行（主动）     │
│                                                  │
│  ④ 🪝 Hooks（钩子）   ← 某事件发生时触发           │
│                                                  │
│  ⑤ 🔗 Webhooks       ← 外部系统调用触发           │
│                                                  │
│  ⑥ 📨 Agent间消息     ← 其他Agent发来的消息        │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 10.2 心跳系统详解

> 💡 **比喻**：管家每30分钟"巡逻"一次，看看有没有需要处理的事。

```
心跳触发（每30分钟）
    │
    ▼
┌──────────────────────────────────────┐
│  第一步：廉价检查（不用 AI）            │
│                                       │
│  运行预设的检查脚本：                   │
│  - 有新邮件吗？                        │
│  - 日历有变更吗？                      │
│  - 监控的网站有变化吗？                 │
│  - 有新的告警吗？                      │
│                                       │
│  这些是确定性脚本，不花 AI 的钱          │
└──────────┬───────────────────────────┘
           │
     有变化？│
     ┌──────┴──────┐
     │             │
   ❌ 没有       ✅ 有
     │             │
     ▼             ▼
  什么都不做   ┌──────────────────────┐
              │ 第二步：调用AI分析      │
              │                       │
              │ 把变化内容发给AI：      │
              │ "有3封新邮件，1个告警"  │
              │ AI 决定是否需要通知你   │
              └───────────────────────┘

💰 省钱秘诀：只在有变化时才花 AI 的钱！
```

### 10.3 Cron 定时任务

```yaml
# 例子：每天早上 8 点发送今日简报
cron: "0 8 * * *"
task: |
  搜索今天的科技新闻，整理成简报发给我的 Telegram
```

---

## 十一、多 Agent 协作：从单兵到团队

### 11.1 为什么需要多个 Agent？

> 💡 **比喻**：一个人干活慢而且累。老板（你）→ 管家（主 Agent）→ 雇临时工（子 Agent）

```
你："帮我做一个网站"

这是一个大任务，需要：前端、后端、设计

主 Agent（管家）的做法：
  ├── spawn → Agent A（后端工程师）："用 Node.js 写 API"
  ├── spawn → Agent B（前端工程师）："用 React 写界面"
  └── spawn → Agent C（设计师）："用 Gemini 设计 UI"

三个子 Agent 同时干活，管家监督协调
→ 速度快3倍！
```

### 11.2 子 Agent 的特性

每个子 Agent 都是**独立的**：

| 特性 | 说明 |
|------|------|
| 独立工作空间 | 每个有自己的文件夹 |
| 独立工具权限 | 程序员能写代码，审查员只能读代码 |
| 独立 AI 模型 | 后端用 Codex，前端用 Claude，设计用 Gemini |
| 独立记忆 | 互不干扰 |
| 最小上下文 | 只给"完成任务所需的最少信息" |

### 11.3 Lobster 工作流引擎

OpenClaw 内置了一个**确定性工作流引擎**，核心理念是：

> **不要用 AI 做流程调度，AI 只做创造性工作。**

```
❌ 糟糕的做法：让 AI 自己决定下一步做什么
   → AI 可能走错路、进入死循环、跳过步骤

✅ OpenClaw 的做法：流程用 YAML 写死，AI 只负责执行每一步

# dev-pipeline.lobster（开发流水线）
steps:
  - 写代码:
      agent: codex
      → 写完后自动进入下一步

  - 代码审查:
      agent: reviewer
      loop.condition: 审查是否通过？
      maxIterations: 3    # 最多改3次
      → 通过才进入下一步

  - 跑测试:
      agent: tester
      → 全通过才进入下一步

  - 通知:
      channel: telegram
      → 告诉你结果
```

---

## 十二、安全模型：防护与风险

### 12.1 四层安全防护

```
┌──────────────────────────────────────────┐
│  Layer 1: 🌐 网络层                       │
│  默认只绑定 127.0.0.1（本机访问）           │
│  远程访问必须通过 SSH 隧道 / Tailscale      │
├──────────────────────────────────────────┤
│  Layer 2: 🔑 认证层                       │
│  Token/密码认证 + 设备配对机制              │
│  每个设备有独立权限范围                     │
├──────────────────────────────────────────┤
│  Layer 3: 📦 沙箱隔离                     │
│  Docker 容器隔离工具执行                    │
│  Gateway 留在宿主机，工具在容器里跑          │
├──────────────────────────────────────────┤
│  Layer 4: 🛡️ 工具权限                    │
│  五级权限控制（全局→Provider→Agent→沙箱→管理员）│
│  拒绝列表永远优先                           │
└──────────────────────────────────────────┘
```

### 12.2 ⚠️ 已知安全风险（必须知道）

| 风险 | 说明 | 建议 |
|------|------|------|
| 🔴 **沙箱默认关闭** | 工具直接在你电脑上执行，没有隔离 | 开启 Docker 沙箱模式 |
| 🔴 **CVE-2026-25253** | 严重远程代码执行漏洞（CVSS 8.8） | 及时更新到最新版 |
| 🔴 **13.5万实例暴露** | 有人把 Gateway 暴露到公网 | 永远不要把端口暴露到公网 |
| 🟠 **API Key 明文存储** | 配置文件中密钥未加密 | 使用环境变量或密钥管理工具 |
| 🟠 **社区技能恶意代码** | ~12%的ClawHub技能被发现有恶意 | 只使用信任的技能来源 |
| 🟡 **Agent "失控"** | Meta AI安全专家的Agent删除了200封邮件 | 设置权限白名单，限制危险操作 |

---

## 十三、真实案例：别人怎么用的

### 案例1：Elvis Sun 的"一人开发团队"

> 一个人 + OpenClaw = 日均 50 次 commit，30分钟内 7 个 PR

**架构**：

```
Elvis（人类）
    │ 开客户会议、做产品决策
    ▼
Zoe（编排 Agent，运行在 OpenClaw 上）
    │ 理解需求、拆解任务、选模型、写Prompt
    ├── Codex Agent（90%任务：后端、复杂Bug）
    ├── Claude Code Agent（前端、Git操作）
    └── Gemini Agent（UI设计）

成本：每月仅 $190（Claude $100 + Codex $90）
```

**关键创新**：编排层持有"业务上下文"（客户需求、公司信息），执行层只拿到"完成任务所需的最小代码上下文"。两层各自发挥最大效能。

### 案例2：Nat Eliason 的 Felix Bot

> 给 AI 管家 $1000，3周赚回 $14,718

用 OpenClaw 构建了一个自动化业务助手，能处理客户沟通、内容创作、日程管理。

### 案例3：25分钟交付 SaaS 着陆页

> 传统自由职业者：$500-2000 + 1-2周。OpenClaw 多Agent：25分钟 + $2。

Lead Agent 分解任务 → Coding Agent 编写代码 → Review Agent 验证质量 → Deploy Agent 部署上线。

---

## 十四、与竞品对比

### 14.1 对比矩阵

| 维度 | 🦞 OpenClaw | 💻 Claude Code | 🖱️ Cursor | 🤖 Devin AI |
|------|------------|---------------|-----------|------------|
| **是什么** | 通用 AI 管家 | 终端编程助手 | IDE 编程助手 | 自治软件工程师 |
| **运行位置** | 你的电脑（本地） | 终端/CLI | VS Code 编辑器 | 云端 |
| **价格** | 免费 + API 成本 | $0-20/月 | $20-200/月 | $500+/月 |
| **消息平台** | 50+（WhatsApp/Telegram/Slack等） | 终端 | IDE | Web IDE |
| **记忆** | ⭐ 跨会话持久化（最强） | 会话级（关了就忘） | 项目级 | 项目级 |
| **主动工作** | ✅ 心跳+Cron | ❌ 被动 | ❌ 被动 | 部分 |
| **多模型** | ✅ 任意切换 | ❌ 仅Claude | 多模型 | ❌ 固定 |
| **非编程任务** | ✅ 通用 | ❌ 仅编程 | ❌ 仅编程 | ❌ 仅编程 |
| **安全性** | ⚠️ 弱（沙箱默认关） | ✅ 强 | ✅ 强 | ✅ 云端沙箱 |
| **适合谁** | 想要AI全能管家的人 | 需要编程助手的开发者 | IDE用户 | 企业工程团队 |

### 14.2 怎么选？

```
你的需求是什么？
  │
  ├── 我想要一个"万能管家"，帮我处理各种事
  │     → 🦞 OpenClaw
  │
  ├── 我是开发者，需要编程助手
  │     ├── 喜欢终端操作 → 💻 Claude Code
  │     └── 喜欢IDE操作  → 🖱️ Cursor
  │
  ├── 我想要AI替我完整地写程序
  │     → 🤖 Devin AI（但很贵）
  │
  ├── 我是"一人公司"，想要AI开发团队
  │     → 🦞 OpenClaw + Claude Code + Codex（Elvis模式）
  │
  └── 我不想写代码，想要自动化工作流
        → n8n / Zapier
```

---

## 十五、关键术语速查表

| 术语 | 解释 |
|------|------|
| **Gateway** | OpenClaw 的核心控制中心，所有消息都经过它 |
| **Channel** | 消息平台适配器（Telegram/Slack 等） |
| **Provider** | AI 模型提供商（Anthropic/OpenAI/Google 等） |
| **Agent** | 一个有特定角色和配置的 AI 实例 |
| **Session** | 一次对话会话，有独立的历史和状态 |
| **Tool** | AI 能调用的外部功能（搜索/文件/浏览器等） |
| **Skill** | 用 Markdown 写的能力模块，告诉 AI 怎么做某事 |
| **MEMORY.md** | 持久记忆文件，存储长期重要信息 |
| **AGENTS.md** | 行为规则文件，定义 AI 的操作指令 |
| **SOUL.md** | 人格设定文件，定义 AI 的性格和边界 |
| **StandardMessage** | 统一消息格式，屏蔽平台差异 |
| **JSONL** | JSON Lines，每行一个JSON对象的文件格式 |
| **Heartbeat** | 心跳机制，AI 定时自动检查是否有事要做 |
| **Cron** | 定时任务调度器 |
| **CDP** | Chrome DevTools Protocol，控制浏览器的接口 |
| **MCP** | Model Context Protocol，AI 连接工具的标准协议 |
| **sqlite-vec** | SQLite 的向量搜索扩展 |
| **BM25** | 经典的关键词搜索排名算法 |
| **MMR** | 最大边际相关性，平衡搜索结果的相关性和多样性 |
| **Lobster** | OpenClaw 的确定性工作流引擎 |
| **Function Calling** | AI 请求调用外部工具的机制 |
| **Embedding** | 文本向量化，把文字转成数字以计算相似度 |
| **Context Window** | AI 一次能处理的最大文本量 |
| **RAG** | 检索增强生成，先搜索知识库再回答 |

---

## 参考资料

### 官方资源

1. [OpenClaw GitHub 仓库](https://github.com/openclaw/openclaw)
2. [OpenClaw 官方文档](https://docs.openclaw.ai/)
3. [OpenClaw AGENTS.md 模板](https://docs.openclaw.ai/reference/templates/AGENTS)
4. [OpenClaw 记忆系统文档](https://docs.openclaw.ai/concepts/memory)
5. [OpenClaw 模型 Provider 文档](https://docs.openclaw.ai/concepts/model-providers)
6. [OpenClaw Agent Runtime 文档](https://docs.openclaw.ai/concepts/agent)
7. [OpenClaw 浏览器工具文档](https://docs.openclaw.ai/tools/browser)

### 技术深度分析

8. [OpenClaw Architecture, Explained - Substack](https://ppaolo.substack.com/p/openclaw-system-architecture-overview)
9. [Deep Dive into OpenClaw Architecture - EastonDev](https://eastondev.com/blog/en/posts/ai/20260205-openclaw-architecture-guide/)
10. [OpenClaw Memory System Deep Dive - GitBook](https://snowan.gitbook.io/study-notes/ai-blogs/openclaw-memory-system-deep-dive)
11. [Local-First RAG: Using SQLite for AI Agent Memory - PingCAP](https://www.pingcap.com/blog/local-first-rag-using-sqlite-ai-agent-memory-openclaw/)
12. [How OpenClaw Works - Bibek Poudel (Medium)](https://bibek-poudel.medium.com/how-openclaw-works-understanding-ai-agents-through-a-real-architecture-5d59cc7a4764)
13. [Inside OpenClaw: How a Persistent AI Agent Works - DEV](https://dev.to/entelligenceai/inside-openclaw-how-a-persistent-ai-agent-actually-works-1mnk)
14. [OpenClaw High-Reliability Architecture Guide - Vertu](https://vertu.com/ai-tools/openclaw-clawdbot-architecture-engineering-reliable-and-controllable-ai-agents/)

### 工具与技能

15. [OpenClaw Tools & Skills - DeepWiki](https://deepwiki.com/openclaw/openclaw/6-tools-and-skills)
16. [OpenClaw 25 Tools + 53 Skills 指南](https://yu-wenhao.com/en/blog/openclaw-tools-skills-tutorial/)
17. [Proactive Agent Skill](https://github.com/openclaw/skills/blob/main/skills/halthelobster/proactive-agent/SKILL.md)
18. [Cron Mastery Skill](https://github.com/openclaw/skills/blob/main/skills/i-mw/cron-mastery/SKILL.md)

### 多模型与配置

19. [Multi-model Routing Guide - VelvetShark](https://velvetshark.com/openclaw-multi-model-routing)
20. [OpenRouter + OpenClaw Integration](https://openrouter.ai/docs/guides/guides/openclaw-integration)
21. [Custom Model Configuration Guide](https://blog.laozhang.ai/en/posts/openclaw-custom-model)
22. [Configuration File Structure - DeepWiki](https://deepwiki.com/openclaw/openclaw/4.1-configuration-file-structure)

### 竞品对比

23. [OpenClaw vs Cursor vs Claude Code vs Windsurf - SkyWork](https://skywork.ai/blog/ai-agent/openclaw-vs-cursor-claude-code-windsurf-comparison/)
24. [OpenClaw vs Claude Code - DataCamp](https://www.datacamp.com/blog/openclaw-vs-claude-code)
25. [OpenClaw vs Claude Code - ClaudeFast](https://claudefa.st/blog/tools/extensions/openclaw-vs-claude-code)

### 安全

26. [Running OpenClaw Safely - Microsoft Security Blog](https://www.microsoft.com/en-us/security/blog/2026/02/19/running-openclaw-safely-identity-isolation-runtime-risk/)
27. [OpenClaw Goes Rogue - SF Standard](https://sfstandard.com/2026/02/25/openclaw-goes-rogue/)
28. [OpenClaw Security Comparison - TheWorldMag](https://theworldmag.com/en/openclaw-vs-claude-code-2026-security-features-guide/)

### 案例

29. [OpenClaw Masterclass - HelloPM](https://hellopm.co/openclaw-ai-agent-masterclass/)
30. [Build a Business That Runs Itself - Nat Eliason](https://creatoreconomy.so/p/use-openclaw-to-build-a-business-that-runs-itself-nat-eliason)
31. [ClawWork: OpenClaw as AI Coworker - HKUDS](https://github.com/HKUDS/ClawWork)
32. [AI Dev Team Pipeline - LobsterLair](https://lobsterlair.xyz/blog/ai-dev-team-openclaw)

### 入门教程

33. [What Is OpenClaw - Milvus Complete Guide](https://milvus.io/blog/openclaw-formerly-clawdbot-moltbot-explained-a-complete-guide-to-the-autonomous-ai-agent.md)
34. [What is OpenClaw - DigitalOcean](https://www.digitalocean.com/resources/articles/what-is-openclaw)
35. [Unleashing OpenClaw - DEV Community](https://dev.to/mechcloud_academy/unleashing-openclaw-the-ultimate-guide-to-local-ai-agents-for-developers-in-2026-3k0h)
36. [OpenClaw Wikipedia](https://en.wikipedia.org/wiki/OpenClaw)
37. [You Could've Invented OpenClaw - Nader Dabit (GitHub Gist)](https://gist.github.com/dabit3/bc60d3bea0b02927995cd9bf53c3db32)
38. [保姆级安装教程（腾讯云）](https://cloud.tencent.com/developer/article/2626160)

---

> 📌 **最后总结一句话**：OpenClaw 就是一个**本地运行的、有记忆的、能用工具的、能主动干活的 AI 管家**。它的核心创新在于**三层记忆 + 压缩前刷写 + 多模型调度 + 确定性编排**。理解了这四点，你就理解了 OpenClaw 80% 的技术本质。
>
> 🔗 进阶阅读：[[docs/OpenClaw 完整技术架构与应用详解.md]]（更偏技术的版本）
>
> 🔗 视频攻略：[[docs/OpenClaw-视频攻略-赋范课堂28集.md]]（28集完整攻略）
>
> 🔗 动手实战：[[docs/OpenClaw-开发笔记-MiniOpenClaw与HR实战.md]]（Mini OpenClaw + HR Agent 开发笔记）