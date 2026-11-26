/*! Ported from TangramJS painter/Charts/modules/polar.js. */

/* 从极坐标选项和系列数据装配角轴及径向轴，归集各数据点的命中结果。 */

import type { ChartElement } from '../components/Abstract.js'
import type { Charts } from '../index.js'
import { Polar } from '../components/scales/Polar.js'
import { eachEntry } from '../series-data.js'
import { mergeOptions } from '../series-data.js'
import { joinLists } from '../series-data.js'
import { defaults } from '../defaults.js'
import * as helpers from '../util/helpers.js'
import * as events from '../util/events.js'

export const polarDefaults = {
        polar: {
            show: false,
            zIndex: 0,
            center: ['50%', '50%'],
            radius: '75%',
            shape: 'polygon',
        },
        angleAxis: {
            show: true,
            type: 'label',
            axisLine: {
                show: true,
                beginAtZero: false,
                onZero: false,
                lineStyle: {
                    color: "rgba(0,0,0,.2)",
                    width: 1
                }
            },
            splitLine: {
                show: true,
                lineStyle: {
                    color: "rgba(0,0,0,.05)",
                    width: 1
                }
            },
            axisLabel: {
                show: true,
                formatter: "<%=value%>",
                textStyle: {
                    fontFamily: "'Microsoft YaHei', 'Hiragino Sans'",
                    fontSize: 12,
                    fontStyle: "normal",
                    fontColor: "#666"
                }
            },
            max: null,
            min: null,
            data: null as import('../types.js').AxisOptions['data']
        },
        radiusAxis: {
            show: true,
            type: 'value',
            axisLine: {
                show: true,
                beginAtZero: false,
                onZero: false,
                lineStyle: {
                    color: "rgba(0,0,0,.20)",
                    width: 1
                }
            },
            splitLine: {
                show: true,
                lineStyle: {
                    color: "rgba(0,0,0,.05)",
                    width: 1
                }
            },
            axisLabel: {
                show: true,
                formatter: "<%=value%>",
                textStyle: {
                    fontFamily: "'Microsoft YaHei', 'Hiragino Sans'",
                    fontSize: 12,
                    fontStyle: "normal",
                    fontColor: "#666"
                }
            },
            max: null,
            min: null,
            data: null as import('../types.js').AxisOptions['data']
        }
    }

