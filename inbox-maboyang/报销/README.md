# 报销投递区

把**报销图片**(发票 / invoice / 支付凭证 / 支付证明截图)放进这个文件夹。

baoxiao 系统会在抓取邮件时一并扫描这里,自动搬进报销流程 → 归档入账 → 去重
(content-hash + 发票号,同一张不会重复入账)。

- 支持:pdf / png / jpg / jpeg
- 搬走后原文件 mv 到 `.processed/`(表示已处理)
- 只放报销凭证,别放工作素材(logo/截图/banner)
