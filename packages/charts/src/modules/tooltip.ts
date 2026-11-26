/*! Ported from TangramJS painter/Charts/modules/tooltip.js. */

/* 汇总系列命中结果，把数据项或整条轴上的数据交给提示图层显示。 */

import type { ChartElement } from '../components/Abstract.js'
import type { Charts } from '../index.js'
import { Tooltip } from '../components/Tooltip.js'
import { MultiTooltip } from '../components/MultiTooltip.js'
import { eachEntry } from '../series-data.js'
import { maxNumber } from '../series-data.js'
import { minNumber } from '../series-data.js'
import { isNumeric } from '../util/helpers.js'
import * as helpers from '../util/helpers.js'

export const tooltipDefaults = {
        tooltip: {
            show: true,
            type: 'item',
            zIndex: 0,
            triggerOn: ["mousemove", "touchstart", "touchmove"],
            triggerOff: ["mouseout"],
            onTrigger: null,

            backgroundColor: 'rgba(0,0,0,0.8)',
            borderColor: '#333',
            borderWidth: 0,
            padding: 5,
            formatter: '<%if (label){%><%=label%> : <%}%><%= value %>',
            axisFormatter: '<%= itemLabel %> : <%= value %>',
            caretSize: 8,
            cornerRadius: 6,
            xOffset: 10,
            textStyle: {
                color: '#fff',
                fontStyle: 'normal',
                fontWeight: 'normal',
                fontFamily: '\'Microsoft YaHei\', \'Hiragino Sans\', \'Helvetica Neue\', \'Helvetica\', \'Arial\', sans-serif',
                fontSize: 14,
            },
            titleFormatter: '<%= titleLabel%>',
            titleStyle: {
                color: '#fff',
                fontStyle: 'normal',
                fontWeight: 'blod',
                fontFamily: '\'Microsoft YaHei\', \'Hiragino Sans\', \'Helvetica Neue\', \'Helvetica\', \'Arial\', sans-serif',
                fontSize: 14,
            },
            strictHover: false,
            legendBackgroundColor: '#fff'
        }
    }

