/*! Ported from TangramJS painter/Charts/components/scales/Polar.js. */
import { ChartElement } from '../Abstract.js'
import { eachEntry } from '../../series-data.js'
import { joinLists } from '../../series-data.js'
import { minNumber } from '../../series-data.js'
import { maxNumber } from '../../series-data.js'
import * as helpers from '../../util/helpers.js'
import { getDecimalPlaces } from '../../util/helpers.js'
import { isFinite } from 'lodash-es'
import { fontString } from '../../util/canvas.js'

var getMax = function(steps, value) {
            var stepValue = Math.ceil(value / steps);
            return stepValue * steps;
        };

export class Polar extends ChartElement {
    protected initializeElement(configuration: object): void {
            Object.assign(this, configuration);
            this.drawingAreaR = (this.display) ? this.radius - (this.radiusLabelFontSize / 2 + this.backdropPaddingY) : this.radius;
            this.save();
            this.fit();
        }
    update(newProps) {
            Object.assign(this, newProps);
            //this.drawingAreaR = (this.display) ? this.radius - (this.radiusLabelFontSize / 2 + this.backdropPaddingY) : this.radius;
            //this.save();
            this.fit();
            return this;
        }
    fit() {
            this.charts = {};
            this.getValues();
            this.calculateAngleRange();
            this.calculateRadiusRange();
            this.buildAngleLabels();
            this.buildRadiusLabels();
            this.fitDrawingAreaR();
        }
    getValues() {
            this.angleValues = [];
            this.radiusValues = [];
            if (this.status === 6) {
                var max: number[] = [],
                    min: number[] = [];
                eachEntry(this.angleLabels, function(j) {
                    this.radiusValues.push([]);
                }, this);
                eachEntry(this.instance.series.radar, function(i, chart) {
                    max.push(maxNumber(chart.data));
                    min.push(minNumber(chart.data));
                    eachEntry(chart.data, function(j, v) {
                        if (typeof v === 'number') {
                            this.radiusValues[j] && this.radiusValues[j].push(v);
                        }
                    }, this);
                }, this);
                this.radiusAxisMax = maxNumber(max);
                this.radiusAxisMin = minNumber(min);
            } else {
                eachEntry(this.instance.series.line, function(i, chart) {
                    var data: number[] = [];
                    eachEntry(chart.data, function(j, v) {
                        (typeof v === 'number') && data.push(v);
                    });
                    this.radiusValues = joinLists(this.radiusValues, data);
                }, this);
                eachEntry(this.instance.series.scatter, function(i, chart) {
                    var angleData: number[] = [],
                        radiusData: number[] = [];;
                    eachEntry(chart.data, function(j, v) {
                        if (typeof v === 'object' && v instanceof Array) {
                            (typeof v[0] === 'number') && angleData.push(v[0]);
                            (typeof v[1] === 'number') && radiusData.push(v[1]);
                        }
                    });
                    switch (this.status) {
                        case 0:
                            this.radiusValues = joinLists(this.radiusValues, radiusData);
                            break;
                        case 4:
                            this.angleValues = joinLists(this.angleValues, angleData);
                            this.radiusValues = joinLists(this.radiusValues, radiusData);
                            break;
                    }
                }, this);
                //this.radiusAxisMax = maxNumber(this.radiusValues);
                //this.radiusAxisMin = minNumber(this.radiusValues);
                this.radiusAxisMax = maxNumber(this.radiusValues);
                this.radiusAxisMin = minNumber(this.radiusValues);
                console.log(this.radiusAxisMax, this.radiusAxisMax, this.radiusValues);
            }

            if (this.angleValues.length < 1) {
                this.angleValues = [1];
            }
            if (this.radiusValues.length < 1) {
                this.radiusValues = [1];
            }
        }
    calculateAngleRange() {
        let valuesArray: number[];
            if (this.status === 0 || this.status === 5 || this.status === 6) {
                // 角度为项，或角径皆为项
                this.angleSteps = this.angleLabels.length
            } else {
                if ((typeof(this.angleAxisMax) === 'number') && (typeof(this.angleAxisMin) === 'number')) {
                    valuesArray = [this.angleAxisMax, this.angleAxisMin];
                } else if (typeof(this.angleAxisMax) === 'number') {
                    valuesArray = [this.angleAxisMax, minNumber(this.angleValues)];
                } else if (typeof(this.yAxisMin) === 'number') {
                    valuesArray = [this.angleAxisMin, maxNumber(this.angleValues)];
                } else {
                    valuesArray = this.angleValues;
                }
                this.angleSteps = helpers.calculateScaleRange(
                    valuesArray,
                    this.drawingAreaR,
                    this.angleLabelFontSize,
                    this.angleBeginAtZero,
                    this.angleIntegersOnly,
                    true, true);
                console.log(valuesArray, this.angleSteps);
            }
            Object.assign(this, {
                angleSteps: this.angleSteps,
                angleStepValue: 1,
                minAngle: 0,
                maxAngle: Math.PI
            });
        }
    calculateRadiusRange() {
        let valuesArray: number[];
            if (this.status === 1 || this.status === 5) {
                this.splitNumber = this.radiusLabels.length;
                this.radiusStepValue = 1;
            } else if (this.status === 0 || this.status === 4) {
                if ((typeof(this.radiusAxisMax) === 'number') && (typeof(this.radiusAxisMin) === 'number')) {
                    valuesArray = [this.radiusAxisMax, this.radiusAxisMin];
                } else if (typeof(this.radiusAxisMax) === 'number') {
                    var min = minNumber(this.radiusValues);
                        valuesArray = [this.radiusAxisMax, min < this.radiusAxisMax ? min : this.radiusAxisMax - 1];
                } else if (typeof(this.radiusAxisMin) === 'number') {
                    var max = maxNumber(this.radiusValues);
                        valuesArray = [this.radiusAxisMin, max > this.radiusAxisMin ? max : this.radiusAxisMin + 1];
                } else {
                    valuesArray = this.radiusValues;
                }
                var updatedRanges = helpers.calculateScaleRange(
                    valuesArray,
                    this.drawingAreaR,
                    this.radiusLabelFontSize,
                    this.radiusBeginAtZero,
                    this.radiusIntegersOnly,
                    false, true);
                this.splitNumber = updatedRanges[0];
                this.radiusStepValue = updatedRanges[1];
            } else {
                Object.assign(this, {
                    radiusSteps: this.splitNumber,
                    radiusStepValue: this.radiusAxisMax / this.splitNumber,
                    minRadius: 0,
                    maxRadius: this.radiusAxisMax
                });
            }
        }
    buildAngleLabels() {
            if (this.status === 1 || this.status === 4) {
                this.angleLabels = [];
                var stepDecimalPlaces = getDecimalPlaces(this.angleStepValue);
                for (var i = 0; i <= this.angleSteps; i++) {
                    this.radiusLabels.push(helpers.template(this.angleTemplateString, {
                        value: (this.minAngle + (i * this.angleStepValue)).toFixed(stepDecimalPlaces)
                    }));
                }
            }
        }
    buildRadiusLabels() {
            if (this.status === 0 || this.status === 4 || this.status === 6) {
                this.radiusLabels = [];
                var stepDecimalPlaces = getDecimalPlaces(this.radiusStepValue);
                for (var i = 0; i <= this.radiusSteps; i++) {
                    this.radiusLabels.push(helpers.template(this.radiusTemplateString, {
                        value: (this.minRadius + (i * this.radiusStepValue)).toFixed(stepDecimalPlaces)
                    }));
                }
            }
        }
    fitDrawingAreaR() {
            var largestPossibleRadius = this.radius - this.radiusLabelFontSize - 5,
                pointPosition,
                i,
                txet,
                textWidth,
                halfTextWidth,
                furthestRight = this.radius * 2,
                furthestRightIndex,
                furthestRightAngle,
                furthestLeft = 0,
                furthestLeftIndex,
                furthestLeftAngle,
                xProtrusionLeft,
                xProtrusionRight,
                radiusReductionRight,
                radiusReductionLeft,
                maxWidthRadius;
            this.ctx.font = fontString(this.angleLabelFontSize, this.angleLabelFontStyle, this.angleLabelFontFamily);
            for (i = 0; i < this.angleSteps; i++) {
                pointPosition = this.getPointPosition(this.calculateAngle(i), this.calculateRadius(i, largestPossibleRadius));
                txet = helpers.template(this.angleTemplateString, {
                    value: this.angleLabels[i]
                })
                textWidth = this.ctx.measureText(txet).width + 5;
                if (i === 0 || i === this.angleSteps / 2) {
                    halfTextWidth = textWidth / 2;
                    if (pointPosition.x + halfTextWidth > furthestRight) {
                        furthestRight = pointPosition.x + halfTextWidth;
                        furthestRightIndex = i;
                    }
                    if (pointPosition.x - halfTextWidth < furthestLeft) {
                        furthestLeft = pointPosition.x - halfTextWidth;
                        furthestLeftIndex = i;
                    }
                } else if (i < this.angleSteps / 2) {
                    if (pointPosition.x + textWidth > furthestRight) {
                        furthestRight = pointPosition.x + textWidth;
                        furthestRightIndex = i;
                    }
                } else if (i > this.angleSteps / 2) {
                    if (pointPosition.x - textWidth < furthestLeft) {
                        furthestLeft = pointPosition.x - textWidth;
                        furthestLeftIndex = i;
                    }
                }
            }
            xProtrusionLeft = furthestLeft;
            xProtrusionRight = Math.ceil(furthestRight - this.width);
            furthestRightAngle = this.calculateAngle(furthestRightIndex);
            furthestLeftAngle = this.calculateAngle(furthestLeftIndex);
            radiusReductionRight = xProtrusionRight / Math.sin(furthestRightAngle + Math.PI / 2);
            radiusReductionLeft = xProtrusionLeft / Math.sin(furthestLeftAngle + Math.PI / 2);

            radiusReductionRight = (isFinite(radiusReductionRight)) ? radiusReductionRight : 0;
            radiusReductionLeft = (isFinite(radiusReductionLeft)) ? radiusReductionLeft : 0;
            this.drawingAreaR = largestPossibleRadius - (radiusReductionLeft + radiusReductionRight) / 2;
        }
    getPointPosition(angle, radius) {
            return {
                angle: angle,
                radius: radius,
                x: (Math.cos(angle) * radius) + this.xCenter,
                y: (Math.sin(angle) * radius) + this.yCenter
            };
        }
    calculateAngle(index) {
            var angleMultiplier = (Math.PI * 2) / this.angleSteps;
            return index * angleMultiplier - (Math.PI / 2);
        }
    calculateRadius(index, value) {
            if (this.status === 5) {
                var scalingFactor = this.drawingAreaR / this.radiusSteps;
                return index * scalingFactor;
            }
            //var value = index;
            var scalingFactor = this.drawingAreaR / (this.maxRadius - this.minRadius);
            return (value - this.minRadius) * scalingFactor;
        }
    draw() {
            if (this.display) {
                this.drawAngle();
                this.drawRadius();
            }
        }
    drawRadius() {
            if (this.radiusAxisShow) {
                var ctx = this.ctx;
                eachEntry(this.radiusLabels, function(index, label) {
                    if (index > 0) {
                        var radius = index * (this.drawingAreaR / this.radiusSteps),
                            radiusLabelCenter = this.yCenter - radius,
                            pointPosition;

                        if (this.radiusLabelsShow) {
                            ctx.font = fontString(this.radiusLabelFontSize, this.radiusLabelFontStyle, this.radiusLabelFontFamily);
                            ctx.textAlign = 'center';
                            ctx.textBaseline = "middle";
                            ctx.fillStyle = this.radiusLabelFontColor;
                            ctx.fillText(label, this.xCenter, radiusLabelCenter);
                        }
                        if ((this.radiusOnZero && label == '0') || (!this.radiusOnZero && (index === this.radiusLabels.length - 1))) {
                            if (this.radiusAxisLineShow && (this.radiusAxisLineWidth > 0)) {
                                ctx.strokeStyle = this.radiusAxisLineColor;
                                ctx.lineWidth = this.radiusAxisLineWidth;
                            } else {
                                return;
                            }
                        } else {
                            if (this.angleSplitLineWidth > 0) {
                                ctx.strokeStyle = this.angleSplitLineColor;
                                ctx.lineWidth = this.angleSplitLineWidth;
                            } else {
                                return;
                            }
                        }
                        if (this.angleSplitLineArc) {
                            ctx.beginPath();
                            ctx.arc(this.xCenter, this.yCenter, radius, 0, Math.PI * 2);
                            ctx.closePath();
                            ctx.stroke();
                        } else {
                            ctx.beginPath();
                            for (var i = 0; i < this.angleSteps; i++) {
                                pointPosition = this.getPointPosition(this.calculateAngle(i), this.calculateRadius(index, index * this.radiusStepValue));
                                if (i === 0) {
                                    ctx.moveTo(pointPosition.x, pointPosition.y);
                                } else {
                                    ctx.lineTo(pointPosition.x, pointPosition.y);
                                }
                            }
                            ctx.closePath();
                            ctx.stroke();
                        }
                    }
                }, this);
            }
        }
    drawAngle() {
            if (this.angleAxisShow) {
                var ctx = this.ctx;

                for (var i = this.angleSteps - 1; i >= 0; i--) {
                    var radius = null,
                        outerPosition: { x: number; y: number } | undefined;
                    if (((this.angleOnZero && this.angleLabels[i] == '0') || (!this.angleOnZero && i === 0)) && this.angleAxisLineShow && (this.angleAxisLineWidth > 0)) {
                        ctx.lineWidth = this.angleAxisLineWidth;
                        ctx.strokeStyle = this.angleAxisLineColor;
                    } else {
                        ctx.lineWidth = this.radiusSplitLineWidth
                        ctx.strokeStyle = this.radiusSplitLineColor;
                    }
                    if (this.radiusSplitLineWidth > 0) {
                        outerPosition = this.getPointPosition(this.calculateAngle(i), this.calculateRadius(i, this.maxRadius));
                        ctx.beginPath();
                        ctx.moveTo(this.xCenter, this.yCenter);
                        ctx.lineTo(outerPosition.x, outerPosition.y);
                        ctx.stroke();
                        ctx.closePath();
                    }

                    if (this.backgroundColors && this.backgroundColors.length == this.angleSteps) {
                        if (outerPosition == null)
                            outerPosition = this.getPointPosition(this.calculateAngle(i), this.calculateRadius(i, this.maxRadius));

                        if (!outerPosition) continue;
                        var previousOuterPosition = this.getPointPosition(this.calculateAngle(i === 0 ? this.angleSteps - 1 : i - 1), this.calculateRadius(i, this.maxRadius));
                        var nextOuterPosition = this.getPointPosition(this.calculateAngle(i === this.angleSteps - 1 ? 0 : i + 1), this.calculateRadius(i, this.maxRadius));

                        var previousOuterHalfway = {
                            x: (previousOuterPosition.x + outerPosition.x) / 2,
                            y: (previousOuterPosition.y + outerPosition.y) / 2
                        };
                        var nextOuterHalfway = {
                            x: (outerPosition.x + nextOuterPosition.x) / 2,
                            y: (outerPosition.y + nextOuterPosition.y) / 2
                        };

                        ctx.beginPath();
                        ctx.moveTo(this.xCenter, this.yCenter);
                        ctx.lineTo(previousOuterHalfway.x, previousOuterHalfway.y);
                        ctx.lineTo(outerPosition.x, outerPosition.y);
                        ctx.lineTo(nextOuterHalfway.x, nextOuterHalfway.y);
                        ctx.fillStyle = this.backgroundColors[i];
                        ctx.fill();
                        ctx.closePath();
                    }
                    this.drawAngleLabels(ctx, i);
                }
            }
        }
    drawAngleLabels(ctx, i) {
            if (this.angleLabelsShow) {
                // Extra 3px out for some label spacing
                var pointLabelPosition = this.getPointPosition(this.calculateAngle(i), this.calculateRadius(i, this.maxRadius + 5));
                ctx.font = fontString(this.angleLabelFontSize, this.angleLabelFontStyle, this.angleLabelFontFamily);
                ctx.fillStyle = this.angleLabelFont;

                var labelsCount = this.angleSteps,
                    halfLabelsCount = this.angleSteps / 2,
                    quarterLabelsCount = halfLabelsCount / 2,
                    upperHalf = (i < quarterLabelsCount || i > labelsCount - quarterLabelsCount),
                    exactQuarter = (i === quarterLabelsCount || i === labelsCount - quarterLabelsCount);
                if (i === 0) {
                    ctx.textAlign = 'center';
                } else if (i === halfLabelsCount) {
                    ctx.textAlign = 'center';
                } else if (i < halfLabelsCount) {
                    ctx.textAlign = 'left';
                } else {
                    ctx.textAlign = 'right';
                }

                // Set the correct text baseline based on outer positioning
                if (exactQuarter) {
                    ctx.textBaseline = 'middle';
                } else if (upperHalf) {
                    ctx.textBaseline = 'bottom';
                } else {
                    ctx.textBaseline = 'top';
                }

                ctx.fillStyle = this.radiusLabelFontColor;
                ctx.fillText(this.angleLabels[i], pointLabelPosition.x, pointLabelPosition.y);
            }
        }
}
