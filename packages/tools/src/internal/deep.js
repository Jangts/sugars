// TangramJS tangram.js:274
import each from '../each.js'
import writeValue from './writeValue.js'

export default function deep(source) {
    var type = Object.prototype.toString.call(source).match(/\[object (\w+)\]/)[1];
    if (type === 'Object') {
        var clone = {};
        each(source, function(key) {
            if (source.hasOwnProperty(key)) {
                writeValue(clone, key, deep(source[key]));
            }
        });
        return clone;
    }
    if (type === 'Array') {
        return source.map && source.map(function(v) {
            return deep(v);
        });
    }
    return source;
}
