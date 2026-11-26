// TangramJS obj/obj.js:111

/** @param {object|null} [obj] */
export default function toQueryString(obj?: object | null) {
    obj = obj || {};
    var fields = []
    for (var i in obj) {
        fields.push(i + "=" + encodeURIComponent((obj as Record<string, string>)[i]!));
    }
    return fields.join("&");
}
