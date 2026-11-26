// TangramJS obj/obj.js:16
import each from '../each.js'
import writeValue from './writeValue.js'

export default function mergeInto(obj1, obj2) {
    if (obj1 && obj2) {
        each(obj2, function(key, val) {
            if (key !== '__proto__' && (typeof obj1[key] === 'object') && (typeof val === 'object') && !(obj1[key] instanceof Array) && !(val instanceof Array)) {
                obj1[key] = mergeInto(obj1[key], val)
            } else {
                writeValue(obj1, key, val);
            }
        });
    } else {
        obj1 = obj2;
    }
    return obj1;
}
