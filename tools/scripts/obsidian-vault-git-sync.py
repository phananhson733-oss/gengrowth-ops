#!/usr/bin/env python3
from __future__ import annotations

import argparse
import fcntl
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Iterable, List, NamedTuple


class RepoConfig(NamedTuple):
    name: str
    path: Path
    branch: str = "main"


class SyncResult(NamedTuple):
    name: str
    ok: bool
    message: str
    changed: bool = False


HOME = Path.home()
SCRIPT_DIR = Path(__file__).resolve().parent
LOCK_PATH = Path(os.getenv("GENGROWTH_VAULT_SYNC_LOCK", HOME / ".cache" / "gengrowth-vault-sync.lock"))

COMMON_REPO_NAMES = (
    "gengrowth-wiki",
    "GenGrowth-wiki",
    "gengrowth-ops",
    "gengrowth-flow-mvp",
    "gengrowth-agents",
)

AUTO_MERGE_JSON_PATHS = {
    "inbox/06-tasks/tasks/.autopilot-claims.json",
}

SECRET_NAME_RE = re.compile(
    r"(^|/)(\.env(\..*)?|.*\.(pem|key|p12|pfx|crt|cer))$",
    re.IGNORECASE,
)
SECRET_TEXT_RE = re.compile(
    r"ghp_[A-Za-z0-9_]{20,}|"
    r"sk-[A-Za-z0-9]{20,}|"
    r"xox[baprs]-[A-Za-z0-9-]{20,}|"
    r"-----BEGIN [A-Z ]*PRIVATE KEY-----|"
    r"(api[_-]?key|secret|token|password)\s*[:=]\s*['\"]?(?!(process|import|os|env)\.)[A-Za-z0-9_./+=-]{24,}",
    re.IGNORECASE,
)
REF_LOCK_RACE_RE = re.compile(
    r"cannot lock ref 'refs/remotes/origin/(?P<branch>[^']+)'.*unable to update local ref",
    re.DOTALL,
)


def git(repo: Path, *args: str, check: bool = False) -> subprocess.CompletedProcess[str]:
    env = os.environ.copy()
    if args[:2] == ("rebase", "--continue"):
        env.setdefault("GIT_EDITOR", "true")
    proc = subprocess.run(["git", *args], cwd=repo, text=True, capture_output=True, env=env)
    if check and proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or proc.stdout.strip() or f"git {' '.join(args)} failed")
    return proc


def git_paths(repo: Path, *args: str) -> List[str]:
    proc = subprocess.run(["git", *args], cwd=repo, capture_output=True)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.decode("utf-8", errors="ignore").strip() or f"git {' '.join(args)} failed")
    return [p.decode("utf-8", errors="surrogateescape") for p in proc.stdout.split(b"\0") if p]


def repo_root(path: Path) -> Path | None:
    proc = subprocess.run(["git", "rev-parse", "--show-toplevel"], cwd=path, text=True, capture_output=True)
    if proc.returncode != 0:
        return None
    return Path(proc.stdout.strip()).resolve()


def discover_repos() -> List[RepoConfig]:
    candidates: list[Path] = []
    here_root = repo_root(SCRIPT_DIR)
    if here_root is not None:
        candidates.append(here_root)
        for name in COMMON_REPO_NAMES:
            candidates.append(here_root.parent / name)
    for name in COMMON_REPO_NAMES:
        candidates.append(HOME / name)
        candidates.append(HOME / "code" / name)
        candidates.append(HOME / "Code" / name)
        candidates.append(HOME / "Documents" / name)

    seen: set[Path] = set()
    repos: list[RepoConfig] = []
    for candidate in candidates:
        try:
            resolved = candidate.expanduser().resolve()
        except OSError:
            continue
        if resolved in seen or not (resolved / ".git").exists():
            continue
        seen.add(resolved)
        repos.append(RepoConfig(resolved.name, resolved))
    return repos


def dirty_paths(repo: Path) -> List[str]:
    tracked = git_paths(repo, "ls-files", "-m", "-d", "-o", "--exclude-standard", "-z")
    return sorted(set(tracked))


def staged_paths(repo: Path) -> List[str]:
    return git_paths(repo, "diff", "--cached", "--name-only", "-z")


def unmerged_paths(repo: Path) -> List[str]:
    return git_paths(repo, "diff", "--name-only", "--diff-filter=U", "-z")


def ahead_behind(repo: Path, branch: str) -> tuple[int, int]:
    proc = git(repo, "rev-list", "--left-right", "--count", f"HEAD...origin/{branch}", check=True)
    ahead, behind = proc.stdout.strip().split()
    return int(ahead), int(behind)


def is_ref_lock_race(detail: str, branch: str) -> bool:
    match = REF_LOCK_RACE_RE.search(detail)
    return bool(match and match.group("branch") == branch)


