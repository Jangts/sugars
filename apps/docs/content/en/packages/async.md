# @sugars/async

**ES5 compatibility package**

The TangramJS AMD loader and legacy Promise can be used independently. Load `amd.js` and `promise.js` as classic scripts or use their CommonJS entries. AMD delivers results through callbacks.

## AMD

<!-- example:1 -->

Use a regular AMD definition in `./modules/example.js`.

<!-- example:2 -->

`createAmdLoader()` owns its module and script caches. `installGlobals()` exposes `define` and `require` to scripts and returns a restore function. Use `loader.define('id', ...)` to register an in-memory module. `require(['id'], callback, onError)` loads asynchronously. `require('id')` reads a loaded module synchronously. Configure `baseUrl` (formerly `mainUrl`), `paths`, and `packages` with `require.config()`. External scripts need a browser DOM.

The loader waits up to 15 seconds after each external script begins loading. Set `timeoutMs` to adjust the limit. Timeouts notify `onError` while the rest of the queue continues. A retry uses a query parameter to avoid sharing an unfinished browser request.

Declare `require`, `exports`, and `module` explicitly for custom factories that need them. The shorthand without a dependency list supports literal `require('id')`.

## Legacy Promise

Load `promise.js` to use `SugarsPromise`. With CommonJS use `require('@sugars/async/promise')`, or get `LegacyPromise` or its `Promise` alias from the package root.

<!-- example:3 -->

Available operations are `then`, `done`, `catch`, `all`, `race`, and `oneByOne`. The last accepts an array of executors and starts them sequentially. Instances expose `PromiseStatus` and `PromiseValue`. Notifications and chaining retain TangramJS timing. A child returned by `then` forwards the original settlement value and ignores the handler’s return value.
