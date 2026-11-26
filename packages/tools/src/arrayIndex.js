// TangramJS arr/arr.js:111

export default function arrayIndex(array, elem) {
    if (Array.prototype.indexOf) {
        return array.indexOf(elem);
    } else {
        for (var i = 0; i < array.length; i++) {
            if (array[i] === elem) return i;
        }
        return -1;
    }
}
