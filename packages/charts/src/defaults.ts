import { baseDefaults } from './util/defaults.js'
import { gridDefaults } from './modules/grid.js'
import { radarDefaults } from './modules/radar.js'
import { polarDefaults } from './modules/polar.js'
import { tooltipDefaults } from './modules/tooltip.js'

export const defaults = { ...baseDefaults, ...gridDefaults, ...radarDefaults, ...polarDefaults, ...tooltipDefaults }
