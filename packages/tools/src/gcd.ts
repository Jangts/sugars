// TangramJS math/math.js:107
import type from './type.js'
import legacyGcd from './internal/legacyGcd.js'

/**
 * 保留旧 gcd 入口。其历史计算是最小公倍数，参数可为一对数字或待归并的数组。
 *
 *
 * @param num1 - 第一个数字或用于归并的非空数值数组。
 * @param num2 - 传入两个独立数字时的第二个数字。
 * @returns 历史最小公倍数结果。非法输入为 NaN，搜索无结果时可为 undefined。
 */
export default function gcd(num1: number | readonly number[], num2?: number) {
    if (typeof num1 === 'number' && typeof num2 === 'number') {
        return legacyGcd(num1, num2);
    } else if (typeof num1 !== 'number' && type(num1) === 'Array') {
        let num = num1[0];
        if (typeof num !== 'number') return NaN;
        for (var i = 1; i < num1.length; i++) {
            if (typeof num1[i] === 'number') {
                num = legacyGcd(num!, num1[i]!);
            } else {
                return NaN;
            }
        }
        return num;
    }
    return NaN;
}
