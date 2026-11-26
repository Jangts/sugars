// TangramJS tangram.js:213
import slice from './slice.js'

/** @param {unknown} [that] */
export default function each(obj, handler, that) {
    /* 首先检查是否为空对象或空值。 */
    if (typeof(obj) == 'object' && obj) {
        /* 截取传入的不定参数 */
        var addArgs = slice(arguments, 3);
        /* 判断是否为数组对象 */
        if ((obj instanceof Array) || (Object.prototype.toString.call(obj) === '[object Array]') || ((typeof(obj.length) === 'number') && ((typeof(obj.item) === 'function') || (typeof(obj.splice) != 'undefined')))) {
            for (var i = 0; i < obj.length; i++) {
                handler.apply(that || obj[i], [i, obj[i]].concat(addArgs));
            }
        } else {
            for (var i in obj) {
                handler.apply(that || obj[i], [i, obj[i]].concat(addArgs));
            }
        }
    }
}
