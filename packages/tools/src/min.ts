// TangramJS arr/arr.js:148

export default function min(array: readonly number[]) {
    return Math.min.apply(Math, array as number[]);
}
