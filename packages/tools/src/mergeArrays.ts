// TangramJS arr/arr.js:29
import each from './each.js'

/**
 * 收集多个数组中的元素并保持首次出现顺序，忽略其他输入。
 *
 * @param sources - 按顺序读取的数组来源，非数组条目会被忽略。
 * @returns 按严格相等去重得到的新数组。
 */
function mergeArrays<T>(...sources: (readonly T[] | string | number | boolean | null | undefined)[]): T[]
function mergeArrays(...sources: unknown[]): unknown[]
function mergeArrays(...sources: unknown[]): unknown[] {
    const array: unknown[] = [];
    if (sources.length > 0) {
        for (var a = 0; a < sources.length; a++) {
            if (typeof sources[a] == 'object' && sources[a] instanceof Array) {
                each(sources[a] as readonly unknown[], function(index, elememt) {
                    if (array.indexOf(elememt) < 0) {
                        array.push(elememt);
                    }
                });
            }
        }
    }
    return array;
}

export default mergeArrays
