// TangramJS tangram.js:232

export default (function() {
    /* 高级遍历方法的中断参数，当其值为是时，将中断当前遍历 */
    var BREAK = false;

    /* 高级遍历方法的中断：其作用是将终端参数的值设为是 */
    function loop<T, Args extends unknown[]>(obj: ArrayLike<T>,
        handler: (this: unknown, key: number, value: T, ...args: Args) => unknown, that?: unknown, ...args: Args): void
    function loop<Args extends unknown[]>(obj: unknown,
        handler: (this: unknown, key: string | number, value: unknown, ...args: Args) => unknown, that?: unknown, ...args: Args): void
    function loop(obj: unknown, handler: Function, that?: unknown, ...addArgs: unknown[]): void {
        /* 首先检查是否为空对象或空值。 */
        if (typeof(obj) == 'object' && obj) {
            /* 截取传入的不定参数 */
            const list = obj as { length?: number; item?: unknown; splice?: unknown; [key: string]: unknown };

            /* 初始化中断参数 */
            BREAK = false;

            /* 判断是否为数组对象 */
            if ((obj instanceof Array) || (Object.prototype.toString.call(obj) === '[object Array]') || ((typeof(list.length) === 'number') && ((typeof(list.item) === 'function') || (typeof(list.splice) != 'undefined')))) {
                for (var i = 0; i < list.length!; i++) {
                    if (BREAK) {
                        BREAK = false;
                        break;
                    }
                    handler.apply(that || list[i], [i, list[i], ...addArgs]);
                }
            } else {
                for (const i in obj) {
                    if (BREAK) {
                        BREAK = false;
                        break;
                    }
                    handler.apply(that || list[i], [i, list[i], ...addArgs]);
                }
            }
        }
    }
    return Object.assign(loop, { out: function () { BREAK = true } });
})()
