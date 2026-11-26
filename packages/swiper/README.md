# Swiper

`@sugars/swiper` 是 TangramJS `Slider` 的独立移植。各预设负责布置及切换 slide，实例共享播放、自动前进、触摸、导航和当前索引。

```html
<div id="slides">
    <div class="stage" style="width: 100%; height: 8rem">
        <div class="troupe">
            <div class="actor">第一张</div>
            <div class="actor">第二张</div>
            <div class="actor">第三张</div>
        </div>
    </div>
    <div class="panel">
        <button type="button" class="cutter goto-prev">上一张</button>
        <button type="button" class="cutter goto-next">下一张</button>
    </div>
</div>
```

```ts
import { Swiper } from '@sugars/swiper'

const swiper = new Swiper('slides', 'seamless', { autoplay: false })
swiper.playNx()
// 不再使用时调用 swiper.destroy()
```

包使用浏览器原生 DOM 和 CSS 过渡。调用方提供 `.stage`、`.troupe`、`.actor` 和视觉样式。`.slider-anchor` 可以用 DOM 顺序或 `data-actor-index` 指向逻辑索引。`renderPanel: true` 会按顺序写入索引。

预设有 `slide`、`slide-vert`、`seamless`、`seamless-vert`、`colx3`、`colx3-vert` 和 `fade`。无缝及三列预设默认复制边界 slide。原 DOM 已提供边界副本时可传 `preparedActors: true`。三列预设在当前区域两侧保留相邻 slide。

`curr` 是零基逻辑索引。用 `play(index)`、`playNx()`、`playPr()` 切换。默认循环、自动播放和悬停暂停，默认播放间隔为 5000 毫秒，过渡用 `duration` 控制。`stop()` 清除自动播放计时器，`pause(true)` 禁用自动播放，`pause(false)` 启用它。可传 `pauseOnAction`、`kbCtrlAble` 或 `touch` 控制手动交互。可选回调 `start`、`before`、`after` 接受索引，并以 Swiper 实例为 `this`。

自定义预设可通过 `Swiper.extend('slide', { name, layout, cut })` 注册，也可直接传入构造器。`Slider` 与 `Swiper` 是同一个构造器。
