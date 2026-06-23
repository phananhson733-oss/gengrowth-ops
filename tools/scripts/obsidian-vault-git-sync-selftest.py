#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import subprocess
import tempfile
from pathlib import Path


SCRIPT = Path(__file__).with_name("obsidian-vault-git-sync.py")


def run(cwd: Path, *args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    proc = subprocess.run(["git", *args], cwd=cwd, text=True, capture_output=True)
    if check and proc.returncode != 0:
        raise AssertionError(
            f"git {' '.join(args)} failed in {cwd}\nstdout={proc.stdout}\nstderr={proc.stderr}"
        )
    return proc


def load_module():
    spec = importlib.util.spec_from_file_location("obsidian_vault_git_sync", SCRIPT)
    if spec is None or spec.loader is None:
        raise AssertionError("could not load sync script")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def configure_repo(repo: Path) -> None:
    run(repo, "config", "user.name", "test-user")
    run(repo, "config", "user.email", "test@example.com")


def test_commit_pull_rebase_push() -> None:
    module = load_module()

    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        remote = root / "remote.git"
        repo = root / "vault"
        peer = root / "peer"

        subprocess.run(["git", "init", "--bare", str(remote)], check=True, capture_output=True)
        subprocess.run(["git", "init", str(repo)], check=True, capture_output=True)
        configure_repo(repo)
        run(repo, "branch", "-M", "main")
        run(repo, "remote", "add", "origin", str(remote))
        (repo / "base.md").write_text("base\n", encoding="utf-8")
        run(repo, "add", "base.md")
        run(repo, "commit", "-m", "initial")
        run(repo, "push", "-u", "origin", "main")

        subprocess.run(["git", "clone", str(remote), str(peer)], check=True, capture_output=True)
        configure_repo(peer)
        run(peer, "checkout", "main")
        (peer / "remote.md").write_text("remote\n", encoding="utf-8")
        run(peer, "add", "remote.md")
        run(peer, "commit", "-m", "remote change")
        run(peer, "push", "origin", "main")

        (repo / "local.md").write_text("local\n", encoding="utf-8")
        result = module.sync_repo(module.RepoConfig("test-vault", repo, "main"), dry_run=False)

        if not result.ok:
            raise AssertionError(result.message)
        status = run(repo, "status", "--porcelain").stdout.strip()
        if status:
            raise AssertionError(f"repo should be clean after sync, got {status!r}")
        ahead_behind = run(repo, "rev-list", "--left-right", "--count", "HEAD...origin/main").stdout.strip()
        if ahead_behind != "0\t0":
            raise AssertionError(f"repo should be synced, got {ahead_behind!r}")


def test_json_add_add_conflict_merges_keys() -> None:
    module = load_module()

    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        remote = root / "remote.git"
        repo = root / "vault"
        peer = root / "peer"
        rel = Path("inbox/06-tasks/tasks/.autopilot-claims.json")

        subprocess.run(["git", "init", "--bare", str(remote)], check=True, capture_output=True)
        subprocess.run(["git", "init", str(repo)], check=True, capture_output=True)
        configure_repo(repo)
        run(repo, "branch", "-M", "main")
        run(repo, "remote", "add", "origin", str(remote))
        (repo / "base.md").write_text("base\n", encoding="utf-8")
        run(repo, "add", "base.md")
        run(repo, "commit", "-m", "initial")
        run(repo, "push", "-u", "origin", "main")

        subprocess.run(["git", "clone", str(remote), str(peer)], check=True, capture_output=True)
        configure_repo(peer)
        run(peer, "checkout", "main")
        (peer / rel.parent).mkdir(parents=True)
        (peer / rel).write_text('{"remote": {"status": "done"}}\n', encoding="utf-8")
        run(peer, "add", str(rel))
        run(peer, "commit", "-m", "remote claims")
        run(peer, "push", "origin", "main")

        (repo / rel.parent).mkdir(parents=True)
        (repo / rel).write_text('{"local": {"status": "done"}}\n', encoding="utf-8")
        result = module.sync_repo(module.RepoConfig("test-vault", repo, "main"), dry_run=False)

        if not result.ok:
            raise AssertionError(result.message)
        text = (repo / rel).read_text(encoding="utf-8")
        if '"local"' not in text or '"remote"' not in text:
            raise AssertionError(f"json conflict was not merged: {text}")


def test_dry_run_reports_intended_commit_without_dirty_blocker() -> None:
    module = load_module()

    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        remote = root / "remote.git"
        repo = root / "vault"

        subprocess.run(["git", "init", "--bare", str(remote)], check=True, capture_output=True)
        subprocess.run(["git", "init", str(repo)], check=True, capture_output=True)
        configure_repo(repo)
        run(repo, "branch", "-M", "main")
        run(repo, "remote", "add", "origin", str(remote))
        (repo / "base.md").write_text("base\n", encoding="utf-8")
        run(repo, "add", "base.md")
        run(repo, "commit", "-m", "initial")
        run(repo, "push", "-u", "origin", "main")

        (repo / "local.md").write_text("local\n", encoding="utf-8")
        result = module.sync_repo(module.RepoConfig("test-vault", repo, "main"), dry_run=True)

        if not result.ok:
            raise AssertionError(result.message)
        if "would" not in result.message:
            raise AssertionError(f"expected dry-run intent, got {result.message!r}")


def test_discover_repos_checks_home_code_layout() -> None:
    module = load_module()

    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        code_repo = root / "code" / "gengrowth-agents"
        code_repo.mkdir(parents=True)
        subprocess.run(["git", "init", str(code_repo)], check=True, capture_output=True)

        original_home = module.HOME
        try:
            module.HOME = root
            discovered = {cfg.path for cfg in module.discover_repos()}
        finally:
            module.HOME = original_home

        if code_repo.resolve() not in discovered:
            raise AssertionError(f"expected to discover repo under ~/code: {code_repo}")


def test_repository_wrapper_entrypoint_exists() -> None:
    repo = SCRIPT.parents[2]
    wrapper = repo / "scripts" / "obsidian-vault-git-sync.sh"

    if not wrapper.exists():
        raise AssertionError(f"expected wrapper at {wrapper}")
    if "obsidian-vault-git-sync.py" not in wrapper.read_text(encoding="utf-8"):
        raise AssertionError(f"wrapper should call shared sync script: {wrapper}")
    proc = subprocess.run(["bash", "-n", str(wrapper)], text=True, capture_output=True)
    if proc.returncode != 0:
        raise AssertionError(f"wrapper shell syntax failed\nstdout={proc.stdout}\nstderr={proc.stderr}")


if __name__ == "__main__":
    test_commit_pull_rebase_push()
    test_json_add_add_conflict_merges_keys()
    test_dry_run_reports_intended_commit_without_dirty_blocker()
    test_discover_repos_checks_home_code_layout()
    test_repository_wrapper_entrypoint_exists()
    print("obsidian-vault-git-sync-selftest: ok")
