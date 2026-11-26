/**
 * `@sugars/tools` 的公开入口。
 *
 * 汇总分类入口及现有单函数导出，具体实现位于各自模块。
 * 按数组、集合、类型、数学、对象和字符串聚合公共工具，各单文件子路径使用同一个实现。
 */

export {
    merge as mergeArrays, beObject, each as eachArray, eachReverse, has as hasArrayValue,
    push, remove, removeByIndex, index as arrayIndex, unique, sum, max, min, indexOfMax, indexOfMin,
} from './array.js'
export * from './collection.js'
export * from './lang.js'
export * from './math.js'
export {
    clone, copy, extend, update, hasProp, merge as mergeObjects, deepMerge,
    toQueryString, encodeQueryString, decodeQueryString,
} from './object.js'
export { capital, toCamel, has as hasString, base64Encode, base64Decode } from './string.js'
