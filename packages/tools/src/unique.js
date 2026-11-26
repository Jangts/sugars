// TangramJS arr/arr.js:133
import each from './each.js'
import hasArrayValue from './hasArrayValue.js'

export default function unique(array) {
    var result = [];
    each(array, function(i, elem) {
        if (hasArrayValue(result, elem) === false) {
            result.push(elem);
        };
    });
    return result;
}
