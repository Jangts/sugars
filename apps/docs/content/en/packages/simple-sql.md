# Simple SQL

`@sugars/simple-sql` ports TangramJS `data.Sheet`. A table has defaults, constraints, an auto-incrementing primary key, and browser persistence. Use the table methods or compact SQL statements.

<!-- example:1 -->

- `insert(...rows)` returns the last generated key. `select(...ids)` reads specified rows, or the whole table if you omit IDs. `update(id, patch)` and `delete(...ids)` use primary keys.
- `fields()` reads the schema. `add(name, defaultValue, constraint)`, `alter(oldName, newName, defaultValue)`, and `drop(fieldName)` manage columns. `drop()` deletes the table.
- `Sheet.exec(sql)` supports `SELECT`, `INSERT INTO ... VALUES { ... }`, `UPDATE ... SET { ... } WHERE ...`, and `DELETE FROM ... WHERE ...`. Write values accept JSON objects, as well as legacy bare keys and single quotes. Use commas between multiple inserted objects.
- `WHERE` accepts fields, literals, comparisons, parentheses, and `AND/OR/NOT` or `&&/||/!`. Sort with `ORDER BY`. `LIMIT offset, count` preserves the legacy one-based offset. Invalid syntax throws `SyntaxError`.
- `subscribe(callback, onError?)` reports committed versions in the current page and returns an unsubscribe function. Errors reach `onError` asynchronously without preventing other subscribers from running. The host reports errors by default. `render(width, border, container)` mounts an HTML table that follows local commits. `destroy()` removes the instance’s views.

Storage defaults to browser `localStorage`. Pass a backend with `getItem` and `setItem` as the fifth constructor argument or the second `Sheet.exec` argument. Legacy storage shards can be read directly and switch to the current format on the first write. `SimpleSQL` is an alias for `Sheet`.

## Writing from multiple tabs

Each operation reads the current storage version. Backends that also implement `length`, `key()`, and `removeItem()`, including browser storage, record separate versions. Coordinate concurrent access yourself when the backend only offers read and write.

If several pages write to the same table, use `withWriteLock` consistently. It serializes callbacks by table in a secure context that supports [Web Locks](https://w3c.github.io/web-locks/).

<!-- example:2 -->

A synchronous operation throws `SheetConflictError` before writing if its source version was replaced. An empty `versions` list means the operation can be retried. If two writes pass the check at the same time, both snapshots survive and subsequent operations report the alternatives. Choose or merge them with `Sheet.resolveConflict(name, versions => snapshot)`. Renumber duplicate numeric primary keys before saving a merge and update `ai` accordingly. Use the same library version across tabs.
