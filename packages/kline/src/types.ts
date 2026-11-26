/* 定义行情输入、布局配置、指标选择、主题和图表实例的共享公共类型。 */

import type { KLineBar } from './DataProvider.js'

import type { ChartName } from './charts/index.js'

export interface Size {
    width: number
    height: number
}

export interface KLineOptions {
    /** 宿主元素或现有元素 ID。实例会创建自己的交互表面。 */
    element: HTMLElement | string
    /** 表面宽度，数值为 CSS 像素，其他值采用 CSS 长度，null 使用 100%。 */
    width?: string | number | null
    /** 表面高度，数值为 CSS 像素，其他值采用 CSS 长度，null 使用 100%。 */
    height?: string | number | null
    /** 是否按设备像素比扩展画布像素尺寸，逻辑坐标仍使用 CSS 像素。默认开启。 */
    useRetinaScale?: boolean
    /** 暗色主题是否用旧规则给符合尺寸条件的上涨蜡烛画空心柱体。 */
    drawPseudoUpDown?: boolean
    /** 按从上到下的顺序指定主图、副图和指标，缺省为 MA、Volume、MACD。 */
    layoutConf?: readonly ChartName[]
    /** 初始化的历史行情。null 与省略都表示空行情。 */
    data?: readonly KLineBar[] | null
    /** 覆盖默认主题的局部颜色与字体样式。 */
    theme?: Partial<ThemeInterface>
}

export interface ThemeInterface {
    // 积极的，涨
    Positive: string

    // 消极的，跌
    Negative: string

    // 背景
    Background: string

    // 指标颜色，允许6种
    Indicator0: string
    Indicator1: string
    Indicator2: string
    Indicator3: string
    Indicator4: string
    Indicator5: string

    // 网格线颜色，4种
    GridX: string                   // 网格竖直线颜色
    GridY: string                   // 网格水平线颜色
    GridC: string                   // 时价水平线颜色
    GridS: string                   // 水平分隔线颜色

    // 与网格线对应的文字颜色，3种
    GridTextX: string               // 网格横轴刻度文本颜色
    GridTextY: string               // 网格纵轴刻度文本颜色
    GridTextC: string               // 时价文本颜色

    // 选中颜色组
    SelectedTX: string              // 横轴文本颜色
    SelectedSX: string              // 横轴文本框边框色
    SelectedBGX: string             // 横轴文本框背景色
    SelectedTY: string              // 纵轴文本颜色
    SelectedSY: string              // 纵轴文本框边框色
    SelectedBGY: string             // 纵轴文本框背景色
    SelectedTI: string              // 信息框文本颜色
    SelectedSI: string              // 信息框框边颜色
    SelectedBGI: string             // 信息框背景色
    SelectedTP: string              // 信息框积极文本颜色
    SelectedTN: string              // 信息框消极文本颜色
    SelectedL: string               // 选中横线颜色
    SelectedB: string               // 选中Bar颜色
    SelectedP: string               // 选中点颜色

    // 字体设置，8种
    FontX: string                   // 横轴文本样式
    FontY: string                   // 纵轴文本样式
    FontI: string                   // 指标文本样式
    FontP: string                   // 时价文本样式
    FontR: string                   // 峰谷值文本样式
    FontS: string                   // 选中值文本样式
    FontT: string                   // 选中时间文本样式
    FontB: string                   // 信息板文本样式
}
