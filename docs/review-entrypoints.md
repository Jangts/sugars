# 项目检查入口

全面检查、专项检查和修复复查使用全局 `$comprehensive-code-review`。

在仓库根目录执行适用的命令。文档变更重点检查链接、事实来源、签名和示例。改变浏览器行为时，用受影响包的公开入口验证对应路径。

| 变化 | 实际入口 | 证据范围 |
| --- | --- | --- |
| 双语文档站 | `npm run docs:check` | 公开包、API、示例、双语路由、锚点、资源与静态产物 |
| TypeScript 构建与声明 | `npm run typecheck` 或 `npm run build` | 当前编译配置下的类型、项目引用及导出。完整构建复制默认表情 |
| 编辑器 | [原生编辑器示例](../README.md#原生编辑器) | 实际浏览器中的选区、命令、内容、表单和清理 |
| Web Component | [Web Component 示例](../README.md#web-component) | 实际注册、Light DOM、属性、事件及重连 |
| 图表 | [Canvas 图表示例](../README.md#canvas-图表)和按变更补充的配置 | 绘制、各系列与输入形态、图层、提示及更新 |
| 两个编辑器的 npm 包体清单 | 构建后运行 `npm pack --dry-run --json --workspace @sugars/editor --workspace @sugars/editor-element` | 文件是否按预期入包。真实 tarball 安装和 registry 状态另行核对 |
| K 线 | [K 线示例](../packages/kline/README.md)和 `npm pack --dry-run --json --workspace @sugars/kline` | 桌面鼠标和移动触摸、指标和行情更新、分辨率适配、清理、声明及来源文件 |
| 代码高亮 | [高亮示例](../packages/highlight/README.md)和 `npm pack --dry-run --json --workspace @sugars/highlight` | 纯文本转义、语言登记、嵌套语法、DOM 属性与回调、主题及来源文件 |
| ES5 兼容包 | [AMD 和 Promise 示例](../packages/async/README.md)、[declare 示例](../packages/declare/README.md)和 `npm pack --dry-run --json --workspace @sugars/async --workspace @sugars/declare` | 实际包体的 ES5 语法、普通脚本和 CommonJS 入口、AMD 加载、Promise 时序及原型继承 |
| Animation | [场景播放器示例](../packages/animation/README.md)和 `npm pack --dry-run --json --workspace @sugars/animation` | 场景和帧定位、播放和中断、循环、回调及实际绘制 |
| ScrollView | [滚动控制器示例](../packages/scroll-view/README.md)和 `npm pack --dry-run --json --workspace @sugars/scroll-view` | 不同轨道结构、双向同步、原生滚动、尺寸变化及解绑 |
| 基础工具 | [工具用法](../packages/tools/README.md)和 `npm pack --dry-run --json --workspace @sugars/tools` | 根、分类及单函数入口，数据复制、边界输入、文本编解码与包体 |
| Simple MVVM | [数据观察与渲染示例](../packages/simple-mvvm/README.md)和 `npm pack --dry-run --json --workspace @sugars/simple-mvvm` | 读写订阅、渲染回调、键控重排、根节点替换、表单回写和清理 |
| Swiper | [轮播示例](../packages/swiper/README.md) | 七种预设、逻辑索引、边界副本、交互、计时和销毁 |
| Visual Form | [表单示例](../packages/visual-form/README.md) | 字段定义、JSON 读写、校验回退、textarea 和销毁 |
| Simple SQL | [本地表示例](../packages/simple-sql/README.md) | 查询与写入、约束、版本通知、持久化失败和旧分片读取 |
| 3D Pictures | [图片序列示例](../packages/3d-pictures/README.md) | 四种帧来源、鼠标及触摸拖动、循环、预加载和销毁 |
| DOM 集合 | [插件示例](../packages/dom/README.md)和 `npm pack --dry-run --json --workspace @sugars/dom` | 选择和返回链、扩展、委托与命名空间、常用 DOM 操作和实际插件 |

仓库目前没有登记自动浏览器回归脚本。验证浏览器行为时，记录实际浏览器、输入、断言及未覆盖场景。历史本机验证见 [迁移背景与共识](maintenance/project-background.md#已验证和待核对)。

`npm run typecheck` 和 `npm run build` 共用 TypeScript 项目构建过程，对同一类型疑问通常选择其一。

## 迁移和重构的验收

同一图形名称可以对应不同承诺。画出柱状图不能覆盖区间柱、组间距和横轴纵轴交换。鼠标出现提示不能覆盖按轴汇总多个系列。相同 `zIndex` 选项也需要区分绘制顺序和具体 Canvas 图层。修改这些规则时，用同一组输入对照原行为或明确的预期。

涉及编辑生命周期时，按需核对工具栏取焦点后的选区恢复、撤销、内容变化事件、表单取值和实例释放。涉及 Web Component 时，按需核对 Light DOM 原有内容、注册、连接、断开与重连。涉及 charts 时，按需核对受影响的系列、比例尺、提示、更新和销毁。仅登记了选项或能力名称无法证明它参与了执行。

核对外来 HTML、粘贴和插入时沿编辑器的实际处理路径追查。发布前核对实际包体、独立消费和原素材许可。
