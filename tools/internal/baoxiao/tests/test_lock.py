import importlib.util
import os
import tempfile
import time
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "lock.py"
SPEC = importlib.util.spec_from_file_location("lock", MODULE_PATH)
lock = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(lock)


class FileLockTests(unittest.TestCase):
    def test_acquire_when_free(self):
        with tempfile.TemporaryDirectory() as tmp:
            lk = lock.FileLock(Path(tmp) / "ingest.lock")
            self.assertTrue(lk.acquire())
            self.assertTrue((Path(tmp) / "ingest.lock").exists())
            lk.release()

    def test_second_acquire_blocked(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "ingest.lock"
            a = lock.FileLock(p)
            b = lock.FileLock(p)
            self.assertTrue(a.acquire())
            self.assertFalse(b.acquire())
            a.release()

    def test_release_allows_reacquire(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "ingest.lock"
            a = lock.FileLock(p)
            self.assertTrue(a.acquire())
            a.release()
            self.assertTrue(lock.FileLock(p).acquire())

    def test_stale_lock_reclaimed(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "ingest.lock"
            self.assertTrue(lock.FileLock(p).acquire())  # 持有者"消失"(没 release)
            os.utime(p, (time.time() - 3600, time.time() - 3600))  # 把锁弄旧 1 小时
            fresh = lock.FileLock(p, stale_seconds=60)
            self.assertTrue(fresh.acquire())  # 旧锁被回收
            fresh.release()

    def test_context_manager_acquires_and_releases(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "ingest.lock"
            with lock.FileLock(p):
                self.assertTrue(p.exists())
            self.assertFalse(p.exists())

    def test_context_manager_busy_raises(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "ingest.lock"
            holder = lock.FileLock(p)
            holder.acquire()
            with self.assertRaises(lock.LockBusy):
                with lock.FileLock(p):
                    pass
            holder.release()


if __name__ == "__main__":
    unittest.main()
