# Visual Form

`@sugars/visual-form` ports TangramJS `VisualJOSN.ClassObject` and `data.Model`. A single definition determines the browser controls and JSON field rules.

<!-- example:1 -->

A field definition is `[name, control, maxLength, defaultValue, options, label]`. You can omit length and default. In the short form `[name, control, options, label]`, the first option provides the default. The controls follow the legacy field mapping with checkbox support. Browser inputs replace the old time plugins.

Register reusable definitions with `VisualForm.declare(name, fields)`. Supply a textarea at construction or call `bindInput(textarea)` to load its JSON. `getJSON()` writes back to it. The textarea is hidden while bound and its display style is restored on destruction.

`input(data)` and `loadJSON(json)` update fields accepted by the model and render controls. `output()` reads and validates controls against the same model, retaining the last valid value on failure. Number inputs and selects still produce strings in the normal edit path. To use the model separately, import `Model` and call `check`, `create`, `read`, `update`, or `delete`. `ClassObject` is an alias for `VisualForm`.

The `time` control exports `HH:mm:ss`. Missing seconds are filled with `00`.
