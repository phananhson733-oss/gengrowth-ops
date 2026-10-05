# 短剧能力源码归属

选剧规则、选剧方案、短剧发行 Runner、TikTok 视频采集器、对应测试和五个剪辑 Skill 统一维护在 [gengrowth-hermes](https://github.com/phananhson733-oss/gengrowth-hermes/blob/main/skills/social-media/short-drama-release-manager/README.md)。

- 已验证的迁移提交：[`f4716320c1`](https://github.com/phananhson733-oss/gengrowth-hermes/commit/f4716320c13debc73c28f31e5b889c1f942fd0ba)。
- [逐文件来源与新路径](https://github.com/phananhson733-oss/gengrowth-hermes/blob/main/skills/social-media/short-drama-release-manager/references/ops-source-import.json)。
- gengrowth-ops 保留个人运营工作区、业务资料以及迁移链接，不再保留这部分可执行源码。
- 现有本地 ops 路径仍可作为部署地址，不能把 Git 源码删除操作当成生产卸载。在原生产 checkout 拉取此提交之前，先备份并保全部署程序、配置、凭证、状态与输出，按 Hermes 入口文档安排部署。
- 根级与个人 AGENTS.md 仍约束对应工作区操作；这不构成第二份程序源码。
