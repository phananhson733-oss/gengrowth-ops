#!/usr/bin/env python3
"""Apply the Employee Handbook v1.1 print style to a generated DOCX."""

from __future__ import annotations

import shutil
import sys
import tempfile
import zipfile
import re
from pathlib import Path
from xml.etree import ElementTree as ET

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
REL = "http://schemas.openxmlformats.org/package/2006/relationships"
CT = "http://schemas.openxmlformats.org/package/2006/content-types"
XML = "http://www.w3.org/XML/1998/namespace"

for prefix, uri in {"w": W, "r": R}.items():
    ET.register_namespace(prefix, uri)


def q(ns: str, name: str) -> str:
    return f"{{{ns}}}{name}"


def ensure(parent: ET.Element, tag: str) -> ET.Element:
    child = parent.find(tag)
    if child is None:
        child = ET.SubElement(parent, tag)
    return child


def set_run_style(rpr: ET.Element, size: str, bold: bool = False) -> None:
    fonts = ensure(rpr, q(W, "rFonts"))
    for key in ("ascii", "hAnsi", "eastAsia", "cs"):
        fonts.set(q(W, key), "Microsoft YaHei")
    ensure(rpr, q(W, "sz")).set(q(W, "val"), size)
    ensure(rpr, q(W, "szCs")).set(q(W, "val"), size)
    if bold:
        ensure(rpr, q(W, "b"))


def patch_styles(path: Path) -> None:
    tree = ET.parse(path)
    root = tree.getroot()
    doc_defaults = ensure(root, q(W, "docDefaults"))
    rpr_default = ensure(doc_defaults, q(W, "rPrDefault"))
    set_run_style(ensure(rpr_default, q(W, "rPr")), "21")

    sizes = {
        "Normal": ("21", False),
        "Title": ("36", True),
        "Heading1": ("30", True),
        "Heading2": ("26", True),
        "Heading3": ("23", True),
    }
    for style in root.findall(q(W, "style")):
        style_id = style.get(q(W, "styleId"))
        if style_id not in sizes:
            continue
        rpr = ensure(style, q(W, "rPr"))
        set_run_style(rpr, *sizes[style_id])
        ppr = ensure(style, q(W, "pPr"))
        spacing = ensure(ppr, q(W, "spacing"))
        if style_id == "Normal":
            spacing.set(q(W, "after"), "120")
            spacing.set(q(W, "line"), "360")
            spacing.set(q(W, "lineRule"), "auto")
        else:
            spacing.set(q(W, "before"), "240")
            spacing.set(q(W, "after"), "120")
            ensure(ppr, q(W, "keepNext"))
    tree.write(path, encoding="utf-8", xml_declaration=True)


def patch_document(path: Path, header_rid: str, footer_rid: str) -> None:
    tree = ET.parse(path)
    root = tree.getroot()
    body = root.find(q(W, "body"))
    sect = ensure(body, q(W, "sectPr"))

    for tag in (q(W, "headerReference"), q(W, "footerReference")):
        for node in list(sect.findall(tag)):
            sect.remove(node)

    header_ref = ET.Element(q(W, "headerReference"))
    header_ref.set(q(W, "type"), "default")
    header_ref.set(q(R, "id"), header_rid)
    footer_ref = ET.Element(q(W, "footerReference"))
    footer_ref.set(q(W, "type"), "default")
    footer_ref.set(q(R, "id"), footer_rid)
    sect.insert(0, footer_ref)
    sect.insert(0, header_ref)

    pg_sz = ensure(sect, q(W, "pgSz"))
    pg_sz.set(q(W, "w"), "11906")
    pg_sz.set(q(W, "h"), "16838")
    margins = ensure(sect, q(W, "pgMar"))
    for key, value in {
        "top": "1134",
        "right": "1134",
        "bottom": "1134",
        "left": "1134",
        "header": "567",
        "footer": "567",
        "gutter": "0",
    }.items():
        margins.set(q(W, key), value)

    tree.write(path, encoding="utf-8", xml_declaration=True)


