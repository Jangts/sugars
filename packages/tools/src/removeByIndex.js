// TangramJS arr/arr.js:104

export default function removeByIndex(array, index) {
    var result = [];
    for (var i = 0; i < array.length; i++) {
        i == index || result.push(array[i]);
    }
    return result;
}
