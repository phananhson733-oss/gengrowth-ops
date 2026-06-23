#!/usr/bin/env python3
"""公众号账号文章情报采集 MVP。

定位：先把“公众号账号名 + 最近文章 URL seed/cache”跑通到 down.mptext 抽取和 Markdown 归档。
说明：微信没有稳定公开的账号历史文章 API，因此账号名到最近文章列表先采用 seed/cache 发现，失败会写入 log，避免静默编造。
"""

import argparse
import html
import json
import re
import sys
import time
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Callable, Dict, Iterable, List, Optional, Sequence
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qsl, quote, urlencode, urlparse, urlunparse
from urllib.request import Request, urlopen


ARTICLE_URL_RE = re.compile(r"https?://mp\.weixin\.qq\.com/(?:s/[A-Za-z0-9_-]+|s\?[^\s\]\)>'\"，。；、]+)")
TRAILING_PUNCTUATION = "\u3002\uff0c\uff1b\uff1a\uff01\uff1f,.;:!?)）]】>\"'"
KEEP_QUERY_KEYS = {"__biz", "mid", "idx", "sn", "chksm"}
DEFAULT_OUTPUT_DIR = Path("wzb-obsidian/LLM-Wiki/Notes/Clippings")
DEFAULT_DOWN_MPTEXT_ENDPOINT = "https://down.mptext.top/api/public/v1/download"
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"


@dataclass
class Article:
    title: str
    account_name: str
    publish_time: str
    content_markdown: str
    source_url: str


def normalize_wechat_article_url(raw_url: str) -> str:
    """标准化公众号文章 URL，用于去重。"""
    url = html.unescape(raw_url.strip()).rstrip(TRAILING_PUNCTUATION)
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or parsed.netloc != "mp.weixin.qq.com":
        return ""
    scheme = "https"
    if parsed.path.startswith("/s/"):
        return urlunparse((scheme, parsed.netloc, parsed.path, "", "", ""))
    if parsed.path == "/s":
        kept_pairs = [
            (key, value)
            for key, value in parse_qsl(parsed.query, keep_blank_values=True)
            if key in KEEP_QUERY_KEYS
        ]
        if not kept_pairs:
            return ""
        return urlunparse((scheme, parsed.netloc, parsed.path, "", urlencode(kept_pairs), ""))
    return ""


def extract_article_urls(text: str, limit: Optional[int] = None) -> List[str]:
    """从文本/HTML/缓存文件中提取公众号文章 URL，并保持原顺序去重。"""
    urls: List[str] = []
    seen = set()
    for match in ARTICLE_URL_RE.finditer(text or ""):
        normalized = normalize_wechat_article_url(match.group(0))
        if normalized and normalized not in seen:
            seen.add(normalized)
            urls.append(normalized)
            if limit and len(urls) >= limit:
                break
    return urls


def build_down_mptext_url(source_url: str, output_format: str = "json", endpoint: str = DEFAULT_DOWN_MPTEXT_ENDPOINT) -> str:
    query = urlencode({"url": source_url, "format": output_format})
    return f"{endpoint}?{query}"


def fetch_text(url: str, timeout: int = 30) -> str:
    req = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "*/*"})
    with urlopen(req, timeout=timeout) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="ignore")


def _first_string(payload: Dict, keys: Sequence[str]) -> str:
    for key in keys:
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def _unwrap_payload(payload):
    if isinstance(payload, dict):
        for key in ("data", "article", "result"):
            value = payload.get(key)
            if isinstance(value, dict):
                return value
    return payload


def article_from_payload(payload, source_url: str) -> Article:
    data = _unwrap_payload(payload)
    if not isinstance(data, dict):
        raise ValueError("down.mptext 返回结构不是 JSON 对象")
    content = _first_string(data, ("content_markdown", "markdown", "content", "text", "html"))
    title = _first_string(data, ("title", "article_title", "name")) or "未命名公众号文章"
    account_name = _first_string(data, ("account_name", "author", "nickname", "source"))
    publish_time = _first_string(data, ("publish_time", "published_at", "date", "time"))
    if not content:
        raise ValueError("down.mptext 返回中没有正文内容")
    return Article(
        title=title,
        account_name=account_name,
        publish_time=publish_time,
        content_markdown=content.strip(),
        source_url=source_url,
    )


def extract_meta_content(html_text: str, property_name: str) -> str:
    patterns = [
        rf'<meta[^>]+property=["\']{re.escape(property_name)}["\'][^>]+content=["\']([^"\']+)["\']',
        rf'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']{re.escape(property_name)}["\']',
        rf'<meta[^>]+name=["\']{re.escape(property_name)}["\'][^>]+content=["\']([^"\']+)["\']',
    ]
    for pattern in patterns:
        match = re.search(pattern, html_text, flags=re.I)
        if match:
            return html.unescape(match.group(1)).strip()
    return ""


