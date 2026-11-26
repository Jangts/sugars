// TangramJS arr/arr.js:66
import isArray from './isArray.js'

/**
 * 从数组末尾向开头遍历，回调仍收到数组原索引。
 *
 * @param array - 从末尾遍历到起始位置的数组。
 * @param handler - 接收数组原索引与值，this 指向当前项。
 */
export default function eachReverse<T>(array: readonly T[], handler: (this: T, index: number, value: T) => unknown) {
    if (isArray(array)) {
        for (var i = array.length - 1; i > -1; i--) {
            handler.call(array[i]!, i, array[i]!);
        }
    }
}
