// TangramJS util/type.js:93

/* 通过当前环境的 RegExp 构造器检查正则对象。 */

export default function isRegExp(object: unknown) {
    return object instanceof RegExp;
}
