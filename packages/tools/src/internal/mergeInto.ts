// TangramJS obj/obj.js:16
import each from '../each.js'
import writeValue from './writeValue.js'

export default function mergeInto(obj1: object | null, obj2: object | null): object | null {
    if (obj1 && obj2) {
        const target = obj1 as Record<PropertyKey, unknown>;
        each(obj2, function(key, val) {
            if (key !== '__proto__' && (typeof target[key] === 'object') && (typeof val === 'object') && !(target[key] instanceof Array) && !(val instanceof Array)) {
                target[key] = mergeInto(target[key] as object | null, val)
            } else {
                writeValue(target, key, val);
            }
        });
    } else {
        obj1 = obj2;
    }
    return obj1;
}
