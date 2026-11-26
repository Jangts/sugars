// TangramJS util/type.js:17
import isArray from '../isArray.js'
import isGlobal from './isGlobal.js'
import isDoc from './isDoc.js'
import isElement from './isElement.js'
import isElements from './isElements.js'
import isRegExp from './isRegExp.js'
import nativeType from './nativeType.js'

export default function typeofObj(object) {
    if (!object) {
        return 'Null';
    }
    if (isGlobal(object)) {
        return 'Global';
    }
    if (isDoc(object)) {
        return 'HTMLDocument';
    }
    if (isElement(object)) {
        return 'Element';
    }
    if (isElements(object)) {
        return 'Elements';
    }
    if (isArray(object)) {
        return 'Array';
    }
    if (isRegExp(object)) {
        return 'RegExp';
    }
    return nativeType(object);
}
