// TangramJS arr/arr.js:97

export default function remove(array, elem) {
    var result = [];
    for (var i = 0; i < array.length; i++) {
        array[i] == elem || result.push(array[i]);
    }
    return result;
}
