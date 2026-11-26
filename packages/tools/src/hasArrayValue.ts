// TangramJS arr/arr.js:73

/**
 * 返回第一个严格相等的项的索引。找不到时返回 false，索引 0 表示命中首项。
 *
 * @param array - 按索引读取的集合。
 * @param elem - 以严格相等查找的值。
 * @returns 首个命中索引，未找到时返回 false。
 */
export default function hasArrayValue<T>(array: ArrayLike<T>, elem: unknown) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === elem) {
            return i;
        };
    };
    return false;
}
