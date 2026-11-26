// TangramJS util/type.js:131
import typeofObj from './internal/typeofObj.js'
import typeofStr from './internal/typeofStr.js'
import isInteger from './isInteger.js'

/** @param {boolean} [subtype] */
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
