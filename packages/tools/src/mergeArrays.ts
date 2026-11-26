// TangramJS arr/arr.js:29
import each from './each.js'

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
