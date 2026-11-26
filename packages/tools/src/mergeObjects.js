// TangramJS obj/obj.js:35
import each from './each.js'
import writeValue from './internal/writeValue.js'

export default function mergeObjects() {
    if (arguments.length > 0) {
        var object = {};
        for (var a = 0; a < arguments.length; a++) {
            if (typeof arguments[a] == 'object') {
                each(arguments[a], function(index, elememt) {
                    writeValue(object, index, elememt);
                });
            }
        }
    } else {
        var object = {};
    }
    return object;
}
