/* 定义内部集合边界。插件能把原始值、DOM 节点或自有对象放入集合，公开类型通过泛型保留调用方知道的成员类型。 */

import type { Elements } from './index.js'

// 插件可以把原始值、浏览器节点或自有对象放入集合。
// 内部在这里处理动态成员访问，公开类型通过泛型保留成员类型。
export type SelectionValue = any
export type RuntimeCollection = Elements<SelectionValue>
export type SelectionPredicate = (this: SelectionValue, index: number, item: SelectionValue) => unknown
