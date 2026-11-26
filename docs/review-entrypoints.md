# 项目检查入口

在仓库根目录执行适用的命令。文档变更重点检查链接、事实来源、签名和示例。改变浏览器行为时，用受影响包的公开入口验证对应路径。

| 变化 | 实际入口 | 证据范围 |
| --- | --- | --- |
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

仓库目前没有登记自动浏览器回归脚本。验证浏览器行为时，记录实际浏览器、输入、断言及未覆盖场景。历史本机验证见 [迁移背景与共识](maintenance/project-background.md#已验证和待核对)。

`npm run typecheck` 和 `npm run build` 共用 TypeScript 项目构建过程，对同一类型疑问通常选择其一。
