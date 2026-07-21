#!/usr/bin/env python3
"""Fallback for when the Cloud Console "Download JSON" button doesn't work.

Prompts for the Client ID / Client secret shown on the OAuth client's detail
page and writes the same file format Google's download would produce.
Input goes straight to this local process — it never passes through chat.
"""

from __future__ import annotations

import getpass
import json
from pathlib import Path

CONFIG_DIR = Path.home() / ".config" / "gengrowth"
CLIENT_SECRET_FILE = CONFIG_DIR / "oauth_client.json"

PROJECT_ID = "gengrowth-growth-lead"


def main() -> None:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    print("在 Cloud Console 的 OAuth client 详情页复制这两个值：\n")

    client_id = input("Client ID: ").strip()
    client_secret = getpass.getpass("Client secret（输入时不回显）: ").strip()

    if not client_id or not client_secret:
        raise SystemExit("Client ID / secret 不能为空。")

    payload = {
        "installed": {
            "client_id": client_id,
            "project_id": PROJECT_ID,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_secret": client_secret,
            "redirect_uris": ["http://localhost"],
        }
    }

    CLIENT_SECRET_FILE.write_text(json.dumps(payload, indent=2, ensure_ascii=False))
    CLIENT_SECRET_FILE.chmod(0o600)
    print(f"\n已写入 {CLIENT_SECRET_FILE}。接下来跑 auth_setup.py。")


if __name__ == "__main__":
    main()
