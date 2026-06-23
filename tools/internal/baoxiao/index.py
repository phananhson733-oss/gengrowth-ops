"""本地记录索引:content_sha256 → 飞书 record_id。

仅作缓存加速(避免每票全表扫 = N+1),非权威源:
命中后仍须由 feishu 层 GET 校验 record_id(行可能被人工删/移)。
存仓库外路径;原子写,防被自动 git 备份逮到半截 JSON。
失效/损坏的文件按空索引处理,不让坏缓存阻断主流程。
"""

import json
import os
import tempfile
from pathlib import Path


class RecordIndex:
    def __init__(self, path):
        self.path = Path(path).expanduser()
        self._data = self._load()

    def _load(self):
        if not self.path.exists():
            return {}
        try:
            return json.loads(self.path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return {}  # 损坏缓存按空处理

    def get(self, key):
        return self._data.get(key)

    def set(self, key, record_id):
        self._data[key] = record_id
        self._save()

    def invalidate(self, key):
        if key in self._data:
            del self._data[key]
            self._save()

    def _save(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        fd, tmpname = tempfile.mkstemp(dir=str(self.path.parent))
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(self._data, f, ensure_ascii=False, indent=2)
            os.replace(tmpname, str(self.path))
        except BaseException:
            if os.path.exists(tmpname):
                os.unlink(tmpname)
            raise
