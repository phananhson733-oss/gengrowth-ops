#!/usr/bin/env python3
"""Add the short-drama exception (§4.3) to the Social profile's SOUL.md.

Written for the operator to run, not the agent: CLAUDE.md puts ~/.hermes out of bounds for
the agent, and letting an agent edit another agent's permission file is exactly what that
rule exists to prevent. So this does the fiddly part — correct insertion point, the
"two exceptions" wording, a backup, idempotency — and leaves the decision to a human.

  python3 patch_social_soul.py          # show what would change, write nothing
  python3 patch_social_soul.py --apply  # back up, then write

It prints only structure (headings, counts), never the file's contents.
"""
import argparse, re, shutil, sys
from datetime import datetime
from pathlib import Path

SOUL = Path.home() / ".hermes" / "profiles" / "social" / "SOUL.md"

SECTION = '''## 4.3 例外：短剧发行管理 short-drama-release-manager（预授权，直接执行）

第三个 CEO 预授权例外。与 §4.1、§4.2 是三条独立流程，别混用彼此的脚本、Sheet 和 Base。

**触发**：短剧业务的查看或修改请求——「选剧池有哪些 / 看一下账号台账 / 采集数据」
「把 SD-xxxxxx 的 X 改成 Y」「给 xxx 排期」「归档 xxx」「回填发布记录」。

**与 §4.1、§4.2 的结构差异**：本流程的脚本不在 `~/.hermes/profiles/social/skills/` 下，
而在 `~/gengrowth-ops/` 内，解释器是 `node` 而不是 venv 里的 python。这是本例外明确允许的。

1. 命令形态是**逐字校验**的，必须正好是这一行，多一个字符都会被 Runner 拒绝
   （返回 `social_invoker_untrusted`）：

   /usr/bin/env node /Users/awayer_mini/gengrowth-ops/inbox-pengman/tools/short-drama-release-manager/shortdrama_ctl.mjs <子命令> <参数...> --config /Users/awayer_mini/gengrowth-ops/inbox-pengman/tools/short-drama-release-manager/shortdrama.runtime.json

   不能只写 `node`；不能用 `~`（比对前不会展开）；不能有 `cd`、`&&`、`;`、管道、`$PWD`
   或任何变量替换；工作目录不要写进命令里。
2. 允许的命令组：`account`、`capture`、`metrics`（只读）；`pool`、`release`（业务读写）；`sync start`。
3. **禁止**：`doctor`、`migrate`、`schedule`、`queue` 及任何 internal 命令。
   Runner 自己也会返回 `social_command_denied`，不要试图绕过它直连 Base API。
4. **写操作一律两段式**：先跑 `preview-*`，把回执（含 `before` 快照）发到飞书，
   等人明确确认后才跑 `apply-*`。不得跳过 preview 直接 apply。
5. 不得用 `--actor-id` / `--chat-id` 覆盖会话身份；身份只从 Hermes 会话变量取。
6. `账号台账` 和 `采集数据` 对本流程是**只读**的（只有 list / get）。
7. 完成后在飞书回一句摘要（改了哪张表哪条记录 + 关键字段的前后值）。

**例外边界**：只允许上述这一个 Runner + 它固定配置指向的那一个 Base。
不借此例外访问其它 Base / Sheet / 凭证 / 目录，不做迁移、调度或物理删除类操作。
'''

