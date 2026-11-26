(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else if (typeof define === 'function' && define.amd) define([], factory);
    else root.declare = factory();
}(typeof window === 'object' ? window : this, function () {
    'use strict';

    function copy(value, originals, copies, fromInstance) {
        if (value === null || typeof value !== 'object') return value;
        var array = Array.isArray(value);
        var prototype = Object.getPrototypeOf(value);
        if (!fromInstance && !array && prototype !== Object.prototype && prototype !== null) return value;
        var prior = originals.indexOf(value);
        if (prior !== -1) return copies[prior];

        var result = array ? new Array(value.length) : {};
        originals.push(value);
        copies.push(result);
        Object.keys(value).forEach(function (key) {
            Object.defineProperty(result, key, {
                value: copy(value[key], originals, copies),
                enumerable: true,
                writable: true,
                configurable: true
            });
        });
        return result;
    }

    function init() {}

    function extend(members, strict) {
        var instance = this;
        Object.keys(members).forEach(function (key) {
            if (!strict || instance[key] !== undefined) instance[key] = members[key];
        });
        return instance;
    }

    function clone() {
        return copy(this, [], [], true);
    }

    var initializers = [];

    function bindInitializer(method, parent) {
        return function () {
            initializers.push({ instance: this, parent: parent });
            try {
                return method.apply(this, arguments);
            } finally {
                initializers.pop();
            }
        };
    }

    function declare() {
        var args = Array.prototype.slice.call(arguments);
        var label = typeof args[0] === 'string' ? args.shift() : '';
        if (label && !/^[a-z_$][\w$]*(?:\.[\w$]+)*$/i.test(label)) throw new TypeError('Invalid class name: ' + label);
        var base = typeof args[0] === 'function' ? args.shift() : null;
        var parent = base && base.prototype || { _p: {}, _init: init, _x: extend, _c: clone };
        var prototype = Object.create(parent);

        if (!('_init' in parent)) prototype._init = init;
        if (!('_x' in parent)) prototype._x = extend;
        if (!('_c' in parent)) prototype._c = clone;
        if (!('_p' in parent)) prototype._p = {};

        for (var index = 0; index < args.length; index++) {
            if (!args[index] || typeof args[index] !== 'object') break;
            addMembers(prototype, args[index], parent);
        }

        function Class() {
            var instance = this instanceof Class ? this : Object.create(prototype);
            instance._init.apply(instance, arguments);
            return instance;
        }

        Object.defineProperties(prototype, {
            constructor: { value: Class, configurable: true, writable: true },
            _parent: {
                configurable: true,
                enumerable: true,
                get: function () {
                    for (var i = initializers.length - 1; i >= 0; i--) {
                        if (initializers[i].instance === this) return initializers[i].parent;
                    }
                    return parent;
                },
                set: function (value) {
                    Object.defineProperty(this, '_parent', { value: value, configurable: true, writable: true, enumerable: true });
                }
            }
        });
        Class.prototype = prototype;
        if (label) {
            var name = label.replace(/\.([\w$])/g, function (match, character) { return character.toUpperCase(); });
            Class.displayName = name;
            var nameProperty = Object.getOwnPropertyDescriptor(Class, 'name');
            if (!nameProperty || nameProperty.configurable) {
                Object.defineProperty(Class, 'name', { value: name, configurable: true });
            }
        }
        return Class;
    }

    function addMembers(target, source, parent) {
        Object.getOwnPropertyNames(source).forEach(function (name) {
            var descriptor = Object.getOwnPropertyDescriptor(source, name);
            if (name === '_init' && typeof descriptor.value === 'function') {
                descriptor.value = bindInitializer(descriptor.value, parent);
            }
            Object.defineProperty(target, name, descriptor);
        });
    }

    declare.declare = declare;
    declare.declareClass = declare;
    return declare;
}));
