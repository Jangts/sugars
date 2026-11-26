// TangramJS tangram.js:303
import each from './each.js'
import writeValue from './internal/writeValue.js'

/**
 * 给目标补上不存在的成员，首个来源位传 true 或 1 时允许覆盖。空目标使用全局对象。
 *
 * @param base - 写入目标。缺省或无效目标沿用旧接口的 globalThis。
 * @param sources - 按顺序读取自有成员的来源。首位可放 true 或 1 允许覆盖。
 * @returns 原地扩展后的目标。
 */
export default function extend(base?: object | null, ...sources: unknown[]) {
    const target = ((base && (typeof(base) === 'object' || typeof(base) === 'function')) ? base : globalThis) as Record<PropertyKey, unknown>;
    var rewrite = (sources[0] === 1 || sources[0] === true) ? true : false;
    each(sources, function(index, source) {
        each(source, function(key, value) {
            if ((source as object).hasOwnProperty(key)) {
                /* 判断是否需要覆盖 */
                if (typeof target[key] === 'undefined' || rewrite) {
                    writeValue(target, key, value);
                }
            }
        });
    });
    return target;
}
