// TangramJS arr/arr.js:151
import arrayIndex from './arrayIndex.js'

/**
 * 返回第一个最大值的索引，空输入沿用查找函数的未命中结果。
 *
 * @param array - 待查的数值数组。
 * @returns 首个最大值索引，无匹配时为 -1。
 */
export default function indexOfMax(array: readonly number[]) {
    return arrayIndex(array, Math.max.apply(Math, array as number[]));
}
