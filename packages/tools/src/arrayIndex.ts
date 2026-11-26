// TangramJS arr/arr.js:111

/**
 * 按严格相等查找第一个匹配项，未找到时返回 -1。
 *
 * @param array - 待查数组。
 * @param elem - 按严格相等比较的目标值。
 * @returns 首次出现的从零计数索引，找不到时返回 -1。
 */
export default function arrayIndex<T>(array: readonly T[], elem: T) {
    if ((Array.prototype as Partial<unknown[]>).indexOf) {
        return array.indexOf(elem);
    } else {
        for (var i = 0; i < array.length; i++) {
            if (array[i] === elem) return i;
        }
        return -1;
    }
}