def add_relationships(path: Path) -> tuple[str, str]:
    tree = ET.parse(path)
    root = tree.getroot()
    header_type = (
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/header"
    )
    footer_type = (
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer"
    )
    existing_header = next(
        (
            rel
            for rel in root.findall(q(REL, "Relationship"))
            if rel.get("Type") == header_type and rel.get("Target") == "header1.xml"
        ),
        None,
    )
    existing_footer = next(
        (
            rel
            for rel in root.findall(q(REL, "Relationship"))
            if rel.get("Type") == footer_type and rel.get("Target") == "footer1.xml"
        ),
        None,
    )
    if existing_header is not None and existing_footer is not None:
        return existing_header.get("Id"), existing_footer.get("Id")

    used = {
        int(rel.get("Id")[3:])
        for rel in root.findall(q(REL, "Relationship"))
        if rel.get("Id", "").startswith("rId") and rel.get("Id", "")[3:].isdigit()
    }
    next_id = max(used, default=0) + 1
    header_rid = f"rId{next_id}"
    footer_rid = f"rId{next_id + 1}"
    for rid, rel_type, target in (
        (header_rid, header_type, "header1.xml"),
        (footer_rid, footer_type, "footer1.xml"),
    ):
        rel = ET.SubElement(root, q(REL, "Relationship"))
        rel.set("Id", rid)
        rel.set(
            "Type",
            rel_type,
        )
        rel.set("Target", target)
    tree.write(path, encoding="utf-8", xml_declaration=True)
    return header_rid, footer_rid


def patch_content_types(path: Path) -> None:
    tree = ET.parse(path)
    root = tree.getroot()
    existing = {node.get("PartName") for node in root.findall(q(CT, "Override"))}
    for part_name, content_type in (
        (
            "/word/header1.xml",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml",
        ),
        (
            "/word/footer1.xml",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml",
        ),
    ):
        if part_name in existing:
            continue
        node = ET.SubElement(root, q(CT, "Override"))
        node.set("PartName", part_name)
        node.set("ContentType", content_type)
    tree.write(path, encoding="utf-8", xml_declaration=True)


def styled_run(text: str, size: str = "18", bold: bool = False) -> str:
    bold_xml = "<w:b/>" if bold else ""
    return (
        "<w:r><w:rPr>"
        '<w:rFonts w:ascii="Microsoft YaHei" w:hAnsi="Microsoft YaHei" '
        'w:eastAsia="Microsoft YaHei" w:cs="Microsoft YaHei"/>'
        f"<w:sz w:val=\"{size}\"/><w:szCs w:val=\"{size}\"/>{bold_xml}"
        f'</w:rPr><w:t xml:space="preserve">{text}</w:t></w:r>'
    )


def write_header_footer(word_dir: Path) -> None:
    header = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        f'<w:hdr xmlns:w="{W}"><w:p><w:pPr><w:jc w:val="center"/></w:pPr>'
        f"{styled_run('广州进格智能科技有限公司', '18')}"
        "</w:p></w:hdr>"
    )
    footer = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        f'<w:ftr xmlns:w="{W}"><w:p><w:pPr>'
        '<w:tabs><w:tab w:val="right" w:pos="9638"/></w:tabs>'
        "</w:pPr>"
        f"{styled_run('广州进格智能科技有限公司  员工手册 v1.1', '16')}"
        f"{styled_run(chr(9) + '第 ', '16')}"
        '<w:fldSimple w:instr=" PAGE "><w:r><w:rPr>'
        '<w:rFonts w:ascii="Microsoft YaHei" w:hAnsi="Microsoft YaHei" '
        'w:eastAsia="Microsoft YaHei"/><w:sz w:val="16"/>'
        '</w:rPr><w:t>1</w:t></w:r></w:fldSimple>'
        f"{styled_run(' 页', '16')}"
        "</w:p></w:ftr>"
    )
    (word_dir / "header1.xml").write_text(header, encoding="utf-8")
    (word_dir / "footer1.xml").write_text(footer, encoding="utf-8")


