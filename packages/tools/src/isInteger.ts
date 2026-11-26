// TangramJS util/type.js:123

/**
 * 调用原生整数判断，有需要时采用历史的向下取整比较。
 *
 * @param number - 待检查的值。
 * @returns 是否为整数值。
 */
export default function isInteger(number: unknown) {
    if (typeof Number.isInteger === 'function') {
        return Number.isInteger(number);
    } else {
        return Math.floor(number as number) === number;
    }
}
