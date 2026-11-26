// TangramJS arr/arr.js:133
import each from './each.js'
import hasArrayValue from './hasArrayValue.js'

/**
 * 按严格相等去重并保留首次出现的顺序。
 *
 * @param array - 由旧集合遍历规则读取的数组或类数组。
 * @returns 保留首次出现顺序的新数组。
 */
export default function unique<T>(array: ArrayLike<T>): T[] {
    const result: T[] = [];
    each(array, function(i, elem) {
        if (hasArrayValue(result, elem) === false) {
            result.push(elem);
        };
    });
    return result;
}
