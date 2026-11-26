// 旧工具写入调用方的字段时，__proto__ 作为普通数据键。

/* 写入调用方提供的字段时，把 __proto__ 保存为普通数据属性。 */

export default function writeValue(target: object, key: PropertyKey, value: unknown) {
    if (key === '__proto__') {
        Object.defineProperty(target, key, { value, writable: true, enumerable: true, configurable: true });
    } else {
        (target as Record<PropertyKey, unknown>)[key] = value;
    }
}