def html_to_plain_text(html_text: str) -> str:
    main_match = re.search(r'<div[^>]+id=["\']js_content["\'][^>]*>(.*?)</div>\s*<script', html_text, flags=re.S | re.I)
    body = main_match.group(1) if main_match else html_text
    body = re.sub(r"<br\s*/?>", "\n", body, flags=re.I)
    body = re.sub(r"</p\s*>", "\n\n", body, flags=re.I)
    body = re.sub(r"<[^>]+>", "", body)
    body = html.unescape(body)
    lines = [line.strip() for line in body.splitlines()]
    return "\n".join(line for line in lines if line)


def download_direct_wechat(source_url: str) -> Article:
    html_text = fetch_text(source_url)
    title = extract_meta_content(html_text, "og:title") or "未命名公众号文章"
    account_name = extract_meta_content(html_text, "og:article:author")
    publish_time = extract_meta_content(html_text, "article:published_time")
    content = html_to_plain_text(html_text)
    if not content or "环境异常" in content[:200]:
        raise ValueError("直连微信页面未获得可用正文")
    return Article(
        title=title,
        account_name=account_name,
        publish_time=publish_time,
        content_markdown=content,
        source_url=source_url,
    )


def download_with_down_mptext(source_url: str) -> Article:
    api_url = build_down_mptext_url(source_url, output_format="json")
    raw = fetch_text(api_url)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"down.mptext 返回不是 JSON：{exc}") from exc
    return article_from_payload(payload, source_url)


def download_article(source_url: str) -> Article:
    """优先使用 down.mptext；失败时尝试直连微信页面作为保底。"""
    try:
        return download_with_down_mptext(source_url)
    except Exception as down_error:
        try:
            return download_direct_wechat(source_url)
        except Exception as direct_error:
            raise RuntimeError(f"down.mptext 失败：{down_error}；直连微信失败：{direct_error}") from direct_error


def safe_filename_part(text: str) -> str:
    value = re.sub(r"[\\/:*?\"<>|\s]+", "-", text.strip())
    value = re.sub(r"-+", "-", value).strip("-")
    return value or "wechat-account"


def collect_cache_text(cache_paths: Sequence[str], account_name: str) -> str:
    chunks: List[str] = []
    for raw_path in cache_paths:
        path = Path(raw_path).expanduser()
        if not path.exists():
            continue
        files: Iterable[Path]
        if path.is_dir():
            files = list(path.rglob("*.md")) + list(path.rglob("*.html")) + list(path.rglob("*.txt"))
        else:
            files = [path]
        for file_path in files:
            try:
                text = file_path.read_text(encoding="utf-8", errors="ignore")
            except OSError:
                continue
            if account_name in text or "mp.weixin.qq.com" in text:
                chunks.append(text)
    return "\n".join(chunks)


def discover_article_urls(
    account_name: str,
    limit: int,
    seed_urls: Optional[Sequence[str]] = None,
    cache_paths: Optional[Sequence[str]] = None,
) -> List[str]:
    source_text = "\n".join(seed_urls or [])
    if cache_paths:
        source_text = f"{source_text}\n{collect_cache_text(cache_paths, account_name)}"
    return extract_article_urls(source_text, limit=limit)


