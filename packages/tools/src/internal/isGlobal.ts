// TangramJS util/type.js:53

/* 检查值是否是当前浏览器 window。无 window 时返回 false。 */

export default function isGlobal(object: unknown) {
    return typeof window !== 'undefined' && object === window;
}
