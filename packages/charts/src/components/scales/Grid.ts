/*! Ported from TangramJS painter/Charts/components/scales/Grid.js. */

/* 计算直角坐标系的绘图区、刻度、标签和零点基线，同时支持横纵轴交换及双数值轴。 */

import { ChartElement } from '../Abstract.js'
import { fontString } from '../../util/canvas.js'
import { eachEntry } from '../../series-data.js'
import { joinLists } from '../../series-data.js'
import { minNumber } from '../../series-data.js'
import { maxNumber } from '../../series-data.js'
import * as helpers from '../../util/helpers.js'
import { getDecimalPlaces } from '../../util/helpers.js'
import { longestText } from '../../util/canvas.js'

export class Grid extends ChartElement {
    protected initializeElement(configuration: object): void {
            Object.assign(this, configuration);
            switch (this.status) {
                case 0:
                    //横轴为项，纵轴为值
                    this.xOffsetSplitLines = this.hasBar;
                    this.yOffsetSplitLines = false;
                    break;
                case 1:
                    //横轴为值，纵轴为项
                    this.xOffsetSplitLines = false;
                    this.yOffsetSplitLines = this.hasBar || this.hasScatter;
                    break;
                case 5:
                    // 横纵皆为项
                    this.xOffsetSplitLines = false;
                    this.yOffsetSplitLines = true;
                    break;
                default:
                    //横纵皆为值
                    this.xOffsetSplitLines = false;
                    this.yOffsetSplitLines = false;
            }
            this.font = fontString(this.xLabelFontSize, this.xLabelFontStyle, this.xLabelFontFamily);
            //this.save();
            this.fit();
        }
    update(newProps: object) {
            Object.assign(this, newProps);
            //this.save();
            return this.fit();
        }
    fit() {
            this.charts = {};
            this.getValues();

            this.yScalePaddingTop = this.padding + 3;

            if (this.display && this.xLabelsShow) {
                this.yScalePaddingBottom = this.xLabelFontSize * 1.5 + 5 + this.padding;
            } else {
                this.yScalePaddingBottom = this.padding;
            }

            this.topPoint = this.top + this.yScalePaddingTop;
            this.bottomPoint = (this.display) ? this.height - this.yScalePaddingBottom + this.top : this.height + this.top;

            this.drawingAreaY = Math.max(0, this.height - this.yScalePaddingBottom - this.yScalePaddingTop);
            var currentHeight = this.drawingAreaY;
            this.calculateYRange(currentHeight);
            this.buildYLabels();

            this.xScalePaddingRight = this.padding;

            if (this.display && this.yLabelsShow) {
                this.xScalePaddingLeft = this.yLabelWidth + this.padding;
            } else {
                this.xScalePaddingLeft = this.padding;
            }

            this.drawingAreaX = Math.max(0, this.width - this.xScalePaddingLeft - this.xScalePaddingRight);
            this.drawingAreaY = Math.max(0, this.height - this.yScalePaddingBottom - this.yScalePaddingTop);

            this.leftPoint = Math.round(this.xScalePaddingLeft) + this.left;
            this.rightPoint = this.width + this.left;

            var currentWidth = this.drawingAreaX;
            this.calculateXRange(currentWidth);
            this.buildXLabels();

            if (this.status === 1) {
                this.fit1();
            } else if (this.status !== 5) {
                this.fit0();
            }
            return this;
        }
    getValues() {
            this.xValues = [];
            this.yValues = [];
            eachEntry(this.instance.series.line, function(i, chart) {
                var data: number[] = [];
                eachEntry(chart.data, function(j, v) {
                    (typeof v === 'number') && data.push(v);
                });
                switch (this.status) {
                    case 0:
                        this.yValues = joinLists(this.yValues, data);
                        break;
                    case 1:
                        this.xValues = joinLists(this.xValues, data)
                        break;
                }
            }, this);
            eachEntry(this.instance.series.bar, function(i, chart) {
                var data: number[] = [];
                eachEntry(chart.data, function(j, v) {
                    v = v && typeof v === 'object' && 'value' in v ? v.value : v;
                    if (typeof v === 'number') {
                        data.push(v);
                    } else if (Array.isArray(v)) {
                        (typeof v[0] === 'number') && data.push(v[0]);
                        (typeof v[1] === 'number') && data.push(v[1]);
                    }
                });
                switch (this.status) {
                    case 0:
                        this.yValues = joinLists(this.yValues, data);
                        break;
                    case 1:
                        this.xValues = joinLists(this.xValues, data)
                        break;
                }
            }, this);
            eachEntry(this.instance.series.scatter, function(i, chart) {
                var xData: number[] = [],
                    yData: number[] = [];;
                eachEntry(chart.data, function(j, v) {
                    if (Array.isArray(v)) {
                        (typeof v[0] === 'number') && xData.push(v[0]);
                        (typeof v[1] === 'number') && yData.push(v[1]);
                    }
                });
                switch (this.status) {
                    case 0:
                        this.yValues = joinLists(this.yValues, yData);
                        break;
                    case 1:
                        this.xValues = joinLists(this.xValues, xData);
                        break;
                    case 4:
                        this.xValues = joinLists(this.xValues, xData);
                        this.yValues = joinLists(this.yValues, yData);
                        break;
                }
            }, this);

            if (this.xValues.length < 1) {
                this.xValues = [1];
            }
            if (this.yValues.length < 1) {
                this.yValues = [1];
            }
        }
    calculateYRange(currentHeight: number) {
        let valuesArray: number[];
            if (this.status === 1 || this.status === 5) {
                this.ySteps = this.yLabels.length;
                this.yStepValue = 1;
            } else {
                if ((typeof(this.yAxisMax) === 'number') && (typeof(this.yAxisMin) === 'number')) {
                    valuesArray = [this.yAxisMax, this.yAxisMin];
                } else if (typeof(this.yAxisMax) === 'number') {
                    var min = minNumber(this.yValues);
                        valuesArray = [this.yAxisMax, min < this.yAxisMax ? min : this.yAxisMax - 1];
                } else if (typeof(this.yAxisMin) === 'number') {
                    var max = maxNumber(this.yValues);
                        valuesArray = [this.yAxisMin, max > this.yAxisMin ? max : this.yAxisMin + 1];
                } else {
                    valuesArray = this.yValues;
                }
                var updatedRanges = helpers.calculateScaleRange(
                    valuesArray,
                    currentHeight,
                    this.xLabelFontSize,
                    this.yBeginAtZero,
                    this.yIntegersOnly);
                Object.assign(this, updatedRanges);
            }
        }
    buildYLabels() {
            if (this.status === 0 || this.status === 4) {
                // 纵轴为值
                this.yLabels = [];
                var stepDecimalPlaces = getDecimalPlaces(this.yStepValue);
                for (var i = 0; i <= this.ySteps; i++) {
                    this.yLabels.push(helpers.template(this.yTemplateString, {
                        value: (this.minY + (i * this.yStepValue)).toFixed(stepDecimalPlaces)
                    }));
                }
            }
            this.yLabelWidth = (this.display && this.yLabelsShow) ? longestText(this.ctx, this.font, this.yLabels) + 10 : 0;

            var yLabelHeight = (this.display && this.yLabelsShow) ? this.yLabelFontSize * 1.5 : 0,
                yLabelSteps = this.ySteps,
                drawingAreaY = this.drawingAreaY;
            while (yLabelSteps > 1 && yLabelSteps * yLabelHeight > drawingAreaY) {
                yLabelSteps = Math.ceil(yLabelSteps / 2);
            }
            this.yLabelStep = Math.ceil(this.ySteps / yLabelSteps);
            return this;
        }
    calculateXRange(currentWidth: number) {
        let valuesArray: number[];
            if (this.status === 0 || this.status === 5) {
                // 横轴为项，或横纵皆为项
                this.xSteps = this.xLabels.length;
                this.xStepValue = 1;
            } else {
                if ((typeof(this.xAxisMax) === 'number') && (typeof(this.xAxisMin) === 'number')) {
                    valuesArray = [this.xAxisMax, this.xAxisMin];
                } else if (typeof(this.xAxisMax) === 'number') {
                    valuesArray = [this.xAxisMax, minNumber(this.xValues)];
                } else if (typeof(this.xAxisMin) === 'number') {
                    valuesArray = [this.xAxisMin, maxNumber(this.xValues)];
                } else {
                    valuesArray = this.xValues;
                }
                var updatedRanges = helpers.calculateScaleRange(
                    valuesArray,
                    currentWidth,
                    this.yLabelFontSize,
                    this.xBeginAtZero,
                    this.xIntegersOnly,
                    true);
                Object.assign(this, updatedRanges);

            }
        }
    buildXLabels() {
            if (this.status === 1 || this.status === 4) {
                // 横轴为值
                this.xLabels = [];
                var stepDecimalPlaces = getDecimalPlaces(this.xStepValue);
                for (var i = 0; i <= this.xSteps; i++) {
                    this.xLabels.push(helpers.template(this.xTemplateString, {
                        value: (this.minX + (i * this.xStepValue)).toFixed(stepDecimalPlaces)
                    }));
                }
            }
            this.xLabelWidth = (this.display && this.xLabelsShow) ? longestText(this.ctx, this.font, this.xLabels) + 4 : 0;

            var xLabelSteps = this.xSteps,
                drawingAreaX = this.drawingAreaX;
            while (xLabelSteps > 1 && xLabelSteps * this.xLabelWidth > drawingAreaX) {
                xLabelSteps = Math.ceil(xLabelSteps / 2);
            }
            this.xLabelStep = Math.ceil(this.xSteps / xLabelSteps);
            return this;
        }
    fit0() {
            if (this.maxY * this.minY >= 0) {
                if (this.minY >= 0) {
                    this.baseY = this.bottomPoint;
                } else {
                    this.baseY = this.topPoint;
                }
            } else {
                var height = this.drawingAreaY,
                    difference = this.maxY - this.minY;
                this.baseY = this.calculateY(0);
            }
        }
    fit1() {
            if (this.maxX * this.minX >= 0) {
                if (this.minX >= 0) {
                    this.baseX = this.leftPoint;
                } else {
                    this.baseX = this.rightPoint;
                }
            } else {
                var width = this.drawingAreaY,
                    difference = this.maxX - this.minX;

                this.baseX = this.calculateX(0);
            }
        }
    calculateX(index: number) {
            if (this.status === 0 || this.status === 5) {
                var innerWidth = this.width - (this.xScalePaddingLeft + this.xScalePaddingRight),
                    valueWidth = innerWidth / Math.max((this.xSteps - ((this.xOffsetSplitLines) ? 0 : 1)), 1),
                    valueOffset = (valueWidth * index) + this.xScalePaddingLeft;
                if (this.xOffsetSplitLines) {
                    valueOffset += (valueWidth / 2);
                }
                return Math.round(valueOffset + this.left);
            }
            var value = index;
            var scalingFactor = this.drawingAreaX / (this.maxX - this.minX);
            return this.leftPoint + (scalingFactor * (value - this.minX));
        }
    calculateY(index: number) {
            if (this.status === 1 || this.status === 5) {
                var innerHeight = this.height - (this.yScalePaddingTop + this.yScalePaddingBottom),
                    valueHeight = innerHeight / Math.max((this.ySteps - ((this.yOffsetSplitLines) ? 0 : 1)), 1),
                    valueOffset = (valueHeight * index) + this.yScalePaddingBottom;

                if (this.yOffsetSplitLines) {
                    valueOffset += (valueHeight / 2);
                }
                return Math.round(this.height + this.top - valueOffset);
            }
            var value = index;
            var scalingFactor = this.drawingAreaY / (this.maxY - this.minY);
            return this.bottomPoint - (scalingFactor * (value - this.minY));
        }
    draw() {
            var xLabelGap = this.drawingAreaX / Math.max(1, (this.xOffsetSplitLines || (this.status !== 0 && this.status !== 5)) ? this.xSteps : this.xSteps - 1),
                yLabelGap = this.drawingAreaY / Math.max(1, (this.yOffsetSplitLines || (this.status !== 1 && this.status !== 5)) ? this.ySteps : this.ySteps - 1);
            if (this.display) {
                this.drawYAxis(yLabelGap);
                this.drawXAxis(xLabelGap);
            }
        }
    drawYAxis(yLabelGap: number) {
            if (this.yAxisShow) {
                var ctx = this.ctx;
                ctx.fillStyle = this.xLabelFontColor;
                ctx.font = this.font;
                ctx.textAlign = "right";
                ctx.textBaseline = "middle";
                eachEntry(this.yLabels, function(index, labelString) {
                    var yLabelCenter = this.bottomPoint - (yLabelGap * index),
                        yLabelPos = this.yOffsetSplitLines ? yLabelCenter - (yLabelGap * 0.5) : yLabelCenter,
                        linePositionY = Math.round(yLabelCenter);
                    if (((this.yOnZero && labelString == '0') || (!this.yOnZero && index === 0)) && this.yAxisLineShow) {
                        ctx.lineWidth = this.yAxisLineWidth;
                        ctx.strokeStyle = this.yAxisLineColor;
                        linePositionY += helpers.aliasPixel(ctx.lineWidth);
                        ctx.beginPath();
                        ctx.moveTo(this.leftPoint - 5, linePositionY);
                        ctx.lineTo(this.rightPoint, linePositionY);
                        ctx.stroke();
                        ctx.closePath();
                    } else {
                        if (this.ySplitLineShow) {
                            ctx.lineWidth = this.xSplitLineWidth;
                            ctx.strokeStyle = this.xSplitLineColor;
                            linePositionY += helpers.aliasPixel(ctx.lineWidth);
                            ctx.beginPath();
                            ctx.moveTo(this.leftPoint - 5, linePositionY);
                            ctx.lineTo(this.rightPoint, linePositionY);
                            ctx.stroke();
                            ctx.closePath();
                        }
                    }
                    if (this.yLabelsShow && (index % this.yLabelStep == Math.floor(this.yLabelStep / 2))) {
                        ctx.save();
                        ctx.fillText(labelString, this.leftPoint - 10, yLabelPos);
                        ctx.restore();
                    }
                }, this);
            }
        }
    drawXAxis(xLabelGap: number) {
            if (this.xAxisShow) {
                var ctx = this.ctx;
                ctx.fillStyle = this.xLabelFontColor;
                ctx.font = this.font;
                ctx.textAlign = "center";
                ctx.textBaseline = "top";
                eachEntry(this.xLabels, function(index, label) {
                    var xLabelCenter = this.leftPoint + (xLabelGap * index),
                        xLabelPos = this.xOffsetSplitLines ? xLabelCenter + (xLabelGap * 0.5) : xLabelCenter,
                        linePositionX = Math.round(xLabelCenter);

                    if (((this.xOnZero && label == '0') || (!this.xOnZero && index === 0)) && this.xAxisLineShow) {
                        ctx.lineWidth = this.xAxisLineWidth;
                        ctx.strokeStyle = this.xAxisLineColor;
                        ctx.beginPath();
                        ctx.moveTo(linePositionX, this.bottomPoint + 5);
                        ctx.lineTo(linePositionX, this.topPoint - 3);
                        ctx.stroke();
                        ctx.closePath();
                    } else {
                        if (this.xSplitLineShow) {
                            ctx.lineWidth = this.ySplitLineWidth;
                            ctx.strokeStyle = this.ySplitLineColor;
                            ctx.beginPath();
                            ctx.moveTo(linePositionX, this.bottomPoint + 5);
                            ctx.lineTo(linePositionX, this.topPoint - 3);
                            ctx.stroke();
                            ctx.closePath();
                        }
                    }
                    if (this.xLabelsShow && (index % this.xLabelStep == Math.floor(this.xLabelStep / 2))) {
                        ctx.save();
                        ctx.fillText(label, xLabelPos, this.bottomPoint + 8);
                        ctx.restore();
                    }
                }, this);

            }
        }
}
