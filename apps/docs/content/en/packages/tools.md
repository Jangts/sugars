# @sugars/tools

Utilities extracted from TangramJS. Import from the package root, a category, or an individual function path. The API reference groups functions by their actual category exports.

<!-- example:1 -->

| Category | Entry point |
| --- | --- |
| Arrays | `@sugars/tools/array` |
| Collection iteration | `@sugars/tools/collection` |
| Type checks | `@sugars/tools/lang` |
| Math | `@sugars/tools/math` |
| Objects | `@sugars/tools/object` |
| Strings and encoding | `@sugars/tools/string` |

Category entries retain their original names. The package root and individual entries use names such as `mergeArrays`, `mergeObjects`, `eachArray`, `hasArrayValue`, `hasString`, and `arrayIndex` to distinguish identical category names.

- `each` and `loop` call handlers with `(key, value)`. Call `loop.out()` to break. `clone(source, deeply)` defaults to a shallow copy, while `copy(source, shallowly)` defaults to a deep copy.
- `push(elem, array, index)` preserves the old truncate-then-append behavior. `beObject(keys, values)` maps falsy values to `null`.
- `toCamel` replaces only the first hyphenated segment. Base64 uses the historical encoding. Query strings keep the original splitting rules.
- `gcd` and `lcm` have the legacy names and their swapped computations. `sum` takes numbers and returns `undefined` for an empty list.
