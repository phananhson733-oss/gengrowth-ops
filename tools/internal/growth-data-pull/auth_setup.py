#!/usr/bin/env python3
"""One-time OAuth consent flow for growth-lead's read-only Google data access.

Reads the Desktop OAuth client downloaded from Cloud Console, walks Lynne
through the consent screen in her browser, and stores a refresh token
locally. Re-run any time to re-consent (e.g. after revoking access).
"""

from __future__ import annotations

import sys
from pathlib import Path

from google_auth_oauthlib.flow import InstalledAppFlow

CONFIG_DIR = Path.home() / ".config" / "gengrowth"
CLIENT_SECRET_FILE = CONFIG_DIR / "oauth_client.json"
TOKEN_FILE = CONFIG_DIR / "token.json"

SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/webmasters.readonly",
    "https://www.googleapis.com/auth/analytics.readonly",
    "https://www.googleapis.com/auth/spreadsheets.readonly",
]


def main() -> None:
    if not CLIENT_SECRET_FILE.exists():
        sys.exit(
            f"未找到 {CLIENT_SECRET_FILE}。\n"
            "先在 Cloud Console 创建 Desktop OAuth client 并下载 JSON，"
            "存到这个路径后再重跑本脚本。"
        )

    flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT_SECRET_FILE), SCOPES)
    creds = flow.run_local_server(port=0)

    TOKEN_FILE.write_text(creds.to_json())
    TOKEN_FILE.chmod(0o600)
    print(f"授权成功，token 已存到 {TOKEN_FILE}（本地文件，不进 git）。")
    print(f"账号：{creds.id_token.get('email') if creds.id_token else '(见 token.json)'}")


if __name__ == "__main__":
    main()
