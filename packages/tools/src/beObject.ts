// TangramJS arr/arr.js:46
import writeValue from './internal/writeValue.js'

/**
 * 用第一个数组提供键。省略第二个数组时，以键本身作为对应值。
 *
 *
 * @param array1 - 按顺序生成对象字段的键。
 * @param array2 - 对应字段值，其缺失项及其他假值按旧规则映射成 null。
 * @returns 由两个输入数组映射得到的新对象。
 */
export default function beObject(array1: readonly PropertyKey[], array2?: readonly unknown[]) {
    const object: Record<PropertyKey, unknown> = {};
    if (array2) {
        for (var i = 0; i < array1.length; i++) {
            writeValue(object, array1[i]!, array2[i] || null);
        }
    } else {
        for (var i = 0; i < array1.length; i++) {
            object[i] = array1[i]!;
        }
    }
    return object;
}
