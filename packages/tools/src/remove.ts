// TangramJS arr/arr.js:97

/**
 * 按历史宽松相等比较移除匹配项，返回新数组。
 *
 * @param array - 被读取的数组或类数组。
 * @param elem - 按宽松相等匹配并排除的值。
 * @returns 剩余项组成的新数组。
 */
export default function remove<T>(array: ArrayLike<T>, elem: unknown) {
    var result = [];
    for (var i = 0; i < array.length; i++) {
        array[i] == elem || result.push(array[i]!);
    }
    return result;
}
