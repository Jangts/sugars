# TangramJS 移植说明

| 原模块 | 对应工作区 |
| --- | --- |
| `form/SimpleEditor/SimpleEditor.js`、`Range.js`、`Selection.js`、`commands/*` | `packages/editor/src` |
| `form/SimpleEditor/emoticons/default.js` 和默认 GIF | `packages/editor/src/emoticons.ts` 和 `emoticons/` |
| `painter/Charts/Charts.js` | `packages/charts/src/index.ts` |
| `painter/Charts/components`、`modules`、`types`、`util` | `packages/charts/src` 中同名目录 |
| `painter/canvas.js` 中 Charts 所需的绘制方法 | `packages/charts/src/util/canvas.ts` |
| `see/highlight/highlight.js`、`languages/*` 和 `themes/*` | `packages/highlight`。接口与验证范围见 [代码高亮移植与验收](highlight-migration.md) |
| `util/require.js`、`async/Promise.js`、`tangram.js` 的 `declareClass` | `packages/async` 和 `packages/declare`。入口见 [ES5 兼容模块移植](legacy-migration.md) |
| `dom/Animation.js`、`see/Scrollbar/Abstract.js` 和 `Scrollbar.js` | `packages/animation` 和 `packages/scroll-view`。对应行为见 [Animation 与 ScrollView 移植](animation-scroll-migration.md) |
| 核心数据操作、`arr/arr.js`、`obj/obj.js`、`str/str.js`、`util/{bool,type}.js`、`math/math.js` | `packages/tools`。工具范围与行为见 [基础工具移植](tools-migration.md) |
| `obj/Observer/`、`dom/ViewModel.js`、`dom/VElement/` 和 `arr/diff.js` | `packages/simple-mvvm`。运行路径见 [Simple MVVM 移植](simple-mvvm-migration.md) |
| `see/Slider/`、`form/VisualJOSN/ClassObject.js`、`data/{Model,Sheet,Storage}.js`、`see/Photos/ThreeDimensionalEyes.js` | `packages/{swiper,visual-form,simple-sql,3d-pictures}`。见 [原模块对照与验收](widgets-and-sheet-migration.md) |
| `dom/Elements.js`，以及它调用的选择、事件和样式操作 | `packages/dom`。见 [DOM 集合移植](dom-migration.md) |

编辑器延续 `SimpleEditor`、`execCommand(cmd, value)`、`getValue(index)`、`setValue(value, index)`、`resetValue`、`insertImage` 等方法，保留原来拼写的 `careatEditor` 和 `careatEditors` 入口。原来的工具栏、弹窗、状态栏与样式由调用方自行组织。原上传回调可用 `options.uploader.transfer` 接入，通过 `uploadFiles` 调用。视频插入使用 HTML video，旧 SWF 插入已移除。格式命令沿用浏览器的 `execCommand`，因此具体格式标记和撤销粒度由浏览器决定。外部 HTML 通过 DOMPurify 处理。

图表延续 `new Charts(element, theme, options)` 与 `setOption`。五种系列仍使用各自原有的渲染类，沿用 Grid 和 Polar 比例尺、Canvas 图形、配色和提示框。动画调度改用原生 `requestAnimationFrame`。更新新选项时重建比例尺和系列，避免缩短数据时残留旧图形。模板格式支持 `<%= value %>` 一类的字段插值和格式化函数，原来能执行任意脚本的模板写法需要改成函数。

三个包使用显式 ES Modules。图表以 Lodash 做数据合并和克隆，DOM 及生命周期使用浏览器 API。Web Component 是对编辑内核的新增适配器。

历史来源为 `@jangts/tangram.js` 2.9.1 的源码目录。[原目录附带的许可证文本](../../notices/TangramJS-LICENSE.txt) 原样保留，其署名为 JP Richardson。[编辑器包内第三方声明](../../packages/editor/THIRD-PARTY-NOTICES.md) 分别说明代码与表情来源。各模块和表情素材的许可来源尚未逐项确认。两个编辑器包的 npm 发布访问级别设为 public，图表包仍为私有。
