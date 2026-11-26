// TangramJS arr/arr.js:46
import writeValue from './internal/writeValue.js'

/** @param {readonly unknown[]} [array2] */
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
