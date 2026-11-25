# @sugars/highlight

TangramJS `see.highlight` 的独立 ESM 包，运行环境需支持 ES2022。使用 Sugars 根目录的 `npm ci` 和 `npm run build` 构建后，可在工作区通过包名引入。

## 高亮页面代码块

`data-language` 或 `data-lang` 可以放在 `<code>` 或它的祖先元素上。把待展示的代码作为文本写入代码块。

```html
<pre data-lang="javascript"><code>const answer = 42;</code></pre>
```

```ts
import { renderAll } from '@sugars/highlight'
import '@sugars/highlight/themes/default.css'

renderAll()
```

示例中的 CSS 导入适用于支持 CSS 导入的打包工具。直接使用浏览器模块时，将对应 CSS 作为样式表加载。包内有 `default.css`、`dark.css`、`coy.css`、`funky.css`、`okaidia.css`、`solarizedColor.css` 和 `Twilight.css`。

- `renderElement(element, callback?)` 处理单个元素。高亮成功后，回调中的 `this` 指向该元素。
- `renderAll(callback?)` 扫描当前文档。`renderAll(root, callback?)` 可限定扫描范围。
- `render(element, callback?)` 和 `render(callback?)` 沿用原模块的单处与全页入口。
- 页面内容变化时可再次调用上述方法。语言未登记或代码为空时，渲染保留原先的内容。

## 转换代码文本

```ts
import { highlight, languages } from '@sugars/highlight'

const html = highlight('const answer = 42;', 'javascript')
const sameHtml = highlight('const answer = 42;', languages.javascript!, 'javascript')
```

`highlight` 返回带 `ib-hl` 词法类名的 HTML，未知语言返回经过转义的文本。该入口可在 Node.js 使用。`languages` 提供内置规则及规则扩展方法，`tokenize(text, grammar)` 返回分词结果，`hooks` 提供生成标记与渲染阶段的回调。默认导出汇集原来常用的方法、语言规则和钩子。

历史代码和主题的来源记录见 [第三方声明](THIRD-PARTY-NOTICES.md)。
