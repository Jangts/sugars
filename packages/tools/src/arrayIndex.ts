// TangramJS arr/arr.js:111

export default function arrayIndex<T>(array: readonly T[], elem: T) {
    if ((Array.prototype as Partial<unknown[]>).indexOf) {
        return array.indexOf(elem);
    } else {
        for (var i = 0; i < array.length; i++) {
            if (array[i] === elem) return i;
        }
        return -1;
    }
}
