// TangramJS arr/arr.js:145

export default function max(array: readonly number[]) {
    return Math.max.apply(Math, array as number[]);
}
