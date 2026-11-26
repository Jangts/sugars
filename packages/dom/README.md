# DOM

`@sugars/dom` 移植了 TangramJS 的 `dom.Elements` 和 `dom.select`。源码使用 TypeScript，构建输出 ESM，直接使用浏览器的选择器、DOM 和事件 API，无运行时依赖。npm 工作区构建后可从根入口导入。

```ts
import $ from '@sugars/dom'

$.fn.extend({
    highlight(enabled = true) {
        return this.each(function () {
            $(this).toggleClass('is-highlighted', enabled)
        })
    },
})

const items = $('.note')
items.on('click.notes', function () {
    $(this).attr('aria-pressed', 'true')
})
items.off('.notes')
```

插件可用 `$.fn.plugin = function (...) { ... }` 或 `$.fn.extend({...})` 注册。另有 `$.extend`、静态 `$.data`、`$.Event` 和常用集合工具。默认导入 `$` 和命名导入 `$` 指向同一个函数。浏览器 IIFE 插件可以在调用 `installGlobals(window)` 后加载，返回函数用于恢复先前的全局变量。

| 能力 | 常用接口 |
| --- | --- |
| 集合 | `get`、`each`、`map`、`find`、`filter`、`closest`、`addBack`、`end` |
| DOM | `attr`、`prop`、`data`、`html`、`text`、插入、`clone`、`remove`、`detach` |
| 事件 | `on`、`one`、`off`、委托、命名空间、`trigger`、`triggerHandler` |
| 表单和布局 | `val`、`serialize`、`css`、尺寸、偏移和滚动位置 |
| 效果 | `animate`、`stop`、显示隐藏、淡入淡出、纵向展开收起、数值 Tween hooks |

旧代码可以用 `select({ tagName: 'div', className: ['item', 'active'] })` 和 `select.extend(methods, rewrite)`。集合上也保留了 `closet`、`sub`、`concat`、`transition` 和 `animator`。

选择器支持原生 CSS 以及末尾的常用扩展，如 `:visible`、`:hidden`、`:input`、`:first` 和 `:eq(n)`。插件兼容范围集中在 DOM 和效果。依赖 jQuery 的 AJAX、Deferred、完整选择器引擎或事件内部钩子的插件仍需使用 jQuery。导入时不安装全局变量，插入 HTML 时不主动执行其中的脚本。
