// TangramJS math/math.js:66

/**
 * 根据数字的十进制字符串计算小数位数，也处理负指数形式。
 *
 * @param num - 将转成十进制字符串的数值。
 * @returns 表示该值所需的小数位数，整数为 0。
 */
export default function getDecimalPlaces(num: number) {
    if (num && num % 1 !== 0 && typeof num === 'number') {
        var s = num.toString();
        if (s.indexOf("e-") < 0) {
            // 普通小数，例如 0.01。
            return s.split(".")[1]!.length;
        } else if (s.indexOf(".") < 0) {
            // 尾数无小数点，例如 1e-9。
            return parseInt(s.split("e-")[1]!);
        } else {
            // 尾数含小数点和负指数，例如 1.23e-9。
            var parts = s.split(".")[1]!.split("e-");
            return parts[0]!.length + parseInt(parts[1]!);
        }
    } else {
        return 0;
    }
}
