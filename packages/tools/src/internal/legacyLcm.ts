// TangramJS math/math.js:16

export default function legacyLcm(m: number, n: number) {
    //辗转相除法 求最大公约数
    var u = +m,
        v = +n,
        t = v;
    if (!Number.isFinite(u) || !Number.isFinite(v)) return NaN;
    while (v != 0) {
        t = u % v;
        u = v;
        v = t;
    }
    return u;
}
