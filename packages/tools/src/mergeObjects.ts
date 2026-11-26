// TangramJS obj/obj.js:35
import each from './each.js'
import writeValue from './internal/writeValue.js'

/**
 * 按来源顺序把可遍历字段合并到新对象，后写入的同名字段覆盖前值。
 *
 * @param sources - 按历史集合枚举规则读取的来源。
 * @returns 右侧来源覆盖同名字段的新对象。
 */
export default function mergeObjects(...sources: unknown[]) {
    const object: Record<PropertyKey, unknown> = {};
    if (sources.length > 0) {
        for (var a = 0; a < sources.length; a++) {
            if (typeof sources[a] == 'object') {
                each(sources[a], function(index, elememt) {
                    writeValue(object, index, elememt);
                });
            }
        }
    }
    return object;
}
