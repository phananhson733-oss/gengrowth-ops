#!/usr/bin/env python3
"""把本机 Obsidian Git 插件配置改成"冲突安全"：不自动裸推，交给加固过的
py 同步引擎（system git，遵守 .gitattributes 的 union 合并）。

为什么：Obsidian Git 插件在桌面端默认用 isomorphic-git，它**不支持**
.gitattributes 的 union 合并驱动，也没有 push 重试；多机并发下它自己
commit+push 就是 non-fast-forward / 记录被打回的源头。让插件只做本地编辑、
由 obsidian-vault-git-sync.py 经 launchd 统一推送，才能全网真正生效。

改动（对每个找到的 .obsidian/plugins/obsidian-git/data.json）：
  autoSaveInterval=0, autoPushInterval=0, autoPullInterval=0,
  autoBackupAfterFileChange=false, disablePush=true, pullBeforePush=true
改前自动备份为 data.json.bak.{timestamp}。

用法:
  python3 tools/scripts/set-obsidian-git-safe-config.py               # 自动发现 wiki/ops 库
  python3 tools/scripts/set-obsidian-git-safe-config.py --vault /path # 指定库根
  python3 tools/scripts/set-obsidian-git-safe-config.py --dry-run
"""
from __future__ import annotations

import argparse
import json
import os
import time
from pathlib import Path

SAFE = {
    "autoSaveInterval": 0,
    "autoPushInterval": 0,
    "autoPullInterval": 0,
    "autoBackupAfterFileChange": False,
    "disablePush": True,
    "pullBeforePush": True,
}

REL = ".obsidian/plugins/obsidian-git/data.json"


def discover_vaults() -> list[Path]:
    found: list[Path] = []
    seen: set[Path] = set()
    home = Path.home()
    roots = [home, home / "code", home / "Code", home / "Documents"]
    names = ["gengrowth-wiki", "GenGrowth-wiki", "gengrowth-ops"]
    # 脚本所在仓库（tools/scripts/ 上两级）也算一个候选
    here = Path(__file__).resolve().parents[2]
    for cand in [here, *[r / n for r in roots for n in names]]:
        try:
            rp = cand.resolve()
        except OSError:
            continue
        if rp in seen:
            continue
        if (rp / REL).exists():
            seen.add(rp)
            found.append(rp)
    return found


def apply(data_json: Path, dry_run: bool) -> tuple[bool, str]:
    try:
        cfg = json.loads(data_json.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001
        return False, f"读取失败: {exc}"
    diff = {k: (cfg.get(k), v) for k, v in SAFE.items() if cfg.get(k) != v}
    if not diff:
        return True, "已是安全配置，无需改动"
    if dry_run:
        return True, "would set " + ", ".join(f"{k}:{a}->{b}" for k, (a, b) in diff.items())
    bak = data_json.with_suffix(f".json.bak.{int(time.time())}")
    bak.write_text(data_json.read_text(encoding="utf-8"), encoding="utf-8")
    cfg.update(SAFE)
    data_json.write_text(json.dumps(cfg, ensure_ascii=False, indent=2), encoding="utf-8")
    return True, "已改: " + ", ".join(f"{k}:{a}->{b}" for k, (a, b) in diff.items()) + f"（备份 {bak.name}）"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--vault", action="append", help="库根路径，可重复；默认自动发现")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    vaults = [Path(v) for v in args.vault] if args.vault else discover_vaults()
    if not vaults:
        print("没找到任何带 obsidian-git 的库（用 --vault 指定）")
        return 1
    rc = 0
    for v in vaults:
        dj = v / REL
        if not dj.exists():
            print(f"[skip] {v}: 无 {REL}")
            continue
        ok, msg = apply(dj, args.dry_run)
        print(f"[{'ok' if ok else '!!'}] {v.name}: {msg}")
        if not ok:
            rc = 1
    print("\n提示：插件改为不自动推后，请用 launchd 让 py 引擎接管推送：")
    print("  bash tools/scripts/install-sync-launchd.sh")
    return rc


if __name__ == "__main__":
    raise SystemExit(main())
