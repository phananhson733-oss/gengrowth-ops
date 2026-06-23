"""发票归档:content_sha256 查重 + 原子写 + 同名碰撞追号。

归档是拷贝(不移动):源文件留在 _inbox 当队列,sync 全部成功后才删。
archive_invoice 返回 ArchiveResult,即使是重复内容也带回 path/hash,
让后续 feishu sync 在崩溃重跑时能继续(不返回裸"跳过")。
"""

import os
import shutil
import tempfile
from dataclasses import dataclass
from pathlib import Path

import identity
import naming


@dataclass
class ArchiveResult:
    path: Path
    content_hash: str
    reason: str  # "new" | "duplicate_content" | "collision_suffixed"
    is_new: bool


def _find_by_hash(root, content_hash):
    if not root.exists():
        return None
    for p in root.rglob("*"):
        if p.is_file() and identity.content_sha256(p) == content_hash:
            return p
    return None


def archive_invoice(src, archive_root, *, reimburser, period, category,
                    currency, amount, invoice_number=""):
    """归档发票。文件名 = {period}-{category}-{币种金额}[-{发票号末4位}].{ext}(对齐 task doc)。

    category 在 ingest 时定型,后续 Lynne 改账本不会回写文件名(account 是真相,文件名是归档快照)。
    """
    src = Path(src)
    archive_root = Path(archive_root)
    content_hash = identity.content_sha256(src)

    existing = _find_by_hash(archive_root, content_hash)
    if existing is not None:
        return ArchiveResult(existing, content_hash, "duplicate_content", False)

    ext = src.suffix.lstrip(".") or "bin"
    target_dir = archive_root / period / reimburser
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / naming.build_filename(period, category, currency, amount, ext)
    reason = "new"
    if target.exists():
        key = identity.normalize_invoice_key(invoice_number)
        suffix = key[-4:] if key else content_hash[:4]
        target = target_dir / naming.build_filename(
            period, category, currency, amount, ext, suffix=suffix
        )
        reason = "collision_suffixed"

    fd, tmpname = tempfile.mkstemp(dir=str(target_dir))
    os.close(fd)
    shutil.copyfile(str(src), tmpname)
    os.replace(tmpname, str(target))

    return ArchiveResult(target, content_hash, reason, True)
