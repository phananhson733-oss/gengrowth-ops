#!/usr/bin/env python3
"""Prove the read-only Google connection works and surface IDs Lynne needs to confirm.

Lists the GSC-verified sites, GA4 accounts/properties visible to this account,
and the three known Google Sheets by title — no data is modified anywhere.
"""

from __future__ import annotations

import sys
from pathlib import Path

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

CONFIG_DIR = Path.home() / ".config" / "gengrowth"
TOKEN_FILE = CONFIG_DIR / "token.json"

SHEETS = {
    "关键词研究实表": "1CkjOCgYbRfXGYc6l2FJOaxUIzxT0NBVUhUpgCjyzcQc",
    "Google Trends 定期抓取": "1b7Gs2RXd9ZNnLR9qVQiaIG4Pq_hD_4NRWfkXvOWqDRg",
    "博主账号与内容拆解": "1zJJqSxRxRH9s5PeiT25RP4sRgXpl3tKqfB5nSdrU0bA",
}


def main() -> None:
    if not TOKEN_FILE.exists():
        sys.exit(f"未找到 {TOKEN_FILE}，先跑 auth_setup.py 完成一次性授权。")

    creds = Credentials.from_authorized_user_file(str(TOKEN_FILE))

    print("=== Search Console：已验证站点 ===")
    try:
        sc = build("searchconsole", "v1", credentials=creds)
        sites = sc.sites().list().execute().get("siteEntry", [])
        for s in sites:
            print(f"  {s['siteUrl']}  ({s['permissionLevel']})")
    except Exception as e:  # noqa: BLE001
        print(f"  失败：{e}")

    print("\n=== GA4：可见账号与媒体资源 ===")
    try:
        admin = build("analyticsadmin", "v1beta", credentials=creds)
        summaries = admin.accountSummaries().list().execute().get("accountSummaries", [])
        for acc in summaries:
            print(f"  账号：{acc.get('displayName')}")
            for prop in acc.get("propertySummaries", []):
                print(f"    - {prop.get('displayName')}  property_id={prop.get('property')}")
    except Exception as e:  # noqa: BLE001
        print(f"  失败：{e}")

    print("\n=== Google Sheets：三张表读取确认 ===")
    try:
        sheets = build("sheets", "v4", credentials=creds)
        for name, sheet_id in SHEETS.items():
            try:
                meta = sheets.spreadsheets().get(spreadsheetId=sheet_id).execute()
                tabs = [s["properties"]["title"] for s in meta.get("sheets", [])]
                print(f"  {name}：{meta['properties']['title']}  tabs={tabs}")
            except Exception as e:  # noqa: BLE001
                print(f"  {name}：失败 - {e}")
    except Exception as e:  # noqa: BLE001
        print(f"  失败：{e}")


if __name__ == "__main__":
    main()
