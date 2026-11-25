# @sugars/kline

K Line Mobile 的 TypeScript ESM 版。使用 Canvas 2D 绘制 K 线，独立于通用的 `@sugars/charts`。在 sugars 根目录执行 `npm ci` 和 `npm run build`，然后从工作区包名导入。容器需要有可用的宽高。

```html
<style>
#market { width: 100%; height: 360px; }
@media (max-width: 600px) {
    #market { height: 100vh; height: 100dvh; }
}
</style>
<div id="market"></div>
```

```ts
import { KLine } from '@sugars/kline'

const chart = new KLine({
    element: 'market',
    data: [
        [Date.UTC(2025, 0, 1), 100, 109, 98, 105, 1200],
        [Date.UTC(2025, 0, 2), 105, 108, 101, 103, 900],
    ],
})

chart.appendData([Date.UTC(2025, 0, 3), 103, 112, 102, 110, 1350])
// 容器移除时调用 chart.destroy()
```

## 行情与布局

- 行情支持历史元组 `[time, open, high, low, close, volume, turnover?]`，`Data` 对象，以及历史服务端对象 `{ unixts, openpx, highpx, lowpx, newpx, vol, money? }`。元组和 `Data` 用毫秒，服务端的 `unixts` 用秒。时间刻度使用 UTC。调用方负责提供行情。
- `setData(data)` 替换行情并回到最新区间，`appendData(bar)` 按时间插入或更新同一根蜡烛。初始数据和替换数据按时间排序，同一时间取最后一条。空数组清空行情。非法行情抛出 `TypeError`。
- `layoutConf` 默认是 `['MA', 'Volume', 'MACD']`。可以通过 `setLayout()` 配置一至三个区域。主图支持 `MA`、`SMA`、`EMA`、`BOLL`，副图支持 `Volume`、`MACD`、`KDJ`、`RSI` 和 `WR`。`KDI` 是历史 `KDJ` 别名。
- `setTheme()` 接受命名导出的 `classicDark`、`classicLight`、`reverseDark`、`reverseLight` 或颜色和字体覆盖项。默认使用经典深色。可用 `drawPseudoUpDown: true` 恢复历史深色主题的空心阳线。

## 桌面与移动端

| 输入 | 操作 |
| --- | --- |
| 鼠标 | 悬停显示十字线和 OHLC，按住横拖浏览历史，滚轮对准光标缩放，双击复位 |
| 触摸 | 点按查看行情，单指横拖，双指缩放 |
| 键盘 | 聚焦图表后，方向键平移，`+` 和 `-` 缩放，`Home` 复位，`Escape` 清除选择 |

画布默认填满容器并按设备像素比调整。上例的独立移动页使用动态视口高度。嵌入业务页面时，可由外层布局分配图表高度。`resize(width, height)` 与 `setSize(width, height)` 均接受像素数、CSS 尺寸或 `null`。传入 `null` 恢复相应方向的容器尺寸。`resetView()` 返回最新区间及默认缩放。`draw()` 重绘，`clear()` 清除画布，`destroy()` 释放监听、尺寸观察和图表 DOM。

## 代码来源

移植以 K Line Mobile 最终版为基线，参考 `depths-chart` 的桌面绘制和交互。项目沿用了 [chxj1992/kline](https://github.com/chxj1992/kline/tree/master/src/js) 的部分指标表达式及绘图语义。上游署名、许可证和已知来源链见 [第三方声明](THIRD-PARTY-NOTICES.md)。
