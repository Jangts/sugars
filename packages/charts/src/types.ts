/* 定义图表入口接受的主题外选项、系列、数据点、比例尺和提示配置形状。 */

/** 数值为逻辑像素，百分比相对于对应绘图区或容器尺寸换算。 */
export type Dimension = number | `${number}%`
/** 坐标轴类别或刻度值，可为文本标签或数值。 */
export type Coordinate = number | string
/** 双数值轴下的横纵坐标。区间柱也使用同一元组表示下界与上界。 */
export type PointValue = readonly [number, number]
/** 标量或双值数据，具体含义由系列的坐标模式决定。 */
export type ChartValue = number | PointValue

export interface Paint {
    /** 常规或强调态的填充颜色，可用 CSS 颜色。 */
    color?: string
    /** 对应样式的描边颜色。 */
    borderColor?: string
    /** 描边宽度，使用逻辑像素。 */
    borderWidth?: number
    /** 柱体样式采用的专用描边色。 */
    barBorderColor?: string
    /** 柱体样式采用的专用边宽，使用逻辑像素。 */
    barBorderWidth?: number
    /** 点样式的半径，使用逻辑像素。 */
    radius?: number
}

export interface Datum<T> {
    /** 单个经过系列规则解释的数据值。 */
    value: T
    name?: string
    /** 分别提供默认态和命中强调态的绘图覆盖值。 */
    itemStyle?: { normal?: Paint; emphasis?: Paint }
}

interface SeriesBase<T> {
    name?: string
    /** 系列映射到的 Canvas 层号，默认 0。 */
    zIndex?: number
    itemStyle?: { normal?: Paint; emphasis?: Paint }
    /** 系列按索引消费的数据项，允许值由系列类型决定。 */
    data: readonly T[]
}

export interface BarSeries extends SeriesBase<ChartValue | Datum<ChartValue> | null> {
    type: 'bar'
    /** 历史柱宽配置。当前绘制端按可用空间与间距自动分配柱宽。 */
    barWidth?: Dimension | 'auto'
    /** 历史最大柱宽配置。当前绘制端未应用该限制。 */
    barMaxWidth?: Dimension | 'auto'
    /** 类别两侧预留的像素间距。 */
    barGap?: number
    /** 同一类别的多个柱系列之间预留的像素间距。 */
    barCategoryGap?: number
}

export interface LineSeries extends SeriesBase<number> {
    type: 'line'
    showPoint?: boolean
    showLine?: boolean
    /** 是否通过相邻数据点计算曲线控制点。 */
    smooth?: boolean
    /** 平滑曲线的张力，用于确定控制点距离。 */
    smoothTension?: number
    showArea?: boolean
    areaStyle?: { color?: string }
    lineStyle?: Paint & { normal?: Paint }
    /** 供指针命中检查使用的距离。 */
    hitDetectionRadius?: number
}

export interface ScatterSeries extends SeriesBase<PointValue | null> {
    type: 'scatter'
    showPoint?: boolean
    /** 点的直径或根据坐标对计算直径的回调，使用逻辑像素。 */
    symbolSize?: number | ((value: PointValue) => number)
    hitDetectionRadius?: number
}

export interface PieSeries extends SeriesBase<number | Datum<number> | null> {
    type: 'pie'
    /** 从容器左上角起算的水平和垂直圆心位置。 */
    center?: readonly [Dimension, Dimension]
    /** 单值为外半径，元组依次提供内半径、外半径及强调半径。 */
    radius?: Dimension | readonly [Dimension, Dimension, Dimension?]
    /** 扇区角度和半径对数据权重的映射方式，false 为普通饼图。 */
    roseType?: false | 'area' | 'angle' | 'radius'
    /** 初次从零圆心角过渡到目标角度。 */
    animateRotate?: boolean
    /** 初次从零半径过渡到目标半径。 */
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
    /** 按类别或数值分配刻度，label 保留旧的类别轴名称。 */
    type?: 'label' | 'category' | 'value'
    /** 显式提供类别标签或供轴装配的刻度数据。 */
    data?: readonly Coordinate[] | null
    show?: boolean
    /** 显式数值下界，缺省由数据和刻度策略计算。 */
    min?: number | null
    /** 显式数值上界，缺省由数据和刻度策略计算。 */
    max?: number | null
    /** 标签的显示、格式化和文字样式。 */
    axisLabel?: AxisLabel
    /** 坐标轴线显示、零点和描边参数。 */
    axisLine?: AxisStyle
    /** 区间分割线的显示和描边参数。 */
    splitLine?: AxisStyle
}