def patch_raw_ooxml(work: Path) -> None:
    """Patch the Pandoc reference DOCX without reserializing its XML roots."""
    for xml_path in (work / "word").rglob("*.xml"):
        text = xml_path.read_text(encoding="utf-8")
        for old in (
            "ArialUnicodeMS",
            "Arial Unicode MS",
            "LiberationSerif",
            "Liberation Serif",
            "PingFangSC-Semibold",
            "PingFang SC",
            "Arial-Black",
            "Arial Black",
        ):
            text = text.replace(old, "Microsoft YaHei")
        xml_path.write_text(text, encoding="utf-8")

    document_path = work / "word" / "document.xml"
    document = document_path.read_text(encoding="utf-8")
    sect_match = re.search(r"<(?P<prefix>\w+):sectPr>", document)
    if not sect_match:
        raise RuntimeError("sectPr not found")
    prefix = sect_match.group("prefix")
    page_setup = (
        f'<{prefix}:pgSz {prefix}:w="11906" {prefix}:h="16838"/>'
        f'<{prefix}:pgMar {prefix}:top="1134" {prefix}:right="1134" '
        f'{prefix}:bottom="1134" {prefix}:left="1134" '
        f'{prefix}:header="567" {prefix}:footer="567" {prefix}:gutter="0"/>'
    )
    document = document[: sect_match.end()] + page_setup + document[sect_match.end() :]
    document_path.write_text(document, encoding="utf-8")

    theme_path = work / "word" / "theme" / "theme1.xml"
    theme = theme_path.read_text(encoding="utf-8")
    theme = re.sub(
        r'(<a:(?:latin|ea|cs)\b[^>]*\btypeface=")[^"]*(")',
        r"\1Microsoft YaHei\2",
        theme,
    )
    theme_path.write_text(theme, encoding="utf-8")

    def replace_part(path: Path, body: str, closing: str) -> None:
        text = path.read_text(encoding="utf-8")
        root_name = closing[2:-1]
        opening_end = text.index(">", text.index(f"<{root_name}")) + 1
        path.write_text(text[:opening_end] + body + closing, encoding="utf-8")

    header_body = "<w:p/>"
    footer_body = (
        '<w:p><w:pPr><w:tabs><w:tab w:val="right" w:pos="9638"/>'
        "</w:tabs></w:pPr>"
        f"{styled_run('广州进格智能科技有限公司  员工手册 v1.1', '16')}"
        f"{styled_run(chr(9) + '第 ', '16')}"
        '<w:fldSimple w:instr=" PAGE "><w:r><w:rPr>'
        '<w:rFonts w:ascii="Microsoft YaHei" w:hAnsi="Microsoft YaHei" '
        'w:eastAsia="Microsoft YaHei"/><w:sz w:val="16"/>'
        '</w:rPr><w:t>1</w:t></w:r></w:fldSimple>'
        f"{styled_run(' 页', '16')}"
        "</w:p>"
    )
    replace_part(work / "word" / "header1.xml", header_body, "</w:hdr>")
    replace_part(work / "word" / "footer1.xml", footer_body, "</w:ftr>")


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: postprocess_handbook_v11.py <docx>")
    source = Path(sys.argv[1]).resolve()
    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        with zipfile.ZipFile(source) as archive:
            archive.extractall(work)
        patch_raw_ooxml(work)

        output = work / "result.docx"
        with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
            for item in work.rglob("*"):
                if item.is_file() and item != output:
                    archive.write(item, item.relative_to(work))
        shutil.copy2(output, source)


if __name__ == "__main__":
    main()
