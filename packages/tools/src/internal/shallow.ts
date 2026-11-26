// TangramJS tangram.js:294
import each from '../each.js'
import writeValue from './writeValue.js'

export default function shallow(source: unknown) {
    var target = {};
    each(source, function(key, value) {
        writeValue(target, key, value);
    });
    return target;
}
