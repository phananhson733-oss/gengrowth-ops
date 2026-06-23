"""v2.5.9:cmd_refresh_dashboard 必须与 ingest/fetch 共用 baoxiao.lock。
锁被 ingest 持有时,refresh 静默退出不写盘;launchd 2s 后下个 tick 再来。

防的是:ingest 中途改了 ledger 文件;watch refresh 读到旧版,
再写回去把 ingest 的改动覆盖回去(read-modify-write 竞态)。
"""
import argparse
import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock


BAOXIAO_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BAOXIAO_DIR))


def _load(name):
    spec = importlib.util.spec_from_file_location(name, BAOXIAO_DIR / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


cli = _load("cli")
ledger = _load("ledger")
lock = _load("lock")


class RefreshDashboardLockSharedTests(unittest.TestCase):
    def test_lock_path_is_shared_module_constant(self):
        # 集成层断言:不再用 inbox.parent / "baoxiao.lock" 拼,
        # 三个写命令(ingest / fetch / refresh)统一指向 HERE / baoxiao.lock。
        self.assertEqual(cli.BAOXIAO_LOCK_PATH, cli.HERE / "baoxiao.lock")


class RefreshDashboardLockBusyTests(unittest.TestCase):
    """锁被 ingest 持有 → refresh 静默退出。验证 ledger.refresh_dashboard 未被调用。"""

    def setUp(self):
        # 暂存真实 BAOXIAO_LOCK_PATH,测试用 tmp 路径避免污染开发机
        self._orig_lock = cli.BAOXIAO_LOCK_PATH
        self.tmpdir = tempfile.mkdtemp()
        cli.BAOXIAO_LOCK_PATH = Path(self.tmpdir) / "baoxiao.lock"

    def tearDown(self):
        cli.BAOXIAO_LOCK_PATH = self._orig_lock
        import shutil
        shutil.rmtree(self.tmpdir, ignore_errors=True)

    def _args(self):
        return argparse.Namespace(month=None, ledger_root=str(self.tmpdir))

    def test_busy_lock_skips_refresh_silently(self):
        # 模拟 ingest 正持锁
        holder = lock.FileLock(cli.BAOXIAO_LOCK_PATH)
        self.assertTrue(holder.acquire())
        try:
            with mock.patch.object(cli, "_do_refresh_dashboard") as m:
                # 不应抛 LockBusy(命令静默退出),也不应进入实际刷新
                cli.cmd_refresh_dashboard(self._args())
                m.assert_not_called()
        finally:
            holder.release()

    def test_free_lock_enters_refresh(self):
        # 锁空 → 正常进入 _do_refresh_dashboard,并把锁释放
        with mock.patch.object(cli, "_do_refresh_dashboard") as m:
            cli.cmd_refresh_dashboard(self._args())
            m.assert_called_once()
        # 锁应被释放(目录不存在)
        self.assertFalse(cli.BAOXIAO_LOCK_PATH.exists())

    def test_sync_filenames_noop_on_unmerged(self):
        # _sync_filenames 含 conflict markers 时返回 0 不重写,
        # 避免 file-link 替换把 marker 一起吞掉。
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "Lynne.md"
            p.write_text(
                "---\ntitle: t\n---\n\n### 1. desc\n"
                "<<<<<<< HEAD\nfoo\n=======\nbar\n>>>>>>> origin/main\n",
                encoding="utf-8",
            )
            before = p.read_text(encoding="utf-8")
            n = cli._sync_filenames(p, Path(tmp))
            self.assertEqual(n, 0)
            self.assertEqual(p.read_text(encoding="utf-8"), before)

    def test_refresh_releases_lock_even_if_inner_raises(self):
        # _do_refresh_dashboard 抛异常 → 锁仍应释放,避免下个 tick 永远抢不到
        with mock.patch.object(cli, "_do_refresh_dashboard",
                               side_effect=RuntimeError("boom")):
            with self.assertRaises(RuntimeError):
                cli.cmd_refresh_dashboard(self._args())
        self.assertFalse(cli.BAOXIAO_LOCK_PATH.exists())


if __name__ == "__main__":
    unittest.main()
