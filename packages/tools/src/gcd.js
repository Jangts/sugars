// TangramJS math/math.js:107
import type from './type.js'
import legacyGcd from './internal/legacyGcd.js'

/** @param {number|readonly number[]} num1 @param {number} [num2] */
export default function gcd(num1, num2) {
    if (typeof num1 === 'number' && typeof num2 === 'number') {
        return legacyGcd(num1, num2);
    } else if (type(num1) === 'Array') {
        if (typeof num1[0] === 'number') {
            var num = num1[0];
        } else {
            return NaN;
        }
        for (var i = 1; i < num1.length; i++) {
            if (typeof num1[i] === 'number') {
                num = legacyGcd(num, num1[i]);
            } else {
                return NaN;
            }
        }
        return num;
    }
    return NaN;
}
