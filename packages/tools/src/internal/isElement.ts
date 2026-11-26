// TangramJS util/type.js:61

export default function isElement(object: unknown) {
    return object && typeof object === 'object' && ((typeof HTMLElement !== 'undefined' && (object instanceof HTMLElement)) || ((object as {nodeType?: number}).nodeType === 1) || (typeof DocumentFragment !== 'undefined' && (object instanceof DocumentFragment)) || ((object as {nodeType?: number}).nodeType === 11));
}
