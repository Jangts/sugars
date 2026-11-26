# Swiper、Visual Form、Simple SQL 和 3D Pictures 移植

四个包来自本地 TangramJS 2.9.1 历史原件，作为私有 npm workspace 交付。Swiper 通过 Simple MVVM 的 ViewModel 更新导航状态，Visual Form 通过 ViewModel 更新表单，Simple SQL 和 3D Pictures 通过 Observer 订阅提交版本和当前帧。

| 包 | 历史源码 | 保留的设计 |
| --- | --- | --- |
| [Swiper](../../packages/swiper/README.md) | `src/see/Slider/Slider.js` 和 `options/*.js` | 使用原 .stage、.troupe、.actor 和导航接口，七个布局及切换预设共享播放控制 |
| [Visual Form](../../packages/visual-form/README.md) | `src/form/VisualJOSN/{ClassObject,Object}.js`、`src/data/Model.js` | 从同一字段定义创建浏览器输入控件和数据模型，加载、回读校验及 JSON 导出 |
| [Simple SQL](../../packages/simple-sql/README.md) | `src/data/{Sheet,Storage,data}.js`、`src/str/hash.js` | 默认值、字段约束、自增主键、结构化操作及原 SQL 式入口，读取旧 localStorage 的元数据和分片 |
| [3D Pictures](../../packages/3d-pictures/README.md) | `src/see/Photos/{ThreeDimensionalEyes,Photos}.js` | URL 数组、目录、清单和内联帧，点击预加载、按 25 像素分步以及首尾回绕 |

## 适配

- Swiper 的轨道尺寸和偏移使用历史预设的百分比计算，动画使用 CSS 过渡，循环时以规范化索引记录当前 slide。可自动生成首尾副本，也能接用调用方预置副本。包内控制器需要的样式按实例设置，旧主题由调用方选择。修复完成回调、首个活动索引和用户暂停计时器。
- Visual Form 用原生 DOM 创建控件，时分、日期和日期时间映射到原生输入类型。相同定义的表单分别持有数据，数值零、false、校验失败后的旧值以及 textarea 回写均纳入验证。
- Simple SQL 的查询引擎按文本解析条件和字面量，保留历史条件写法中的常用比较与逻辑操作。修复数值最值检查，数值排序按方向名执行。旧 key 和分片内容保留。当前版本为浏览器写入保留独立快照，并在本页持久化成功后通知观察者。跨页串行化、冲突恢复和存储适配条件见 [Simple SQL](../../packages/simple-sql/README.md#多标签页写入)。
- 3D Pictures 用原生 Pointer Events 处理鼠标与触摸。内联帧在初始化时计数，清单用标准 JSON 读取，单帧无法加载时预加载仍可完成。

## 验证

- Chrome 158 用相同夹具对照了旧版具名字段的输入输出、帧索引走势，以及六种轨道预设的百分比尺寸和切换位置。旧预设的动画适配器立即应用最终位置，旧内联帧夹具补齐原本缺失的帧数。另在同一个浏览器用原版 Sheet 生成 localStorage 数据并由新包读取。
- 使用独立安装的 tarball，在 Chrome 158 验证七种预设、鼠标或触摸与键盘导航、计时和销毁、表单回写、表格随提交更新与页面重载，以及四种帧来源、鼠标和触摸拖动及首尾循环。
- Node 用可注入存储验证 SQL 的增删改查、排序和限制、字段约束、历史分片以及持久化失败后仍然保留原状态。构建、TypeScript 消费示例和包体均已核对。
