# @sugars/async

TangramJS 的 AMD 加载器和旧式 Promise，运行代码使用 ES5。`amd.js` 和 `promise.js` 可分别用普通 `<script>` 标签加载，也提供 CommonJS 入口。两者可各自使用，AMD 通过回调交付结果。

## AMD

```html
<script src="./amd.js"></script>
<script>
    var loader = createAmdLoader({ baseUrl: './modules' });
    var restore = loader.installGlobals();

    loader.require(['example'], function (example) {
        try {
            example.start();
        } finally {
            restore();
        }
    }, function (error) {
        restore();
        throw error;
    });
</script>
```

在 `./modules/example.js` 里，给旧脚本保留常见的 AMD 声明方式。

```js
define(['./dependency'], function (dependency) {
    return { start: function () { dependency.run(); } };
});
```

`createAmdLoader()` 的模块和脚本缓存属于实例。`installGlobals()` 安装供外部脚本调用的 `define` 和 `require`，返回恢复函数。只使用 `loader.define('id', ...)` 登记内存模块时可直接调用实例方法。`require(['id'], callback, onError)` 异步加载，`require('id')` 在模块加载后同步取值。`require.config()` 支持 `baseUrl`、旧名 `mainUrl`、`paths` 和 `packages`。外部脚本需要浏览器 DOM。

定制 AMD 工厂用依赖数组显式声明 `require`、`exports`、`module`。省略依赖数组的简写工厂可以使用字面量 `require('id')`。

## 旧式 Promise

直接加载 `promise.js` 后使用 `SugarsPromise`。CommonJS 可用 `require('@sugars/async/promise')`，也可从包入口取 `LegacyPromise` 或别名 `Promise`。

```js
var promise = new SugarsPromise(function (resolve) {
    setTimeout(function () { resolve(42); }, 0);
});
promise.done(function (value) { console.log(value); });
```

提供 `then`、`done`、`catch`、`all`、`race` 和 `oneByOne`。`oneByOne` 接收执行器数组，前一项完成后才开始下一项。实例保留 `PromiseStatus` 和 `PromiseValue`。它沿用 TangramJS 的同步通知和原值转发语义，`then` 返回的子项转发结算值，回调返回值不会替换它。

[源码来源和许可](THIRD-PARTY-NOTICES.md)
