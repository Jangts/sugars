// TangramJS tangram.js:183

/** @param {number|string} [startIndex] @param {number} [endIndex] */
export default function slice(arrayLike, startIndex, endIndex) {
    startIndex = parseInt(startIndex) || 0;
    return Array.prototype.slice.call(arrayLike, startIndex, endIndex);
}
