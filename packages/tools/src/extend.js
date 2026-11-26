// TangramJS tangram.js:303
import each from './each.js'
import slice from './slice.js'
import writeValue from './internal/writeValue.js'

export default function extend(base) {
    base = (base && (typeof(base) === 'object' || typeof(base) === 'function')) ? base : globalThis;
    var rewrite = (arguments[1] === 1 || arguments[1] === true) ? true : false;
    each(slice(arguments, 1), function(index, source) {
        each(source, function(key, value) {
            if (source.hasOwnProperty(key)) {
                /* 判断是否需要覆盖 */
                if (typeof base[key] === 'undefined' || rewrite) {
                    writeValue(base, key, value);
                }
            }
        });
    });
    return base;
}
