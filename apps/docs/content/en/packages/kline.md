# @sugars/kline

A TypeScript ESM port of K Line Mobile. It renders candlestick charts using Canvas 2D independently of `@sugars/charts`. Give the container a usable width and height.

<!-- example:1 -->

<!-- example:2 -->

## Market data and layout

- Input may be a tuple `[time, open, high, low, close, volume, turnover?]`, a `Data` instance, or a legacy object `{ unixts, openpx, highpx, lowpx, newpx, vol, money? }`. Tuples and `Data` use milliseconds. Legacy `unixts` uses seconds. Time scale labels use UTC. The caller supplies market data.
- `setData(data)` replaces history and shows the latest range. `appendData(bar)` inserts or updates a candle by time. Initial and replacement data are sorted, keeping the last entry for duplicate timestamps. An empty array clears the chart. Invalid data throws `TypeError`.
- The default layout is `['MA', 'Volume', 'MACD']`. Set one to three panels with `setLayout()`. Price indicators include `MA`, `SMA`, `EMA`, and `BOLL`. Secondary panels include `Volume`, `MACD`, `KDJ`, `RSI`, and `WR`. `KDI` is a legacy alias for `KDJ`.
- Pass `classicDark`, `classicLight`, `reverseDark`, `reverseLight`, or color and font overrides to `setTheme()`. The default is classic dark. `drawPseudoUpDown: true` restores hollow rising candles in the dark theme.

## Desktop and touch

| Input | Actions |
| --- | --- |
| Mouse | Hover for crosshair and OHLC, drag horizontally for history, zoom around the pointer with the wheel, double-click to reset |
| Touch | Tap for details, drag with one finger, zoom with two |
| Keyboard | Focus the chart, then use arrows to pan, `+` or `-` to zoom, `Home` to reset, or `Escape` to clear selection |

The canvas fills the container and scales for device pixel ratio. The standalone mobile example uses a dynamic viewport height. An embedding layout can supply its own height. `resize(width, height)` and `setSize(width, height)` take pixels, CSS dimensions, or `null` to restore container sizing. `resetView()` restores the latest range and default zoom. Use `draw()` to redraw, `clear()` to empty the canvas, and `destroy()` to release observers, listeners, and DOM.

## Origins

The port follows the final K Line Mobile implementation and uses `depths-chart` as a reference for desktop drawing and interaction. Some indicator expressions and drawing behavior come from [chxj1992/kline](https://github.com/chxj1992/kline/tree/master/src/js). The attribution notice lists upstream credits and licenses.
