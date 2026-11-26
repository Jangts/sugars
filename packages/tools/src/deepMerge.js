// TangramJS obj/obj.js:50
import each from './each.js'
import copy from './copy.js'
import mergeInto from './internal/mergeInto.js'
import writeValue from './internal/writeValue.js'

export default function deepMerge(obj1, obj2) {
    var object = {};
    if ((typeof obj1 === 'object') && (typeof obj2 === 'object') && !(obj1 instanceof Array) && !(obj2 instanceof Array)) {
        if (obj1 && obj2) {
            object = copy(obj1);
            each(obj2, function(key, val) {
                if (key !== '__proto__' && (typeof object[key] === 'object') && (typeof val === 'object') && !(object[key] instanceof Array) && !(val instanceof Array)) {
                    object[key] = mergeInto(object[key], val)
                } else {
                    writeValue(object, key, val);
                }
            });
        } else if (obj1) {
            object = copy(obj1);
        } else if (obj2) {
            object = copy(obj2);
        } else {
            object = {};
        }
        return object;
    } else {
        throw 'tangram.js Error: Parameters must be two objects.';
    }
}
