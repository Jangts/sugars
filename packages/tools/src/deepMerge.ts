// TangramJS obj/obj.js:50
import each from './each.js'
import copy from './copy.js'
import mergeInto from './internal/mergeInto.js'
import writeValue from './internal/writeValue.js'

/**
 * 在左对象的副本上递归合并两个对象。数组值由右侧整项替换。
 *
 * @param obj1 - 生成副本的左对象，null 视为空。
 * @param obj2 - 右侧来源，冲突时覆盖非对象值。
 * @returns 合并后的新对象。
 * @throws 输入为数组或非对象时抛出旧式错误字符串。
 */
export default function deepMerge(obj1: object | null, obj2: object | null): Record<PropertyKey, unknown> {
    let object: Record<PropertyKey, unknown> = {};
    if ((typeof obj1 === 'object') && (typeof obj2 === 'object') && !(obj1 instanceof Array) && !(obj2 instanceof Array)) {
        if (obj1 && obj2) {
            object = copy(obj1) as Record<PropertyKey, unknown>;
            each(obj2, function(key, val) {
                if (key !== '__proto__' && (typeof object[key] === 'object') && (typeof val === 'object') && !(object[key] instanceof Array) && !(val instanceof Array)) {
                    object[key] = mergeInto(object[key] as object | null, val)
                } else {
                    writeValue(object, key, val);
                }
            });
        } else if (obj1) {
            object = copy(obj1) as Record<PropertyKey, unknown>;
        } else if (obj2) {
            object = copy(obj2) as Record<PropertyKey, unknown>;
        } else {
            object = {};
        }
        return object;
    } else {
        throw 'tangram.js Error: Parameters must be two objects.';
    }
}
