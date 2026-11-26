// TangramJS util/type.js:42

/* 从原生标签取得对象类型，为没有匹配标签的值保留旧的类型名。 */

export default function nativeType(object: unknown) {
    if (!object) {
        return 'Null';
    }
    var match = Object.prototype.toString.call(object).match(/\[object (\w+)\]/);
    if (match) {
        return match[1]!;
    }
    return 'Object';
}
