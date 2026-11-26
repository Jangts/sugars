// TangramJS tangram.js:183

/**
 * 从类数组取出指定范围，起始位置沿用旧的整数解析和缺省规则。
 *
 *
 * @param arrayLike - 由原生 Array.slice 按索引读取的集合。
 * @param startIndex - 起始位置，按旧规则解析整数并缺省为 0。
 * @param endIndex - 不包含的结束位置，缺省到集合末端。
 * @returns 截取的新数组。
 */
export default function slice<T>(arrayLike: ArrayLike<T>, startIndex?: number | string, endIndex?: number): T[] {
    const start = parseInt(startIndex as string) || 0;
    return Array.prototype.slice.call(arrayLike, start, endIndex);
}
