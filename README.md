# sugars

把 TangramJS 的编辑器、图表、高亮、数据工具和界面组件，以及 GrandAPP 的 K Line Mobile 整理为独立包。AMD、旧式 Promise 和类工厂使用 ES5 并提供普通脚本入口，其余包使用 ESM。项目结构、规范和维护资料从 [项目文档](docs/README.md) 进入。

| 包 | 用途 |
| --- | --- |
| `@sugars/editor` | 可公开发布的通用内核。将 `SimpleEditor` 绑定到原生元素或表单字段 |
| `@sugars/editor-element` | 可公开发布的 Light DOM 自定义元素，依赖 `@sugars/editor` |
| `@sugars/charts` | 切出 TangramJS 的 Canvas 渲染、比例尺和提示框 |
| `@sugars/kline` | 支持鼠标和触摸的 Canvas K 线图 |
| `@sugars/highlight` | 代码块语法高亮和纯文本转换，附历史语言规则与主题 |
| [`@sugars/async`](packages/async/README.md) | **ES5 兼容** · AMD 加载器和 TangramJS 旧式 Promise |
| [`@sugars/declare`](packages/declare/README.md) | **ES5 兼容** · 原型类工厂 |
| [`@sugars/animation`](packages/animation/README.md) | 场景和帧组成的动画播放器 |
| [`@sugars/scroll-view`](packages/scroll-view/README.md) | 绑定调用方轨道和滑块的原生滚动控制器 |
| [`@sugars/tools`](packages/tools/README.md) | 可按分类或单函数导入的基础工具 |
| [`@sugars/simple-mvvm`](packages/simple-mvvm/README.md) | 数据观察、自定义渲染和虚拟 DOM |
| [`@sugars/swiper`](packages/swiper/README.md) | 七种布局和切换预设共用的轮播控制 |
| [`@sugars/visual-form`](packages/visual-form/README.md) | 用一份字段定义编辑和校验 JSON |
| [`@sugars/simple-sql`](packages/simple-sql/README.md) | 带字段约束和 SQL 查询的本地表 |
| [`@sugars/3d-pictures`](packages/3d-pictures/README.md) | 鼠标和触摸拖动图片序列 |
| [`@sugars/dom`](packages/dom/README.md) | 轻量 DOM 集合与 jQuery 风格的插件接口 |

```sh
npm ci
npm run build
```

工作区使用 `packages/*`。现代包使用 TypeScript 7，构建生成目标为 ES2025 的 ESM 和类型声明。表中标有 **ES5 兼容** 的包直接交付 ES5 脚本，也提供类型声明。

## 原生编辑器

```ts
import { SimpleEditor } from '@sugars/editor'

const editor = new SimpleEditor(document.querySelector<HTMLElement>('#editor')!, {
    onChange: ({ html }) => console.log(html),
})

editor.execCommand('bold')
editor.execCommand('inserttable', { rows: 2, columns: 3, width: 100, unit: '%' })
editor.setValue('<p>新内容</p>')
console.log(editor.getValue())
```

可传入 `textarea` 或文本 `input`。内核保留字段作为表单值，为它创建一个无样式的编辑区。自定义工具栏点击前可用 `editor.selection.saveRange()` 保存选区。

字段同步和销毁用法见 [SimpleEditor 包说明](packages/editor/README.md)。

## Web Component

```html
<sugars-editor id="note"><p>开始编辑</p></sugars-editor>
```

```ts
import { defineEditorElement } from '@sugars/editor-element'

defineEditorElement()

const note = document.querySelector('sugars-editor')!
note.addEventListener('editor-ready', () => {
    note.execCommand('italic')
})
note.addEventListener('editor-change', event => console.log((event as CustomEvent).detail.html))
```

元素提供 `value`、`readOnly`、`execCommand` 和 `editor`。编辑区在 Light DOM，页面可以直接设定样式。元素断开时释放内核监听，重连时恢复编辑能力。

注册时机和事件见 [Web Component 包说明](packages/editor-element/README.md)。

## Canvas 图表

给容器设置宽高，再沿用原图表的 `series`、`xAxis`、`yAxis` 等选项。

```ts
import { Charts } from '@sugars/charts'

const chart = new Charts(document.querySelector<HTMLElement>('#chart')!, null, {
    xAxis: { data: ['一月', '二月', '三月'] },
    series: [{ type: 'bar', name: '流水', data: [4, 8, 2] }],
})

chart.setOption({
    series: [{ type: 'line', name: '流水', data: [5, 8, 3], smooth: true }],
})
```

支持柱状图、折线图、散点图、饼图和雷达图。可通过 `Charts.theme` 配置命名主题，容器移除时调用 `chart.destroy()`。

## K 线图

用 `new KLine({ element, data })` 挂载 K 线图。容器需有可用宽高。完整示例、行情格式、操作方式和来源见 [K 线包说明](packages/kline/README.md)。

## 代码高亮

给 `<code>` 或它的 `<pre>` 设置 `data-language` 或 `data-lang`，在页面内容就绪后调用 `renderAll()`。纯文本可直接调用 `highlight(text, language)`。示例和主题见 [代码高亮包说明](packages/highlight/README.md)。
