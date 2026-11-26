/* 汇总图表实例的默认选项。比例尺、提示、颜色和调度参数在实例合并配置后交由各模块消费。 */

import { baseDefaults } from './util/defaults.js'
import { gridDefaults } from './modules/grid.js'
import { radarDefaults } from './modules/radar.js'
import { polarDefaults } from './modules/polar.js'
import { tooltipDefaults } from './modules/tooltip.js'

export const defaults = { ...baseDefaults, ...gridDefaults, ...radarDefaults, ...polarDefaults, ...tooltipDefaults }
