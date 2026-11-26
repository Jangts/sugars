# SimpleEditor

`@sugars/editor` 提供浏览器原生富文本编辑内核。可接管一个普通元素，也可绑定 `textarea` 或单行文本字段。通过 npm 使用时安装对应版本的 `@sugars/editor`，在支持 ESM 的前端项目中导入。

```ts
import { SimpleEditor } from '@sugars/editor'

const field = document.createElement('textarea')
field.name = 'body'
document.body.append(field)

const editor = new SimpleEditor(field, {
    html: '<p>开始编辑</p>',
    onChange: ({ html }) => console.log(html),
})

editor.setValue('<p>更新后的正文</p>')
console.log(field.value)
```

编辑器绑定字段时会创建原生编辑区，并将初始内容和编辑结果同步到字段。可用 `getValue()` 读取 HTML，`resetValue()` 恢复初始内容。调用外部工具栏命令前可用 `editor.selection.saveRange()` 保存选区，再用 `execCommand('bold')` 等命令执行操作。内容插入和粘贴经过清理。

卸载编辑区时调用 `editor.destroy()`，也可通过 `readOnly` 暂时禁用编辑。默认表情与历史素材说明见 [第三方声明](THIRD-PARTY-NOTICES.md)。
