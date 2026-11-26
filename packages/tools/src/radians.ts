// TangramJS math/math.js:84

/**
 * 按 π 与 180 的比例将角度换算为弧度。
 *
 * @param degrees - 输入角度，单位为度。
 * @returns 对应的弧度。
 */
export default function radians(degrees: number) {
    return degrees * (Math.PI / 180);
}
