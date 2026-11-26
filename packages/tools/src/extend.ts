// TangramJS tangram.js:303
import each from './each.js'
import writeValue from './internal/writeValue.js'

export default function extend(base?: object | null, ...sources: unknown[]) {
    const target = ((base && (typeof(base) === 'object' || typeof(base) === 'function')) ? base : globalThis) as Record<PropertyKey, unknown>;
    var rewrite = (sources[0] === 1 || sources[0] === true) ? true : false;
    each(sources, function(index, source) {
        each(source, function(key, value) {
            if ((source as object).hasOwnProperty(key)) {
                /* 判断是否需要覆盖 */
                if (typeof target[key] === 'undefined' || rewrite) {
                    writeValue(target, key, value);
                }
            }
        });
    });
    return target;
}
