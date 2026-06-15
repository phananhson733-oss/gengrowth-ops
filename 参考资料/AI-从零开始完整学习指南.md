---
title: AI 从零开始完整学习指南
date: 2026-02-28
updated: 2026-03-03
type: reference
tags:
  - AI
  - 学习路径
  - 机器学习
  - 深度学习
  - LLM
  - AI-Agent
aliases:
  - AI学习指南
  - 人工智能学习路径
description: 从零基础到 AI 全栈的完整学习路线图，涵盖数学基础、编程、机器学习、深度学习、LLM、生成式 AI、AI Agent、工程化部署等全部领域
---

# AI 从零开始完整学习指南

> [!abstract] 指南概览
> 本指南为零基础学习者设计，涵盖 AI 全部核心领域。按照「基础 → 核心 → 进阶 → 前沿 → 工程化」五阶段递进，预计 12-18 个月完成从入门到能独立开发 AI 应用的全部学习。

---

## 目录

1. [AI 全景地图](#1-ai-全景地图)
2. [学前准备](#2-学前准备)
3. [阶段一：数学基础](#3-阶段一数学基础80-120-小时)
4. [阶段二：Python 编程](#4-阶段二python-编程60-100-小时)
5. [阶段三：机器学习](#5-阶段三机器学习120-180-小时)
6. [阶段四：深度学习](#6-阶段四深度学习120-180-小时)
7. [阶段五：自然语言处理 NLP](#7-阶段五自然语言处理-nlp80-120-小时)
8. [阶段六：计算机视觉 CV](#8-阶段六计算机视觉-cv80-120-小时)
9. [阶段七：大语言模型 LLM](#9-阶段七大语言模型-llm100-150-小时)
10. [阶段八：生成式 AI 应用](#10-阶段八生成式-ai-应用80-120-小时)
11. [阶段九：AI Agent 自主智能体](#11-阶段九ai-agent-自主智能体80-120-小时)
12. [阶段十：AI 工程化与部署](#12-阶段十ai-工程化与部署60-100-小时)
13. [阶段十一：AI 伦理与安全](#13-阶段十一ai-伦理与安全20-40-小时)
14. [12 个月学习路线图](#14-12-个月学习路线图)
15. [分方向专精路线](#15-分方向专精路线)
16. [推荐资源汇总](#16-推荐资源汇总)
17. [参考链接](#17-参考链接)

---

## 1. AI 全景地图

> [!abstract] 本节摘要
> 理解 AI 的全貌——它不是单一技术，而是一棵庞大的技术树。先看清全景，再选择路径。

### 1.1 什么是人工智能？

**人工智能（Artificial Intelligence, AI）** 是计算机科学的一个分支，目标是创建能够模拟人类智能行为的系统——包括学习、推理、感知、决策和语言理解。

用一个比喻：

```
人类智能                          人工智能
├── 看（视觉）          →        计算机视觉 (CV)
├── 听（听觉）          →        语音识别 (ASR)
├── 说（语言）          →        自然语言处理 (NLP)
├── 想（推理）          →        机器学习 / 深度学习
├── 记（记忆）          →        知识图谱 / 向量数据库
├── 做（行动）          →        机器人 / AI Agent
└── 创（创造）          →        生成式 AI (GenAI)
```

### 1.2 AI 技术树全景

```
人工智能 (AI)
│
├── 🧮 机器学习 (Machine Learning)
│   ├── 监督学习 (Supervised Learning)
│   │   ├── 回归 (Regression)
│   │   └── 分类 (Classification)
│   ├── 无监督学习 (Unsupervised Learning)
│   │   ├── 聚类 (Clustering)
│   │   └── 降维 (Dimensionality Reduction)
│   ├── 强化学习 (Reinforcement Learning)
│   └── 半监督学习 / 自监督学习
│
├── 🧠 深度学习 (Deep Learning)
│   ├── CNN — 卷积神经网络（图像）
│   ├── RNN / LSTM — 循环神经网络（序列）
│   ├── Transformer — 注意力机制（万物基石）
│   ├── GAN — 生成对抗网络
│   ├── Diffusion — 扩散模型（图像生成）
│   └── Mamba / SSM — 状态空间模型
│
├── 💬 自然语言处理 (NLP)
│   ├── 文本分类 / 情感分析
│   ├── 机器翻译
│   ├── 问答系统
│   ├── 文本生成
│   └── 大语言模型 (LLM)
│       ├── GPT 系列 (OpenAI)
│       ├── Claude 系列 (Anthropic)
│       ├── Gemini 系列 (Google)
│       ├── Llama 系列 (Meta)
│       └── DeepSeek / Qwen (中国)
│
├── 👁 计算机视觉 (CV)
│   ├── 图像分类
│   ├── 目标检测 (YOLO, DETR)
│   ├── 语义分割
│   ├── 图像生成 (Stable Diffusion, DALL-E)
│   └── 多模态视觉 (GPT-4V, Gemini)
│
├── 🤖 AI Agent（自主智能体）
│   ├── 工具调用 (Function Calling)
│   ├── 记忆系统 (Memory)
│   ├── 多 Agent 协作
│   └── 编排框架 (LangChain, CrewAI)
│
├── 🔧 AI 工程 (AI Engineering)
│   ├── MLOps / LLMOps
│   ├── 模型部署与推理优化
│   ├── RAG 系统
│   └── 向量数据库
│
└── ⚖️ AI 安全与伦理
    ├── AI 对齐 (Alignment)
    ├── 可解释性 (Interpretability)
    ├── 公平性与偏见
    └── AI 治理与法规
```

### 1.3 AI 发展简史

| 年代 | 里程碑 | 意义 |
|------|--------|------|
| 1950 | 图灵测试提出 | AI 概念诞生 |
| 1956 | 达特茅斯会议 | "人工智能"一词正式提出 |
| 1997 | 深蓝击败卡斯帕罗夫 | AI 在特定领域超越人类 |
| 2012 | AlexNet 赢得 ImageNet | 深度学习革命开始 |
| 2016 | AlphaGo 击败李世石 | 深度强化学习震惊世界 |
| 2017 | Transformer 论文发表 | "Attention is All You Need" — 一切的基石 |
| 2020 | GPT-3 发布 | 大语言模型展现涌现能力 |
| 2022 | ChatGPT 发布 | AI 走入大众视野，改变世界 |
| 2023 | GPT-4 / Claude 2 | 多模态、长上下文、更强推理 |
| 2024 | Claude 3.5 / GPT-4o / Gemini 1.5 | AI Agent 元年、开源模型崛起 |
| 2025 | Claude 4 / DeepSeek-R1 / Gemini 2.5 | 推理模型、AI 编程、Agent 编排 |
| 2026 | 当前 | Agentic AI、多模态融合、AI 工程化 |

---

## 2. 学前准备

> [!abstract] 本节摘要
> 开始学 AI 之前，你只需要准备三样东西：一台电脑、好奇心、和基础的高中数学。

### 2.1 你需要什么基础？

| 领域 | 最低要求 | 理想起点 |
|------|---------|---------|
| 数学 | 高中数学（函数、方程） | 大学高数/线代/概率论 |
| 编程 | 完全零基础也可以 | 任意语言编程经验 |
| 英语 | 能借助翻译工具阅读 | 能阅读英文技术文档 |
| 硬件 | 任意电脑 | 有独立 GPU 的电脑（NVIDIA） |

> [!tip] 别被数学吓到
> AI 学习中的数学不需要你成为数学家。你需要的是**理解直觉**而非推导证明。很多优秀的 AI 从业者都是边学边补数学。

### 2.2 环境搭建

**必装工具清单：**

```
基础工具
├── Python 3.10+          → python.org 或 Anaconda
├── VS Code / Cursor      → 代码编辑器
├── Jupyter Notebook       → 交互式编程环境
├── Git                    → 版本控制
└── Terminal               → 命令行工具

Python 核心库
├── NumPy                  → 数值计算
├── Pandas                 → 数据处理
├── Matplotlib / Seaborn   → 数据可视化
├── Scikit-learn           → 机器学习
├── PyTorch                → 深度学习（推荐）
└── Hugging Face           → 预训练模型
```

### 2.3 学习方法论

> [!tip] AI 学习的黄金法则
> **理论 30% + 实践 70%**
>
> 1. **先跑通再理解**：先让代码跑起来，看到结果，再回头理解原理
> 2. **项目驱动学习**：每学完一个概念就做一个小项目
> 3. **费曼学习法**：用自己的话把学到的概念讲给别人听
> 4. **循环迭代**：每个主题学两遍——第一遍建立直觉，第二遍深入细节

---

## 3. 阶段一：数学基础（80-120 小时）

> [!abstract] 本节摘要
> AI 的数学不需要你当数学家，但需要你理解三大支柱：线性代数（数据的语言）、概率统计（不确定性的语言）、微积分（优化的语言）。

### 3.1 线性代数 — 数据的语言

**为什么重要？** AI 中的所有数据都以向量和矩阵形式存在。图片是像素矩阵，文本是词向量，模型参数是权重矩阵。

**核心概念：**

| 概念 | 生活比喻 | AI 中的作用 |
|------|---------|-----------|
| 向量 (Vector) | 箭头 — 有方向有大小 | 表示一个数据点（如一个词的含义） |
| 矩阵 (Matrix) | 电子表格 — 行列数据 | 存储数据集、模型权重 |
| 矩阵乘法 | 数据变换器 | 神经网络的核心操作 |
| 特征值/特征向量 | 数据的"主旋律" | PCA 降维、数据压缩 |
| 奇异值分解 SVD | 数据的"骨架" | 推荐系统、数据压缩 |

**推荐资源：**
- 📺 [3Blue1Brown《线性代数的本质》](https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab) — 最佳可视化入门（有 B 站中文字幕版）
- 📖 《Linear Algebra Done Right》— Sheldon Axler
- 🎓 [MIT 18.06 线性代数](https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/) — Gilbert Strang 教授经典课程

### 3.2 概率与统计 — 不确定性的语言

**为什么重要？** AI 本质上是在不确定性中做决策。分类器输出的是概率，语言模型生成的是概率分布上的采样。

**核心概念：**

| 概念 | 生活比喻 | AI 中的作用 |
|------|---------|-----------|
| 概率 | 天气预报说"70% 下雨" | 模型输出的置信度 |
| 条件概率 | "已知阴天，下雨概率？" | 贝叶斯推理、分类 |
| 贝叶斯定理 | 根据新证据更新判断 | 朴素贝叶斯、后验推理 |
| 正态分布 | 身高分布的钟形曲线 | 数据建模、初始化权重 |
| 最大似然估计 MLE | "哪个参数最能解释数据？" | 模型训练的核心思想 |
| 期望与方差 | 平均值与波动程度 | 评估模型表现 |

**推荐资源：**
- 📺 [Khan Academy 概率统计](https://www.khanacademy.org/math/statistics-probability) — 从零开始
- 📺 [StatQuest](https://www.youtube.com/c/joshstarmer) — 用简单动画讲统计（强烈推荐）
- 📖 《统计学习方法》— 李航（中文经典）

### 3.3 微积分 — 优化的语言

**为什么重要？** 神经网络通过**梯度下降**来学习——这就是微积分。求导告诉模型"往哪个方向调整参数能减少错误"。

**核心概念：**

| 概念 | 生活比喻 | AI 中的作用 |
|------|---------|-----------|
| 导数 | 汽车速度表 — 变化的速率 | 梯度：损失函数变化方向 |
| 偏导数 | 多个旋钮同时调 | 多参数模型的优化 |
| 链式法则 | 多米诺骨牌效应 | 反向传播算法的数学基础 |
| 梯度下降 | 闭着眼睛下山 | 模型训练的核心优化算法 |
| 损失函数 | 考试评分标准 | 衡量模型预测与真实值的差距 |

**推荐资源：**
- 📺 [3Blue1Brown《微积分的本质》](https://www.youtube.com/playlist?list=PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr)
- 🎓 [DeepLearning.AI《Mathematics for ML》](https://www.coursera.org/specializations/mathematics-for-machine-learning-and-data-science) — 专为 ML 设计的数学课

> [!info] 数学学习策略
> **不要试图先学完所有数学再开始 AI。** 建议用 4-6 周快速过一遍核心概念，建立直觉即可。遇到不懂的数学再回来补。很多概念在实践中会自然理解。

---

## 4. 阶段二：Python 编程（60-100 小时）

> [!abstract] 本节摘要
> Python 是 AI 领域的"官方语言"。你不需要成为编程专家，但需要熟练掌握数据处理和基本编程思维。

### 4.1 Python 基础语法

**学习清单（2-3 周）：**

```python
# 核心语法
├── 变量、数据类型（int, float, str, list, dict, tuple, set）
├── 条件语句（if/elif/else）
├── 循环（for, while）
├── 函数定义（def, lambda, *args, **kwargs）
├── 类与面向对象（class, __init__, 继承）
├── 文件读写（open, with, json, csv）
├── 异常处理（try/except/finally）
├── 列表推导式 [x for x in range(10)]
└── 模块与包（import, pip install）
```

**推荐资源：**
- 📺 [Python for Everybody（密歇根大学 Coursera）](https://www.coursera.org/specializations/python) — 完全零基础
- 📺 B 站搜索"Python 零基础入门" — 大量中文教程
- 🎮 [Codecademy Python](https://www.codecademy.com/learn/learn-python-3) — 交互式练习

### 4.2 数据科学三剑客

**NumPy — 数值计算引擎（1 周）：**

```python
import numpy as np

# 创建数组
a = np.array([1, 2, 3, 4, 5])
matrix = np.random.randn(3, 4)  # 3×4 随机矩阵

# 核心操作
matrix.shape          # 形状
matrix.T              # 转置
np.dot(a, b)          # 矩阵乘法
matrix.mean(axis=0)   # 按列求均值
```

**Pandas — 数据处理（1 周）：**

```python
import pandas as pd

# 读取数据
df = pd.read_csv('data.csv')

# 核心操作
df.head()              # 查看前5行
df.describe()          # 统计摘要
df['column'].value_counts()  # 计数
df.groupby('category').mean()  # 分组聚合
df.dropna()            # 处理缺失值
```

**Matplotlib — 数据可视化（3 天）：**

```python
import matplotlib.pyplot as plt

# 基础绑图
plt.figure(figsize=(10, 6))
plt.plot(x, y, label='数据')
plt.xlabel('X轴'); plt.ylabel('Y轴')
plt.title('标题'); plt.legend()
plt.show()
```

### 4.3 第一个实战项目

> [!tip] 🎯 练手项目：泰坦尼克号生存预测
> 使用 Kaggle 的 [Titanic 数据集](https://www.kaggle.com/c/titanic)，完成以下步骤：
> 1. 用 Pandas 加载和探索数据
> 2. 用 Matplotlib 可视化乘客特征
> 3. 用 Scikit-learn 训练一个简单分类器
> 4. 提交预测结果到 Kaggle

---

## 5. 阶段三：机器学习（120-180 小时）

> [!abstract] 本节摘要
> 机器学习是 AI 的核心——让机器从数据中"学习"规律，而不是手动编写规则。这是整条路径中最重要的基础阶段。

### 5.1 核心概念

```
机器学习核心循环
┌──────────────────────────────────────┐
│  数据 → 特征工程 → 模型训练 → 评估   │
│    ↑                         │      │
│    └─────── 调优迭代 ────────┘      │
└──────────────────────────────────────┘
```

**三大学习范式：**

| 类型 | 比喻 | 例子 |
|------|------|------|
| **监督学习** | 有老师批改的作业 | 给模型"图片+标签"，学会识别猫狗 |
| **无监督学习** | 自己找规律 | 给模型一堆客户数据，自动分群 |
| **强化学习** | 试错学习 | AI 打游戏，通过奖惩学会策略 |

### 5.2 核心算法清单

**监督学习（必学）：**

| 算法 | 类型 | 直觉理解 | 应用场景 |
|------|------|---------|---------|
| 线性回归 | 回归 | 画一条最佳拟合直线 | 房价预测、销量预测 |
| 逻辑回归 | 分类 | 用 S 曲线做二选一 | 垃圾邮件检测、是否点击 |
| 决策树 | 分类/回归 | 像流程图一样做决定 | 客户分群、风控 |
| 随机森林 | 集成学习 | 很多决策树投票 | 竞赛常胜将军 |
| XGBoost | 集成学习 | 一棵接一棵纠错 | Kaggle 竞赛利器 |
| SVM | 分类 | 找到最佳分割线 | 文本分类、图像识别 |
| KNN | 分类 | 找最近的邻居 | 推荐系统 |

**无监督学习（了解）：**

| 算法 | 直觉理解 | 应用场景 |
|------|---------|---------|
| K-Means | 把数据分成 K 堆 | 客户分群、图像压缩 |
| PCA | 找到数据的主要方向 | 降维、特征提取 |
| DBSCAN | 按密度发现群体 | 异常检测 |

### 5.3 模型评估与调优

**关键指标：**

```
分类问题
├── 准确率 (Accuracy) — 整体做对了多少
├── 精确率 (Precision) — 说"是"的里面有多少真是
├── 召回率 (Recall) — 所有真"是"里面找到了多少
├── F1 Score — 精确率和召回率的平衡
└── AUC-ROC — 模型区分能力的综合指标

回归问题
├── MSE / RMSE — 预测值与真实值的平均误差
├── MAE — 平均绝对误差
└── R² — 模型解释了多少数据变化
```

**防止过拟合：**
- **交叉验证 (Cross Validation)**：把数据分成多份轮流验证
- **正则化 (Regularization)**：惩罚过于复杂的模型（L1/L2）
- **特征选择**：只用最重要的特征

### 5.4 推荐资源

- 🎓 **[吴恩达《机器学习专项课程》](https://www.coursera.org/specializations/machine-learning-introduction)** — Stanford × DeepLearning.AI，**最经典入门课**（可免费旁听）
- 📖 **《机器学习》周志华** — 中文领域的"西瓜书"，理论扎实
- 📖 **《Hands-On Machine Learning》** — Aurélien Géron，实战导向
- 📺 **[StatQuest Machine Learning](https://www.youtube.com/playlist?list=PLblh5JKOoLUICTaGLRoHQDuF_7q2GfuJF)** — 最通俗易懂的讲解
- 📺 **B 站 李宏毅《机器学习》** — 台大教授，中文讲解，深入浅出
- 🎮 **[Kaggle Learn](https://www.kaggle.com/learn)** — 免费交互式课程 + 实战竞赛

### 5.5 实战项目

| 项目 | 难度 | 学到什么 |
|------|------|---------|
| 🏠 房价预测（Kaggle） | ⭐ | 回归、特征工程 |
| 🖼 手写数字识别（MNIST） | ⭐⭐ | 分类、数据预处理 |
| 💳 信用卡欺诈检测 | ⭐⭐ | 不平衡数据、异常检测 |
| 🛒 电商推荐系统 | ⭐⭐⭐ | 协同过滤、矩阵分解 |

---

## 6. 阶段四：深度学习（120-180 小时）

> [!abstract] 本节摘要
> 深度学习是让 AI 从"能用"到"惊人"的关键跳跃。它通过多层神经网络自动学习数据的层次化表征。当代最强大的 AI 系统（ChatGPT、Midjourney、AlphaFold）都建立在深度学习之上。

### 6.1 神经网络基础

**一个神经元 = 一个简单的决策者：**

```
输入 x₁ ──→ ┌─────────┐
输入 x₂ ──→ │ 加权求和 │ → 激活函数 → 输出
输入 x₃ ──→ │ + 偏置   │
             └─────────┘
              w₁x₁ + w₂x₂ + w₃x₃ + b → σ(z) → ŷ
```

**核心概念进阶：**

| 概念 | 作用 | 比喻 |
|------|------|------|
| 前向传播 | 输入→输出的计算过程 | 考试做题 |
| 损失函数 | 衡量预测与答案的差距 | 考试评分 |
| 反向传播 | 计算每个参数的梯度 | 找出哪些知识点不足 |
| 梯度下降 | 更新参数减少损失 | 针对薄弱点复习 |
| 学习率 | 参数更新的步长 | 复习的力度 |
| Batch Size | 每次看多少数据更新一次 | 做几道题复习一次 |
| Epoch | 看完全部数据一遍 | 刷完整套试卷一遍 |

### 6.2 核心网络架构

```
深度学习架构族谱

🏗 基础架构
├── MLP (多层感知机) — 最基础的全连接网络
├── CNN (卷积神经网络) — 图像之王 👁
│   ├── LeNet → AlexNet → VGG → ResNet → EfficientNet
│   └── 核心：卷积层 + 池化层 + 全连接层
├── RNN (循环神经网络) — 序列处理 📝
│   ├── Vanilla RNN → LSTM → GRU
│   └── 核心：隐藏状态在时间步之间传递
└── Transformer ⭐ — 当代万物基石 🌟
    ├── 核心：自注意力机制 (Self-Attention)
    ├── Encoder-only: BERT（理解）
    ├── Decoder-only: GPT（生成）
    └── Encoder-Decoder: T5（翻译/摘要）

🎨 生成式架构
├── GAN (生成对抗网络) — 生成器 vs 判别器
├── VAE (变分自编码器) — 潜空间学习
└── Diffusion (扩散模型) — 从噪声中恢复图像
```

### 6.3 Transformer 深入理解

> [!info] 为什么 Transformer 如此重要？
> 2017 年 Google 发表的 "Attention is All You Need" 论文开启了 AI 新纪元。ChatGPT、Claude、Gemini、Stable Diffusion、Whisper…… **几乎所有当代顶级 AI 模型都基于 Transformer 架构**。

**Transformer 核心组件：**

```
Transformer 架构
┌──────────────────────────────────────┐
│  输入 Token → 嵌入 (Embedding)       │
│       ↓                              │
│  位置编码 (Positional Encoding)       │
│       ↓                              │
│  ┌─ 多头自注意力 (Multi-Head Attention)│
│  │   "每个词看看其他所有词"            │
│  │   Q(Query) × K(Key) → 注意力权重   │
│  │   注意力权重 × V(Value) → 输出      │
│  └─→ 残差连接 + 层归一化              │
│       ↓                              │
│  ┌─ 前馈网络 (FFN)                    │
│  └─→ 残差连接 + 层归一化              │
│       ↓                              │
│  重复 N 层（GPT-4 约 120 层）          │
│       ↓                              │
│  输出概率分布 → 预测下一个 Token       │
└──────────────────────────────────────┘
```

### 6.4 框架选择：PyTorch vs TensorFlow

| 特性 | PyTorch 🔥（推荐） | TensorFlow |
|------|-------------------|------------|
| 学习曲线 | 更直观，Python 风格 | 较陡，概念多 |
| 学术界 | 主流（90%+ 论文） | 少用 |
| 工业界 | 快速增长 | 仍有大量使用 |
| 调试 | 即时执行，易调试 | 计算图模式 |
| 生态 | Hugging Face 深度集成 | TF Serving 部署方便 |

> [!tip] 建议
> **2026 年推荐选择 PyTorch**。学术界几乎全部使用 PyTorch，Hugging Face 生态与 PyTorch 深度绑定，上手更容易。

### 6.5 推荐资源

- 🎓 **[吴恩达《深度学习专项课程》](https://www.coursera.org/specializations/deep-learning)** — DeepLearning.AI 出品，5 门课系统讲解（可免费旁听）
- 📖 **《动手学深度学习》(d2l.ai)** — 李沐著，全球 500+ 大学教材，[在线免费阅读](https://d2l.ai/)
- 📺 **[3Blue1Brown《神经网络》](https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi)** — 可视化理解
- 📺 **[李沐 B 站《动手学深度学习》](https://space.bilibili.com/1567748478)** — 中文讲解 + 代码实战
- 📺 **[Andrej Karpathy](https://www.youtube.com/c/AndrejKarpathy)** — 前 OpenAI/Tesla AI 总监的教程
- 🎓 **[Fast.ai](https://www.fast.ai/)** — "从上到下"的实践派教学

### 6.6 实战项目

| 项目 | 难度 | 学到什么 |
|------|------|---------|
| 🔢 从零实现神经网络（纯 NumPy） | ⭐⭐ | 反向传播的真正理解 |
| 🐱 图像分类（CIFAR-10） | ⭐⭐ | CNN、数据增强 |
| 📝 文本情感分析 | ⭐⭐ | RNN/LSTM、词嵌入 |
| 🎨 手写数字生成（GAN） | ⭐⭐⭐ | 生成式模型 |
| 🤖 从零实现 GPT（nanoGPT） | ⭐⭐⭐⭐ | Transformer 核心 |

---

## 7. 阶段五：自然语言处理 NLP（80-120 小时）

> [!abstract] 本节摘要
> NLP 是让机器理解和生成人类语言的技术。从搜索引擎到 ChatGPT，NLP 无处不在。在 LLM 时代，NLP 基础仍然重要——它帮你理解大模型"为什么"能工作。

### 7.1 NLP 核心概念

```
NLP 处理流水线

原始文本
  ↓
分词 (Tokenization)     → "我爱AI" → ["我", "爱", "AI"]
  ↓
词嵌入 (Word Embedding)  → 每个词 → 高维向量
  ↓
特征提取                 → CNN / RNN / Transformer
  ↓
任务输出                 → 分类 / 生成 / 翻译 / 问答
```

**关键技术演进：**

| 时代 | 技术 | 特点 |
|------|------|------|
| 统计时代 | TF-IDF, N-gram | 基于词频统计 |
| 词向量时代 | Word2Vec, GloVe | 词义向量化 |
| 序列模型时代 | LSTM, GRU | 理解语序和上下文 |
| 预训练时代 | BERT, GPT | 大规模预训练 + 微调 |
| 大模型时代 | GPT-4, Claude | 涌现能力、指令跟随 |

### 7.2 核心任务

| 任务 | 描述 | 例子 |
|------|------|------|
| 文本分类 | 给文本打标签 | 垃圾邮件检测、情感分析 |
| 命名实体识别 NER | 找出文本中的实体 | "苹果公司在北京发布了 iPhone" → [苹果公司=ORG, 北京=LOC] |
| 机器翻译 | 语言之间转换 | 中文 → 英文 |
| 文本摘要 | 长文变短文 | 新闻摘要生成 |
| 问答系统 QA | 回答问题 | "法国首都是？" → "巴黎" |
| 文本生成 | 生成新文本 | ChatGPT、写作助手 |

### 7.3 推荐资源

- 🎓 **[Stanford CS224N](https://web.stanford.edu/class/cs224n/)** — NLP 圣经课程（YouTube 免费）
- 🎓 **[Hugging Face NLP 课程](https://huggingface.co/learn/nlp-course)** — 免费，实战导向
- 📖 **[Speech and Language Processing](https://web.stanford.edu/~jurafsky/slp3/)** — 在线免费教材
- 📺 **B 站 李宏毅 NLP 课程** — 中文讲解

---

## 8. 阶段六：计算机视觉 CV（80-120 小时）

> [!abstract] 本节摘要
> 计算机视觉让机器"看懂"图像和视频。从人脸识别到自动驾驶，从医学影像到图像生成，CV 是 AI 最直观、应用最广的领域之一。

### 8.1 核心任务

```
计算机视觉任务谱

基础任务
├── 图像分类 — 这张图是猫还是狗？
├── 目标检测 — 图中的物体在哪里？（画框）
├── 语义分割 — 图中每个像素属于什么类别？
├── 实例分割 — 区分同类别的不同物体
└── 关键点检测 — 人体姿态估计

生成任务
├── 图像生成 — 从文字/噪声生成图片
├── 风格迁移 — 把照片变成油画风格
├── 超分辨率 — 低分辨率图片变高清
└── 图像修复 — 填补图片缺失部分

高级任务
├── 视频理解 — 动作识别、视频摘要
├── 3D 视觉 — 深度估计、3D 重建
└── 多模态 — 图文理解（GPT-4V、Gemini）
```

### 8.2 经典模型演进

| 模型 | 年份 | 突破 |
|------|------|------|
| AlexNet | 2012 | 深度学习在 CV 的首次大胜 |
| VGG | 2014 | 更深的网络更好 |
| ResNet | 2015 | 残差连接，可训练 152 层 |
| YOLO | 2016 | 实时目标检测 |
| ViT | 2020 | Transformer 进入视觉领域 |
| CLIP | 2021 | 图文对齐，零样本学习 |
| Stable Diffusion | 2022 | 开源图像生成 |
| SAM | 2023 | 通用图像分割 |

### 8.3 推荐资源

- 🎓 **[Stanford CS231n](http://cs231n.stanford.edu/)** — CV 经典课程
- 🎓 **[Fast.ai Part 2](https://course.fast.ai/)** — 从实战到理论
- 📖 **[PyTorch 官方视觉教程](https://pytorch.org/tutorials/beginner/blitz/cifar10_tutorial.html)**
- 📺 **[Computerphile CV 系列](https://www.youtube.com/user/Computerphile)** — 通俗讲解

### 8.4 实战项目

| 项目 | 难度 | 学到什么 |
|------|------|---------|
| 🔍 人脸检测与识别 | ⭐⭐ | CNN、迁移学习 |
| 🚗 自动驾驶场景检测 | ⭐⭐⭐ | YOLO、目标检测 |
| 🎨 AI 艺术风格迁移 | ⭐⭐ | GAN/扩散模型 |
| 🏥 医学影像分类 | ⭐⭐⭐ | ResNet、数据增强 |

---

## 9. 阶段七：大语言模型 LLM（100-150 小时）

> [!abstract] 本节摘要
> 大语言模型（LLM）是当前 AI 最火热的方向。理解 LLM 的工作原理、训练流程和使用方法，是每个 AI 学习者必备的技能。

### 9.1 LLM 核心概念

**LLM 是什么？**

大语言模型本质上是一个**超大规模的 Transformer 模型**，在海量文本上训练，学会了"预测下一个词"。但在这个简单目标的训练过程中，它涌现出了推理、翻译、编程、创作等惊人能力。

```
LLM 的训练三阶段

阶段 1：预训练 (Pre-training)
├── 数据：互联网海量文本（万亿 Token）
├── 目标：预测下一个 Token
├── 结果：获得通用语言能力
└── 成本：数百万~数千万美元

阶段 2：监督微调 SFT (Supervised Fine-Tuning)
├── 数据：人工编写的高质量问答对
├── 目标：学会"遵循指令"
├── 结果：从"续写文本"变成"回答问题"
└── 成本：数万~数十万美元

阶段 3：人类反馈强化学习 RLHF
├── 数据：人类对多个回复的排名偏好
├── 目标：生成人类偏好的回复
├── 结果：更安全、更有帮助、更诚实
└── 技术：PPO / DPO / GRPO
```

### 9.2 当前主流模型一览

| 模型 | 公司 | 特点 | 开源？ |
|------|------|------|--------|
| GPT-4o / GPT-4.5 | OpenAI | 商业最强，多模态 | ❌ |
| Claude 4 (Opus/Sonnet) | Anthropic | 长上下文、强推理、安全 | ❌ |
| Gemini 2.5 Pro | Google | 超长上下文、多模态 | ❌ |
| Llama 3.1 / 4 | Meta | 最强开源基座 | ✅ |
| DeepSeek-R1 / V3 | DeepSeek | 中国最强开源、推理模型 | ✅ |
| Qwen 2.5 / 3 | 阿里 | 中文最强开源之一 | ✅ |
| Mistral Large | Mistral | 欧洲最强、高效 | 部分 |

### 9.3 关键技术概念

| 概念 | 解释 | 重要性 |
|------|------|--------|
| Token | 模型处理的最小文本单位 | 理解计费和上下文限制 |
| 上下文窗口 | 一次能处理的最大 Token 数 | 决定模型能"记住"多少 |
| Temperature | 输出的随机性控制 | 0=确定性，1=创造性 |
| Top-p / Top-k | 采样策略 | 控制生成多样性 |
| 涌现能力 | 模型变大后突然出现的新能力 | LLM 的核心魅力 |
| 幻觉 (Hallucination) | 模型"一本正经地胡说八道" | LLM 的主要挑战 |
| 思维链 CoT | 让模型展示推理步骤 | 提升复杂任务表现 |
| 上下文学习 ICL | 通过示例让模型学会新任务 | 不需要训练就能适应 |

### 9.4 推荐资源

- 🎓 **[Hugging Face LLM 课程](https://huggingface.co/learn/llm-course)** — 免费，从基础到高级
- 🎓 **[Stanford CS324: LLMs](https://stanford-cs324.github.io/)** — 斯坦福 LLM 课程
- 📺 **[Andrej Karpathy: Let's build GPT](https://www.youtube.com/watch?v=kCc8FmEb1nY)** — 从零实现 GPT
- 📖 **《Build a Large Language Model (From Scratch)》** — Sebastian Raschka
- 📺 **B 站 李宏毅《生成式AI》课程** — 中文讲解，适合入门
- 📖 **[LLM Engineering Handbook](https://www.oreilly.com/library/view/the-llm-engineering/9781098150495/)** — 工程实践

---

## 10. 阶段八：生成式 AI 应用（80-120 小时）

> [!abstract] 本节摘要
> 学会"使用" LLM 构建实际应用。这是从"理论学习者"变成"AI 应用开发者"的关键转折。掌握 Prompt Engineering、RAG、微调三大核心技能。

### 10.1 Prompt Engineering — 提示词工程

**核心技巧：**

```
Prompt 工程技巧清单

基础技巧
├── 角色设定 — "你是一位资深数据分析师..."
├── 任务明确 — 清晰描述你要什么
├── 格式指定 — "用 JSON 格式输出"
└── 示例提供 — Few-shot prompting

进阶技巧
├── 思维链 (Chain-of-Thought) — "让我们一步步思考..."
├── 自我一致性 (Self-Consistency) — 多次生成取一致结果
├── ReAct — 推理 + 行动交替
├── 树形思维 (Tree-of-Thought) — 探索多条推理路径
└── 结构化输出 — 使用 JSON Schema 约束

系统级技巧
├── 系统提示 (System Prompt) — 全局行为设定
├── 提示链 (Prompt Chaining) — 分步骤多轮交互
└── 元提示 (Meta-prompting) — 让 AI 优化提示词
```

### 10.2 RAG — 检索增强生成

**为什么需要 RAG？** LLM 有知识截止日期、会产生幻觉、不知道你的私有数据。RAG 让模型"先查资料，再回答"。

```
RAG 工作流程

用户提问
    ↓
┌─ 检索阶段 ─────────────────────────┐
│  问题 → 向量化 → 在向量数据库中搜索  │
│  → 返回最相关的文档片段              │
└────────────────────────────────────┘
    ↓
┌─ 生成阶段 ─────────────────────────┐
│  系统提示 + 检索到的上下文 + 用户问题 │
│  → 发送给 LLM → 生成有据可查的回答   │
└────────────────────────────────────┘
```

**核心组件：**

| 组件 | 作用 | 常用工具 |
|------|------|---------|
| 文档加载器 | 读取各种格式文档 | LangChain Loaders |
| 文本分块 | 将长文档切成小片段 | RecursiveCharacterTextSplitter |
| 向量嵌入 | 将文本转为向量 | OpenAI Embeddings, sentence-transformers |
| 向量数据库 | 存储和搜索向量 | Chroma, Pinecone, Weaviate, FAISS |
| 重排序 | 优化搜索结果排序 | Cohere Reranker, BGE Reranker |

### 10.3 模型微调 Fine-tuning

**什么时候需要微调？**

| 场景 | 推荐方案 |
|------|---------|
| 通用问答、日常任务 | Prompt Engineering |
| 需要特定领域知识 | RAG |
| 需要特定输出风格/格式 | Fine-tuning |
| 需要专业领域深度能力 | Fine-tuning + RAG |

**微调技术演进：**

```
全量微调 (Full Fine-tuning)
├── 更新所有参数
├── 需要大量 GPU
└── 效果最好但成本最高

参数高效微调 (PEFT)
├── LoRA — 低秩适配（最流行 ⭐）
│   └── 只训练少量新增参数（~1%）
├── QLoRA — 量化 LoRA（更省内存）
│   └── 4-bit 量化 + LoRA
├── Prefix Tuning — 前缀调优
└── Adapter — 适配器方法
```

### 10.4 推荐资源

- 🎓 **[DeepLearning.AI Short Courses](https://www.deeplearning.ai/short-courses/)** — 大量免费短课（Prompt Engineering, RAG, Fine-tuning）
- 📖 **[Prompt Engineering Guide](https://www.promptingguide.ai/)** — 最全面的提示工程指南
- 📖 **《Prompt Engineering for LLMs》** — O'Reilly
- 🎓 **[LangChain 官方教程](https://python.langchain.com/docs/tutorials/)** — RAG 实战
- 📺 **[FreeCodeCamp RAG 教程](https://www.youtube.com/watch?v=sVcwVQRHIc8)** — 免费视频

### 10.5 实战项目

| 项目 | 难度 | 学到什么 |
|------|------|---------|
| 📄 PDF 知识库问答 | ⭐⭐ | RAG 完整流程 |
| ✍️ AI 写作助手 | ⭐⭐ | Prompt Engineering |
| 🏥 医疗问答系统 | ⭐⭐⭐ | RAG + 领域知识 |
| 🎯 个人 AI 助理 | ⭐⭐⭐ | 微调 + RAG + 工具 |

---

## 11. 阶段九：AI Agent 自主智能体（80-120 小时）

> [!abstract] 本节摘要
> AI Agent 是 2025-2026 最前沿的方向——让 AI 不仅"回答问题"，还能"自主行动"。Agent 能使用工具、执行代码、浏览网页、管理文件，真正成为你的 AI 助手。

> [!info] 延伸阅读
> 更详细的 AI Agent 学习内容请参见 [[Research/AI-Agents-从零开始学习指南.md|AI Agents 从零开始学习指南]]

### 11.1 什么是 AI Agent？

```
传统 AI（聊天机器人）          AI Agent（自主智能体）
┌──────────────────┐         ┌──────────────────────────┐
│  问 → 答          │         │  目标 → 规划 → 执行 → 反思 │
│  一问一答          │         │  自主循环                  │
│  无记忆            │         │  有记忆                    │
│  无工具            │         │  可调用工具                │
│  无规划            │         │  能分解任务                │
└──────────────────┘         └──────────────────────────┘
```

**Agent 核心组件：**

```
AI Agent 架构

        ┌─────────────┐
        │   🧠 LLM     │ ← 大脑：推理和决策
        │   (大语言模型) │
        └──────┬──────┘
               │
    ┌──────────┼──────────┐
    ↓          ↓          ↓
┌──────┐  ┌──────┐  ┌──────┐
│ 📋    │  │ 🔧    │  │ 💾    │
│ 规划   │  │ 工具   │  │ 记忆   │
│Planning│  │Tools  │  │Memory │
└──────┘  └──────┘  └──────┘

规划：分解任务、制定步骤
工具：代码执行、网页搜索、API 调用、文件操作
记忆：短期（对话历史）、长期（知识库）
```

### 11.2 核心框架对比（2026）

| 框架 | GitHub ⭐ | 特点 | 适合场景 |
|------|-----------|------|---------|
| **LangChain / LangGraph** | 100K+ | 生态最大，集成最多 | 复杂工作流、生产应用 |
| **CrewAI** | 44K+ | 多 Agent 协作最简单 | 团队协作、角色扮演 |
| **OpenAI Agents SDK** | 新兴 | 官方支持，上手最容易 | OpenAI 生态用户 |
| **AutoGen (AG2)** | 35K+ | 微软出品，研究导向 | 多 Agent 对话、研究 |
| **Semantic Kernel** | 22K+ | .NET/Java 友好 | 企业级应用 |
| **OpenClaw** | 175K+ | 本地运行、记忆系统强 | 个人助理、全栈Agent |

### 11.3 核心概念

| 概念 | 解释 |
|------|------|
| **Function Calling** | LLM 决定调用哪个工具、传什么参数 |
| **ReAct 模式** | 推理(Reason) → 行动(Act) → 观察(Observe) → 循环 |
| **MCP (Model Context Protocol)** | Anthropic 提出的标准化工具接口协议 |
| **多 Agent 编排** | 多个 Agent 分工协作完成复杂任务 |
| **Human-in-the-Loop** | 关键决策点让人类确认 |
| **Agentic RAG** | Agent + RAG 结合，智能检索决策 |

### 11.4 推荐资源

- 🎓 **[DeepLearning.AI: AI Agents](https://www.deeplearning.ai/short-courses/)** — 多门 Agent 相关短课
- 📖 **[LangChain 文档](https://python.langchain.com/docs/)** — 官方教程
- 📖 **[CrewAI 文档](https://docs.crewai.com/)** — 多 Agent 入门
- 📖 **[OpenAI Function Calling Guide](https://platform.openai.com/docs/guides/function-calling)** — 工具调用基础
- 📺 **B 站搜索 "AI Agent 开发"** — 大量中文教程

### 11.5 实战项目

| 项目 | 难度 | 学到什么 |
|------|------|---------|
| 🔍 AI 搜索助手 | ⭐⭐ | Function Calling、网页搜索 |
| 📊 数据分析 Agent | ⭐⭐⭐ | 代码执行、多步推理 |
| 👥 多 Agent 开发团队 | ⭐⭐⭐⭐ | CrewAI、角色协作 |
| 🏠 个人 AI 管家 | ⭐⭐⭐⭐ | 完整 Agent 系统 |

---

## 12. 阶段十：AI 工程化与部署（60-100 小时）

> [!abstract] 本节摘要
> 会训练模型只是第一步，把模型变成可靠的产品才是完整闭环。MLOps/LLMOps 是从"实验"到"产品"的桥梁。

### 12.1 MLOps / LLMOps 全景

```
AI 工程化全景

开发阶段
├── 实验管理 — MLflow, Weights & Biases
├── 数据版本控制 — DVC, LakeFS
├── 模型训练 — PyTorch, Hugging Face Trainer
└── 评估测试 — pytest, promptfoo

部署阶段
├── 模型服务 — vLLM, TGI, Triton
├── API 封装 — FastAPI, Flask
├── 容器化 — Docker, Kubernetes
└── 云部署 — AWS SageMaker, GCP Vertex AI

运维阶段
├── 监控告警 — Prometheus, Grafana
├── 日志追踪 — LangSmith, Langfuse
├── A/B 测试 — 灰度发布
├── 自动重训练 — 定时管道
└── 成本优化 — 模型量化、缓存
```

### 12.2 核心技能

**模型优化与推理加速：**

| 技术 | 作用 | 工具 |
|------|------|------|
| 量化 (Quantization) | 缩小模型体积 | GPTQ, AWQ, GGUF |
| 蒸馏 (Distillation) | 大模型教小模型 | Hugging Face Distillation |
| 推理优化 | 加速推理速度 | vLLM, TensorRT-LLM |
| 缓存 | 避免重复计算 | KV-Cache, Prompt Cache |

**API 开发与部署：**

```python
# FastAPI 快速部署 LLM 服务示例
from fastapi import FastAPI
from openai import OpenAI

app = FastAPI()
client = OpenAI()

@app.post("/chat")
async def chat(message: str):
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": message}]
    )
    return {"reply": response.choices[0].message.content}
```

### 12.3 推荐资源

- 🎓 **[Made With ML: MLOps Course](https://madewithml.com/)** — 免费，从头到尾
- 🎓 **[Full Stack LLM Bootcamp](https://fullstackdeeplearning.com/)** — 全栈 AI 工程
- 📖 **[MLOps 指南（Google）](https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning)**
- 📖 **[vLLM 文档](https://docs.vllm.ai/)** — 高性能 LLM 推理

---

## 13. 阶段十一：AI 伦理与安全（20-40 小时）

> [!abstract] 本节摘要
> 越强大的技术越需要负责任地使用。AI 伦理不是可选课程，而是每个 AI 从业者的必修课。

### 13.1 核心议题

```
AI 伦理与安全

⚖️ 公平性与偏见
├── 训练数据偏见 → 模型偏见
├── 算法歧视（招聘、贷款、司法）
└── 解决：公平性度量、去偏技术

🔒 隐私与安全
├── 数据隐私（GDPR、个人信息保护法）
├── 模型安全（对抗攻击、越狱）
├── 数据泄露（训练数据提取）
└── 解决：差分隐私、联邦学习

🎯 AI 对齐 (Alignment)
├── 让 AI 的目标与人类价值观一致
├── RLHF / Constitutional AI / DPO
├── 可控性与可解释性
└── 长期安全（超级智能风险）

📋 AI 治理
├── EU AI Act — 欧盟 AI 法案（风险分级）
├── 中国《生成式AI管理办法》
├── 行业自律（Anthropic RSP、OpenAI Safety）
└── 解决：治理框架、审计机制
```

> [!warning] 重要提醒
> 无论你做哪个方向的 AI，都应该了解你的模型可能带来的社会影响。"能做"不等于"应该做"。

### 13.2 推荐资源

- 🎓 **[Ethics of AI（赫尔辛基大学）](https://ethics-of-ai.mooc.fi/)** — 免费在线课程
- 📖 **[Anthropic Research](https://www.anthropic.com/research)** — AI 安全前沿研究
- 📖 **[AI Safety Fundamentals](https://aisafetyfundamentals.com/)** — 对齐入门
- 📄 **[Future of Life Institute](https://futureoflife.org/)** — AI 安全指数

---

## 14. 12 个月学习路线图

> [!abstract] 本节摘要
> 如果你每天投入 2-3 小时，这是一个 12 个月从零到能独立开发 AI 应用的完整路线。

```
┌─────────────────────────────────────────────────────────┐
│                 12 个月 AI 学习路线图                      │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│  月 1-2  │  🧮 数学基础 + 🐍 Python 编程                  │
│  基础期   │  线性代数 + 概率统计 + 微积分核心概念            │
│          │  Python 语法 + NumPy + Pandas + Matplotlib     │
│          │  📌 项目：数据探索分析（Titanic 数据集）          │
│          │                                              │
├──────────┼──────────────────────────────────────────────┤
│          │                                              │
│  月 3-4  │  🤖 机器学习核心                               │
│  核心期   │  监督学习全部算法 + 模型评估与调优               │
│          │  Scikit-learn 实战                             │
│          │  📌 项目：房价预测 + 信用卡欺诈检测              │
│          │                                              │
├──────────┼──────────────────────────────────────────────┤
│          │                                              │
│  月 5-6  │  🧠 深度学习 + NLP/CV 入门                     │
│  进阶期   │  神经网络原理 + CNN + RNN + Transformer         │
│          │  PyTorch 框架 + Hugging Face                   │
│          │  📌 项目：图像分类 + 文本情感分析                │
│          │                                              │
├──────────┼──────────────────────────────────────────────┤
│          │                                              │
│  月 7-8  │  💬 大语言模型 + 生成式 AI                     │
│  LLM 期  │  LLM 原理 + Prompt Engineering + RAG          │
│          │  微调技术（LoRA/QLoRA）                        │
│          │  📌 项目：PDF 知识库问答 + AI 写作助手           │
│          │                                              │
├──────────┼──────────────────────────────────────────────┤
│          │                                              │
│  月 9-10 │  🤖 AI Agent + 多 Agent 系统                  │
│  Agent期 │  Function Calling + LangChain/CrewAI          │
│          │  MCP 协议 + 记忆系统                           │
│          │  📌 项目：AI 搜索助手 + 多 Agent 开发团队       │
│          │                                              │
├──────────┼──────────────────────────────────────────────┤
│          │                                              │
│  月 11-12│  🚀 工程化 + 综合项目                          │
│  实战期   │  MLOps + 模型部署 + API 开发                   │
│          │  AI 伦理与安全                                 │
│          │  📌 项目：完整 AI 应用（从模型到上线）            │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

### 每日学习建议

| 时间段 | 活动 | 说明 |
|--------|------|------|
| 早上 30 分钟 | 看教程视频/读文档 | 理论输入 |
| 下午/晚上 1-2 小时 | 动手编码/做项目 | 实践为主 |
| 睡前 15 分钟 | 写学习笔记/复盘 | 整理知识 |

---

## 15. 分方向专精路线

> [!abstract] 本节摘要
> 完成基础学习后，你可以根据兴趣和职业目标选择一个方向深入。以下是 5 条主流专精路线。

### 路线 A：AI 应用开发者 🛠

> 最适合：想用 AI 构建产品的开发者

```
核心技能栈：
├── LLM API 调用（OpenAI, Anthropic, Google）
├── Prompt Engineering 高级技巧
├── RAG 系统设计与优化
├── Agent 开发框架（LangChain, CrewAI）
├── 前端集成（React/Next.js + AI）
├── 后端 API（FastAPI, Node.js）
└── 部署（Docker, Cloud）
```

### 路线 B：机器学习工程师 ⚙️

> 最适合：想把模型变成产品的工程师

```
核心技能栈：
├── 经典 ML 算法深入理解
├── 特征工程与数据管道
├── 模型训练与优化
├── MLOps（MLflow, Kubeflow）
├── 模型部署与监控
├── 分布式训练
└── 数据库与数据仓库
```

### 路线 C：深度学习研究者 🔬

> 最适合：想推动 AI 前沿的研究者

```
核心技能栈：
├── 深度学习理论（优化、泛化、涌现）
├── 论文阅读与复现
├── 新架构设计
├── 大规模训练技术
├── 数学功底（信息论、最优化）
└── 学术写作与发表
```

### 路线 D：AI 产品经理 📊

> 最适合：想将 AI 融入商业的产品人

```
核心技能栈：
├── AI 能力边界理解（能做什么/不能做什么）
├── Prompt Engineering（非技术角度）
├── AI 产品设计与用户体验
├── AI 项目管理与评估
├── 商业案例分析
├── AI 伦理与合规
└── 数据分析与可视化
```

### 路线 E：AI Agent 工程师 🤖

> 最适合：想构建自主 AI 系统的开发者（2026 最热门方向）

```
核心技能栈：
├── LLM 深入理解（推理、工具调用）
├── Agent 架构设计
├── 记忆系统与知识管理
├── 多 Agent 编排与协作
├── MCP 协议与工具生态
├── 安全与沙箱机制
└── 全栈开发能力
```

---

## 16. 推荐资源汇总

### 📺 视频课程 TOP 10

| # | 课程 | 平台 | 语言 | 费用 |
|---|------|------|------|------|
| 1 | [吴恩达《机器学习专项课程》](https://www.coursera.org/specializations/machine-learning-introduction) | Coursera | 英/中字幕 | 可免费旁听 |
| 2 | [吴恩达《深度学习专项课程》](https://www.coursera.org/specializations/deep-learning) | Coursera | 英/中字幕 | 可免费旁听 |
| 3 | [李宏毅《机器学习/深度学习》](https://speech.ee.ntu.edu.tw/~hylee/ml/2023-spring.php) | YouTube/B站 | 中文 | 免费 |
| 4 | [3Blue1Brown 数学系列](https://www.youtube.com/c/3blue1brown) | YouTube | 英/中字幕 | 免费 |
| 5 | [Fast.ai 实用深度学习](https://www.fast.ai/) | 官网 | 英文 | 免费 |
| 6 | [Stanford CS229/CS231n/CS224n](https://www.youtube.com/results?search_query=stanford+cs229) | YouTube | 英文 | 免费 |
| 7 | [Andrej Karpathy 系列](https://www.youtube.com/c/AndrejKarpathy) | YouTube | 英文 | 免费 |
| 8 | [DeepLearning.AI 短课程](https://www.deeplearning.ai/short-courses/) | 官网 | 英文 | 免费 |
| 9 | [Hugging Face 课程系列](https://huggingface.co/learn) | 官网 | 英文 | 免费 |
| 10 | [StatQuest 统计/ML 讲解](https://www.youtube.com/c/joshstarmer) | YouTube | 英文 | 免费 |

### 📖 推荐书籍 TOP 10

| # | 书名 | 适合阶段 | 语言 |
|---|------|---------|------|
| 1 | 《动手学深度学习》(d2l.ai) — 李沐 | 深度学习 | 中/英 |
| 2 | 《机器学习》— 周志华（西瓜书） | 机器学习理论 | 中文 |
| 3 | 《统计学习方法》— 李航 | 机器学习理论 | 中文 |
| 4 | 《Hands-On Machine Learning》— Géron | 机器学习实战 | 英文 |
| 5 | 《Deep Learning》— Goodfellow | 深度学习理论 | 英文 |
| 6 | 《Build a LLM from Scratch》— Raschka | LLM | 英文 |
| 7 | 《LLM Engineering Handbook》 | LLM 工程 | 英文 |
| 8 | 《Prompt Engineering for LLMs》 | 提示工程 | 英文 |
| 9 | 《AI Engineering》— Chip Huyen | AI 工程化 | 英文 |
| 10 | 《Designing Machine Learning Systems》— Chip Huyen | MLOps | 英文 |

### 🎮 实践平台

| 平台 | 用途 | 链接 |
|------|------|------|
| **Kaggle** | 竞赛 + 数据集 + 免费 GPU | [kaggle.com](https://www.kaggle.com) |
| **Google Colab** | 免费 Jupyter + GPU | [colab.research.google.com](https://colab.research.google.com) |
| **Hugging Face** | 模型库 + 数据集 + Spaces | [huggingface.co](https://huggingface.co) |
| **GitHub** | 开源项目 + 代码学习 | [github.com](https://github.com) |
| **Papers With Code** | 论文 + 代码 + 排行榜 | [paperswithcode.com](https://paperswithcode.com) |
| **LeetCode** | 算法练习 | [leetcode.com](https://leetcode.com) |
| **Datawhale** | 中文开源学习社区 | [datawhale.club](https://datawhale.club) |
| **和鲸社区** | 中文数据科学平台 | [heywhale.com](https://www.heywhale.com) |

### 📰 保持更新

| 来源 | 类型 | 链接 |
|------|------|------|
| **arXiv** | 最新论文 | [arxiv.org/list/cs.AI](https://arxiv.org/list/cs.AI/recent) |
| **The Batch** | 吴恩达周报 | [deeplearning.ai/the-batch](https://www.deeplearning.ai/the-batch/) |
| **Sebastian Raschka** | LLM 深度解读 | [magazine.sebastianraschka.com](https://magazine.sebastianraschka.com/) |
| **机器之心** | 中文 AI 新闻 | [jiqizhixin.com](https://www.jiqizhixin.com) |
| **量子位** | 中文 AI 新闻 | [qbitai.com](https://www.qbitai.com) |
| **Twitter/X AI 社区** | 实时动态 | 关注 @AndrewYNg @kaborey @ylecun 等 |

---

## 17. 参考链接

1. [Complete RoadMap To Learn AI — GitHub](https://github.com/krishnaik06/Complete-RoadMap-To-Learn-AI)
2. [AI Learning Roadmap: Beginner to Expert — Coursera](https://www.coursera.org/resources/ai-learning-roadmap)
3. [How to Learn AI From Scratch in 2026 — DataCamp](https://www.datacamp.com/blog/how-to-learn-ai)
4. [6-Month AI Engineer Roadmap — OpenCV](https://opencv.org/blog/ai-engineer-roadmap/)
5. [AI Engineer Roadmap 2026 — Turing College](https://www.turingcollege.com/blog/ai-engineer-roadmap-how-to-become-an-ai-engineer)
6. [How to Learn AI in 2025 — Udacity](https://www.udacity.com/blog/2025/05/how-to-learn-ai-in-2025-a-roadmap-for-beginners-and-developers.html)
7. [Machine Learning Specialization — Stanford Online](https://online.stanford.edu/courses/soe-ymls-machine-learning-specialization)
8. [Mathematics for ML — DeepLearning.AI](https://www.coursera.org/specializations/mathematics-for-machine-learning-and-data-science)
9. [All the Math You Need for AI — FreeCodeCamp](https://www.freecodecamp.org/news/all-the-math-you-need-in-artificial-intelligence/)
10. [Essential Math for ML — Medium](https://medium.com/@morepravin1989/the-essential-math-you-need-for-ai-and-machine-learning-with-roadmap-and-resources-0a7d332466bb)
11. [20+ Free ML Courses — DataTalks.Club](https://datatalks.club/blog/free-machine-learning-courses.html)
12. [Machine Learning Roadmap 2026 — Scaler](https://www.scaler.com/blog/machine-learning-roadmap/)
13. [The Roadmap for Mastering LLMs — MachineLearningMastery](https://machinelearningmastery.com/the-roadmap-for-mastering-language-models-in-2025/)
14. [Hugging Face LLM Course](https://huggingface.co/learn/llm-course/chapter1/1)
15. [NLP Learning Path 2025 — Analytics Vidhya](https://www.analyticsvidhya.com/blog/2023/12/nlp-learning-path/)
16. [Mastering LLMs Learning Path — Turing](https://www.turing.com/blog/mastering-large-language-models-learning-path-for-developers)
17. [Top 7 Agentic AI Frameworks 2026 — AlphaMatch](https://www.alphamatch.ai/blog/top-agentic-ai-frameworks-2026)
18. [AI Agent Frameworks Compared 2026 — Arsum](https://arsum.com/blog/posts/ai-agent-frameworks/)
19. [Top AI Agent Frameworks — Codecademy](https://www.codecademy.com/article/top-ai-agent-frameworks-in-2025)
20. [Definitive Guide to Agentic Frameworks — SoftmaxData](https://blog.softmaxdata.com/definitive-guide-to-agentic-frameworks-in-2026-langgraph-crewai-ag2-openai-and-more/)
21. [RAG vs Fine-tuning vs Prompt Engineering — IBM](https://www.ibm.com/think/topics/rag-vs-fine-tuning-vs-prompt-engineering)
22. [10 Must-Read AI Books 2026 — DEV Community](https://dev.to/somadevtoo/10-must-read-ai-and-llm-engineering-books-for-developers-in-2025-129j)
23. [Prompt Engineering Guide](https://www.promptingguide.ai/)
24. [RAG for LLMs — Prompt Engineering Guide](https://www.promptingguide.ai/research/rag)
25. [MLOps in 2026 — HatchWorks](https://hatchworks.com/blog/gen-ai/mlops-what-you-need-to-know/)
26. [Complete MLOps/LLMOps Roadmap 2026 — Medium](https://medium.com/@sanjeebmeister/the-complete-mlops-llmops-roadmap-for-2026-building-production-grade-ai-systems-bdcca5ed2771)
27. [MLOps Best Practices 2026 — KernShell](https://www.kernshell.com/best-practices-for-scalable-machine-learning-deployment/)
28. [AI Safety Index 2025 — Future of Life Institute](https://futureoflife.org/ai-safety-index-summer-2025/)
29. [Responsible AI — Microsoft](https://www.microsoft.com/en-us/ai/responsible-ai)
30. [AI Governance 2025 Guide — Athena Solutions](https://athena-solutions.com/ai-governance-2025-guide-to-responsible-ethical-ai-success/)
31. [2025版人工智能学习路线 — CSDN](https://blog.csdn.net/Libra1313/article/details/145847452)
32. [从零到专家：AI完整指南 — 博客园](https://www.cnblogs.com/java-note/p/18750625)
33. [AI学习路线图2025 — CSDN](https://blog.csdn.net/shayudiandian/article/details/154709465)
34. [40个AI学习渠道 — 知乎](https://zhuanlan.zhihu.com/p/27670316615)
35. [2026年AI学习完整指南 — CSDN](https://xingyun3d.csdn.net/69547fb1bf6b0e4b285fa365.html)
36. [AI智能体开发指南 — 知乎](https://zhuanlan.zhihu.com/p/1932119139343905681)
37. [2025年AI实战项目 — 博客园](https://www.cnblogs.com/jellyai/p/18780403)
38. [AI大模型推荐书籍 — CSDN](https://blog.csdn.net/2401_84204207/article/details/145642169)

---

## 相关笔记

- [[Research/AI-经典论文库/00-论文索引.md|AI 经典论文库（15 篇里程碑论文详细解读）]]
- [[Research/AI-Agents-从零开始学习指南.md|AI Agents 从零开始学习指南]]
- [[docs/OpenClaw 完整技术架构与应用详解.md|OpenClaw 完整技术架构与应用详解]]
- [[Research/OpenClaw-技术原理拆解-小白版.md|OpenClaw 技术原理拆解（小白版）]]