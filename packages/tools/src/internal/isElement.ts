// TangramJS util/type.js:61

/* 沿用旧分类把普通元素和 DocumentFragment 都识别为 Element。 */

export default function isElement(object: unknown) {
    return object && typeof object === 'object' && ((typeof HTMLElement !== 'undefined' && (object instanceof HTMLElement)) || ((object as {nodeType?: number}).nodeType === 1) || (typeof DocumentFragment !== 'undefined' && (object instanceof DocumentFragment)) || ((object as {nodeType?: number}).nodeType === 11));
}
