# @sugars/scroll-view

把调用方已有的轨道和滑块绑定到原生滚动容器。视口持有真实滚动位置，调用方决定 DOM 层级、尺寸和样式。组件接受任意 HTML 标签，也可以只接一条轴。

```html
<div class="scroll-layout">
    <article id="viewport" tabindex="0" aria-label="文章">
        <div id="content">滚动内容</div>
    </article>
    <aside id="track" aria-hidden="true"><i id="thumb"></i></aside>
</div>
```

```css
.scroll-layout { display: grid; grid-template-columns: minmax(0, 1fr) 12px; }
#viewport { max-height: 240px; overflow: auto; scrollbar-width: none; }
#content { min-height: 480px; }
#track { position: relative; background: #e8e8e8; }
#track[data-scrollview-overflow="false"] { visibility: hidden; }
#thumb {
    position: absolute;
    inset: 0 0 auto;
    height: var(--scrollview-thumb-size);
    transform: translateY(var(--scrollview-thumb-offset));
    background: #666;
    touch-action: none;
}
```

```ts
import { ScrollView } from '@sugars/scroll-view'

const scrollView = new ScrollView(document.querySelector<HTMLElement>('#viewport')!, {
    content: document.querySelector('#content')!,
    vertical: {
        track: document.querySelector<HTMLElement>('#track')!,
        thumb: document.querySelector<HTMLElement>('#thumb')!,
        minThumbSize: 24,
    },
})

scrollView.toBottom()
```

`horizontal` 接入水平轨道，上面的滑块尺寸和位移对应 `width` 与 `translateX`。轨道和滑块也可以是兄弟元素，布局只需让滑块的位移起点与轨道起点对齐。每次同步会更新滑块上的 `--scrollview-thumb-size`、`--scrollview-thumb-offset` 以及轨道上的 `data-scrollview-overflow`。最小滑块长度以 CSS 像素计，默认按视口与内容的比例计算。

- 拖动滑块或点击轨道会更新原生滚动位置。滚轮、触摸和键盘应在视口上使用原生滚动。调用方可按需要设置视口焦点与可访问名称。
- `toTop()`、`toBottom()`、`toLeft()`、`toRight()` 跳到物理边界，可选传入滚动行为，例如 `'smooth'`。水平 RTL 也按屏幕的左、右边界解释。
- 尺寸同步观察视口、轨道和可选的 `content`。调用方可以通过 `refresh()` 处理尺寸观察未覆盖的布局变化。移除组件前调用 `destroy()`，它会解除监听并恢复控制器写入的属性和样式。
- `getScrollMetrics()` 与 `scrollOffsetFromThumb()` 可在其他渲染层复用，输入为非负尺寸和以轨道起点为零的偏移。

[源码来源和许可](THIRD-PARTY-NOTICES.md)