export interface GridOptions {
    /** 绘图区左边到容器左边的距离。 */
    left?: Dimension
    /** 绘图区右边到容器右边的距离。 */
    right?: Dimension
    /** 绘图区上边到容器上边的距离。 */
    top?: Dimension
    /** 绘图区下边到容器下边的距离。 */
    bottom?: Dimension
    /** 显式绘图区宽度，自动模式使用边距后的剩余空间。 */
    width?: Dimension | 'auto'
    /** 显式绘图区高度，自动模式使用边距后的剩余空间。 */
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
    /** 极坐标网格的轮廓形状。 */
    shape?: 'polygon' | 'circle'
}

export interface RadarOptions extends PolarOptions {
    /** 雷达径向的网格分段数。 */
    splitNumber?: number
    /** 各指标轴的标签与可选上下界，顺序对应数据点。 */
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
    /** 整个系列列表。setOption() 中省略则保留，空数组用于清空。 */
    series?: readonly Series[]
    /** 直角坐标横轴的类型、标签和值域。 */
    xAxis?: AxisOptions
    /** 直角坐标纵轴的类型、标签和值域。 */
    yAxis?: AxisOptions
    /** 直角坐标系的绘图区和网格设置。 */
    grid?: GridOptions
    /** 雷达图的轴及网格设置。 */
    radar?: RadarOptions
    /** 独立极坐标图层的几何参数。 */
    polar?: PolarOptions
    /** 围绕圆心的角度轴。 */
    angleAxis?: AxisOptions
    /** 从圆心向外的径向轴。 */
    radiusAxis?: AxisOptions
    /** 图表容器的背景 CSS 颜色。 */
    backgroundColor?: string
    barColorDefaults?: readonly string[]
    barColorDefaultsEmphasis?: readonly string[]
    lineColorDefaults?: readonly string[]
    areaColorDefaults?: readonly string[]
    pointColorDefaults?: readonly string[]
    pointColorDefaultsEmphasis?: readonly string[]
    /** 是否按帧过渡到最终绘制结果。 */
    animation?: boolean
    /** 一次动画的时长，单位为毫秒。 */
    animationDuration?: number
    /** 把经过时间的比例换算为绘制进度。 */
    animationEasing?: 'linear' | 'easeOutQuart' | ((progress: number) => number)
    /** 每个实际绘制的动画帧接收时间进度。 */
    onAnimationProgress?: (progress: number) => void
    /** 此轮绘制完成后调用，包括因减弱动态效果而直接绘制的路径。 */
    onAnimationComplete?: () => void
    /** 是否根据图表容器尺寸变化重新排布。 */
    responsive?: boolean
    /** 响应式变更时是否沿用建立图表时的宽高比例。 */
    maintainAspectRatio?: boolean
    /** 控制指针提示内容、触发事件和所在层。 */
    tooltip?: {
        show?: boolean
        /** axis 汇集同一坐标位置的系列，item 只展示命中的数据项。 */
        type?: 'axis' | 'item'
        /** 提示内容的 Canvas 层号。 */
        zIndex?: number
        /** 触发命中检查的事件名。 */
        triggerOn?: readonly string[]
        /** 用于停止显示提示的事件名。 */
        triggerOff?: readonly string[]
        /** 单项提示的替换模板或格式化函数。 */
        formatter?: TooltipFormatter
        /** 按轴汇总时用于项文本的模板或函数。 */
        axisFormatter?: TooltipFormatter
        /** 按轴汇总时用于标题的模板或函数。 */
        titleFormatter?: TooltipFormatter
        [option: string]: unknown
    }
}
