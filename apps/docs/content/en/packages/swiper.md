# Swiper

`@sugars/swiper` ports the TangramJS slider. A preset supplies layout and transitions. All presets share playback, input, navigation, and the logical index.

<!-- example:1 -->

<!-- example:2 -->

Use a browser with native DOM and CSS transitions. Supply `.stage`, `.troupe`, and `.actor` elements and their styles. A `.slider-anchor` points to a logical slide by its order or `data-actor-index`. With `renderPanel: true`, Swiper assigns indices to existing anchors.

Presets are `slide`, `slide-vert`, `seamless`, `seamless-vert`, `colx3`, `colx3-vert`, and `fade`. Seamless and three-column layouts use boundary copies. Set `preparedActors: true` when your markup already includes them. The three-column layouts show adjacent slides on both sides.

`curr` is zero-based. Change slides with `play(index)`, `playNx()`, or `playPr()`. Looping, autoplay, and hover pause are enabled by default. The autoplay interval defaults to 5000 ms. Configure transition time with `duration`. `stop()` clears the timer. `pause(true)` disables autoplay and `pause(false)` enables it. Configure manual input with `pauseOnAction`, `kbCtrlAble`, and `touch`. The optional `start`, `before`, and `after` callbacks receive an index and use Swiper as `this`.

Register a custom preset with `Swiper.extend('slide', { name, layout, cut })` or pass it to the constructor. `Slider` is an alias for `Swiper`.
