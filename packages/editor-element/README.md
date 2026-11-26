# Sugars Editor Element

`@sugars/editor-element` 将 `@sugars/editor` 挂载为 Light DOM 自定义元素。通过 npm 使用时安装对应版本的 `@sugars/editor-element`，包清单会解析匹配的编辑器内核。需要支持 ESM 与 Custom Elements 的浏览器。

```html
<sugars-editor id="note"><p>开始编辑</p></sugars-editor>
```

```ts
import { defineEditorElement } from '@sugars/editor-element'

const note = document.querySelector('sugars-editor')!
note.addEventListener('editor-ready', () => {
    note.value = '<p>编辑器已就绪</p>'
})
defineEditorElement()
```

注册后，元素连接到文档时创建编辑器并派发 `editor-ready`。元素可通过 `value`、`readOnly` 和 `execCommand()` 使用，内容变化派发 `editor-change`。元素断开时释放实例，重连后用保留的 Light DOM 内容重新挂载。
