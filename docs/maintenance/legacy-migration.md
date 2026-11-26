# ES5 兼容模块移植

基线为 TangramJS 2.9.1。两个工作区按 ES5 语法直接交付 JavaScript，另附 TypeScript 声明。普通脚本、CommonJS 和 AMD 都可使用独立运行入口。

| 历史模块 | 当前入口与行为 |
| --- | --- |
| `util/require.js` 的 `define`、`require`、`require.config` | `@sugars/async/amd`。加载器实例持有自己的模块表，外部 AMD 文件需要时安装全局入口。保留命名和匿名工厂、相对依赖、`paths`、`packages` 和简写 `require('id')` |
| `async/Promise.js` | `@sugars/async/promise`。保留旧式同步状态通知和 `then` 的原值转发，补齐异步聚合失败、已经结算时的回调和 `oneByOne` 顺序执行 |
| `tangram.js` 的类工厂 | `@sugars/declare`。保留原型继承、初始化、成员块及实例辅助方法，构造器由调用方接收和组合。一次构造只执行一次 `_init` |

`require` 的数组形式使用回调。切换时将旧 `util.require(...).then(...)` 的回调放到 `require(ids, callback, onError)`。AMD 加载器按依赖数组传参，工厂可在依赖表显式列出 `require`、`exports` 和 `module`，也可使用省略依赖数组的简写。加载范围为 JavaScript AMD 文件。历史代码块调度器 `tangram.block`、全局注册仓和旧 `async.Request` 由原库保存。

`Promise` 的结算以第一次为准。`all` 和 `race` 会转发输入的拒绝，`oneByOne` 遇到失败会停止开始后续任务。`declare` 将 `_p` 限定在同一条继承链，名称只用来标识构造器。`_c()` 保留普通对象、数组和循环引用的结构。这些改动以及示例见 [async 包说明](../../packages/async/README.md) 和 [declare 包说明](../../packages/declare/README.md)。

## 验收记录

- 根构建和类型检查通过。用 `npm pack` 生成两份实际 tarball，确认其中的四个运行脚本全部通过 Acorn 的 ES5 解析。确认 CommonJS 包入口、类型声明和来源文件都随包交付。用 TypeScript 5.9.3 在 ES5 目标下验证入口、AMD 回调与多成员块的合并类型。
- 在移除原生 Promise、Map、Set、WeakMap、WeakSet、Symbol、URL 及其他现代辅助 API 的 VM 环境中，验证旧 Promise 的同步通知、失败和 10,000 个同步任务的顺序执行，以及 `declare` 的初始化、继承和实例数据拷贝。AMD 命名模块可在同一环境下独立运行。
- 在同样移除现代全局的 Chrome 158 中，用普通 `<script>` 加载实际包体，检查 AMD 匿名模块、相对路径和配置映射、并发 bundle、URL 去重、失败后重试、全局入口恢复，以及缺少 `document.currentScript` 时的匿名模块关联。浏览器覆盖以这一版 Chrome 和模拟的旧 DOM 路径为限。
