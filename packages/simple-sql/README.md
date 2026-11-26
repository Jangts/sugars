# Simple SQL

`@sugars/simple-sql` 移植了 TangramJS `data.Sheet`。表具有默认值、约束、自增主键和浏览器持久化。用结构化方法或短 SQL 语句读写。

```ts
import { Sheet } from '@sugars/simple-sql'

const items = new Sheet('items', { id: 0, name: '', quantity: 0 }, 'id', {
    quantity: { type: 'number', min: 0 },
})

items.insert({ name: '铅笔', quantity: 3 })
const rows = Sheet.exec('select name from items where (quantity > 0) order by quantity desc')
console.log(rows)
```

- `insert(...rows)` 返回最后一个自增主键。`select(...ids)` 读取指定行，省略主键时读取整张表。`update(id, patch)` 与 `delete(...ids)` 按主键操作。
- `fields()` 查看字段定义。`add(name, defaultValue, constraint)`、`alter(oldName, newName, defaultValue)`、`drop(fieldName)` 管理列。`drop()` 删除表。
- `Sheet.exec(sql)` 支持 `SELECT`、`INSERT INTO ... VALUES { ... }`、`UPDATE ... SET { ... } WHERE ...`、`DELETE FROM ... WHERE ...`。写入值可以使用 JSON 对象，也可以使用旧式裸键和单引号。多个插入对象用逗号分隔。
- `WHERE` 支持字段、字面量、比较、括号、`AND/OR/NOT` 及对应的 `&&/||/!`。排序使用 `ORDER BY`，`LIMIT offset, count` 保留旧版的从 1 开始计数。语法错误抛出 `SyntaxError`。
- `subscribe(callback, onError?)` 在本页提交成功后通知版本号，返回取消订阅函数。订阅回调失败时，其他订阅仍会收到通知，提交结果照常返回。错误异步交给 `onError`，缺省时用宿主错误报告。`render(width, border, container)` 挂载随本页提交更新的 HTML 表格。`destroy()` 清理当前实例挂载的表格。

默认使用浏览器的 `localStorage`。构造器第五个参数和 `Sheet.exec` 第二个参数可以传入实现 `getItem`、`setItem` 的存储。旧版 localStorage 的表和分片可直接读取，首次写入后使用当前格式。`SimpleSQL` 是 `Sheet` 的别名。

## 多标签页写入

每次操作读取当前存储版本。浏览器的 `localStorage` 以及同时提供 `length`、`key()` 和 `removeItem()` 的存储后端会为每次提交保存独立版本。仅提供读写两个方法的后端需由调用方协调并发访问。

多个页面都需要写同一张表时，将这些写入统一放进 `withWriteLock`，它会在支持 Web Locks 的安全上下文中按表串行执行回调。 [Web Locks 规范](https://w3c.github.io/web-locks/)

```ts
const id = await Sheet.withWriteLock('items', () => {
    return new Sheet('items', { id: 0, name: '' }).insert({ name: '橡皮' })
})
```

普通同步调用也可跨页使用。发现读取版本已被替换时，会在写入前抛出 `SheetConflictError`，此时 `versions` 为空，可重新执行操作。两个写入若同时通过检查，分支快照均会保留，后续操作会抛出带快照的 `SheetConflictError`。用 `Sheet.resolveConflict(name, versions => snapshot)` 保存人工选择或合并后的快照。合并有重复数字主键的行时，需要重新编号并相应更新 `ai`。切换到此版本后，各标签页应使用同一版本的库。