def render_markdown(account_name: str, limit: int, articles: Sequence[Article], failures: Sequence[Dict[str, str]], run_date: Optional[str] = None) -> str:
    run_date = run_date or date.today().isoformat()
    title = f"{run_date}-{account_name}-最近{limit}篇文章情报归档"
    lines = [
        "---",
        f"title: {title}",
        f"date: {run_date}",
        f"updated: {run_date}",
        "type: note",
        "tags:",
        "  - wechat",
        "  - gengrowth-intel",
        "  - clipping",
        "aliases:",
        f"  - {account_name} 公众号情报",
        f"  - {account_name} 最近文章归档",
        "---",
        "",
        f"# {account_name} — 最近 {limit} 篇文章情报归档",
        "",
        "## PM 快读结论",
        "",
    ]
    if articles:
        lines.extend([
            f"- 已成功抽取：{len(articles)} 篇；失败：{len(failures)} 篇。",
            "- 当前 MVP 已跑通：账号名/seed/cache → URL 去重 → down.mptext/直连抽取 → Markdown 归档。",
            "- 待产品化补齐：稳定的公众号账号搜索与最近文章列表发现能力；当前不伪造不存在的微信官方历史文章 API。",
        ])
    else:
        lines.extend([
            f"- 未成功抽取文章；失败：{len(failures)} 篇。",
            "- 当前阻塞点在文章 URL 发现或正文抽取，需补 seed、缓存页或登录态可访问来源。",
        ])
    lines.extend(["", "## 文章列表", ""])
    for index, article in enumerate(articles, start=1):
        lines.extend([
            f"### {index}. {article.title}",
            "",
            f"- 公众号：{article.account_name or account_name}",
            f"- 发布时间：{article.publish_time or '未识别'}",
            f"- 原文：{article.source_url}",
            "",
            "#### GenGrowth 判断",
            "",
            "- 可转化方向：待基于全文继续提炼为内容选题、服务包、SOP 或增长实验。",
            "- MVP 用法：先作为公众号情报剪藏和 PM 快读入口，跑通 10–20 篇后再决定是否封装为正式 Hermes tool。",
            "",
            "#### 正文摘录",
            "",
            article.content_markdown.strip(),
            "",
        ])
    if failures:
        lines.extend(["## 失败记录", ""])
        for item in failures:
            lines.append(f"- {item['url']}：{item['error']}")
        lines.append("")
    lines.extend([
        "## 限制与下一步",
        "",
        "- 限制：微信没有稳定公开的“公众号名 → 最近文章列表”接口，不能承诺完全自动、全量、无登录态抓取。",
        "- 下一步：沉淀账号别名、文章列表 seed、失败重试和人工确认机制，再接入 GBrain/wiki 同步。",
        "",
    ])
    return "\n".join(lines)


def run_pipeline(
    account_name: str,
    limit: int,
    seed_urls: Optional[Sequence[str]],
    output_dir: str,
    downloader: Callable[[str], Article] = download_article,
    cache_paths: Optional[Sequence[str]] = None,
    sleep_seconds: float = 0.0,
) -> Dict[str, object]:
    urls = discover_article_urls(account_name, limit=limit, seed_urls=seed_urls, cache_paths=cache_paths)
    articles: List[Article] = []
    failures: List[Dict[str, str]] = []
    for url in urls[:limit]:
        try:
            raw_article = downloader(url)
            article = raw_article if isinstance(raw_article, Article) else Article(**raw_article)
            articles.append(article)
        except Exception as exc:
            failures.append({"url": url, "error": str(exc)})
        if sleep_seconds:
            time.sleep(sleep_seconds)

    run_date = date.today().isoformat()
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    base_name = f"{run_date}-{safe_filename_part(account_name)}-最近{limit}篇文章情报归档"
    output_path = out_dir / f"{base_name}.md"
    log_path = out_dir / f"{base_name}.json"
    markdown = render_markdown(account_name, limit, articles, failures, run_date=run_date)
    output_path.write_text(markdown, encoding="utf-8")
    log_payload = {
        "account_name": account_name,
        "requested_limit": limit,
        "discovered_urls": urls,
        "success_count": len(articles),
        "failure_count": len(failures),
        "articles": [
            {
                "title": article.title,
                "account_name": article.account_name or account_name,
                "publish_time": article.publish_time,
                "source_url": article.source_url,
                "content_chars": len(article.content_markdown),
            }
            for article in articles
        ],
        "failures": failures,
        "output_path": str(output_path),
    }
    log_path.write_text(json.dumps(log_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return {
        "account_name": account_name,
        "requested_limit": limit,
        "discovered_urls": urls,
        "success_count": len(articles),
        "failure_count": len(failures),
        "failures": failures,
        "output_path": str(output_path),
        "log_path": str(log_path),
    }


def parse_args(argv: Optional[Sequence[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="公众号账号文章情报采集 MVP")
    parser.add_argument("--account", required=True, help="公众号账号名，例如：子木聊AI出海")
    parser.add_argument("--limit", type=int, default=10, help="最多处理文章数")
    parser.add_argument("--seed-url", action="append", default=[], help="已知文章 URL，可重复传入")
    parser.add_argument("--seed-file", action="append", default=[], help="包含文章 URL 的缓存文件或目录")
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR), help="Markdown/JSON 输出目录")
    parser.add_argument("--sleep", type=float, default=0.0, help="每篇之间暂停秒数，避免频控")
    return parser.parse_args(argv)


def main(argv: Optional[Sequence[str]] = None) -> int:
    args = parse_args(argv)
    result = run_pipeline(
        account_name=args.account,
        limit=args.limit,
        seed_urls=args.seed_url,
        cache_paths=args.seed_file,
        output_dir=args.output_dir,
        sleep_seconds=args.sleep,
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["discovered_urls"] else 2


if __name__ == "__main__":
    sys.exit(main())
