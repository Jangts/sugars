// TangramJS tangram.js:183

/** @param {number|string} [startIndex] @param {number} [endIndex] */
export default function slice<T>(arrayLike: ArrayLike<T>, startIndex?: number | string, endIndex?: number): T[] {
    const start = parseInt(startIndex as string) || 0;
    return Array.prototype.slice.call(arrayLike, start, endIndex);
}
