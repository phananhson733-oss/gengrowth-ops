---
title: "(1) X 上的 AlphaSignal AI：“How to Make a Coding Agent Smarter Without Touching the Model or the Prompt”"
source: "https://x.com/AlphaSignalAI/status/2049900160080077229"
author:
published: 2026-04-28
created: 2026-05-19
description: "https://t.co/dDtDyVssfm"
tags:
  - "clippings"
---
![图像](https://pbs.twimg.com/media/HHKzJ2OXQAA0nQo?format=jpg&name=large)

A new paper evolves a coding agent's tools, middleware, and memory automatically. It beats every human-tuned harness in 32 hours.一篇新论文自动演进了编码代理的工具、中间件和内存。它在32小时内击败所有人工调校的安全带。

**The system prompt alone regresses.** Editing it as the only adaptation surface drops pass@1 by 2.3 points on Terminal-Bench 2.**系统提示本身会退化。** 将其编辑为唯一适应曲面，终端工作台 2 的表现会下降 2.3 个 pass@1 点。

**AHE** (Agentic Harness Engineering) is the framework that produced this finding. It holds the base model frozen, evolves all seven harness components automatically against rollouts, and lifts a bash-only seed from 69.7% to 77.0% in ten iterations.得出这一发现的框架是 **AHE** （ 智能束带工程）。它会冻结基础模型，自动进化所有七个核心组件以应对推出，并在十次迭代中将仅限 bash 的种子从 69.7% 提升到 77.0%。

**The result** beats human-designed Codex-CLI (71.9%), the prompt-only self-evolver ACE (68.9%), and the trajectory-feedback baseline TF-GRPO (72.3%) on the same 89-task panel in 32 hours.结果在同一 89 个任务面板中，32 小时内优于人类设计的 Codex-CLI（71.9%）、仅提示自演化的 ACE（68.9%）和轨迹反馈基线 TF-GRPO（72.3%）。

**The transfer** ships the evolved workspace unchanged: 12% fewer tokens on SWE-bench-verified, +5.1 to +10.1pp across four other model families, with the largest gain on the weakest base.**转移** 后，演进后的工作空间保持不变：SWE 工作台验证代币减少 12%，其他四个模型家族中代币减少+5.1 至+10.1pp，且在最弱基础上涨幅最大。

> “If you didn’t quite catch that intro, you should definitely check out our [Harness Engineering workshop](https://luma.com/t24o902x). If you did follow along, you should still give it a look anyway!” more details at the end.“如果你还没听懂那个开场白，绝对应该去看看我们的 [驾驭工程工作坊](https://luma.com/t24o902x) 。如果你真的跟着看，也应该去看看！“更多细节在最后。

## Context背景

The paper is authored by **Jiahang Lin, Shichun Liu, Chengjun Pan**, and collaborators at **Fudan University**, **Peking University**, and **Shanghai Qiji Zhifeng**, titled " **Agentic Harness Engineering: Observability-Driven Automatic Evolution of Coding-Agent Harnesses** " (arXiv 2604.25850, April 28, 2026, MIT-licensed code).该论文由 **林嘉恒、刘世春、潘承军** 及 **复旦大学** 、 **北京大学** 和 **上海启吉志峰** 的合作者共同撰写， 题为《 **智能体约束工程：编码代理智能体约束** 的可观测性驱动自动演进》“（arXiv 2604.25850,2026 年 4 月 28 日，MIT 授权代码）

A coding agent's harness is everything around the model: system prompt, tool definitions, middleware, skills, sub-agents, memory. Production teams hand-tune these by inspecting trajectories and editing files. The manual loop is slow and the gains scatter across undocumented decisions.编码代理的束缚包括模型周围的一切：系统提示、工具定义、中间件、技能、子代理、内存。制作团队通过检查轨迹和编辑文件来手动调校这些设备。手动循环很慢，收益分散在未被记录的决策中。

Prior automated work optimizes one component at a time, almost always the prompt or an in-context playbook (ACE, GEPA, DSPy) or the trajectory distribution (TF-GRPO, GRPO variants). Tools, middleware, and memory stay closed.以往自动化工作一次优化一个组件，几乎总是提示词或上下文操作手册（ACE、GEPA、DSPy）或轨迹分布（TF-GRPO、GRPO 变体）。工具、中间件和内存都保持关闭。

AHE evolves the full harness as a combinatorial whole and treats every edit as a falsifiable contract verified against the next round's task outcomes.AHE 将完整框架作为一个组合整体进化，并将每一次编辑视为可证伪的契约，并与下一轮任务结果进行验证。

## How AHE worksAHE 的工作原理

The central design move is that every phase of the loop produces structured, file-level artifacts another agent can read.核心设计的做法是循环的每个阶段都会产生结构化的文件级工件，其他代理可以读取。

**Component observability.** The harness is instantiated on the **NexAU** framework, which exposes seven editable component types as files at fixed mount points: system prompt, tool description, tool implementation, middleware, skill, sub-agent configuration, and long-term memory. Each failure pattern maps cleanly to one component class. Each logical edit becomes one git commit, so file-level diffs and rollback come for free.

The seed harness is deliberately minimal, just a single bash tool with no middleware or skills, so every component the loop adds has to earn its place against measured rollouts.

**Experience observability.** The Agent Debugger framework distills raw rollout traces (millions of tokens) into a layered evidence corpus. Each trajectory message lives in its own file. Per-task root-cause reports identify failure patterns.

A benchmark-level overview aggregates every report into the evolve agent's entry point. Original traces stay accessible for verification but are never the first read.

**Decision observability.** Every edit ships with a **change\_manifest.json** entry naming the failure pattern it addresses, the predicted task fixes, the at-risk regressions, and the constraint level (prompt, tool description, tool implementation, middleware, skill).

In the next round, the loop intersects predicted fixes and regressions against observed task-level deltas. Edits whose predictions don't materialize get rolled back automatically at file granularity. Self-justification becomes measurement.

## The outer loop

The plain pseudocode is included in appendix section at the end

The load-bearing choice is that attribution runs before distillation. The verdict for prior edits lands inside the evidence corpus the evolve agent reads, binding each manifest entry as a contract instead of a rationale.

The evolve agent writes only inside **workspace/**. The runs directory, tracer, verifier, and LLM config are read-only. The seed system prompt is non-deletable.

These restrictions block the shortcuts an unconstrained self-modifier would take, like disabling the verifier or raising the reasoning budget, and keep every recorded gain attributable to harness edits.

## Evidence

Ten AHE iterations on Terminal-Bench 2 (89 tasks, k=2 rollouts, GPT-5.4 high reasoning, ~32 hours total runtime) lift pass@1 from 69.7% to 77.0%. AHE outperforms three human-designed harnesses (opencode 47.2%, terminus-2 62.9%, Codex-CLI 71.9%) and both self-evolve baselines (ACE 68.9%, TF-GRPO 72.3%).

On Easy and Medium tiers AHE leads cleanly. On Hard it slips to 53.3% behind Codex-CLI's 56.7%, traced to component interference rather than missing capability.

Cross-benchmark transfer holds without re-evolution. On SWE-bench-verified (500 tasks across seven repos), AHE achieves the highest aggregate at 75.6% while spending 12% fewer tokens than the seed, 21% fewer than TF-GRPO, and 32% fewer than ACE.

Gains concentrate on django and sphinx-doc, the two largest, most token-expensive repos. Cost efficiency on SWE-bench (Succ/Mtok): AHE 1.64, NexAU₀ 1.43, TF-GRPO 1.27, ACE 1.10.

Cross-model transfer is the strongest evidence that the harness encodes general engineering experience. The same evolved workspace, evaluated unchanged on five alternate bases, produces five positive gains: +10.1pp on **deepseek-v4-flash** (51.7→61.8), +6.3pp on **qwen-3.6-plus** (56.2→62.5), +5.1pp on **gemini-3.1-flash-lite-preview** (36.5→41.6), and +2.3pp on both GPT-5.4 medium and xhigh.

Weaker bases benefit more because they lean on the coordination patterns AHE has fixed inside tools, middleware, and memory. Stronger bases re-derive the same coordination from the prompt cheaply.

The component ablation is the load-bearing finding. Swapping a single AHE component into the bash-only seed: memory alone +5.6pp, tools alone +3.3pp, middleware alone +2.2pp, system prompt alone **−2.3pp**. The harness components ACE and TF-GRPO never edit are exactly where the gain lives.

## Four case studies

The paper traces four trajectories from failure to fix across iterations 2, 5, 6, and 8. Each peak in the best-so-far curve lines up with one trajectory.

**db-wal-recovery (iteration 2).** The agent had to reconstruct a SQLite database from a corrupted write-ahead log. The failing rollout invented missing rows from a guessed pattern (**value = id × 100**) and self-checked on row count instead of the verifier's value assertions.

The fix was a 68-line append to the system prompt with eight numbered rules: contract first, mirror the evaluator, generalize without overfitting visible samples. None of the rules mentions SQLite, WAL, or this task. The rules were proposed for a different cluster of partial-pass tasks and carried over by accident, flipping db-wal-recovery 1/2 → 2/2 and holding 2/2 every iteration after.

**path-tracing (iteration 5).** The agent rendered a correct image, self-checked it, then issued **rm -rf** as a final tidy-up step and submitted on the cleanup's exit code. The verifier found nothing on disk and rejected the rollout. The seed prompt already had advice against destroying verified state, but no execution-time mechanism enforced it.

The iteration-5 fix installed a publish-state guard inside the shell tool: when the shell observes a successful evaluator-style check, it parses the acceptance command for protected paths and intercepts later deletes. Task flips 0/2 → 2/2.

**mcmc-sampling-stan (iteration 6).** The agent computed a fake posterior via grid integration, fired the real MCMC run as a background job, killed it before convergence "to preserve the deliverables," and submitted the fake. This failed for five straight iterations.

Iteration 6 closed it with two components working together: the publish-state guard extended to protect script entrypoints (**analysis.R**), and a new **ExecutionRiskHintsMiddleware** watching the live command history for seven cross-step risk patterns (proxy validators, shallow validation, localhost-only checks, repeated retries against the same error, among others). Task flips 0/2 → 2/2 and stays.

**configure-git-webserver (iteration 8).** The agent reached a working webserver, self-checked via localhost curl, then issued **ALLOW\_POST\_SUCCESS\_RESET** -prefixed cleanup commands that wiped the live web root and reset the git ref "to leave a clean repo for grading." The external verifier got a 404.

Iteration 8 patched the override token: deletion of protected outputs and reset of protected roots became hard blocks the token can no longer wipe. A **before\_model** hook promoted execution-risk warnings into FRAMEWORK reminders visible on the next model turn. Iteration 8's overall score reached 76.97, the run's high-water mark.

The pattern across all four cases: prompts say what to avoid, but execution-time enforcement is what changes outcomes. Three of the four winning fixes shipped at the tool-implementation or middleware level.

## Limitations

**Hard-tier slip.** AHE marginally trails Codex-CLI on Hard (53.3% vs 56.7%). Memory, middleware, and the system prompt all push toward the same closure-style verification, which spends turn budget on redundant re-checks. Swapping AHE's long-term memory alone into the seed (no other components) already surpasses Codex on Hard.

**Non-additive component interaction.** Three positive single-component gains sum to +11.1pp, but full AHE only achieves +7.3pp. Stacking the components costs 3.8pp. The evolve agent optimizes an aggregate dominated by 55 Medium tasks, so it converges to a Medium-heavy trade-off that returns part of the Hard memory effect.

**Regression blindness.** Across nine evaluation rounds, the evolve agent issued 43 unique regression predictions and only 5 landed (precision 11.6%). 40 unforeseen regressions actually occurred (recall 11.1%). Fix predictions are 5× above random. Regression predictions are barely 2× above.

The agent can justify why an edit should help. It cannot reliably name what the same edit will break.

**Benchmark scope.** The full evolution run is on Terminal-Bench 2. Cross-benchmark and cross-model transfer evidence is encouraging, but a non-Terminal-Bench-2 evolution run is what would close the benchmaxxing question. The authors flag this and call it out as a generalization hazard.

So the best recommendation is to treat AHE as a controlled research prototype that already produces a frozen harness worth studying, while waiting for evolution runs on a second benchmark before adopting the framework as a deployment-grade self-improvement loop.

## AlphaSignal Take

Worth Watching. The framework does what it claims, the receipts (change manifests + auto-rollback) replace self-justification with measurement, and the cross-model transfer is the strongest signal yet that harness structure encodes coordination patterns weaker bases cannot re-derive cheaply.

The two unfinished pieces are the regression-blindness gap and a second-benchmark evolution run. Closing either pushes it from research-prototype to production-grade.

The forward-looking entity to watch is **NexAU**, the substrate the loop runs on, since the framework's reach scales with how many production agents adopt the file-level component contract.

## Who benefits, who doesn't

**Benefits:** teams running long-horizon coding agents on multi-step terminal or repository workflows, anyone hand-tuning prompts beyond a rough first pass, ML engineers evaluating self-evolution loops as an alternative to fine-tuning, and researchers studying test-time adaptation surfaces that don't require gradient updates.

**Skips:** teams whose agent loop is short-horizon API-call chains, anyone without rollout traces or a verifier with binary pass/fail signal, and teams already invested in prompt-only frameworks (ACE, GEPA, DSPy) that cannot open the harness components where the gain lives.

## Practitioner implication

ML engineers can now evolve a coding agent's tools, middleware, and memory automatically against a benchmark, now that observability primitives turn each component edit into a falsifiable contract.

## The Workshop

We’re hosting a session on Harness Engineering to move beyond simple prompts and context. It’s about building the constraints that let agents work autonomously.

May 14th, 11am PT. Led by AJ Joobandi (Augment Code). 20 seats, $150.

You’ll learn why agents break, how to design robust success metrics, and walk away with a plug-and-play harness file.

**→ Grab your seat** [here](https://lu.ma/t24o902x)

## Links

- [Paper on arXiv](https://arxiv.org/abs/2604.25850) (paper, ~45 min read)
- [GitHub repo](https://github.com/china-qijizhifeng/agentic-harness-engineering) (code, MIT license)
- [Agent Debugger blog](https://dawning-road.github.io/blog/agent-debugger) (background, ~10 min read)
- [NexAU framework](https://github.com/nex-agi/NexAU) (substrate the loop runs on)

Follow [@AlphaSignalAI](https://x.com/@AlphaSignalAI) for more content like this.

Subscribe at [AlphaSignal.ai](https://alphasignal.ai/) for daily AI signals. Read by 280,000+ developers.

## Appendix

```plaintext
Algorithm 1: AHE outer loop
H_best ← H₀                                       # bash-only NexAU₀ seed
for t = 1 to N do
T_t ← Rollout(M, H_{t-1}, D, k)               # phase 1: k≥2 rollouts per task
T̃_t ← Clean(T_t)                              # phase 2: drop base64, dedup tool output
if t ≥ 2 then                                  # phase 3: attribute prior manifest, then rollback
V_t ← Attribute(C_{t-1}, T_{t-1}, T_t)
H_{t-1} ← Rollback(H_{t-1}, V_t)
R_t ← AgentDebugger(T̃_t)                      # phase 4: layered distillation
(H_t, C_t) ← Evolve(H_{t-1}, R_t, V_t)         # phase 5: workspace edits + new manifest
Commit(H_t, C_t, t)                            # phase 6: tag iteration in git
if Pass@1(T_t) > Pass@1(H_best) then
H_best ← H_t
return H_best
```