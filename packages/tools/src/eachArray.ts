// TangramJS arr/arr.js:59
import isArray from './isArray.js'

/**
 * 只遍历通过历史数组检查的值，回调的 this 为当前元素。
 *
 * @param array - 待遍历数组。未通过数组检查时跳过。
 * @param handler - 接收当前索引和值，this 指向当前项。
 */
export default function eachArray<T>(array: readonly T[], handler: (this: T, index: number, value: T) => unknown) {
    if (isArray(array)) {
        for (var i = 0; i < array.length; i++) {
            handler.call(array[i]!, i, array[i]!);
        }
    }
}
