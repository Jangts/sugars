# 代码高亮移植

基线为本地历史原件 `@jangts/tangram.js` 2.9.1 的 `src/see/highlight`。来源与附带许可见 [包内声明](../../packages/highlight/THIRD-PARTY-NOTICES.md)。

| 原模块 | 对应实现 |
| --- | --- |
| `highlight.js` 的 `highlight`、`tokenize` | 保留显式语法规则调用、词法匹配顺序、嵌套规则、贪婪匹配、转义和 `ib-hl` 标记 |
| `render`、`renderAll`、`renderElement` 与钩子 | 使用原生 DOM。保留 `data-language`、`data-lang`、回调绑定和渲染钩子，新增限定扫描范围的入口 |
| `languages/*` | 109 份历史语言文件迁移为 ESM，由一个入口按依赖顺序登记。修复了错误的命名空间、漏写的依赖、XML 和 MathML 等别名的注册位置，以及 Q 的三条损坏正则 |
| `themes/*` | 7 份 CSS 按原文件交付，可通过包的 CSS 子路径导入 |

调用入口为 [`@sugars/highlight`](../../packages/highlight/README.md)。接入时用 ESM 导入替换 `tangram.block` 和 `pandora.see.highlight`，也可以通过语言名省略手动查找规则。内部工具与空的 `plugins` 对象留在历史原件。Haml、Jade、Pure 的可选嵌入语法由原件内已有的语言文件提供。

## 验收记录

- 根目录的 `npm run build` 和 `npm run typecheck` 均通过。用 `npm pack` 生成实际 tarball，确认包内包含 ESM、类型声明、7 份与原件字节一致的主题和来源文件。使用 TypeScript 5.9.3 严格模式验证包入口及 CSS 导入。
- 用 Node.js 24.9.0 从 tarball 加载，对 115 个语言名及别名验证分词后的文本还原。Python、SQL、JSON、Rust 和 Lua 的样例输出与 TangramJS 原始实现一致。检查了嵌入 CSS 和 JavaScript 的 HTML、ASP.NET、HTTP、Markdown 及 Q 样例。
- 用 Chrome 158 从 tarball 加载，验证单元素和全页入口、按容器限定范围、两种语言属性、回调绑定与顺序、默认主题颜色、重复渲染及 PHP、Handlebars、Smarty 的嵌入处理。语法样例覆盖上述路径，各语言的完整语法和其他浏览器尚未逐项验收。
