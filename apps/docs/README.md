# Sugars 文档站

一个 VitePress 静态站承载 Sugars 的 16 个包。浏览器可在 `/zh/` 和 `/en/` 间切换，并在本地搜索当前语言的页面。站点按能力分组，Tools 的 API 进一步按实际分类入口组织。

## 本地命令

在仓库根目录安装依赖并检查文档站。

```sh
npm ci
npm run docs:check
```

`npm run docs:build` 构建库声明与站点，产物位于 `apps/docs/dist/`。`npm run docs:dev` 生成页面后启动本地开发服务。`npm run docs:preview` 预览已构建的产物。

## 内容来源

- 中文用法来自各包的 `packages/<包>/README.md`。英文正文在 `content/en/packages/`，示例占位符按顺序复用包 README 的代码块。修改中文正文时同步对应的英文说明。
- `scripts/catalog.mjs` 登记能力分组、页面导航和双语标签。包身份、版本和发布配置读取包清单。
- API 读取 `package.json#exports` 与 TypeScript 7 构建声明，包含公开子路径、CommonJS 两个兼容包和高亮主题。Tools 的分类从导出符号与其声明文件对应生成，可同时查到分类名、根入口名和单函数路径。
- 导航使用[单色标志组合](assets/sugars-lockup.svg)，页签使用[单色图标](assets/sugars-logo.png)，中英文首页使用[立体图标原稿](design/sugars-logo-rendered.png)。横向组合由图标充当首字母 `S`，后续字母从 `u` 排起，以图标内的 `S` 和字形上两行校准垂直位置。设计稿也保留[立体标志组合](design/sugars-lockup-rendered.png)。
- 生成目录为 `.generated/`。改变内容时编辑上述来源。`docs:check` 检查实际静态页的双语对应、链接、锚点与资源，并核对包入口和共享示例。

默认基础路径为 `/`。可用 `DOCS_BASE=/sugars/` 构建子路径版本。设置 `DOCS_ORIGIN` 后生成 canonical、hreflang 和 sitemap。本地构建、检查和预览均为开发操作。

## 线上站点

Sugars 文档站部署在武汉自建 Jangts Pages。正式构建使用站点的 HTTPS 地址和域名根路径。

```sh
DOCS_ORIGIN=https://sugars-docs.pages.jangts.cafe DOCS_BASE=/ npm run docs:check
```

[公开站点](https://sugars-docs.pages.jangts.cafe/) · [部署记录](../../docs/maintenance/docs-site-deployment.md)
