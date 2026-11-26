# Visual Form

`@sugars/visual-form` 移植自 TangramJS `VisualJOSN.ClassObject` 与 `data.Model`。一份定义同时决定浏览器控件和 JSON 字段规则。

```ts
import { VisualForm } from '@sugars/visual-form'

const element = document.createElement('div')
document.body.append(element)

const form = new VisualForm(element, [
    ['name', 'text', 40, '匿名'],
    ['visibility', 'text', ['public', 'private'], ['公开', '私有']],
    ['quantity', 'number', 0, 0],
])

form.loadJSON('{"name":"小可乐","visibility":"private"}')
console.log(form.getJSON())
// 不再使用时调用 form.destroy()
```

字段定义是 `[名称, 控件, 最大长度, 默认值, 选项, 显示文字]`。长度和默认值可省略。也可写 `[名称, 控件, 选项, 显示文字]`，这时第一项为默认值。控件类型沿用原字段映射，另支持 checkbox。原来使用时间插件的字段映射到浏览器输入控件。

可以用 `VisualForm.declare(name, fields)` 登记后按返回的名称创建多个表单。构造时传入一个 `textarea`，或之后调用 `bindInput(textarea)`，可用其值初始化表单并在 `getJSON()` 时写回。使用期间 textarea 隐藏，销毁时恢复显示样式。

`input(data)` 和 `loadJSON(json)` 更新通过校验的字段并渲染控件。`output()` 回读控件并根据同一模型校验，未通过的字段保留上一次有效值。数值 input 和 select 的普通编辑值按原接口输出字符串。具名表单之外也可单独导入 `Model`，使用 `check`、`create`、`read`、`update` 和 `delete`。历史构造器名称 `ClassObject` 是 `VisualForm` 的别名。

`time` 控件按 `HH:mm:ss` 导出，浏览器省略秒时补为 `00`。
