# @sugars/animation

Organize animation into scenes with separate durations, draw functions, and completion callbacks. Use the same player with the DOM, Canvas, or other numeric output.

<!-- example:1 -->

- `play()` starts at the current frame and `stop()` preserves it. Calling `play()` after natural completion starts from the beginning.
- `gotoAndPlay(scene, frame = 0)` and `gotoAndStop(scene, frame = 0)` use zero-based scene and frame indices. Frames clamp to the current scene. `next()` and `prev()` stop at an adjacent frame in that scene.
- `position` exposes `scene`, `frame`, `lastFrame`, `iteration`, `elapsed`, and `progress`. `playing` reports whether the player is running. Iterations start at zero.
- Scene duration and frame elapsed time are in milliseconds. The last frame is `ceil(duration * fps / 1000)`. Progress at frame zero is 0 and at the final frame is 1. The defaults are 36 FPS and one iteration. Use `Infinity` to repeat indefinitely.
- By default the browser schedules frames with `requestAnimationFrame`. A delayed frame may skip intermediate positions, but natural scene completion draws the last frame. The scene callback runs before the next scene and the player callback after all iterations. Seeking and frame stepping call `render`.

Render each scene from the supplied frame so seeking works at any position. For other hosts, provide a `clock` whose `now()` and asynchronous `request()` callbacks use the same millisecond time base.