export function buildPolar(this: Charts) {
        var polar = mergeOptions(defaults.polar, this.options.polar || {}),
            angleAxis = mergeOptions(defaults.angleAxis, this.options.angleAxis || {}),
            radiusAxis = mergeOptions(defaults.radiusAxis, this.options.radiusAxis || {});

        var style = helpers.calculateCircleStyle(polar, this.width, this.height);

        var polarOptions = {
            status: 4,
            display: (polar.show == true),
            hasBar: this.series.bar ? true : false,
            hasScatter: this.series.scatter ? true : false,
            instance: this,
            ctx: this.getLayer(polar.zIndex).getContext("2d"),
            radius: style.radius,
            xCenter: style.x,
            yCenter: style.y,

            angleAxisMax: angleAxis.max,
            angleAxisMin: angleAxis.min,
            angleAxisShow: (angleAxis.show == true),
            angleAxisLineShow: (angleAxis.axisLine.show == true),
            angleAxisLineWidth: angleAxis.axisLine.lineStyle.width,
            angleAxisLineColor: angleAxis.axisLine.lineStyle.color,

            angleSplitLineShow: (angleAxis.splitLine.show == true),
            angleSplitLineArc: (polar.shape === 'circle'),
            angleSplitLineWidth: angleAxis.splitLine.lineStyle.width,
            angleSplitLineColor: angleAxis.splitLine.lineStyle.color,

            angleLabelsShow: (angleAxis.axisLabel.show == true),
            angleLabelFontColor: angleAxis.axisLabel.textStyle.fontColor,
            angleLabelFontSize: angleAxis.axisLabel.textStyle.fontSize,
            angleLabelFontStyle: angleAxis.axisLabel.textStyle.fontStyle,
            angleLabelFontFamily: angleAxis.axisLabel.textStyle.fontFamily,


            angleLabels: angleAxis.data,
            angleTemplateString: angleAxis.axisLabel.formatter,
            angleOnZero: angleAxis.axisLine.onZero,
            angleBeginAtZero: (angleAxis.axisLine.beginAtZero == true),
            angleIntegersOnly: true,

            radiusAxisMax: radiusAxis.max,
            radiusAxisMin: radiusAxis.min,
            radiusAxisShow: (radiusAxis.show == true),
            radiusAxisLineShow: (radiusAxis.axisLine.show == true),
            radiusAxisLineWidth: radiusAxis.axisLine.lineStyle.width,
            radiusAxisLineColor: radiusAxis.axisLine.lineStyle.color,

            radiusSplitLineShow: (radiusAxis.splitLine.show == true),
            radiusSplitLineWidth: radiusAxis.splitLine.lineStyle.width,
            radiusSplitLineColor: radiusAxis.splitLine.lineStyle.color,

            radiusLabelsShow: (radiusAxis.axisLabel.show == true),
            radiusLabelFontColor: radiusAxis.axisLabel.textStyle.fontColor,
            radiusLabelFontSize: radiusAxis.axisLabel.textStyle.fontSize,
            radiusLabelFontStyle: radiusAxis.axisLabel.textStyle.fontStyle,
            radiusLabelFontFamily: radiusAxis.axisLabel.textStyle.fontFamily,

            radiusLabels: radiusAxis.data,
            radiusTemplateString: radiusAxis.axisLabel.formatter,
            radiusOnZero: radiusAxis.axisLine.onZero,
            radiusBeginAtZero: (radiusAxis.axisLine.beginAtZero == true),
            radiusIntegersOnly: true
        };

        polarOptions.status = (polarOptions.angleLabels && polarOptions.radiusLabels) ? 5 : (polarOptions.angleLabels ? 0 : (polarOptions.radiusLabels ? 1 : 4));

        if (this.polar === null) {
            this.polar = new Polar(polarOptions);
            events.bindHover(this, function(evt) {
                const scale = this.polar;
                if (!scale) return;
                var actives: ChartElement[] = [],
                    types = ['lines', 'bars', 'scatters'],
                    restores = {
                        'lines': {
                            'display': 'emphasisDisplay',
                            'fillColor': 'emphasisFill',
                            'radius': 'emphasisRadius',
                            'strokeColor': 'emphasisStroke',
                            'strokeWidth': 'emphasisStrokeWidth'
                        },
                        'scatters': {
                            'radius': 'emphasisRadius'
                        },
                        'areas': {
                            'fillColor': 'emphasisFill',
                            'strokeColor': 'emphasisStroke',
                            'strokeWidth': 'emphasisWidth'
                        }
                    },
                    charts = joinLists(scale.charts.lines, scale.charts.areas, scale.charts.scatters);
                eachEntry(types, function(i, type: keyof typeof restores) {
                    for (let i = 0; scale.charts[type] && i < scale.charts[type].length && actives.length === 0; i++) {
                        var chart = scale.charts[type][i];
                        var activeSegments = ((this.options.tooltip.type == 'axis') ? chart.getSegmentsAtEvent(evt, charts) : chart.getSegmentsAtEvent(evt));
                        eachEntry(chart.segments, function(index, segment) {
                            segment.restore(Object.keys(restores[type]));
                        });
                        if (activeSegments.length > 0) {
                            eachEntry(activeSegments, function(index, activeSegment) {
                                actives.push(activeSegment);
                                eachEntry(restores[type], function(normal, emphasis) {
                                    activeSegment[normal] = activeSegment[emphasis];
                                });
                            });
                            break;
                        }
                    }
                }, this);

                if (this.options.tooltip.show) {
                    this.showTooltip(actives, false, (this.options.tooltip.type == 'axis'));
                }
                if ((this.options.tooltip.type == 'axis') && (actives.length > 0) && (scale.charts.lines) && (scale.charts.lines.length > 0)) {
                    if (scale.status === 0) {
                        // 横轴为项，纵轴为值
                        var x = actives[0]!.x,
                            y1 = scale.topPoint,
                            y2 = scale.bottomPoint,
                            ctx = scale.ctx;
                        ctx.translate(0.5, 0);
                        ctx.lineWidth = 1;
                        ctx.strokeStyle = '#FF0000';
                        ctx.beginPath();
                        ctx.moveTo(x, y1);
                        ctx.lineTo(x, y2);
                        ctx.stroke();
                        ctx.translate(-0.5, 0);
                        ctx.closePath();
                    }
                    if (scale.status === 1) {
                        // 横轴为值，纵轴为项
                        var x1 = scale.leftPoint,
                            x2 = scale.rightPoint,
                            y = actives[0]!.y,
                            ctx = scale.ctx;
                        ctx.translate(0, 0.5);
                        ctx.lineWidth = 1;
                        ctx.strokeStyle = '#FF0000';
                        ctx.beginPath();
                        ctx.moveTo(x1, y);
                        ctx.lineTo(x2, y);
                        ctx.stroke();
                        ctx.translate(0, -0.5);
                        ctx.closePath();
                    }
                }
                if (actives.length > 0) {
                    this.actived = 1;
                    this.Element.style.cursor = 'pointer';
                } else {
                    this.actived = 0;
                    this.Element.style.cursor = 'default';
                }
            });
        } else {
            this.polar.update(polarOptions);
        }
    }
