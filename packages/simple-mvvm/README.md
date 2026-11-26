# Simple MVVM

`@sugars/simple-mvvm` 将 TangramJS 的 Observer、ViewModel 和 VElement 移植为 ESM。ViewModel 根据已声明字段的变化同步渲染，可调用自定义渲染函数，也可用 VElement 创建和更新 DOM。

在 sugars 工作区根目录执行 `npm ci` 和 `npm run build` 后，可从包的根入口导入。单独使用某项能力时也可以从 `/observer`、`/view-model`、`/v-element` 导入。

## 自定义渲染

```ts
import { ViewModel } from '@sugars/simple-mvvm/view-model'

const output = document.createElement('output')
document.body.append(output)

const model = new ViewModel({
    data: { count: 0 },
    render() {
        output.textContent = String(this.data.count)
    },
})

model.count++
// 不再更新时调用 model.destroy()。output 由调用方管理。
```

创建时执行一次渲染。写入不同的值后依次执行 `beforeRender`、`render`、`afterRender`，三个函数的 `this` 都是选项对象。Observer 本身以及无需 DOM 的自定义渲染也可在 Node.js 使用。

## 虚拟 DOM 渲染

```ts
import { createVElement as h, ViewModel } from '@sugars/simple-mvvm'

const model = new ViewModel({
    useVElement: true,
    data: { input: '你好' },
    render() {
        return h('section', [
            h('input', { value: this.input }),
            h('p', [this.input]),
        ])
    },
})

model.input = '写入状态后同步更新'
// 不再使用时调用 model.destroy()，它会移除已挂载的根节点。
```

此模式的 `render` 以 ViewModel 为 `this`，首次渲染挂载到 `document.body`，之后执行 diff 和 patch。也可传第二个构造参数 `true` 或 `false` 显式覆盖 `useVElement`。根节点下 `input`、`select` 和 `textarea` 的原生 `change` 事件将字段的 `value` 写入 ViewModel 的 `input`，在 `data` 里声明 `input` 即可触发更新。

`new VElement(tag, props, children)`、`VElement.create` 和 `createVElement` 使用同一构造方式。省略属性时可写 `createVElement(tag, children)`。递归渲染使用原生 DOM。兄弟节点的 `key` 在字符串化后应唯一。单独使用 VElement 时，用 `node = VElement.patch(node, VElement.diff(previous, next))` 更新 DOM 并保留返回的根节点。给元素设置 `ignore` 属性可以交由调用方管理其子 DOM，移除这一属性后会重新渲染该元素。

## 单独观察数据

```ts
import { observe } from '@sugars/simple-mvvm/observer'

const data = { count: 0, nested: { enabled: false } }
const observer = observe(data)
const listener = observer.listen('count', (value, key) => console.log(key, value))
data.count++
listener?.disconnect()
```

`observe(data)` 与 `Observer.create(data)` 等价。每个可观察字段可分别注册写回调和读回调，也可用 `observer.on('write', key, callback)` 或 `observer.on('read', key, callback)`。回调接收 `(value, key)`，普通函数的 `this` 是数据对象。`observer.silently = true` 会暂停通知，仍会记录新值。

观察从普通可变对象已有的可枚举数据字段开始。替换嵌套对象时会观察新对象；监听嵌套字段要对该对象单独订阅。`listen(callback)` 为当前所有受观察字段注册写回调。需要单独解除订阅时，按字段注册并调用返回的 `disconnect()`。ViewModel 只为构造时的字段建立代理和渲染订阅。
