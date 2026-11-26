// TangramJS obj/obj.js:32

export default function hasProp(obj: object | null | undefined, property: PropertyKey) {
    return obj && obj.hasOwnProperty && obj.hasOwnProperty(property);
}
