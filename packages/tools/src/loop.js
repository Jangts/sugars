// TangramJS tangram.js:232
import slice from './slice.js'

export default (function() {
    /* 高级遍历方法的中断参数，当其值为是时，将中断当前遍历 */
    var BREAK = false;

    /* 高级遍历方法的中断：其作用是将终端参数的值设为是 */
    loop.out = function() {
        BREAK = true;
    };

    /** @param {unknown} [that] */
    function loop(obj, handler, that) {
        /* 首先检查是否为空对象或空值。 */
        if (typeof(obj) == 'object' && obj) {
            /* 截取传入的不定参数 */
            var addArgs = slice(arguments, 3);

            /* 初始化中断参数 */
            BREAK = false;

            /* 判断是否为数组对象 */
            if ((obj instanceof Array) || (Object.prototype.toString.call(obj) === '[object Array]') || ((typeof(obj.length) === 'number') && ((typeof(obj.item) === 'function') || (typeof(obj.splice) != 'undefined')))) {
                for (var i = 0; i < obj.length; i++) {
                    if (BREAK) {
                        BREAK = false;
                        break;
                    }
                    handler.apply(that || obj[i], [i, obj[i]].concat(addArgs));
                }
            } else {
                for (var i in obj) {
                    if (BREAK) {
                        BREAK = false;
                        break;
                    }
                    handler.apply(that || obj[i], [i, obj[i]].concat(addArgs));
                }
            }
        }
    }
    return loop;
})()
