# Simple MVVM 移植

当前入口和示例见 [Simple MVVM](../../packages/simple-mvvm/README.md)。历史原件使用 TangramJS 2.9.1 的 `src` 目录。模块出处和原目录的许可证文本随包记录。

| 原模块 | 当前实现 | 保留的行为 |
| --- | --- | --- |
| `obj/Observer/{Observer,Listener,Subscriber}.js` | `observer.ts` | 使用属性描述符和字段订阅器，保留值和字段名回调、回调接收者、静默写入与递归观察 |
| `dom/ViewModel.js` | `view-model.ts` | 代理初始字段并同步渲染，自定义路径执行三个回调，虚拟节点路径挂载到 body 后更新，表单 change 写入 input |
| `dom/VElement/{VElement,diff,patch}.js` | `v-element.ts`、`diff.ts` 和 `patch.ts` | 标签、属性、子节点、key 和后代计数，按先序索引生成补丁，应用替换、重排、属性和文本操作 |
| `arr/diff.js`、`dom/dom.js` | `list-diff.ts` 和 `patch.ts` | 键控与无键子节点的对齐、重排模拟，以及样式、表单值和普通属性更新 |

## 移植调整

- 用原生类、ESM 入口和 DOM API 代替 Pandora 注册、类工厂和事件包装。ViewModel 的树与 DOM 改由实例持有。新增 `destroy()` 和单字段 `disconnect()`。构造或挂载使用的保留字段仍可从 `model.data` 访问。
- 同一对象复用 Observer，递归支持循环引用。`_observer` 仍可读取，改为不可枚举以保留原对象的 JSON 序列化。订阅登记跳过无关属性读取，读回调可以读取本字段。原 `on` 分支重复检查 `read`，现可注册 `write`，同时保留 `silently` 的通知规则。
- 修复原补丁路径中的属性删除、文本与元素互换，以及替换根节点后继续更新。diff 仍然先对齐新旧子节点，再模拟重排。位置随移动更新，以便混合有键、无键、空文本的列表复用对应 DOM 并保持正确顺序。保留 `ignore` 对子树的控制，忽略子树的真实 DOM 数量可由调用方改变。

## 验证

- 使用 Chrome 158 运行历史源码与迁移包的相同夹具，核对读写通知、嵌套对象替换、静默更新、自定义渲染回调顺序和接收者，以及虚拟 DOM 初次挂载、文本更新和键控重排。旧版注册全字段回调时会额外触发一次已有读回调。
- 在 Chrome 158 通过独立安装的 npm tarball 验证根节点替换后的表单回写和后续更新、销毁、忽略子树后保留兄弟节点更新、属性移除及文本节点互换。遍历四个唯一 key 能组成的 4,225 组新旧列表，核对内容和节点身份。另用固定种子验证 4,000 组键控、无键和文本混合列表。
- 根构建、Node 的根和三个子入口、独立 TypeScript 消费样例，以及 tarball 中的 ESM、声明、README 和许可证均已检查。浏览器验收仅覆盖 Chrome。本包标记为私有。
