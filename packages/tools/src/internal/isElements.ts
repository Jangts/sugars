// TangramJS util/type.js:69

/* 识别 DOM 集合或全部成员均为元素的数组、类数组。其他值保留旧返回语义。 */

import isElement from './isElement.js'

export default function isElements(object: unknown) {
    if (object && typeof object === 'object') {
        const list = object as { length?: number; item?: unknown; splice?: unknown; [index: number]: unknown };
        if (typeof HTMLCollection !== 'undefined' && (object instanceof HTMLCollection)) {
            return true;
        }
        if (typeof NodeList !== 'undefined' && (object instanceof NodeList)) {
            return true;
        }
        if ((object instanceof Array) || (Object.prototype.toString.call(object) === '[object Array]') || ((typeof(list.length) === 'number') && ((typeof(list.item) === 'function') || (typeof(list.splice) != 'undefined')))) {
            for (var i = 0; i < list.length!; i++) {
                if (!isElement(list[i])) {
                    return false;
                }
            };
            return true;
        }
    }

}
