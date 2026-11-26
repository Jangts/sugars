// TangramJS tangram.js:320
import each from './each.js'
import writeValue from './internal/writeValue.js'

export default function update(base?: object | null, ...sources: unknown[]) {
    const target = ((base && (typeof(base) === 'object' || typeof(base) === 'function')) ? base : globalThis) as Record<PropertyKey, unknown>;
    each(sources, function(index, source) {
        each(source, function(key, value) {
            if (!(target[key] === undefined) && (source as object).hasOwnProperty(key)) {
                writeValue(target, key, value);
            }
        });
    });
    return target;
}