# §4.1 and §4.2 both say "two exceptions"; a third makes that wording false.
REWORDS = [
    ("以下是 CEO 预授权的**两个**工具/写入例外之一（另一个见 §4.2）",
     "以下是 CEO 预授权的**三个**工具/写入例外之一（另两个见 §4.2、§4.3）"),
    ("第二个 CEO 预授权例外。与 §4.1 是两条独立流程",
     "第二个 CEO 预授权例外。与 §4.1、§4.3 是三条独立流程"),
]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()

    if not SOUL.is_file():
        sys.exit(f"not found: {SOUL}")
    text = SOUL.read_text(encoding="utf-8")

    if re.search(r"^## 4\.3 ", text, re.M):
        # Already patched. If the bot still cannot see it the problem is elsewhere, so print
        # what can be checked from the file itself without disclosing its contents.
        print("§4.3 已存在，无需重复添加。\n")
        print("--- 诊断（Bot 仍看不到时看这里）---")
        print(f"文件        : {SOUL}")
        print(f"最后修改    : {datetime.fromtimestamp(SOUL.stat().st_mtime):%Y-%m-%d %H:%M:%S}")
        print(f"章节顺序    : {' '.join(re.findall(r'^## (\S+)', text, re.M))}")
        body = re.split(r"^## ", text, flags=re.M)
        sec43 = next((b for b in body if b.startswith("4.3 ")), "")
        print(f"§4.3 行数   : {len(sec43.splitlines())}")
        print(f"含固定命令行: {'/usr/bin/env node' in sec43}")
        print(f"含绝对路径  : {'/Users/awayer_mini/gengrowth-ops' in sec43}")
        stale = [a for a, _ in REWORDS if a in text]
        print(f"残留「两个」: {len(stale)}/2 处" + ("  <- 规则自相矛盾，Bot 会按「只有两个例外」执行" if stale else "  （已修正）"))
        print()
        if not stale:
            print("若以上都正常，那就是会话没重载：在 # social assistant 群发 /reset。")
            print("再不行，让 Bot 原样列出它当前的 terminal 允许流程——它会照实列，一眼看得出。")
            return
        # §4.3 present but the "two exceptions" wording still stands: the bot reads that as
        # authoritative and ignores the third entry. Fixing the wording is the whole repair.
        print("§4.3 已在文件中，但上面那句「两个」还在，Bot 会据此忽略它。")
        fixed = text
        for a, b in REWORDS:
            fixed = fixed.replace(a, b)
        if not args.apply:
            print("加 --apply 修正措辞（会先备份）。")
            return
        backup = SOUL.with_suffix(f".md.bak-{datetime.now():%Y%m%d-%H%M%S}")
        shutil.copy2(SOUL, backup)
        SOUL.write_text(fixed, encoding="utf-8")
        print(f"已修正 {len(stale)} 处措辞。备份: {backup}")
        print("下一步：在 # social assistant 群里发 /reset。")
        return

    m = re.search(r"^## 4\.2 .*$", text, re.M)
    if not m:
        sys.exit("找不到 §4.2 标题，结构与预期不符，请人工插入。")
    nxt = re.search(r"^## (?!4\.2)", text[m.end():], re.M)
    at = m.end() + (nxt.start() if nxt else len(text) - m.end())

    patched = text[:at].rstrip("\n") + "\n\n" + SECTION + "\n" + text[at:].lstrip("\n")
    reworded = sum(1 for a, b in REWORDS if a in patched)
    for a, b in REWORDS:
        patched = patched.replace(a, b)

    print(f"文件      : {SOUL}")
    print(f"插入位置  : §4.2 之后" + ("（其后有 " + text[at:at+40].split(chr(10))[0].strip() + "）" if nxt else "（文件末尾）"))
    print(f"新增       : §4.3，{len(SECTION.splitlines())} 行")
    print(f"措辞修正  : {reworded}/2 处（「两个」→「三个」）")
    if reworded < 2:
        print("           注意：有措辞没匹配上，改完请人工确认 §4.1/§4.2 开头不再写「两个」。")
    print(f"章节       : {' '.join(re.findall(r'^## (\S+)', patched, re.M))}")

    if not args.apply:
        print("\n以上是预览，未写入。确认后加 --apply 重跑。")
        return

    backup = SOUL.with_suffix(f".md.bak-{datetime.now():%Y%m%d-%H%M%S}")
    shutil.copy2(SOUL, backup)
    SOUL.write_text(patched, encoding="utf-8")
    print(f"\n已写入。备份: {backup}")
    print("下一步：在 # social assistant 群里发 /reset，然后我会自动跑端到端验证。")

main()
