// TangramJS arr/arr.js:59
import isArray from './isArray.js'

export default function eachArray<T>(array: readonly T[], handler: (this: T, index: number, value: T) => unknown) {
    if (isArray(array)) {
        for (var i = 0; i < array.length; i++) {
            handler.call(array[i]!, i, array[i]!);
        }
    }
}
