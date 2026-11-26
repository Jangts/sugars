// TangramJS obj/obj.js:32

/**
 * 通过对象自身可用的 hasOwnProperty 检查自有成员，空对象值沿用原来的返回行为。
 *
 * @param obj - 提供自身 hasOwnProperty 方法的对象，也可为空。
 * @param property - 待检查的键。
 * @returns 自有字段的检查结果，空值或缺失方法按旧规则短路。
 */
export default function hasProp(obj: object | null | undefined, property: PropertyKey) {
    return obj && obj.hasOwnProperty && obj.hasOwnProperty(property);
}
