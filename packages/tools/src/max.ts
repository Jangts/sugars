// TangramJS arr/arr.js:145

/**
 * 取数值序列的最大值，空输入沿用 Math.max 的返回值。
 *
 * @param array - 比较的数值数组。
 * @returns 最大值，空输入返回负无穷。
 */
export default function max(array: readonly number[]) {
    return Math.max.apply(Math, array as number[]);
}
