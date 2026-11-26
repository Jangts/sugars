// TangramJS arr/arr.js:148

/**
 * 取数值序列的最小值，空输入沿用 Math.min 的返回值。
 *
 * @param array - 比较的数值数组。
 * @returns 最小值，空输入返回正无穷。
 */
export default function min(array: readonly number[]) {
    return Math.min.apply(Math, array as number[]);
}
