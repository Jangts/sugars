/* 汇总 K 线各类画笔，具体绘制逻辑位于对应画笔模块。 */

import * as grids from './grids.js'
import * as charts from './charts.js'
import * as overlays from './overlays.js'

export const brushes = {
    ...grids,
    ...charts,
    ...overlays
}
