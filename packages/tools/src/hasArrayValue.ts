// TangramJS arr/arr.js:73

export default function hasArrayValue<T>(array: ArrayLike<T>, elem: unknown) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === elem) {
            return i;
        };
    };
    return false;
}
