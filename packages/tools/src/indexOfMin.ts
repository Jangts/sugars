// TangramJS arr/arr.js:154
import arrayIndex from './arrayIndex.js'

/**
 * 返回第一个最小值的索引，空输入沿用查找函数的未命中结果。
 *
 * @param array - 待查的数值数组。
 * @returns 首个最小值索引，无匹配时为 -1。
 */
export default function indexOfMin(array: readonly number[]) {
    return arrayIndex(array, Math.min.apply(Math, array as number[]));
}
