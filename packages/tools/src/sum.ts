// TangramJS arr/arr.js:142

/**
 * 累加数值数组。空数组沿用 undefined，参与累加的值须为数字。
 *
 *
 * @param array - 参与加法的数值数组。
 * @returns 数值和，空数组返回 undefined。
 * @throws {TypeError} 遍历到非数字值。
 */
export default function sum(array: readonly number[]) {
    // 旧实现把数组拼成加法表达式。这里直接累加数字，空数组仍返回 undefined。
    let result;
    for (const value of array) {
        if (typeof value !== 'number') throw new TypeError('sum expects numbers');
        const number = value === 0 ? 0 : value;
        result = result === undefined ? number : result + number;
    }
    return result;
}
