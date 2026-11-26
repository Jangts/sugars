# @sugars/declare

**ES5 compatibility package**

A TangramJS prototype-based class factory. Load `index.js` as a classic script and call `declare`, or use `var declare = require('@sugars/declare');` in CommonJS.

<!-- example:1 -->

The name and base are optional. Pass members in separate objects, with later members overriding earlier ones. Calling a constructor with or without `new` runs `_init`. A subclass inherits the parent initializer if it does not define one. Within an initializer, `this._parent._init.call(this, ...)` uses the parent of the class that declared that initializer, including when a deeper subclass inherits it. Ordinary methods can call a specific constructor’s prototype explicitly. Named declarations return a constructor for the caller to store or compose.

`_x` assigns instance fields. Strict mode updates only fields with a defined value. `_c` copies enumerable own data, recursively copying plain objects and arrays. `_p` is shared within one inheritance chain.
