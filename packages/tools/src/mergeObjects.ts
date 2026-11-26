// TangramJS obj/obj.js:35
import each from './each.js'
import writeValue from './internal/writeValue.js'

export default function mergeObjects(...sources: unknown[]) {
    const object: Record<PropertyKey, unknown> = {};
    if (sources.length > 0) {
        for (var a = 0; a < sources.length; a++) {
            if (typeof sources[a] == 'object') {
                each(sources[a], function(index, elememt) {
                    writeValue(object, index, elememt);
                });
            }
        }
    }
    return object;
}
