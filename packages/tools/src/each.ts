// TangramJS tangram.js:213

function each<T, Args extends unknown[]>(obj: ArrayLike<T>,
    handler: (this: unknown, key: number, value: T, ...args: Args) => unknown, that?: unknown, ...args: Args): void
function each<Args extends unknown[]>(obj: unknown,
    handler: (this: unknown, key: string | number, value: unknown, ...args: Args) => unknown, that?: unknown, ...args: Args): void
function each(obj: unknown, handler: Function, that?: unknown, ...addArgs: unknown[]): void {
    /* 首先检查是否为空对象或空值。 */
    if (typeof(obj) == 'object' && obj) {
        /* 截取传入的不定参数 */
        const list = obj as { length?: number; item?: unknown; splice?: unknown; [key: string]: unknown };
        /* 判断是否为数组对象 */
        if ((obj instanceof Array) || (Object.prototype.toString.call(obj) === '[object Array]') || ((typeof(list.length) === 'number') && ((typeof(list.item) === 'function') || (typeof(list.splice) != 'undefined')))) {
            for (var i = 0; i < list.length!; i++) {
                handler.apply(that || list[i], [i, list[i], ...addArgs]);
            }
        } else {
            for (const i in obj) {
                handler.apply(that || list[i], [i, list[i], ...addArgs]);
            }
        }
    }
}

export default each
