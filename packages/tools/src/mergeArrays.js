// TangramJS arr/arr.js:29
import each from './each.js'

export default function mergeArrays() {
    if (arguments.length > 0) {
        var array = [];
        for (var a = 0; a < arguments.length; a++) {
            if (typeof arguments[a] == 'object' && arguments[a] instanceof Array) {
                each(arguments[a], function(index, elememt) {
                    if (array.indexOf(elememt) < 0) {
                        array.push(elememt);
                    }
                });
            }
        }
    } else {
        var array = [];
    }
    return array;
}
