import { MAChart, SMAChart, EMAChart, BOLLChart } from './price.js'
import { MACDChart, KDJChart, RSIChart, WRChart } from './indicators.js'
import { VolumeChart } from './VolumeChart.js'

export const charts = {
    MA: MAChart,
    SMA: SMAChart,
    EMA: EMAChart,
    BOLL: BOLLChart,
    Volume: VolumeChart,
    MACD: MACDChart,
    KDJ: KDJChart,
    KDI: KDJChart,
    RSI: RSIChart,
    WR: WRChart,
}
export type ChartName = keyof typeof charts
