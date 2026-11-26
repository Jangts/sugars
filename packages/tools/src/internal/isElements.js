// TangramJS util/type.js:69
import isElement from './isElement.js'

export default function isElements(object) {
    if (object && typeof object === 'object') {
        if (typeof HTMLCollection !== 'undefined' && (object instanceof HTMLCollection)) {
            return true;
        }
        if (typeof NodeList !== 'undefined' && (object instanceof NodeList)) {
            return true;
        }
        if ((object instanceof Array) || (Object.prototype.toString.call(object) === '[object Array]') || ((typeof(object.length) === 'number') && ((typeof(object.item) === 'function') || (typeof(object.splice) != 'undefined')))) {
            for (var i = 0; i < object.length; i++) {
                if (!isElement(object[i])) {
                    return false;
                }
            };
            return true;
        }
    }

}
