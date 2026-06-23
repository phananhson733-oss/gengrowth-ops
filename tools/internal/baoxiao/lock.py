"""防并发锁:原子 mkdir 锁 + stale 回收。

防 launchd 轮询与手动运行并发处理同一批发票。
原子 mkdir 是跨进程原子的;持有者崩溃不 release 时,超过 stale_seconds
的旧锁可被下一次抢占,避免一次 crash 后永远跑不起来(Codex #16)。
"""

import os
import time
from pathlib import Path

DEFAULT_STALE_SECONDS = 30 * 60


class LockBusy(Exception):
    pass


class FileLock:
    def __init__(self, path, stale_seconds=DEFAULT_STALE_SECONDS):
        self.path = Path(path)
        self.stale_seconds = stale_seconds
        self._held = False

    def acquire(self):
        try:
            os.mkdir(self.path)
            self._held = True
            return True
        except FileExistsError:
            if self._is_stale():
                try:
                    os.rmdir(self.path)
                    os.mkdir(self.path)
                    self._held = True
                    return True
                except OSError:
                    return False  # 别人抢先回收/重建了
            return False

    def _is_stale(self):
        try:
            return (time.time() - os.path.getmtime(self.path)) > self.stale_seconds
        except OSError:
            return False

    def release(self):
        if self._held:
            try:
                os.rmdir(self.path)
            finally:
                self._held = False

    def __enter__(self):
        if not self.acquire():
            raise LockBusy(f"锁被占用: {self.path}")
        return self

    def __exit__(self, exc_type, exc, tb):
        self.release()
        return False
