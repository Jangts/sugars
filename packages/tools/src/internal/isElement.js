// TangramJS util/type.js:61

export default function isElement(object) {
    return object && typeof object === 'object' && ((typeof HTMLElement !== 'undefined' && (object instanceof HTMLElement)) || (object.nodeType === 1) || (typeof DocumentFragment !== 'undefined' && (object instanceof DocumentFragment)) || (object.nodeType === 11));
}
