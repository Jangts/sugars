// TangramJS math/math.js:87
import type from './type.js'
import legacyLcm from './internal/legacyLcm.js'

/** @param {number|readonly number[]} num1 @param {number} [num2] */
export default function lcm(num1, num2) {
    if (typeof num1 === 'number' && typeof num2 === 'number') {
        return legacyLcm(num1, num2);
    } else if (type(num1) === 'Array') {
        if (typeof num1[0] === 'number') {
            var num = num1[0];
        } else {
            return NaN;
        }
        for (var i = 1; i < num1.length; i++) {
            if (typeof num1[i] === 'number') {
                num = legacyLcm(num, num1[i]);
            } else {
                return NaN;
            }
        }
        return num;
    }
    return NaN;
}
