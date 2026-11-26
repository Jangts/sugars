// TangramJS math/math.js:54

/**
 * 沿用旧接口的参数顺序。现有实现按第二个参数限制上界，第三个参数保留在签名中。
 *
 *
 * @param value - 待处理的数值。
 * @param maxValue - 提供数字时用作上界。
 * @param minValue - 历史签名保留的第三参数，当前实现未用它限制下界。
 * @returns 保留原值或将其收至上界。
 */
export default function cap(value: number, maxValue?: number, minValue?: number) {
    if (typeof maxValue === 'number') {
        if (value > maxValue) {
            return maxValue;
        }
    } else if (typeof maxValue === 'number') {
        if (value < minValue!) {
            return minValue;
        }
    }
    return value;
}
