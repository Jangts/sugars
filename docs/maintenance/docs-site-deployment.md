# 双语文档站部署

- 公开入口为 [Sugars 文档站](https://sugars-docs.pages.jangts.cafe/)。该站使用武汉自建 Jangts Pages 的通配域名与证书。
- 服务器站点目录为 `/opt/stacks/nginx-proxy-manager/data/pages/sugars-docs/`。从仓库根目录按[文档站说明](../../apps/docs/README.md)构建和检查，发布 `apps/docs/dist/` 中的静态产物。

## 2026-11-27 首次发布

- 沿用 RESTModel 文档站的 Pages 发布流程。通过 SCP 上传静态产物，远端核对归档和 310 个文件的 SHA-256 后安装到 Sugars 站点目录。
- 从公网 HTTPS 逐一下载并校验 310 个文件，包含中英文页面、实际 JS、CSS 和站点地图。访问缺失路径返回 HTTP 404。
- 使用浏览器检查了首页语言选择、保留查询参数和锚点的语言切换、中英文搜索与移动端语言切换。
