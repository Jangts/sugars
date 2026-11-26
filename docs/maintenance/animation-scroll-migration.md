# Animation 与 ScrollView 移植

基线为 TangramJS 2.9.1。历史滚动组件名为 `see.Scrollbar`。旧默认组件自己生成滚动条，OIML 继承其行为并绑定已有的轨道和滑块。两种结构共用行为的设计由 ScrollView 保留。

| 历史实现 | 当前行为 |
| --- | --- |
| `dom/Animation.js` 的场景队列、帧数、`play`、`stop`、`gotoAndPlay`、`gotoAndStop`、逐帧控制和完成回调 | 通过 `Animation` 显式传入场景，保留场景及帧坐标和默认 36 FPS。定时器改为浏览器帧调度。旧 `from`、`to`、`over` 样式插值和元素队列由调用方通过场景的 `render` 表达 |
| `see/Scrollbar/Abstract.js` 的视口尺寸、滚动边界、轨道和滑块换算 | 纯函数计算几何，绑定层接收调用方的视口、轨道和滑块。拖动和轨道点击调整原生滚动位置，原生滚动和尺寸变化更新自定义滑块 |
| `see/Scrollbar/Scrollbar.js` 的默认结构和 OIML 的自定义结构 | `ScrollView` 对两种结构使用同一入口，轨道和滑块的尺寸、外观、布局及可访问入口由调用方提供 |

动画定位立即绘制指定帧。手动定位和逐帧控制只绘制，完成回调由播放到末帧时触发。滚动条使用视口的真实 `scrollTop` 和 `scrollLeft`，绑定层通过 CSS 变量提供滑块尺寸和位置。示例与签名见 [Animation](../../packages/animation/README.md) 和 [ScrollView](../../packages/scroll-view/README.md)。

## 验收记录

- 根构建与类型检查通过。用实际 npm tarball 验证两个 ESM 包入口、TypeScript 严格模式消费、包内说明与来源文件。在 Node.js 用可控制时钟检查场景和帧定位、暂停恢复、循环、回调顺序及回调内中断，另核对几何换算与边界。
- 在 Chrome 158 从 tarball 加载。Animation 实际更新 DOM 的位移和透明度。ScrollView 分别使用嵌套与兄弟结构验证横纵滑块、轨道点击、拖动捕获、滚轮、键盘、RTL、尺寸观察和解绑时恢复原属性。Chrome 移动模拟另验证触摸拖动滑块和视口原生滚动。浏览器覆盖以这一版 Chrome 为限。