export function showTooltip(this: Charts, segments: any[], forceRedraw = false, showMulti = false) {
        if (Tooltip) {
            if (typeof this.activeElements === 'undefined') {
                this.activeElements = [];
            }

            var isChanged = (function(this: Charts, Elements: ChartElement[]) {
                var changed = false;

                if (Elements.length !== this.activeElements.length) {
                    changed = true;
                    return changed;
                }

                eachEntry(Elements, function(index, element) {
                    if (element !== this.activeElements[index]) {
                        changed = true;
                    }
                }, this);
                return changed;
            }).call(this, segments);

            if (!isChanged && !forceRedraw) {
                return;
            } else {
                this.activeElements = segments;
            }

            var tooltip = this.options.tooltip;

            var options = {
                showTooltips: (tooltip.show == true),
                zIndex: tooltip.zIndex,
                customTooltips: tooltip.onTrigger,

                tooltipFillColor: tooltip.backgroundColor,

                tooltipFontFamily: tooltip.textStyle.fontFamily,
                tooltipFontSize: tooltip.textStyle.fontSize,
                tooltipFontStyle: tooltip.textStyle.fontStyle,
                tooltipFontWeight: tooltip.textStyle.fontWeight,
                tooltipFontColor: tooltip.textStyle.color,

                tooltipTitleFontFamily: tooltip.titleStyle.fontFamily,
                tooltipTitleFontSize: tooltip.titleStyle.fontSize,
                tooltipTitleFontStyle: tooltip.titleStyle.fontStyle,
                tooltipTitleFontWeight: tooltip.titleStyle.fontWeight,
                tooltipTitleFontColor: tooltip.titleStyle.color,

                tooltipTemplate: tooltip.formatter,
                multiTooltipTemplate: tooltip.axisFormatter,
                tooltipTitleTemplate: tooltip.titleFormatter,

                tooltipXPadding: Array.isArray(tooltip.padding) ? tooltip.padding[0] : (isNumeric(tooltip.padding) ? Number(tooltip.padding) : 5),
                tooltipYPadding: Array.isArray(tooltip.padding) ? tooltip.padding[1] : (isNumeric(tooltip.padding) ? Number(tooltip.padding) : 5),

                tooltipCaretSize: tooltip.caretSize,
                tooltipCornerRadius: tooltip.cornerRadius,
                tooltipXOffset: tooltip.xOffset,

                multiTooltipKeyBackground: tooltip.legendBackgroundColor,
            }

            this.draw();
            // 共有多个系列时，将同一位置的命中项交给 MultiTooltip。
            if (segments.length > 0) {
                if (showMulti) {
                    var tooltipLabels: string[] = [],
                        tooltipColors: { fill: string; stroke: string }[] = [],
                        medianPosition = (function() {

                            var Elements = [],
                                dataCollection,
                                xPositions: number[] = [],
                                yPositions: number[] = [],
                                xMax,
                                yMax,
                                xMin,
                                yMin;

                            eachEntry(segments, function(index, element) {
                                xPositions.push(element.x);
                                yPositions.push(element.y);

                                // 记录对应绘图元素的颜色，用于绘制图例。
                                tooltipLabels.push(helpers.template(options.multiTooltipTemplate, element));
                                tooltipColors.push({
                                    fill: element._saved.fillColor || element.fillColor,
                                    stroke: element._saved.strokeColor || element.strokeColor
                                });

                            });

                            yMin = minNumber(yPositions);
                            yMax = maxNumber(yPositions);

                            xMin = minNumber(xPositions);
                            xMax = maxNumber(xPositions);

                            return {
                                x: (xMin + xMax) / 2, //(xMin > this.width / 2) ? xMin : xMax,
                                y: (yMin + yMax) / 2
                            };

                        }).call(this);
                    new MultiTooltip({
                        x: medianPosition.x,
                        y: medianPosition.y,
                        xPadding: options.tooltipXPadding,
                        yPadding: options.tooltipYPadding,
                        xOffset: options.tooltipXOffset,
                        fillColor: options.tooltipFillColor,
                        textColor: options.tooltipFontColor,
                        fontFamily: options.tooltipFontFamily,
                        fontStyle: options.tooltipFontStyle,
                        fontSize: options.tooltipFontSize,
                        titleTextColor: options.tooltipTitleFontColor,
                        titleFontFamily: options.tooltipTitleFontFamily,
                        titleFontStyle: options.tooltipTitleFontStyle,
                        titleFontSize: options.tooltipTitleFontSize,
                        cornerRadius: options.tooltipCornerRadius,
                        labels: tooltipLabels,
                        legendColors: tooltipColors,
                        legendColorBackground: options.multiTooltipKeyBackground,
                        title: helpers.template(options.tooltipTitleTemplate, segments[0]),
                        chart: this,
                        ctx: this.getLayer(options.zIndex).getContext("2d"),
                        custom: options.customTooltips
                    }).draw();
                } else {
                    var Element = segments[0],
                        tooltipPosition = Element.tooltipPosition();

                    new Tooltip({
                        x: Math.round(tooltipPosition.x),
                        y: Math.round(tooltipPosition.y),
                        xPadding: options.tooltipXPadding,
                        yPadding: options.tooltipYPadding,
                        fillColor: options.tooltipFillColor,
                        textColor: options.tooltipFontColor,
                        fontFamily: options.tooltipFontFamily,
                        fontStyle: options.tooltipFontStyle,
                        fontSize: options.tooltipFontSize,
                        caretHeight: options.tooltipCaretSize,
                        cornerRadius: options.tooltipCornerRadius,
                        text: helpers.template(options.tooltipTemplate, Element),
                        chart: this,
                        ctx: this.getLayer(options.zIndex).getContext("2d"),
                        custom: options.customTooltips
                    }).draw();
                }
            }
        }
        return this;
    }
