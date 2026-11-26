// TangramJS arr/arr.js:59
import isArray from './isArray.js'

export default function eachArray(array, handler) {
    if (isArray(array)) {
        for (var i = 0; i < array.length; i++) {
            handler.call(array[i], i, array[i]);
        }
    }
}
