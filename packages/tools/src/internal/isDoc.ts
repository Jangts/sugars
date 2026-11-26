// TangramJS util/type.js:57

/* 检查值是否是当前环境的 document，兼容没有文档的运行环境。 */

export default function isDoc(object: unknown) {
    return typeof document !== 'undefined' && object === document;
}
