# 仓库结构

sugars 由一个 npm workspace 管理。根 `package.json` 定义工作区和构建命令，根 `package-lock.json` 是依赖锁。现代包通过 TypeScript 项目引用生成 ESM 与声明文件。ES5 兼容包直接交付 JavaScript 源码，TypeScript 项目负责检查各自的声明。

| 工作区 | 所有者 | 运行依赖 |
| --- | --- | --- |
| [`@sugars/editor`](../packages/editor/package.json) | 原生编辑器，包括选区、命令、内容读写和表单字段同步 | 浏览器 DOM、DOMPurify |
| [`@sugars/editor-element`](../packages/editor-element/package.json) | Light DOM 自定义元素，包括注册、连接与断开、属性和事件 | Web Components、`@sugars/editor` |
| [`@sugars/charts`](../packages/charts/package.json) | Canvas 图表实例、图层、系列、比例尺和提示框 | 浏览器 DOM、Canvas 2D、`lodash-es` |
| [`@sugars/kline`](../packages/kline/package.json) | K 线画布、视口、行情、指标和鼠标与触摸交互 | 浏览器 DOM、Canvas 2D |
| [`@sugars/highlight`](../packages/highlight/package.json) | 代码分词、HTML 转换、DOM 渲染、语言规则和主题 | DOM 渲染使用浏览器，纯文本转换可在 Node.js 使用 |
| [`@sugars/async`](../packages/async/package.json) | AMD 模块加载与执行、旧式 Promise 通知及组合 | ES5，动态脚本加载使用浏览器 DOM |
| [`@sugars/declare`](../packages/declare/package.json) | 原型继承、实例初始化和成员扩展 | ES5 |
| [`@sugars/animation`](../packages/animation/package.json) | 场景、帧、播放控制和完成通知 | 浏览器帧调度或调用方提供的时钟 |
| [`@sugars/scroll-view`](../packages/scroll-view/package.json) | 滚动几何、轨道和滑块的交互绑定 | 浏览器 DOM，几何计算独立 |
| [`@sugars/tools`](../packages/tools/package.json) | 数组、集合、类型、数学、对象和字符串工具 | 支持现代 JavaScript 与标准文本、URL API 的环境 |

编辑器和图表独立，Web Component 通过编辑器的包入口接入。浏览器功能在创建实例或注册元素时使用。包入口由清单中的 `exports` 定义，现代包的构建内容位于各自的 `dist/`。兼容包同时提供 `main` 入口，运行脚本位于各自的包根目录。默认 GIF 由编辑器持有，根构建将其复制到对应产物目录。

## 安装与构建

在仓库根目录运行以下命令。

```sh
npm ci
npm run build
```

`npm run typecheck` 使用 TypeScript 项目构建模式，必要时更新编译产物。编辑器、自定义元素和 K 线包继承根类型检查设置。通用图表包对 `noImplicitAny` 和 `noUncheckedIndexedAccess` 保留包内迁移例外。公开类型由各包入口输出。

两个编辑器配置公开发布访问级别，其余包在清单中标记为私有。实际可安装性以目标 registry 中的版本为准。
