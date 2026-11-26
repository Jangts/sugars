// Keep __proto__ as a data key when a legacy utility writes caller data.
export default function writeValue(target: object, key: PropertyKey, value: unknown) {
    if (key === '__proto__') {
        Object.defineProperty(target, key, { value, writable: true, enumerable: true, configurable: true });
    } else {
        (target as Record<PropertyKey, unknown>)[key] = value;
    }
}
