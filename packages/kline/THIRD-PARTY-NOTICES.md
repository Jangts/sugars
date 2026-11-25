# Third-party notices and historical sources

## chxj1992/kline

Copyright (C) 2017 chxj1992 <chxj1992@gmail.com>

- Project source: [chxj1992/kline/src/js](https://github.com/chxj1992/kline/tree/master/src/js).
- Historical comparison baseline: [73afcca](https://github.com/chxj1992/kline/tree/73afcca075e6d89dcaac9597175cba81a7e6410a/src/js), dated 2018-06-06.
- Upstream license: WTFPL version 2. The [original license file](licenses/chxj1992-kline-WTFPL.txt) is distributed with this package.
- This port retains and adapts parts of the indicator expression implementation inherited by K Line Mobile, including rolling windows and moving averages. Desktop chart behavior was also informed by the historical desktop implementation and its upstream.

The upstream README describes its JavaScript implementation as an adaptation of an earlier website's K-line chart. It does not identify the website or record a separate license for that earlier source. The bundled WTFPL reproduces the notice from the named GitHub project.

## Historical GrandAPP sources

| Source | Historical revision | Use in this package |
| --- | --- | --- |
| K Line Mobile | `6b9be810154a1a559f2ecde579077ec239a3bd30` | Primary TypeScript port, including layers, layout, painter classes, themes and expressions |
| depths-chart | `5d14a8ad4d00418cf3b96d06d2cac025e78428c3` | Desktop reference for candlesticks, scale and timeline selection, axis labels, and pointer behavior |

Both historical Git revisions record the author as `js <js@js.js>`. Those revisions contain no standalone project license. The repository paths and revision IDs serve as provenance for the local source copies.
