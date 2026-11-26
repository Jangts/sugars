// TangramJS arr/arr.js:66
import isArray from './isArray.js'

export default function eachReverse(array, handler) {
    if (isArray(array)) {
        for (var i = array.length - 1; i > -1; i--) {
            handler.call(array[i], i, array[i]);
        }
    }
}
