# @sugars/scroll-view

Attach your own tracks and thumbs to a native scrolling container. The viewport owns the scroll position. You choose the DOM, dimensions, and styles. Bind the horizontal axis, vertical axis, or both.

<!-- example:1 -->

<!-- example:2 -->

<!-- example:3 -->

For `horizontal`, apply the thumb length to width and the offset to `translateX`. Track and thumb can be siblings if their origins line up. Changes update `--scrollview-thumb-size`, `--scrollview-thumb-offset`, and the track’s `data-scrollview-overflow`. The optional minimum thumb size is measured in CSS pixels.

- Thumb drag and track clicks update the native scroll position. Wheel, touch, and keyboard scrolling use the viewport. Set its focus and accessible name in the host app.
- `toTop()`, `toBottom()`, `toLeft()`, and `toRight()` move to physical edges. They accept optional behavior such as `'smooth'`. Left and right denote physical edges in RTL too.
- The viewport, tracks, and optional `content` are observed for size changes. Call `refresh()` for other layout changes. Call `destroy()` before removing elements to restore attributes and styles changed by the binding.
- `getScrollMetrics()` and `scrollOffsetFromThumb()` can be used without a DOM binding. Supply nonnegative dimensions and offsets measured from the track origin.
