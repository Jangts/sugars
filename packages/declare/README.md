# @sugars/declare

**ES5 兼容包**

TangramJS 的原型类工厂，运行代码使用 ES5。普通 `<script>` 加载 `index.js` 后通过 `declare` 调用。CommonJS 使用 `var declare = require('@sugars/declare');`。

```js
var Counter = declare('Counter', {
    _init: function (value) { this.value = value; },
    next: function () { return ++this.value; }
});

var StepCounter = declare('StepCounter', Counter, {
    next: function () { this.value += 2; return this.value; }
});

var counter = new StepCounter(5);
counter.next(); // 7
```

基类和名称均可省略。成员可以分多个对象传入，后面的对象覆盖前面同名成员。构造器可以用 `new` 或直接调用，都会开始执行 `_init`。子类省略 `_init` 时继承父类版本。在初始化函数内部，`this._parent._init.call(this, ...)` 指向声明该函数的类的父级，即使函数被更深层子类继承。普通方法需要显式调用某一级实现时，可以直接使用该级构造器的 `prototype`。具名声明返回构造器，由调用方决定如何保存和组合。

`_x` 批量写入实例字段，严格模式只更新值已定义的字段。`_c` 复制实例的自有可枚举数据，递归拷贝普通对象和数组。`_p` 在一条继承链内共享，独立声明的基类各自持有自己的对象。

[源码来源和许可](THIRD-PARTY-NOTICES.md)
