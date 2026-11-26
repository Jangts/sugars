# @sugars/tools

从 TangramJS 拆出的基础工具。每个函数各有模块，源码开头标明来源。可从包根入口、分类入口或单函数入口导入。

```ts
import { copy, mergeArrays } from '@sugars/tools'
import { deepMerge } from '@sugars/tools/object'
import unique from '@sugars/tools/unique'

unique(['a', 'b', 'a']) // ['a', 'b']
mergeArrays([1, 2], [2, 3]) // [1, 2, 3]
deepMerge({ style: { color: 'red', gap: 4 } }, { style: { color: 'blue' } })
const snapshot = copy({ items: [{ title: '示例' }] })
```

| 分类入口 | 工具 |
| --- | --- |
| `@sugars/tools/array` | `merge`、`beObject`、`each`、`eachReverse`、`has`、`push`、`remove`、`removeByIndex`、`index`、`unique`、`sum`、`max`、`min`、`indexOfMax`、`indexOfMin` |
| `@sugars/tools/collection` | `slice`、`each`、`loop` |
| `@sugars/tools/lang` | `type`、`fasttype`、`isArray`、`isInteger`、`isIntStr`、`isFloatStr`、`isNumeric`、`isPercent` |
| `@sugars/tools/math` | `cap`、`getDecimalPlaces`、`radians`、`gcd`、`lcm` |
| `@sugars/tools/object` | `clone`、`copy`、`extend`、`update`、`hasProp`、`merge`、`deepMerge`、`toQueryString`、`encodeQueryString`、`decodeQueryString` |
| `@sugars/tools/string` | `capital`、`toCamel`、`has`、`base64Encode`、`base64Decode` |

分类入口沿用原名称。包根入口和单函数入口对同名函数使用 `mergeArrays`、`mergeObjects`、`eachArray`、`hasArrayValue`、`hasString` 和 `arrayIndex`。

- 集合的 `each` 和 `loop` 回调接收 `(key, value)`。`loop.out()` 中断遍历。原有 `clone(source, deeply)` 默认为浅拷贝，`copy(source, shallowly)` 默认为深拷贝。
- `push(elem, array, index)` 沿用旧版截断到指定位置后再追加的行为。`beObject(keys, values)` 仍以 `null` 填充假值。
- `toCamel` 只替换第一个连字符段。Base64 保留历史编码算法，查询字符串保持原来的拆分规则。
- `gcd` 和 `lcm` 沿用原函数名与结果。原实现把两个算法对调了。`sum` 接收数字数组，空数组返回 `undefined`。

[源码来源和许可](THIRD-PARTY-NOTICES.md)
