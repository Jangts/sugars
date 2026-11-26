# Simple MVVM

`@sugars/simple-mvvm` ports the TangramJS Observer, ViewModel, and VElement to ESM. A ViewModel reacts synchronously to changes in declared fields. It can call your renderer or use VElement to build and patch DOM. For individual features, use `/observer`, `/view-model`, or `/v-element`.

## Custom rendering

<!-- example:1 -->

Construction performs one render. When a field receives a different value, the hooks run in order: `beforeRender`, `render`, and `afterRender`. Their `this` is the options object. Observation and custom rendering without DOM dependencies work in Node.js.

## Virtual DOM rendering

<!-- example:2 -->

Here `render` receives the ViewModel as `this`. The first render mounts in `document.body`; later renders diff and patch. The second constructor argument can override `useVElement`. Native `change` events from inputs, selects, and textareas update the ViewModel’s `input` field. Declare that field in `data` to observe updates.

`new VElement(tag, props, children)`, `VElement.create`, and `createVElement` share the same construction model. Call `createVElement(tag, children)` to omit props. Sibling keys should be unique after string conversion. When using VElement directly, keep the root returned by `node = VElement.patch(node, VElement.diff(previous, next))`. The `ignore` attribute lets the caller manage a node’s descendants. Removing it renders that element again.

## Observe data directly

<!-- example:3 -->

`observe(data)` is equivalent to `Observer.create(data)`. Use `observer.on('write', key, callback)` or `observer.on('read', key, callback)` to subscribe. A callback receives `(value, key)`; for ordinary functions, `this` is the data object. Set `observer.silently = true` to suspend notifications while storing values.

Observation starts with the enumerable data fields already present on a mutable object. Replacing a nested object observes its replacement, but you must subscribe to nested fields on that object directly. `listen(callback)` adds a write callback for each observed field. Subscribe by field to receive a handle you can disconnect. A ViewModel wires field proxies and rendering subscriptions for the fields present at construction.
