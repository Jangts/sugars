// TangramJS tangram.js:274

/* 递归复制普通对象的自有成员和数组元素，其他类型沿用原值。 */

import each from '../each.js'
import writeValue from './writeValue.js'

export default function deep(source: unknown): unknown {
    var type = Object.prototype.toString.call(source).match(/\[object (\w+)\]/)![1];
    if (type === 'Object') {
        var clone = {};
        each(source, function(key) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                writeValue(clone, key, deep((source as Record<PropertyKey, unknown>)[key]));
            }
        });
        return clone;
    }
    if (type === 'Array') {
        const array = source as unknown[];
        return array.map && array.map(function(v) {
            return deep(v);
        });
    }
    return source;
}
