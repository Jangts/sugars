/*! Ported from TangramJS painter/Charts/modules/grid.js. */
import type { ChartElement } from '../components/Abstract.js'
import type { Charts } from '../index.js'
import { Grid } from '../components/scales/Grid.js'
import { eachEntry } from '../series-data.js'
import { mergeOptions } from '../series-data.js'
import { joinLists } from '../series-data.js'
import { defaults } from '../defaults.js'
import * as helpers from '../util/helpers.js'
import * as events from '../util/events.js'

export const gridDefaults = {
        grid: {
            show: true,
            zIndex: 0,
            left: '10%' as const,
            top: 60,
            right: '10%' as const,
            bottom: 60,
            width: 'auto' as const,
            height: 'auto' as const,
            padding: 10,
        },
        xAxis: {
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
                //inside: false,
                //rotate: 0,
                //margin: 8,
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
        yAxis: {
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
                //inside: false,
                //rotate: 0,
                //margin: 8,
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

export function buildGrid(this: Charts) {
        var grid = mergeOptions(defaults.grid, this.options.grid || {}),
            xAxis = mergeOptions(defaults.xAxis, this.options.xAxis || {}),
            yAxis = mergeOptions(defaults.yAxis, this.options.yAxis || {});

        var style = helpers.calculateRectangleStyle(grid, this.width, this.height);
        const indexed = !xAxis.data && !yAxis.data && xAxis.type !== 'value'
            ? [...this.series.bar ?? [], ...this.series.line ?? []]
            : [];
        const categoryCount = indexed.reduce((max, series) => Math.max(max, series.data.length), 0);
        const labels = categoryCount ? Array.from({ length: categoryCount }, (_, index) => String(index + 1)) : undefined;

        var gridOptions = {
            status: 4,
            display: (grid.show == true),
            hasBar: this.series.bar ? true : false,
            hasScatter: this.series.scatter ? true : false,
            instance: this,
            ctx: this.getLayer(grid.zIndex).getContext("2d"),
            width: style.width,
            height: style.height,
            top: style.top,
            left: style.left,
            padding: grid.padding,

            xAxisMax: xAxis.max,
            xAxisMin: xAxis.min,
            xAxisShow: (xAxis.show == true),
            xAxisLineShow: (xAxis.axisLine.show == true),
            xAxisLineWidth: xAxis.axisLine.lineStyle.width,
            xAxisLineColor: xAxis.axisLine.lineStyle.color,

            xSplitLineShow: (xAxis.splitLine.show == true),
            xSplitLineWidth: xAxis.splitLine.lineStyle.width,
            xSplitLineColor: xAxis.splitLine.lineStyle.color,

            xLabelsShow: (xAxis.axisLabel.show == true),
            xLabelFontColor: xAxis.axisLabel.textStyle.fontColor,
            xLabelFontSize: xAxis.axisLabel.textStyle.fontSize,
            xLabelFontStyle: xAxis.axisLabel.textStyle.fontStyle,
            xLabelFontFamily: xAxis.axisLabel.textStyle.fontFamily,

            xLabels: xAxis.data?.length ? xAxis.data : labels,
            xTemplateString: xAxis.axisLabel.formatter,
            xOnZero: xAxis.axisLine.onZero,
            xBeginAtZero: (xAxis.axisLine.beginAtZero == true),
            xIntegersOnly: true,

            yAxisMax: yAxis.max,
            yAxisMin: yAxis.min,
            yAxisShow: (yAxis.show == true),
            yAxisLineShow: (yAxis.axisLine.show == true),
            yAxisLineWidth: yAxis.axisLine.lineStyle.width,
            yAxisLineColor: yAxis.axisLine.lineStyle.color,

            ySplitLineShow: (yAxis.splitLine.show == true),
            ySplitLineWidth: yAxis.splitLine.lineStyle.width,
            ySplitLineColor: yAxis.splitLine.lineStyle.color,

            yLabelsShow: (yAxis.axisLabel.show == true),
            yLabelFontColor: yAxis.axisLabel.textStyle.fontColor,
            yLabelFontSize: yAxis.axisLabel.textStyle.fontSize,
            yLabelFontStyle: yAxis.axisLabel.textStyle.fontStyle,
            yLabelFontFamily: yAxis.axisLabel.textStyle.fontFamily,

            yLabels: yAxis.data?.length ? yAxis.data : undefined,
            yTemplateString: yAxis.axisLabel.formatter,
            yOnZero: yAxis.axisLine.onZero,
            yBeginAtZero: (yAxis.axisLine.beginAtZero == true),
            yIntegersOnly: true
        };

        gridOptions.status = (gridOptions.xLabels && gridOptions.yLabels) ? 5 : (gridOptions.xLabels ? 0 : (gridOptions.yLabels ? 1 : 4));

        if (this.grid === null) {
            this.grid = new Grid(gridOptions);
            events.bindHover(this, function(evt) {
                const scale = this.grid;
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
                        'bars': {
                            'fillColor': 'emphasisFill',
                            'strokeColor': 'emphasisStroke',
                            'strokeWidth': 'emphasisWidth'
                        }
                    },
                    charts = joinLists(scale.charts.lines, scale.charts.bars, scale.charts.scatters);
                eachEntry(types, function(i, type) {
                    for (let i = 0; scale.charts[type] && i < scale.charts[type].length && actives.length === 0; i++) {
                        var chart = scale.charts[type][i];
                        // console.log(chart);
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
                        var x = actives[0].x,
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
                            y = actives[0].y,
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
            this.grid.update(gridOptions);

        }
    }
