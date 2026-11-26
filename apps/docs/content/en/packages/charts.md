# Charts

`@sugars/charts` uses Canvas 2D to draw bar, line, scatter, pie, and radar charts. Use a browser with DOM and Canvas support. Give the host element a width and height before creating the chart.

<!-- example:1 -->

<!-- example:2 -->

Each `series` item selects its renderer with `type`. Update or replace series with `setOption({ series })`. Omitted fields retain their previous values. Pass `series: []` to clear the charts. Set `tooltip.type` to choose item or axis aggregation. Call `destroy()` to release animation, event listeners, size observation, and the canvas layers.
