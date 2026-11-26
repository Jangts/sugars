# Charts

`@sugars/charts` 用 Canvas 2D 绘制柱状图、折线图、散点图、饼图和雷达图。需要浏览器 DOM 和有宽高的容器。先在 Sugars 工作区根目录运行 `npm ci` 和 `npm run build`，再从工作区通过包名导入。

```html
<div id="chart" style="width: 640px; max-width: 100%; height: 320px"></div>
```

```ts
import { Charts } from '@sugars/charts'

const chart = new Charts(document.querySelector<HTMLElement>('#chart')!, null, {
    animation: false,
    xAxis: { data: ['Jan', 'Feb', 'Mar'] },
    series: [{ type: 'bar', name: 'Orders', data: [4, 8, 3] }],
})

// When removing the chart, call chart.destroy().
```

每一项 `series` 通过 `type` 选择绘制方式。使用 `setOption({ series })` 更新数据或改换系列。省略字段时保留现有选项，传入 `series: []` 清空系列。`tooltip.type` 可选择按项或按轴聚合。调用 `destroy()` 释放动画、事件监听、尺寸观察和轴所属的画布层。
