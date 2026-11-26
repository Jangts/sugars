// TangramJS math/math.js:28

export default function legacyGcd(a, b) {
    var maxNum = Math.max(a, b),
        minNum = Math.min(a, b),
        count;
    if (!Number.isFinite(a) || !Number.isFinite(b)) return NaN;
    if (a === 0 || b === 0) {
        return maxNum;
    }
    for (var i = 1; i <= maxNum; i++) {
        count = minNum * i;
        if (count % maxNum === 0) {
            return count;
            break;
        }
    }
}
