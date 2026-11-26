# @sugars/animation

用场景和帧组织动画。每个场景有自己的时长、绘制函数和完成回调。可用同一个播放器驱动 DOM、Canvas 或其他数值输出。

```ts
import { Animation } from '@sugars/animation'

const box = document.querySelector<HTMLElement>('#box')!
const animation = new Animation([
    {
        duration: 600,
        render({ progress }) {
            box.style.transform = `translateX(${120 * progress}px)`
            box.style.opacity = '1'
        },
    },
    {
        duration: 400,
        render({ progress }) {
            box.style.transform = 'translateX(120px)'
            box.style.opacity = String(1 - progress)
        },
    },
], { fps: 30, iterations: 2 })

animation.gotoAndStop(1, 6)
animation.play()
```

- `play()` 从当前帧开始，`stop()` 保留当前帧。整段自然结束后再次调用 `play()` 会重新开始。
- `gotoAndPlay(scene, frame = 0)` 和 `gotoAndStop(scene, frame = 0)` 用从零开始的场景和帧定位。帧会限制在当前场景范围内。`next()` 和 `prev()` 停在当前场景的相邻帧。
- `position` 提供当前 `scene`、`frame`、`lastFrame`、`iteration`、`elapsed` 和 `progress`，`playing` 表示是否在播放。`iteration` 从零开始。
- 场景 `duration` 和帧的 `elapsed` 以毫秒计。每个场景的 `lastFrame` 为 `ceil(duration * fps / 1000)`，帧 0 和末帧分别对应进度 0 和 1。默认 36 FPS，`iterations` 默认 1，也可设为 `Infinity`。
- 播放默认使用浏览器的 `requestAnimationFrame`，会按已过时间跳过来不及显示的中间帧，每个自然播放完的场景都会绘制末帧。场景的 `onComplete` 在进入下一场景前调用，播放器的 `onComplete` 在全部轮次自然结束时调用。定位和逐帧控制只调用 `render`。

每个 `render` 应能独立根据当前帧画出该场景的状态，便于从任意位置直接跳转。在其他运行环境播放时，可提供 `clock`，它的 `now()` 和异步 `request()` 回调须使用同一毫秒时间基准。

[源码来源和许可](THIRD-PARTY-NOTICES.md)
