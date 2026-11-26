// TangramJS arr/arr.js:81

/** @param {string|number} [index] */
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
