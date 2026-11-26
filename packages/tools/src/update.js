// TangramJS tangram.js:320
import each from './each.js'
import slice from './slice.js'
import writeValue from './internal/writeValue.js'

export default function update(base) {
    base = (base && (typeof(base) === 'object' || typeof(base) === 'function')) ? base : globalThis;
    each(slice(arguments, 1), function(index, source) {
        each(source, function(key, value) {
            if (!(base[key] === undefined) && source.hasOwnProperty(key)) {
                writeValue(base, key, value);
            }
        });
    });
    return base;
}