def refs_already_converged(repo: Path, branch: str) -> bool:
    try:
        return ahead_behind(repo, branch) == (0, 0)
    except Exception:
        return False


def fetch_origin(repo: Path, branch: str) -> tuple[bool, str]:
    last_detail = ""
    for attempt in range(3):
        try:
            fetch = git(repo, "fetch", "origin", "--prune")
            if fetch.returncode == 0:
                return True, ""
            last_detail = fetch.stderr.strip() or fetch.stdout.strip() or "git fetch origin --prune failed"
        except RuntimeError as exc:
            last_detail = str(exc)

        if not is_ref_lock_race(last_detail, branch):
            return False, last_detail
        if refs_already_converged(repo, branch):
            return True, "fetch raced; refs already converged"
        if attempt < 2:
            time.sleep(0.2)

    if is_ref_lock_race(last_detail, branch) and refs_already_converged(repo, branch):
        return True, "fetch raced; refs already converged"
    return False, last_detail


def has_secret_name(path: str) -> bool:
    return bool(SECRET_NAME_RE.search(path))


def has_secret_text(path: Path) -> bool:
    try:
        if not path.is_file() or path.stat().st_size > 1024 * 1024:
            return False
        text = path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return False
    return bool(SECRET_TEXT_RE.search(text))


def suspicious_paths(repo: Path, paths: Iterable[str]) -> List[str]:
    found: List[str] = []
    for rel in paths:
        if has_secret_name(rel) or has_secret_text(repo / rel):
            found.append(rel)
    return found


def abort_in_progress(repo: Path) -> None:
    git(repo, "rebase", "--abort")
    git(repo, "merge", "--abort")


def commit_dirty(repo: Path, dry_run: bool) -> tuple[bool, str]:
    paths = dirty_paths(repo)
    if not paths:
        return False, "clean"

    suspicious = suspicious_paths(repo, paths)
    if suspicious:
        sample = "; ".join(suspicious[:5])
        raise RuntimeError(f"疑似密钥/凭证文件未自动提交：{sample}")

    if dry_run:
        return True, f"would commit {len(paths)} path(s)"

    git(repo, "add", "-A", "--", ".", check=True)
    staged = staged_paths(repo)
    if not staged:
        return False, "no staged changes"

    msg = f"vault backup: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    git(repo, "commit", "-m", msg, check=True)
    return True, f"committed {len(staged)} path(s)"


def read_stage_json(repo: Path, stage: int, rel: str) -> dict:
    raw = subprocess.check_output(["git", "show", f":{stage}:{rel}"], cwd=repo)
    data = json.loads(raw)
    if not isinstance(data, dict):
        raise ValueError(f"{rel} is not a JSON object")
    return data


