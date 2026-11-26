(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else if (typeof define === 'function' && define.amd) define([], factory);
    else root.SugarsPromise = factory();
}(typeof window === 'object' ? window : this, function () {
    'use strict';

    function LegacyPromise(executor) {
        if (!(this instanceof LegacyPromise)) return new LegacyPromise(executor);
        var promise = this;
        this.PromiseStatus = 'pending';
        this.PromiseValue = undefined;
        this.handlers = [];

        try {
            if (typeof executor === 'function') executor(resolve, reject);
        } catch (error) {
            reject(error);
        }

        function resolve(value) { settle(promise, 'resolved', value); }
        function reject(reason) { settle(promise, 'rejected', reason); }
    }

    function settle(promise, status, value) {
        if (promise.PromiseStatus !== 'pending') return;
        promise.PromiseStatus = status;
        promise.PromiseValue = value;

        var handlers = promise.handlers.splice(0);
        var firstFailure;
        for (var index = 0; index < handlers.length; index++) {
            try {
                handlers[index]();
            } catch (error) {
                if (!firstFailure) firstFailure = { error: error };
            }
        }
        if (firstFailure) throw firstFailure.error;
    }

    function subscribe(promise, handler) {
        if (promise.PromiseStatus === 'pending') promise.handlers.push(handler);
        else handler();
    }

    LegacyPromise.prototype.then = function (onResolved, onRejected) {
        var promise = this;
        return new LegacyPromise(function (resolve, reject) {
            subscribe(promise, function () {
                var handler = promise.PromiseStatus === 'resolved' ? onResolved : onRejected;
                try {
                    if (typeof handler === 'function') handler.call(promise, promise.PromiseValue);
                    // TangramJS chains forward the original settled value.
                    resolve(promise.PromiseValue);
                } catch (error) {
                    reject(error);
                }
            });
        });
    };

    LegacyPromise.prototype.done = function (callback) {
        if (typeof callback !== 'function') return;
        var promise = this;
        subscribe(this, function () {
            if (promise.PromiseStatus === 'resolved') callback.call(promise, promise.PromiseValue);
        });
    };

    LegacyPromise.prototype['catch'] = function (onRejected) {
        return this.then(null, onRejected);
    };

    function follow(value, resolve, reject) {
        var called = false;
        try {
            var then = value == null ? undefined : value.then;
            if (typeof then === 'function') then.call(value, done, fail);
            else done(value);
        } catch (error) {
            fail(error);
        }

        function done(result) {
            if (called) return;
            called = true;
            resolve(result);
        }

        function fail(error) {
            if (called) return;
            called = true;
            reject(error);
        }
    }

    LegacyPromise.all = function (values) {
        return new LegacyPromise(function (resolve, reject) {
            var length = values.length;
            var remaining = length;
            var results = new Array(length);
            if (!remaining) resolve(results);

            for (var index = 0; index < length; index++) observe(index);

            function observe(index) {
                follow(values[index], function (value) {
                    results[index] = value;
                    if (--remaining === 0) resolve(results);
                }, reject);
            }
        });
    };

    LegacyPromise.race = function (values) {
        return new LegacyPromise(function (resolve, reject) {
            for (var index = 0; index < values.length; index++) follow(values[index], resolve, reject);
        });
    };

    LegacyPromise.oneByOne = function (executors) {
        return new LegacyPromise(function (resolve, reject) {
            var results = [];
            var index = 0;
            next();

            function next() {
                while (index < executors.length) {
                    var executor = executors[index++];
                    if (typeof executor !== 'function') {
                        reject(new TypeError('Expected a Promise executor'));
                        return;
                    }
                    var task = new LegacyPromise(executor);
                    if (task.PromiseStatus === 'pending') {
                        task.then(function (value) {
                            results.push(value);
                            next();
                        }, reject);
                        return;
                    }
                    if (task.PromiseStatus === 'rejected') {
                        reject(task.PromiseValue);
                        return;
                    }
                    results.push(task.PromiseValue);
                }
                resolve(results);
            }
        });
    };

    return LegacyPromise;
}));
