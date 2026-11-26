// TangramJS arr/arr.js:142

/** @param {readonly number[]} array */
export default function sum(array) {
    // The original evaluated a string joined with '+'. Keep numeric addition
    // and the empty result without evaluating text supplied by a caller.
    let result;
    for (const value of array) {
        if (typeof value !== 'number') throw new TypeError('sum expects numbers');
        const number = value === 0 ? 0 : value;
        result = result === undefined ? number : result + number;
    }
    return result;
}
