# DOM 集合移植

包的实际入口和兼容范围见 [DOM 使用说明](../../packages/dom/README.md)。来源是本地 TangramJS 2.9.1 的 `src/dom/Elements.js`，以及它调用的 `src/dom/{Events,dom}.js` 和 `src/dom/query/query.js`。

| 原实现 | 当前实现 |
| --- | --- |
| `dom.Elements` 的选择、集合和遍历 | `selection.js` 以 DOM 节点、原生选择器和集合栈实现。保留 `sub`、`closet` 和原位追加的 `concat` |
| `dom.select`、`dom.$` 及旧扩展入口 | `index.js` 导出 jQuery 风格的 `$` 和历史 `select`。历史对象条件及原型扩展通过 `select` 接入 |
| 属性、DOM 插入、类名、数据、样式和尺寸 | `dom.js`、`data.js` 和 `style.js`。多目标插入会复制前几个目标所需的节点。对象数据与 DOM 属性分开存储 |
| 委托、事件数据和触发 | `events.js` 使用原生 DOM 事件。增加命名空间、一次绑定、委托回调上下文及触发参数 |
| `animate`、`stop` 和显示效果 | `effects.js` 使用浏览器帧调度，保留队列和结束回调，支持 CSS 数值、滚动位置及常用 Tween hooks |

标准遍历返回新集合，`end()` 返回上一级。读接口、回调接收者及扩展优先按 jQuery 插件的常见契约处理。事件签名、插件注册和数据行为参考以下文档。 [插件编写](https://learn.jquery.com/plugins/basic-plugin-creation/) · [事件](https://api.jquery.com/on/) · [数据](https://api.jquery.com/data/)

## 验证

- Chrome 158 用原 TangramJS Elements 对照了选择、索引、`each` 接收者、属性和类名判定。另验证了旧式对象条件和扩展入口。
- Chrome 158 对照 jQuery 3.7.1，核对集合返回链、数据缓存、委托事件和命名空间、克隆时的事件与数据、表单值和序列化、尺寸、节点插入及扩展。
- 在同一浏览器用两个实现分别运行 Mark.js 8.11.1 的标记和撤销，以及 jQuery.scrollTo 2.1.3 的双轴队列动画，核对 DOM 输出、滚动位置和回调。用当前包核对停止队列、显示效果样式恢复、复选框默认行为和全局变量恢复。
- 构建后用独立安装的 tarball 验证 ESM、类型和包体。包标记为私有。
