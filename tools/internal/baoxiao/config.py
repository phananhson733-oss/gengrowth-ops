"""配置加载:仓库外 .env 凭证 + yaml 配置。

密钥(app_id/app_secret/app_token/table_id)放仓库外 600 文件
~/.config/gengrowth-baoxiao/.env,绝不进自动提交的 wiki 仓库。
"""

import yaml
from pathlib import Path

ENV_HINT = "~/.config/gengrowth-baoxiao/.env"


def load_env(path):
    """解析 KEY=VALUE(忽略 # 注释与空行,按首个 = 分割,去空白与外层引号)。"""
    path = Path(path).expanduser()
    if not path.exists():
        raise FileNotFoundError(
            f"凭证文件不存在: {path}(应放在仓库外,如 {ENV_HINT},chmod 600)"
        )
    env = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def require(env, key):
    """取必填项;缺失或空白则报错并提示去哪补。"""
    value = env.get(key)
    if value is None or not str(value).strip():
        raise KeyError(f"缺少必填配置项: {key}(检查 {ENV_HINT})")
    return value


def load_yaml(path):
    """读 yaml 配置(category-map.yaml / reimbursers.yaml)。"""
    path = Path(path).expanduser()
    return yaml.safe_load(path.read_text(encoding="utf-8"))
