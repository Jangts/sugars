// TangramJS obj/obj.js:111

/** @param {object|null} [obj] */
export default function toQueryString(obj) {
    obj = obj || {};
    var fields = []
    for (var i in obj) {
        fields.push(i + "=" + encodeURIComponent(obj[i]));
    }
    return fields.join("&");
}
