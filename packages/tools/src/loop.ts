// TangramJS tangram.js:232

/**
 * 按旧回调约定遍历集合。回调调用 loop.out() 后在下一次迭代前退出。
 *
 * @param obj - 数组、类数组或按键遍历的对象。
 * @param handler - 接收索引或键、值及附加参数，可调用 loop.out() 停止。
 * @param that - 回调的接收者，假值时使用当前项。
 * @param args - 追加在当前值之后的参数。
 */
export default (function() {
    // 沿用旧的共享中断标记，loop.out() 由正在执行的回调调用。
    var BREAK = false;

    function loop<T, Args extends unknown[]>(obj: ArrayLike<T>,
        handler: (this: unknown, key: number, value: T, ...args: Args) => unknown, that?: unknown, ...args: Args): void
    function loop<Args extends unknown[]>(obj: unknown,
        handler: (this: unknown, key: string | number, value: unknown, ...args: Args) => unknown, that?: unknown, ...args: Args): void
    function loop(obj: unknown, handler: Function, that?: unknown, ...addArgs: unknown[]): void {
        if (typeof(obj) == 'object' && obj) {
            const list = obj as { length?: number; item?: unknown; splice?: unknown; [key: string]: unknown };

            BREAK = false;

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
