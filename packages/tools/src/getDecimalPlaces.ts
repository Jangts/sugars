// TangramJS math/math.js:66

export default function getDecimalPlaces(num: number) {
    if (num && num % 1 !== 0 && typeof num === 'number') {
        var s = num.toString();
        if (s.indexOf("e-") < 0) {
            // no exponent, e.g. 0.01
            return s.split(".")[1]!.length;
        } else if (s.indexOf(".") < 0) {
            // no decimal point, e.g. 1e-9
            return parseInt(s.split("e-")[1]!);
        } else {
            // exponent and decimal point, e.g. 1.23e-9
            var parts = s.split(".")[1]!.split("e-");
            return parts[0]!.length + parseInt(parts[1]!);
        }
    } else {
        return 0;
    }
}
