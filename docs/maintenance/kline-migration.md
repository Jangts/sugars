# K 线移植

以 GrandAPP 的 `k-line-mobile` 最终提交 `6b9be81` 为源码基线，桌面绘制、时间轴选择、十字线、缩放参考 `depths-chart` 的 `5d14a8a`。历史上 `k-line-mobile` 的 `7343ac0` 与 `depths-chart` 的 `5d14a8a` 拥有相同的 TypeScript 目录。上游 GitHub 参考版本、署名及许可随包保存在 [第三方声明](../../packages/kline/THIRD-PARTY-NOTICES.md)。

| 原模块 | 当前职责 |
| --- | --- |
| `KLine`、`Canvas`、`Painter` | 保留构造入口、三层 Canvas 和画笔。补齐初始化、尺寸变更、重绘和销毁 |
| `Layout`、`Chart`、`Brush` | 保留一至三个区域的历史相对比例和画笔拆分，最后一个区域贴合时间轴。补齐可见视口、尺度、网格、蜡烛、成交量和覆盖层 |
| `DataProvider`、`expressions`、`indicators` | 保留历史行情字段与表达式计算。加入有序更新、按窗口绘制和指标输出 |
| `Theme` 和主题预设 | 保留预设与自定义字段，修复自定义字体字段匹配 |
| 历史桌面和移动手势 | 通过同一套 Pointer Events 统一鼠标和触摸。滚轮、拖动和捏合共享视口计算 |

AMD/RequireJS 入口迁移为包的 ESM 入口。`new KLine({ element, ... })` 的容器通常由调用方设定宽高，`resize()` 可以覆盖。行情格式保持历史元组与服务端对象。视口和图例由实例持有。示例行情由调用方提供。完整签名见 [包说明](../../packages/kline/README.md)。

## 上游迭代核对

2026 年 11 月 25 日核对，`chxj1992/kline` 的默认分支仍指向 2018 年 6 月 6 日的移植参考提交 `73afcca`，`develop` 比该提交早 24 个提交。npm 的 `latest` 仍为 2018 年 5 月 2 日发布的 `1.1.8`。深度与成交侧栏、画线工具、轮询与 STOMP 已存在于参考版本。[GitHub 分支](https://api.github.com/repos/chxj1992/kline/branches) · [npm 版本记录](https://registry.npmjs.org/kline) · [参考版本 README](https://github.com/chxj1992/kline/blob/73afcca075e6d89dcaac9597175cba81a7e6410a/README.md)

基线之后的开放 PR #74 提议缩短 Webpack 开发编译时间，并修复初始配置 `showTrade: false` 时的侧栏样式。当前包通过 TypeScript 构建 ESM，图表布局直接使用容器宽度。两项改动均无对应的迁移点。[PR #74](https://github.com/chxj1992/kline/pull/74/files)

## 验收记录

- 在 workspace 根目录完成构建。从实际 npm tarball 加载 ESM，在严格 TypeScript 消费示例中核对包入口和声明。包体包含 README、第三方声明和与上游 Git blob 一致的 WTFPL v2 文件。
- Chrome 158 桌面模式使用历史 1,000 条行情，检查主图蜡烛、成交量和 MACD 的 Canvas 像素。验证悬停、光标位置缩放、拖动、回看时新增行情、同时间更新、布局切换、主题和销毁。另用历史服务端样本核对秒转毫秒。
- Chrome 158 移动模拟为 390 × 700 CSS 像素、设备像素比 3。验证全高容器、最后一个副图与时间轴相接，画布为 1170 × 2100 像素。点按、单指横拖、双指缩放、容器变化与销毁均通过。

### 输入兼容性复验

- macOS 上使用 Chrome 158、Edge 158、Firefox 159 和 Safari 17.2.1，复测悬停十字线、移出、拖动捕获、光标位置滚轮缩放和聚焦后的快捷键。Chrome、Edge 和 Firefox 验证了双击输入，Safari WebDriver 发送的两次点击各自计为单击，因此另外在 Safari 内验证了 `dblclick` 事件处理路径。
- Chrome 和 Edge 的触摸模拟通过点按、单指横拖、双指放大与缩小、触摸取消后的恢复和快速连点。iPhone 15 模拟器上的 iOS 17.5 Safari 通过点按和单指横拖。XCTest 在该 Safari 页面内发送双指手势，页面分别收到两路触点，验证了双向缩放。实体手机和 Windows 未验证。
- 修复浏览器组合键被图表拦截、纯横向滚动被取消，以及触摸连点误触发鼠标双击复位。Chrome 中复现了修复前的行为，修复后 Chrome 和 Edge 的回归用例均通过。

### 工作区风格对齐

类沿用 PascalCase 文件名，目录按画笔、指标和图表等职责使用小写名称。包级类型位于 `types.ts`。图表名称仍由同一份配置表驱动校验与实例化，`KDI` 继续作为 `KDJ` 的历史配置别名。K 线包直接继承根 TypeScript 严格检查配置。

用风格整理前后的实际 npm 包分别加载同一份 1,000 条历史行情。对比了五套布局在桌面和移动尺寸下的指标数值及 Canvas 像素，并检查了主题预设、服务端行情、同时间更新、空数据和画笔链式调用。结果一致。另用严格 TypeScript 消费示例检查了发布声明。
