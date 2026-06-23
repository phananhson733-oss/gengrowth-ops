#!/usr/bin/env python3
"""
Normalize HR docx placeholders from underscore glyphs to real underline blanks.

This keeps source markdown simple while making exported Word files look like
fillable forms instead of dashed underscore text.
"""

from __future__ import annotations

import copy
import re
import sys
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET

NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "xml": "http://www.w3.org/XML/1998/namespace",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
XML_SPACE = "{http://www.w3.org/XML/1998/namespace}space"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
PLACEHOLDER_RE = re.compile(r"[＿_]+")
REL_ID_RE = re.compile(r'Id="rId(\d+)"')
FOOTER_XML = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
       xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
       mc:Ignorable="w14 wp14">
  <w:p>
    <w:pPr>
      <w:pStyle w:val="Footer"/>
      <w:jc w:val="center"/>
    </w:pPr>
    <w:r>
      <w:rPr><w:sz w:val="18"/></w:rPr>
      <w:t xml:space="preserve">第 </w:t>
    </w:r>
    <w:fldSimple w:instr=" PAGE ">
      <w:r>
        <w:rPr><w:sz w:val="18"/></w:rPr>
        <w:t>1</w:t>
      </w:r>
    </w:fldSimple>
    <w:r>
      <w:rPr><w:sz w:val="18"/></w:rPr>
      <w:t xml:space="preserve"> 页</w:t>
    </w:r>
  </w:p>
