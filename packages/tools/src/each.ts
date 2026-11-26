// TangramJS tangram.js:213

/**
 * 按历史顺序把键或索引放在回调首位，并传递自定义接收者与后续参数。
 *
 * @param obj - 数组、符合历史检测的类数组或按键枚举的对象。
 * @param handler - 接收索引或键、当前值及附加参数的函数。
 * @param that - 回调接收者，省略或为假值时使用当前项。
 * @param args - 放在当前值之后的附加参数。
 */
function each<T, Args extends unknown[]>(obj: ArrayLike<T>,
    handler: (this: unknown, key: number, value: T, ...args: Args) => unknown, that?: unknown, ...args: Args): void
function each<Args extends unknown[]>(obj: unknown,
    handler: (this: unknown, key: string | number, value: unknown, ...args: Args) => unknown, that?: unknown, ...args: Args): void
function each(obj: unknown, handler: Function, that?: unknown, ...addArgs: unknown[]): void {
    if (typeof(obj) == 'object' && obj) {
        const list = obj as { length?: number; item?: unknown; splice?: unknown; [key: string]: unknown };
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
