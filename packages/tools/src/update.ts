// TangramJS tangram.js:320
import each from './each.js'
import writeValue from './internal/writeValue.js'

/**
 * 修改目标中已存在且值不为 undefined 的成员。空目标使用全局对象。
 *
 * @param base - 需要原地更新的对象，缺省沿用旧接口的全局目标。
 * @param sources - 用自有字段更新已有成员的来源。
 * @returns 更新后的原目标。
 */
export default function update(base?: object | null, ...sources: unknown[]) {
    const target = ((base && (typeof(base) === 'object' || typeof(base) === 'function')) ? base : globalThis) as Record<PropertyKey, unknown>;
    each(sources, function(index, source) {
        each(source, function(key, value) {
            if (!(target[key] === undefined) && (source as object).hasOwnProperty(key)) {
                writeValue(target, key, value);
            }
        });
    });
    return target;
}
