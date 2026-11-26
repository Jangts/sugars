// TangramJS util/bool.js:107
import isIntStr from './isIntStr.js'
import isFloatStr from './isFloatStr.js'

export default function isNumeric(num) {
    return typeof num === 'number' || isIntStr(num) || isFloatStr(num);
}
