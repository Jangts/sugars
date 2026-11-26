// TangramJS arr/arr.js:81

/** @param {string|number} [index] */
export default function push(elem, array, index) {
    index = parseInt(index);
    if (index >= 0 && index < array.length) {
        var _array = array;
        array.length = index;

    } else {
        var _array = [];

    }
    array.push(elem);
    for (var i = index + 1; i < _array.length; i++) {
        array.push(_array[i]);
    }
    return array;
}
