// TangramJS math/math.js:54

/** @param {number} [maxValue] @param {number} [minValue] */
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
