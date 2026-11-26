# DOM

`@sugars/dom` ports TangramJS `dom.Elements` and `dom.select` to ESM. It uses browser selectors, DOM, and events without runtime dependencies.

<!-- example:1 -->

Register a plugin with `$.fn.plugin = function (...) { ... }` or `$.fn.extend({...})`. The module also provides `$.extend`, static `$.data`, `$.Event`, and collection utilities. The default and named `$` imports are the same function. For classic IIFE plugins, call `installGlobals(window)` first and call its return value to restore the previous globals.

| Area | Common APIs |
| --- | --- |
| Collections | `get`, `each`, `map`, `find`, `filter`, `closest`, `addBack`, `end` |
| DOM | `attr`, `prop`, `data`, `html`, `text`, insertion, `clone`, `remove`, `detach` |
| Events | `on`, `one`, `off`, delegation, namespaces, `trigger`, `triggerHandler` |
| Forms and layout | `val`, `serialize`, `css`, dimensions, offsets, and scroll positions |
| Effects | `animate`, `stop`, visibility, fading, sliding, and numeric tween hooks |

Legacy code can call `select({ tagName: 'div', className: ['item', 'active'] })` and `select.extend(methods, rewrite)`. Collections retain `closet`, `sub`, `concat`, `transition`, and `animator`.

Selectors include native CSS and common suffixes such as `:visible`, `:hidden`, `:input`, `:first`, and `:eq(n)`. Plugin compatibility covers DOM and effects. Plugins that require jQuery AJAX, Deferred, the full selector engine, or internal event hooks still need jQuery. Importing the module installs no globals. HTML insertion does not actively execute scripts in the supplied markup.
