(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory(root);
    else if (typeof define === 'function' && define.amd) define([], function () { return factory(root); });
    else root.createAmdLoader = factory(root);
}(typeof window === 'object' ? window : typeof global === 'object' ? global : this, function (root) {
    'use strict';

    var specialDependencies = ['require', 'exports', 'module'];

    function isUrl(id) {
        return /^(?:[a-z][a-z0-9+.-]*:|\/)/i.test(id);
    }

    function normalizeId(id) {
        var parts = [];
        id.split('/').forEach(function (part) {
            if (part === '..' && parts.length && parts[parts.length - 1] !== '..') parts.pop();
            else if (part && part !== '.') parts.push(part);
        });
        return parts.join('/');
    }

    function directoryOf(path) {
        path = path.replace(/[?#].*$/, '');
        return path.slice(0, path.lastIndexOf('/') + 1);
    }

    function readDefinition(args) {
        var offset = args.length > 1 && typeof args[0] === 'string' ? 1 : 0;
        if (!args.length || args.length > offset + 2) throw new TypeError('Invalid AMD define signature');
        var factory = args[args.length - 1];
        var dependencies = args.length > offset + 1 ? args[offset] : null;
        var preload = [];
        if (dependencies != null && (!Array.isArray(dependencies) || dependencies.some(function (id) { return typeof id !== 'string'; }))) {
            throw new TypeError('AMD dependencies must be an array of module IDs');
        }
        if (!dependencies && typeof factory === 'function' && factory.length) {
            dependencies = specialDependencies;
            Function.prototype.toString.call(factory)
                .replace(/\/\*[\s\S]*?\*\/|^[ \t]*\/\/.*$/gm, '')
                .replace(/(?:^|[^\w$.])require\s*\(\s*(['"])([^'"\s]+)\1\s*\)/g, function (match, quote, id) {
                    preload.push(id);
                    return match;
                });
        }
        return { id: offset ? args[0] : undefined, dependencies: (dependencies || []).slice(), preload: preload, factory: factory };
    }

    function installGlobals(target, define, require) {
        var restore = [];
        try {
            install('define', define);
            install('require', require);
        } catch (error) {
            reset();
            throw error;
        }
        return reset;

        function install(name, value) {
            var prior = Object.getOwnPropertyDescriptor(target, name);
            Object.defineProperty(target, name, { value: value, configurable: true, writable: true });
            restore.unshift(function () {
                var current = Object.getOwnPropertyDescriptor(target, name);
                if (!current || current.value !== value) return;
                if (prior) Object.defineProperty(target, name, prior);
                else delete target[name];
            });
        }

        function reset() {
            while (restore.length) restore.shift()();
        }
    }

    function createAmdLoader(options) {
        options = options || {};
        var document = options.document || root.document;
        var definitions = Object.create(null);
        var paths = Object.create(null);
        var packages = Object.create(null);
        var scripts = Object.create(null);
        var queue = [];
        var active = null;
        var baseUrl = './';

        function absoluteUrl(path) {
            if (!document) return path;
            var anchor = document.createElement('a');
            anchor.href = path;
            return anchor.href;
        }

        function configure(config) {
            config = config || {};
            var base = config.baseUrl || config.mainUrl;
            if (base) baseUrl = absoluteUrl(base.replace(/\/*$/, '/'));
            (config.packages || []).forEach(function (entry) {
                if (typeof entry === 'string') entry = { name: entry };
                paths[entry.name] = entry.location || entry.name;
                packages[entry.name] = normalizeId(entry.name + '/' + (entry.main || 'main').replace(/\.js$/, ''));
            });
            Object.keys(config.paths || {}).forEach(function (name) { paths[name] = config.paths[name]; });
        }

        function resolveId(request, parent) {
            if (typeof request !== 'string' || !request || request.indexOf('!') !== -1) {
                throw new TypeError('Unsupported AMD module ID: ' + request);
            }
            if (isUrl(request)) return absoluteUrl(request);
            if (/^\.\.?\//.test(request)) {
                if (parent && isUrl(parent)) return absoluteUrl(directoryOf(parent) + request);
                request = (parent ? directoryOf(parent) : '') + request;
            }
            var id = normalizeId(request);
            if (!id) throw new TypeError('Unsupported AMD module ID: ' + request);
            return packages[id] || id;
        }

        function scriptUrl(id) {
            var path = id;
            if (!isUrl(id)) {
                var prefix = id;
                while (prefix) {
                    if (paths[prefix] !== undefined) {
                        var suffix = id.slice(prefix.length);
                        path = suffix ? paths[prefix].replace(/\/$/, '') + suffix : paths[prefix];
                        break;
                    }
                    prefix = prefix.slice(0, Math.max(0, prefix.lastIndexOf('/')));
                }
                if (!isUrl(path)) path = baseUrl + path;
            }
            return absoluteUrl(path.replace(/^[^?#]+/, function (name) {
                return /\.js$/.test(name) ? name : name + '.js';
            }));
        }

        function define() {
            // One active request supplies a fallback for engines without document.currentScript.
            var request = active && (!('currentScript' in document) || document.currentScript === active.node) ? active : null;
            try {
                var definition = readDefinition(arguments);
                var id = definition.id === undefined ? request && request.id : resolveId(definition.id);
                if (!id) throw new Error('Anonymous AMD definitions require a script loaded by this loader');
                var registry = request ? request.definitions : definitions;
                if (registry[id]) throw new Error('AMD module already defined: ' + id);
                var node = request ? request.node : document && document.currentScript;
                definition.module = { id: id, uri: node && node.src || undefined, exports: {} };
                definition.state = 'defined';
                registry[id] = definition;
            } catch (error) {
                if (request) request.error = error;
                throw error;
            }
        }
        define.amd = {};

        function startScript() {
            if (active) return;
            while (queue.length) {
                var request = queue.shift();
                if (!request.callbacks.every(function (waiter) { return !!definitions[waiter.id]; })) {
                    start(request);
                    return;
                }
                // A bundle that just loaded may already have registered every queued ID.
                delete scripts[request.url];
                notify(request, null);
            }
        }

        function notify(request, error) {
            request.callbacks.splice(0).forEach(function (waiter) {
                root.setTimeout(function () { waiter.loaded(error, request); }, 0);
            });
        }

        function start(request) {
            active = request;
            var node = document.createElement('script');
            var supportsLoad = 'onload' in node;
            request.node = node;
            node.async = true;
            node.src = request.url;
            node.onload = function () { finish(request.error); };
            node.onerror = function () { finish(new Error('Unable to load AMD script: ' + request.url)); };
            if (!supportsLoad) {
                node.onreadystatechange = function () {
                    if (node.readyState === 'loaded' || node.readyState === 'complete') finish(request.error);
                };
            }
            try {
                var head = document.head || document.getElementsByTagName('head')[0];
                head.appendChild(node);
            } catch (error) {
                finish(error);
            }

            function finish(error) {
                if (request !== active) return;
                node.onload = node.onerror = node.onreadystatechange = null;
                var ids = Object.keys(request.definitions);
                if (!error && !ids.length) error = new Error('AMD script did not call define: ' + request.url);
                if (!error) {
                    ids.some(function (id) {
                        if (!definitions[id]) return false;
                        error = new Error('AMD module already defined: ' + id);
                        return true;
                    });
                }
                if (error) {
                    delete scripts[request.url];
                    if (node.parentNode) node.parentNode.removeChild(node);
                } else {
                    ids.forEach(function (id) { definitions[id] = request.definitions[id]; });
                    request.ids = ids;
                }
                active = null;
                notify(request, error);
                startScript();
            }
        }

        function locate(id, callback) {
            if (definitions[id]) return callback(null, definitions[id]);
            if (!document) return callback(new Error('AMD module is not defined: ' + id));
            var url;
            try { url = scriptUrl(id); } catch (error) { return callback(error); }
            var request = scripts[url];
            if (request && request.ids) return loaded(null, request);
            var waiter = { id: id, loaded: loaded };
            if (request) request.callbacks.push(waiter);
            else {
                request = { id: id, url: url, definitions: Object.create(null), callbacks: [waiter] };
                scripts[url] = request;
                queue.push(request);
                startScript();
            }

            function loaded(error, result) {
                if (definitions[id]) return callback(null, definitions[id]);
                if (error) return callback(error);
                var definition = result.ids.length === 1 && definitions[result.ids[0]];
                if (!definition) return callback(new Error('AMD script ' + url + ' did not define ' + id));
                definitions[id] = definition;
                callback(null, definition);
            }
        }

        function execute(id, acquire) {
            var definition = definitions[id];
            if (!definition || (!acquire && definition.state === 'defined')) {
                throw new Error('Load AMD module asynchronously before requiring it synchronously: ' + id);
            }
            if (definition.state === 'failed') throw definition.error;
            var module = definition.module;
            if (definition.state !== 'defined') return module.exports;
            definition.state = 'executing';
            try {
                var special = { require: makeRequire(module.id), exports: module.exports, module: module };
                var args = definition.dependencies.map(function (name) {
                    if (specialDependencies.indexOf(name) !== -1) return special[name];
                    return execute(resolveId(name, module.id), true);
                });
                var factory = definition.factory;
                var value = typeof factory === 'function' ? factory.apply(module, args) : factory;
                if (value !== undefined) module.exports = value;
                definition.state = 'executed';
                return module.exports;
            } catch (error) {
                definition.state = 'failed';
                definition.error = error;
                throw error;
            }
        }

        function load(ids, parent, callback, onError) {
            var visited = Object.create(null);
            var dependencies = [];
            var entryIds;
            var index = 0;
            root.setTimeout(function () {
                try {
                    entryIds = ids.map(function (id) { return resolveId(id, parent); });
                    dependencies = entryIds.slice();
                } catch (error) {
                    fail(error);
                    return;
                }
                next();
            }, 0);

            function add(definition) {
                var id = definition.module.id;
                if (visited[id] || definition.state !== 'defined') return;
                visited[id] = true;
                definition.dependencies.concat(definition.preload).forEach(function (name) {
                    if (specialDependencies.indexOf(name) === -1) dependencies.push(resolveId(name, id));
                });
            }

            function advance(error, definition) {
                if (error) return fail(error);
                try { add(definition); } catch (failure) { return fail(failure); }
                next();
            }

            function next() {
                var missing;
                var values;
                try {
                    while (index < dependencies.length) {
                        var id = dependencies[index++];
                        if (!definitions[id]) {
                            missing = id;
                            break;
                        }
                        add(definitions[id]);
                    }
                    if (!missing) values = entryIds.map(function (id) { return execute(id, true); });
                } catch (error) {
                    fail(error);
                    return;
                }
                if (missing) locate(missing, advance);
                else if (typeof callback === 'function') callback.apply(document && document.defaultView || root, values);
            }

            function fail(error) {
                if (typeof onError === 'function') onError(error);
                else throw error;
            }
        }

        function makeRequire(parent) {
            function require(ids, callback, onError) {
                if (typeof ids === 'string') return execute(resolveId(ids, parent), !!parent);
                if (!Array.isArray(ids)) throw new TypeError('AMD require expects a module ID or an array of IDs');
                load(ids.slice(), parent, callback, onError);
            }
            require.config = function (config) {
                configure(config);
                return require;
            };
            return require;
        }

        configure(options);
        var require = makeRequire();
        return {
            define: define,
            require: require,
            installGlobals: function (target) { return installGlobals(target || root, define, require); }
        };
    }

    return createAmdLoader;
}));