</w:ftr>
""".encode("utf-8")


def add_underline(rpr: ET.Element) -> None:
    u = rpr.find(f"{W}u")
    if u is None:
        u = ET.SubElement(rpr, f"{W}u")
    u.set(f"{W}val", "single")


def clone_rpr(run: ET.Element) -> ET.Element | None:
    rpr = run.find(f"{W}rPr")
    return copy.deepcopy(rpr) if rpr is not None else None


def make_run(text: str, base_rpr: ET.Element | None, underline: bool) -> ET.Element:
    run = ET.Element(f"{W}r")
    if base_rpr is not None:
        rpr = copy.deepcopy(base_rpr)
    else:
        rpr = ET.Element(f"{W}rPr")
    if underline:
        add_underline(rpr)
    if len(rpr):
        run.append(rpr)
    t = ET.SubElement(run, f"{W}t")
    if text.startswith(" ") or text.endswith(" ") or "  " in text:
        t.set(XML_SPACE, "preserve")
    t.text = text
    return run


def is_underlined_blank_run(run: ET.Element) -> bool:
    texts = run.findall(f"{W}t")
    if not texts:
        return False
    raw = "".join(t.text or "" for t in texts)
    if not raw or any(ch not in {" ", "\u3000"} for ch in raw):
        return False
    rpr = run.find(f"{W}rPr")
    if rpr is None:
        return False
    return rpr.find(f"{W}u") is not None


def ensure_visible_trailing_blank(paragraph: ET.Element) -> bool:
    children = list(paragraph)
    if not children:
        return False
    last = children[-1]
    if last.tag != f"{W}r" or not is_underlined_blank_run(last):
        return False
    spacer = make_run("\u3000", clone_rpr(last), underline=False)
    paragraph.append(spacer)
    return True


def split_placeholder_run(run: ET.Element) -> list[ET.Element] | None:
    texts = run.findall(f".//{W}t")
    if not texts:
        return None
    raw = "".join(t.text or "" for t in texts)
    if not PLACEHOLDER_RE.search(raw):
        return None

    parts: list[ET.Element] = []
    base_rpr = clone_rpr(run)
    last = 0
    for match in PLACEHOLDER_RE.finditer(raw):
        if match.start() > last:
            parts.append(make_run(raw[last:match.start()], base_rpr, underline=False))
        blank = "\u3000" * (match.end() - match.start())
        parts.append(make_run(blank, base_rpr, underline=True))
        last = match.end()
    if last < len(raw):
        parts.append(make_run(raw[last:], base_rpr, underline=False))
    return parts


def process_paragraph(paragraph: ET.Element) -> bool:
    changed = False
    for child in list(paragraph):
        if child.tag != f"{W}r":
            continue
        replacement = split_placeholder_run(child)
        if not replacement:
            continue
        idx = list(paragraph).index(child)
        paragraph.remove(child)
        for offset, new_run in enumerate(replacement):
            paragraph.insert(idx + offset, new_run)
        changed = True
    changed = ensure_visible_trailing_blank(paragraph) or changed
    return changed


def process_xml(xml_bytes: bytes) -> bytes:
    root = ET.fromstring(xml_bytes)
    changed = False
    for paragraph in root.findall(f".//{W}p"):
        changed = process_paragraph(paragraph) or changed
    if not changed:
        return xml_bytes
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def ensure_footer_relationship(files: dict[str, bytes]) -> bool:
    changed = False

    content_types_name = "[Content_Types].xml"
    content = files[content_types_name].decode("utf-8", errors="ignore")
    footer_part = "/word/footer1.xml"
    footer_content_type = (
        '<Override PartName="/word/footer1.xml" '
        'ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>'
    )
    if footer_part not in content:
        content = content.replace("</Types>", f"{footer_content_type}</Types>")
        files[content_types_name] = content.encode("utf-8")
        changed = True

    rels_name = "word/_rels/document.xml.rels"
    rels = files[rels_name].decode("utf-8", errors="ignore")
    footer_target = 'Target="footer1.xml"'
    if footer_target in rels:
        match = re.search(r'Id="([^"]+)"[^>]+Target="footer1.xml"', rels)
        rel_id = match.group(1) if match else "rId10"
    else:
        rel_ids = [int(m.group(1)) for m in REL_ID_RE.finditer(rels)]
        rel_id = f"rId{(max(rel_ids) + 1) if rel_ids else 10}"
        rel_xml = (
            f'<Relationship Id="{rel_id}" '
            'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" '
            'Target="footer1.xml"/>'
        )
        rels = rels.replace("</Relationships>", f"{rel_xml}</Relationships>")
        files[rels_name] = rels.encode("utf-8")
        changed = True

    doc_name = "word/document.xml"
    root = ET.fromstring(files[doc_name])
    body = root.find(f"{W}body")
    if body is None:
        return changed
    sect_pr = body.find(f"{W}sectPr")
    if sect_pr is None:
        sect_pr = ET.SubElement(body, f"{W}sectPr")
        changed = True
    footer_ref = sect_pr.find(f"{W}footerReference")
    if footer_ref is None:
        footer_ref = ET.Element(f"{W}footerReference")
        footer_ref.set(f"{W}type", "default")
        footer_ref.set(f"{R}id", rel_id)
        insert_at = 0
        for idx, child in enumerate(list(sect_pr)):
            if child.tag in {f"{W}headerReference", f"{W}footerReference"}:
                insert_at = idx + 1
        sect_pr.insert(insert_at, footer_ref)
        files[doc_name] = ET.tostring(root, encoding="utf-8", xml_declaration=True)
        changed = True
    elif footer_ref.get(f"{R}id") != rel_id:
        footer_ref.set(f"{R}id", rel_id)
        files[doc_name] = ET.tostring(root, encoding="utf-8", xml_declaration=True)
        changed = True

    if files.get("word/footer1.xml") != FOOTER_XML:
        files["word/footer1.xml"] = FOOTER_XML
        changed = True

    return changed


def process_docx(path: Path) -> bool:
    with ZipFile(path) as zf:
        infos = zf.infolist()
        files = {info.filename: zf.read(info.filename) for info in infos}

    changed = False
    for name in list(files):
        if name.startswith("word/") and name.endswith(".xml"):
            new_bytes = process_xml(files[name])
            if new_bytes != files[name]:
                files[name] = new_bytes
                changed = True

    changed = ensure_footer_relationship(files) or changed

    if not changed:
        return False

    with ZipFile(path, "w") as zf:
        for info in infos:
            zf.writestr(info, files[info.filename])
        for name, data in files.items():
            if name not in {info.filename for info in infos}:
                zf.writestr(name, data)
    return True


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("Usage: postprocess_fill_lines.py <file.docx> [more.docx...]")
        return 1

    for raw in argv[1:]:
        path = Path(raw)
        if not path.exists():
            print(f"skip missing: {path}")
            continue
        changed = process_docx(path)
        print(f"{'updated' if changed else 'ok'}: {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