def auto_merge_json_conflicts(repo: Path) -> tuple[bool, str]:
    conflicts = unmerged_paths(repo)
    mergeable = [path for path in conflicts if path in AUTO_MERGE_JSON_PATHS]
    if not mergeable or len(mergeable) != len(conflicts):
        return False, ""

    messages: list[str] = []
    for rel in mergeable:
        upstream = read_stage_json(repo, 2, rel)
        local = read_stage_json(repo, 3, rel)
        # Prefer upstream for duplicate keys, keep local-only historical claims.
        merged = {**local, **upstream}
        (repo / rel).write_text(
            json.dumps(merged, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )
        git(repo, "add", "--", rel, check=True)
        messages.append(f"auto-merged {rel} ({len(local)} local, {len(upstream)} upstream)")
    return True, "; ".join(messages)


def pull_rebase(repo: Path, branch: str) -> tuple[bool, str]:
    rebase = git(repo, "rebase", f"origin/{branch}")
    if rebase.returncode == 0:
        return True, "rebased"

    merged, message = auto_merge_json_conflicts(repo)
    if not merged:
        abort_in_progress(repo)
        detail = rebase.stderr.strip() or rebase.stdout.strip() or "rebase failed"
        return False, f"pull/rebase 冲突或失败，已中止：{detail}"

    cont = git(repo, "rebase", "--continue")
    if cont.returncode != 0:
        abort_in_progress(repo)
        detail = cont.stderr.strip() or cont.stdout.strip() or "rebase --continue failed"
        return False, f"JSON 冲突已合并但 rebase 继续失败，已中止：{detail}"
    return True, message


def sync_repo(cfg: RepoConfig, dry_run: bool = False) -> SyncResult:
    repo = cfg.path
    name = cfg.name
    branch = cfg.branch
    if not repo.exists():
        return SyncResult(name, False, f"{name}: 目录不存在 {repo}")
    if not (repo / ".git").exists():
        return SyncResult(name, False, f"{name}: 不是 git 仓库 {repo}")

    try:
        fetched, fetch_detail = fetch_origin(repo, branch)
        if not fetched:
            return SyncResult(name, False, f"{name}: fetch 失败：{fetch_detail}")

        conflicts = unmerged_paths(repo)
        if conflicts:
            return SyncResult(name, False, f"{name}: 存在未解决冲突，未自动同步：{'; '.join(conflicts[:5])}")

        changed, commit_summary = commit_dirty(repo, dry_run)
        if dry_run and changed:
            ahead, behind = ahead_behind(repo, branch)
            bits = [commit_summary]
            if behind > 0:
                bits.append(f"would rebase {behind} remote commit(s)")
            bits.append("would push local commit(s)")
            return SyncResult(name, True, f"{name}: " + ", ".join(bits), True)

        if dirty_paths(repo):
            return SyncResult(name, False, f"{name}: 仍有未提交文件，未 pull/push")

        ahead, behind = ahead_behind(repo, branch)
        pulled = ""
        pushed = False

        # dry-run 只报告意图，不改状态（保持原行为；behind 优先）。
        if dry_run:
            if behind > 0:
                return SyncResult(name, True, f"{name}: {commit_summary}; would rebase {behind} remote commit(s)", True)
            if ahead > 0:
                return SyncResult(name, True, f"{name}: {commit_summary}; would push {ahead} commit(s)", True)

        # 多机/多人并发自动同步下，push 可能与别机的 push 撞车（non-fast-forward）。
        # 整体 fetch→rebase→push 重试若干轮：后到者自动再 rebase 一次，而不是
        # 失败后干等下一轮 cron。全程只用普通 push，绝不 --force/--force-with-lease。
        last_detail = ""
        for attempt in range(3):
            ahead, behind = ahead_behind(repo, branch)
            if behind > 0:
                ok, pulled = pull_rebase(repo, branch)
                if not ok:
                    return SyncResult(name, False, f"{name}: {pulled}")
                ahead, behind = ahead_behind(repo, branch)
            if behind > 0:
                return SyncResult(name, False, f"{name}: rebase 后仍落后远端 {behind} 个提交，未推送")
            if ahead == 0:
                break
            push = git(repo, "push", "origin", f"HEAD:{branch}")
            if push.returncode == 0:
                pushed = True
                break
            last_detail = push.stderr.strip() or push.stdout.strip() or "push failed"
            # 大概率是别机刚 push 造成 non-fast-forward：重新 fetch，下一轮再 rebase+push。
            fetched, fetch_detail = fetch_origin(repo, branch)
            if not fetched:
                return SyncResult(name, False, f"{name}: push 重试中 fetch 失败：{fetch_detail}")
            time.sleep(1.5 * (attempt + 1))
        else:
            return SyncResult(name, False, f"{name}: push 失败（重试 3 次仍 non-fast-forward）：{last_detail}")

        if changed or pulled or pushed:
            bits = [commit_summary]
            if pulled:
                bits.append(pulled)
            if pushed:
                bits.append("pushed")
            return SyncResult(name, True, f"{name}: " + ", ".join(bits), True)
        return SyncResult(name, True, f"{name}: clean")
    except Exception as exc:
        abort_in_progress(repo)
        return SyncResult(name, False, f"{name}: {exc}")


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Safely commit, pull/rebase, and push shared Obsidian git vault repos.")
    parser.add_argument("--repo", action="append", help="Repo path to sync. Can be repeated. Defaults to discovered GenGrowth repos.")
    parser.add_argument("--dry-run", action="store_true", help="Report intended actions without changing git state.")
    parser.add_argument("--verbose", action="store_true", help="Print successful actions as well as blockers.")
    return parser.parse_args(argv)


def repo_configs(args: argparse.Namespace) -> List[RepoConfig]:
    if args.repo:
        return [RepoConfig(Path(path).expanduser().resolve().name, Path(path).expanduser().resolve()) for path in args.repo]
    repos = discover_repos()
    if not repos:
        cwd_root = repo_root(Path.cwd())
        if cwd_root is not None:
            repos = [RepoConfig(cwd_root.name, cwd_root)]
    return repos


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    repos = repo_configs(args)
    if not repos:
        print("Obsidian vault git sync 需要关注：")
        print("- 未发现可同步的 git repo；请用 --repo /path/to/repo 指定。")
        return 0

    LOCK_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOCK_PATH.open("w") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            return 0
        results = [sync_repo(cfg, dry_run=args.dry_run) for cfg in repos]

    blockers = [r.message for r in results if not r.ok]
    actions = [r.message for r in results if r.ok and r.changed]
    if blockers:
        print("Obsidian vault git sync 需要关注：")
        for item in blockers:
            print(f"- {item}")
    elif args.verbose and actions:
        print("Obsidian vault git sync 已处理：")
        for item in actions:
            print(f"- {item}")
    elif args.verbose:
        print("Obsidian vault git sync: clean")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
