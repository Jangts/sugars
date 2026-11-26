// TangramJS arr/arr.js:73

export default function hasArrayValue(array, elem) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === elem) {
            return i;
        };
    };
    return false;
}
