// TangramJS tangram.js:912
import deep from './internal/deep.js'
import shallow from './internal/shallow.js'

/**
 * 默认浅复制，第二个参数传 true 或 1 时递归复制数组与普通对象。
 *
 *
 * @param source - 要复制的输入。浅复制按可枚举键复制为普通对象。
 * @param deeply - true 或 1 启用递归复制。
 * @returns 复制结果。递归复制仅深入普通对象和数组。
 */
export default function clone<T>(source: T, deeply?: boolean | number): T {
    if (deeply === true || deeply === 1) {
        return deep(source) as T;
    } else {
        return shallow(source) as T;
    }
}
