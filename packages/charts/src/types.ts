export type Dimension = number | `${number}%`
export type Coordinate = number | string
export type PointValue = readonly [number, number]
export type ChartValue = number | PointValue

export interface Paint {
    color?: string
    borderColor?: string
    borderWidth?: number
    barBorderColor?: string
    barBorderWidth?: number
    radius?: number
}

export interface Datum<T> {
    value: T
    name?: string
    itemStyle?: { normal?: Paint; emphasis?: Paint }
}

interface SeriesBase<T> {
    name?: string
    zIndex?: number
    itemStyle?: { normal?: Paint; emphasis?: Paint }
    data: readonly T[]
}

export interface BarSeries extends SeriesBase<ChartValue | Datum<ChartValue> | null> {
    type: 'bar'
    barWidth?: Dimension | 'auto'
    barMaxWidth?: Dimension | 'auto'
    barGap?: number
    barCategoryGap?: number
}

export interface LineSeries extends SeriesBase<number> {
    type: 'line'
    showPoint?: boolean
    showLine?: boolean
    smooth?: boolean
    smoothTension?: number
    showArea?: boolean
    areaStyle?: { color?: string }
    lineStyle?: Paint & { normal?: Paint }
    hitDetectionRadius?: number
}

export interface ScatterSeries extends SeriesBase<PointValue | null> {
    type: 'scatter'
    showPoint?: boolean
    symbolSize?: number | ((value: PointValue) => number)
    hitDetectionRadius?: number
}

export interface PieSeries extends SeriesBase<number | Datum<number> | null> {
    type: 'pie'
    center?: readonly [Dimension, Dimension]
    radius?: Dimension | readonly [Dimension, Dimension, Dimension?]
    roseType?: false | 'area' | 'angle' | 'radius'
    animateRotate?: boolean
    animateScale?: boolean
}

export interface RadarSeries extends SeriesBase<number> {
    type: 'radar'
    showPoint?: boolean
    showArea?: boolean
    areaStyle?: { color?: string }
    lineStyle?: Paint & { type?: 'solid' | 'dashed' | 'dotted' }
    hitDetectionRadius?: number
}

export type Series = BarSeries | LineSeries | ScatterSeries | PieSeries | RadarSeries

interface AxisStyle {
    show?: boolean
    onZero?: boolean
    beginAtZero?: boolean
    lineStyle?: { color?: string; width?: number }
}

export interface AxisLabel {
    show?: boolean
    formatter?: string | ((item: { value: Coordinate }) => string)
    textStyle?: { fontFamily?: string; fontSize?: number; fontStyle?: string; fontColor?: string }
}

export interface AxisOptions {
    type?: 'label' | 'category' | 'value'
    data?: readonly Coordinate[] | null
    show?: boolean
    min?: number | null
    max?: number | null
    axisLabel?: AxisLabel
    axisLine?: AxisStyle
    splitLine?: AxisStyle
}

export interface GridOptions {
    left?: Dimension
    right?: Dimension
    top?: Dimension
    bottom?: Dimension
    width?: Dimension | 'auto'
    height?: Dimension | 'auto'
    show?: boolean
    zIndex?: number
    padding?: number
}

export interface PolarOptions {
    center?: readonly [Dimension, Dimension]
    radius?: Dimension
    show?: boolean
    zIndex?: number
    shape?: 'polygon' | 'circle'
}

export interface RadarOptions extends PolarOptions {
    splitNumber?: number
    indicator?: readonly { name: string; min?: number; max?: number }[]
    axisLine?: AxisStyle
    splitLine?: AxisStyle
    axisLabel?: AxisLabel
    splitArea?: { show?: boolean; areaStyle?: { color?: string | readonly string[] } }
}

export interface TooltipDatum {
    value: ChartValue
    label?: string
    itemLabel?: string
    titleLabel?: string
}

type TooltipFormatter = string | ((item: TooltipDatum) => string)

export interface ChartOptions {
    series?: readonly Series[]
    xAxis?: AxisOptions
    yAxis?: AxisOptions
    grid?: GridOptions
    radar?: RadarOptions
    polar?: PolarOptions
    angleAxis?: AxisOptions
    radiusAxis?: AxisOptions
    backgroundColor?: string
    barColorDefaults?: readonly string[]
    barColorDefaultsEmphasis?: readonly string[]
    lineColorDefaults?: readonly string[]
    areaColorDefaults?: readonly string[]
    pointColorDefaults?: readonly string[]
    pointColorDefaultsEmphasis?: readonly string[]
    animation?: boolean
    animationDuration?: number
    animationEasing?: 'linear' | 'easeOutQuart' | ((progress: number) => number)
    onAnimationProgress?: (progress: number) => void
    onAnimationComplete?: () => void
    responsive?: boolean
    maintainAspectRatio?: boolean
    tooltip?: {
        show?: boolean
        type?: 'axis' | 'item'
        zIndex?: number
        triggerOn?: readonly string[]
        triggerOff?: readonly string[]
        formatter?: TooltipFormatter
        axisFormatter?: TooltipFormatter
        titleFormatter?: TooltipFormatter
        [option: string]: unknown
    }
}
