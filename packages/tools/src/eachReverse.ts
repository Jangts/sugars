// TangramJS arr/arr.js:66
import isArray from './isArray.js'

export default function eachReverse<T>(array: readonly T[], handler: (this: T, index: number, value: T) => unknown) {
    if (isArray(array)) {
        for (var i = array.length - 1; i > -1; i--) {
            handler.call(array[i]!, i, array[i]!);
        }
    }
}
