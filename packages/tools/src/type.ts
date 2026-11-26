// TangramJS util/type.js:131
import typeofObj from './internal/typeofObj.js'
import typeofStr from './internal/typeofStr.js'
import isInteger from './isInteger.js'

/**
 * 返回 TangramJS 的大类名称。启用 subtype 时细分数字、字符串和对象。
 *
 *
 * @param object - 任意待识别的值。
 * @param subtype - 是否返回数组、文本或 DOM 等更具体的旧类型名。
 * @returns 历史类型名，旧实现没有覆盖的类型返回 undefined。
 */
export default function type(object: unknown, subtype?: boolean) {
    switch (typeof object) {
        case 'object':
            return subtype ? typeofObj(object) : (object == null ? 'Null' : ((typeofObj(object) === 'Array') ? 'Array' : 'Object'));

        case 'function':
        case 'boolean':
        case 'undefined':
            return (typeof object).replace(/(\w)/, function(v) {
                return v.toUpperCase();
            });

        case 'number':
            return subtype ? (isInteger(object) ? 'Integer' : 'Float') : 'Number';

        case 'string':
            return subtype ? typeofStr(object) : 'String';
    }
}
