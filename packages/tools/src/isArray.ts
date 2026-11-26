// TangramJS util/type.js:89

/**
 * 使用环境中的数组检查能力，并保留旧版后备检查。
 *
 * @param object - 任意候选值。
 * @returns 是否为数组，可供 TypeScript 收窄输入类型。
 */
export default function isArray(object: unknown): object is readonly unknown[] {
    return Object.prototype.toString.call(object) === '[object Array]';
}
