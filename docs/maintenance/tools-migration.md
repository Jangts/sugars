# 基础工具移植

从 TangramJS 2.9.1 逐函数拆出数据与文本操作，保留函数体和历史调用方式。导出结构参考 Lodash 的单函数模块与分类入口。每份源文件标明原始文件和行号。公开范围见 [工具包说明](../../packages/tools/README.md)。

| 历史入口 | 当前入口或行为 |
| --- | --- |
| 核心 `slice`、`each`、`loop` | 集合入口。保留键在前的回调顺序、原遍历范围和 `loop.out()` |
| `arr/arr.js` | 数组入口。保留 `merge`、`unique`、`beObject`、`push`、`remove` 等源函数，包括历史参数顺序和假值处理 |
| 核心数据函数及 `obj/obj.js` | 对象入口。保留 `clone`、`copy`、`extend`、`update`、`merge`、`deepMerge` 及查询字符串工具 |
| `str/str.js` | 字符串入口。保留 `capital`、`toCamel`、`has` 和 Base64 的历史编解码 |
| `util/type.js`、`util/bool.js` | 类型入口。保留 `type`、`fasttype` 及原有数值和字符串判断 |
| `math/math.js` | 数学入口。保留 `cap` 的上限处理及 `gcd`、`lcm` 的历史命名与结果 |

移植改动限于替换框架引用为模块导入，以及以下运行适配。Base64 解码的临时变量改为局部声明，浏览器类型检测允许在 Node.js 调用。数字数组的 `sum` 改用加法，仍保留空数组的结果。公因数与公倍数实现增加有限值判断。写入 `__proto__` 时按数据键处理。

代码来源与附带许可见 [包内声明](../../packages/tools/THIRD-PARTY-NOTICES.md)。

## 验收记录

- 根构建和类型检查通过。用实际 npm tarball 验证根入口、分类入口、单函数入口和 TypeScript 声明。
- 在 Node.js 直接运行 TangramJS 原文件和 tarball，对 46 个公开函数分别使用同样的代表性输入，结果一致。额外验证数值求和、非有限值和原型键的运行适配。
- Chrome 158 从 tarball 加载后验证原有的 DOM 类型标签和 Base64 编解码。
