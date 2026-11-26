// TangramJS arr/arr.js:81

/**
 * 原地追加元素。给定有效的旧索引时先截断数组，再从该位置追加新值。
 *
 *
 * @param elem - 准备附加到数组的新值。
 * @param array - 会被原地修改的数组。
 * @param index - 可解析成整数的截断位置，省略或无效时直接追加。
 * @returns 修改后的原数组。
 */
export default function push<T>(elem: T, array: T[], index?: string | number) {
    const at = parseInt(index as string);
    let _array: T[];
    if (at >= 0 && at < array.length) {
        _array = array;
        array.length = at;

    } else {
        _array = [];

    }
    array.push(elem);
    for (var i = at + 1; i < _array.length; i++) {
        array.push(_array[i]!);
    }
    return array;
}
