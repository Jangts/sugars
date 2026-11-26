// TangramJS util/type.js:98

/* 把字符串细分为整数文本、小数文本和普通文本。 */

import isIntStr from '../isIntStr.js'
import isFloatStr from '../isFloatStr.js'

export default function typeofStr(string: string) {
    if (isIntStr(string)) {
        return 'StringInteger';
    }
    if (isFloatStr(string)) {
        return 'StringFloat';
    }
    return 'String';
}
