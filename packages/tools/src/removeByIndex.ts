// TangramJS arr/arr.js:104

/**
 * 按索引过滤并返回新数组，宽松比较允许数字字符串索引。
 *
 * @param array - 被读取的数组或类数组。
 * @param index - 要排除的索引，数字字符串按旧规则可参与比较。
 * @returns 剩余项保持原顺序的新数组。
 */
export default function removeByIndex<T>(array: ArrayLike<T>, index: number | string) {
    var result = [];
    for (var i = 0; i < array.length; i++) {
        i == index || result.push(array[i]!);
    }
    return result;
}
