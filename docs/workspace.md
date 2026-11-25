# 仓库结构

sugars 由一个 npm workspace 管理。根 `package.json` 定义工作区和构建命令，根 `package-lock.json` 是依赖锁。源码使用 TypeScript 和 ES Modules，使用 TypeScript 项目引用分别生成各包的 ESM 与声明文件。

| 工作区 | 所有者 | 运行依赖 |
| --- | --- | --- |
| [`@sugars/editor`](../packages/editor/package.json) | 原生编辑器，包括选区、命令、内容读写和表单字段同步 | 浏览器 DOM、DOMPurify |
| [`@sugars/editor-element`](../packages/editor-element/package.json) | Light DOM 自定义元素，包括注册、连接与断开、属性和事件 | Web Components、`@sugars/editor` |
| [`@sugars/charts`](../packages/charts/package.json) | Canvas 图表实例、图层、系列、比例尺和提示框 | 浏览器 DOM、Canvas 2D、`lodash-es` |
| [`@sugars/kline`](../packages/kline/package.json) | K 线画布、视口、行情、指标和鼠标与触摸交互 | 浏览器 DOM、Canvas 2D |
| [`@sugars/highlight`](../packages/highlight/package.json) | 代码分词、HTML 转换、DOM 渲染、语言规则和主题 | DOM 渲染使用浏览器，纯文本转换可在 Node.js 使用 |

编辑器和图表独立，Web Component 通过编辑器的包入口接入。浏览器功能在创建实例或注册元素时使用。包入口使用清单中的 `exports`，生成内容位于各包的 `dist/`。默认 GIF 由编辑器持有，根构建将其复制到对应产物目录。

## 安装与构建

在仓库根目录运行以下命令。

```sh
npm ci
npm run build
```

`npm run typecheck` 使用 TypeScript 项目构建模式，必要时更新编译产物。编辑器、自定义元素和 K 线包继承根类型检查设置。通用图表包对 `noImplicitAny` 和 `noUncheckedIndexedAccess` 保留包内迁移例外。公开类型由各包入口输出。

根包、通用图表、K 线和代码高亮包在清单中标记为私有。两个编辑器配置公开发布访问级别。实际可安装性以目标 registry 中的版本为准。
