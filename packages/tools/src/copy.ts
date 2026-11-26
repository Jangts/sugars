// TangramJS tangram.js:927
import deep from './internal/deep.js'
import shallow from './internal/shallow.js'

/**
 * 默认递归复制数组及普通对象，第二个参数传 true 或 1 时走浅复制。
 *
 *
 * @param source - 待复制的原值。
 * @param shallowly - true 或 1 走浅复制。
 * @returns 复制结果。递归复制以外的类型按旧规则保留原值。
 */
export default function copy<T>(source: T, shallowly?: boolean | number): T {
    if (shallowly === true || shallowly === 1) {
        return shallow(source) as T;
    } else {
        return deep(source) as T;
    }
}
