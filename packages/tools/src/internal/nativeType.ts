// TangramJS util/type.js:42

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
