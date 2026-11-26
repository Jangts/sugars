// TangramJS util/type.js:98
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
