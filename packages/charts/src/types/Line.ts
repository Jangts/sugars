/*! Ported from TangramJS painter/Charts/types/Line.js. */

/* 装配折线的数据点和相邻线段，计算坐标、平滑曲线、填充区域及命中结果。 */

import type { LineSeries as LineOptions } from '../types.js'
import { SeriesRenderer, type ResolvedSeries } from './Abstract.js'
import { Line } from '../components/sharps/Line.js'
import { Point } from '../components/sharps/Point.js'
import { mergeOptions } from '../series-data.js'
import { shapeWith } from '../components/Abstract.js'
import { eachEntry } from '../series-data.js'
import * as events from '../util/events.js'
import { visitUntil } from '../series-data.js'
import type { ChartElement } from '../components/Abstract.js'
import type { Charts } from '../index.js'

var defaultConfig = {
        name: '',
        zIndex: 0,
        showPoint: true,
        itemStyle: {
            normal: {
                color: null,
                radius: 3,
                borderColor: null,
                borderWidth: 1
            },
            emphasis: {
                color: null,
                radius: 4,
                borderColor: null,
                borderWidth: 1
            }
        },
        showLine: true,
        lineStyle: {
            normal: {
                borderColor: null,
                borderWidth: 2
            }
        },
        showArea: false,
        areaStyle: {
            color: null,
        },
        hitDetectionRadius: 10,
        smooth: false,
        smoothTension: 0.4,
        data: []
    };

export class LineSeries extends SeriesRenderer {
    declare defaults: any
    initialize(input: object) {
            var instance = this.instance,
                options = mergeOptions(this.defaults, input) as ResolvedSeries<LineOptions> & { lineStyle: NonNullable<LineOptions['lineStyle']>; areaStyle: NonNullable<LineOptions['areaStyle']> };
            this.options = {
                index: options.index,
                name: options.name,

                pointDot: options.showPoint,
                pointColor: options.itemStyle.normal.color || this.instance.options.lineColorDefaults[options.index % this.instance.options.lineColorDefaults.length],
                pointDotRadius: options.itemStyle.normal.radius,
                pointStrokeColor: options.itemStyle.normal.borderColor || '#FFFFFF',
                pointDotStrokeWidth: options.itemStyle.normal.borderWidth,

                pointEmphasisFill: options.itemStyle.emphasis.color || '#FFFFFF',
                pointEmphasisRadius: options.itemStyle.emphasis.radius,
                pointEmphasisStroke: options.itemStyle.emphasis.borderColor || options.itemStyle.normal.borderColor || this.instance.options.lineColorDefaults[options.index % this.instance.options.lineColorDefaults.length],
                pointEmphasisStrokeWidth: options.itemStyle.emphasis.borderWidth,

                datasetStroke: options.showLine,
                datasetStrokeWidth: options.lineStyle.normal?.borderWidth ?? options.lineStyle.borderWidth,
                strokeColor: options.lineStyle.normal?.borderColor || options.lineStyle.borderColor || this.instance.options.lineColorDefaults[options.index % this.instance.options.lineColorDefaults.length],

                datasetFill: options.showArea,
                fillColor: options.areaStyle.color || this.instance.options.areaColorDefaults[options.index % this.instance.options.areaColorDefaults.length],

                bezierCurve: options.smooth,
                bezierCurveTension: options.smoothTension,

                pointHitDetectionRadius: options.hitDetectionRadius,

                legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].strokeColor%>\"><%if(datasets[i].label){%><%=datasets[i].label%><%}%></span></li><%}%></ul>",
            };

            this.lines = [];
            this.segments = [];
            this.grid = this.instance.grid;
            this.LineClass = shapeWith(Line, {
                ctx: this.ctx,
                grid: this.grid,
                bezierCurve: this.options.bezierCurve,
                bezierCurveTension: this.options.bezierCurveTension,
                lineWidth: this.options.datasetStrokeWidth,
                strokeStyle: this.options.strokeColor,
                datasetStroke: this.options.datasetStroke
            });
            this.PointClass = shapeWith(Point, {
                type: this.grid.status,
                ctx: this.ctx,
                grid: this.grid,
                itemLabel: this.options.name,
                display: this.options.pointDot,
                emphasisDisplay: true,
                fillColor: this.options.pointColor,
                emphasisFill: this.options.pointEmphasisFill || this.options.pointColor,
                radius: this.options.pointDotRadius,
                emphasisRadius: this.options.pointEmphasisRadius,
                strokeColor: this.options.pointStrokeColor,
                emphasisStroke: this.options.pointEmphasisStroke || this.options.pointStrokeColor,
                strokeWidth: this.options.pointDotStrokeWidth,
                emphasisStrokeWidth: this.options.pointEmphasisStrokeWidth,
                hitDetectionRadius: this.options.pointHitDetectionRadius,
                strictHover: this.instance.options.tooltip.strictHover
            });
            this.buildSegment(options.data);
        }
    buildSegment(data: LineOptions["data"]) {
            eachEntry(data, function(index, value) {
                this.addSegment(index, value);
            }, this);
            eachEntry(this.lines, function(index, line) {
                line.previous = this.lines[index - 1] || line;
                line.next = this.lines[index + 1] || line;
                line.siblings = this.lines.length;
            }, this);
        }
    update(data: LineOptions["data"]) {
            eachEntry(this.segments, function(index, segment) {
                segment.value = data && data[index] || 0;
                segment.base = this.grid.baseY;
                segment.restore(['display', 'fillColor', 'radius', 'strokeColor', 'strokeWidth']);
                segment.save();
                this.calculate(index, segment);
            }, this);
            for (var index = this.segments.length; index < data.length; index++) {
                this.addSegment(index, data[index]!);
            }
            eachEntry(this.lines, function(index, line) {
                line.previous = this.lines[index - 1] || line;
                line.next = this.lines[index + 1] || line;
                line.siblings = this.lines.length;
            }, this);
        }
    addSegment(index: number, value: LineOptions["data"][number] | undefined) {
            var segment = new this.PointClass({
                    type: this.grid.status,
                    value: value,
                    label: (this.grid.status === 1) ? this.grid.yLabels[index] : this.grid.xLabels[index],
                }),
                line = new this.LineClass({
                    index: index,
                    point: segment
                });
            // console.log(this.grid.status);
            this.lines.push(line);
            this.segments.push(segment);
            this.calculate(index, segment);
            Object.assign(segment, {
                x: this.segments[index - 1] ? this.segments[index - 1]!.X : segment.X,
                y: this.segments[index - 1] ? this.segments[index - 1]!.Y : segment.Y,
                titleLabel: segment.label
            });
            segment.save();
        }
    calculate(index: number, segment: ChartElement) {
            switch (segment.type) {
                case 0:
                    Object.assign(segment, {
                        X: this.grid.calculateX(index),
                        Y: this.grid.calculateY(segment.value)
                    });
                    break;
                case 1:
                    Object.assign(segment, {
                        X: this.grid.calculateX(segment.value),
                        Y: this.grid.calculateY(index)
                    });
                    break;
            }
        }
    removeSegment(index: string | number) {
            index = parseInt(index as string) || 0;
            this.segments.splice(index, 1);
        }
    getSegmentsAtEvent(e: MouseEvent | TouchEvent, charts?: SeriesRenderer[]) {
            var segmentsArray: ChartElement[] = [],
                eventPosition = events.getRelativePosition(e);
            visitUntil(this.segments, function(index, segment) {
                if (segment.inRange(eventPosition.x, eventPosition.y, (charts === undefined))) {
                    if (charts && charts.length) {
                        eachEntry(charts, function(i, chart) {
                            if (chart.segments[index]) segmentsArray.push(chart.segments[index]);
                        });
                    } else {
                        segmentsArray.push(segment);
                    }
                    return false;
                }
            }, this);
            return segmentsArray;
        }
    draw(ease?: number) {
            var easingDecimal = ease ?? 1,
                ctx = this.ctx,
                points: ChartElement[] = [];

            eachEntry(this.segments, function(index, segment) {
                if (segment.hasValue()) {
                    segment.transition({
                        x: segment.X,
                        y: segment.Y

                    }, easingDecimal);
                    this.lines[index].draw();
                    points.push(segment);
                }
            }, this);

            if (this.options.datasetFill && (points.length > 0) && ((this.grid.status === 0) || (this.grid.status === 1))) {
                if (this.grid.status === 0) {
                    ctx.lineTo(points[points.length - 1]!.x, this.grid.baseY);
                    ctx.lineTo(points[0]!.x, this.grid.baseY);
                } else {
                    ctx.lineTo(this.grid.baseX, points[points.length - 1]!.y);
                    ctx.lineTo(this.grid.baseX, points[0]!.y);
                }
                ctx.globalAlpha = 0.85;
                ctx.fillStyle = this.options.fillColor;
                ctx.closePath();
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            eachEntry(points, function(index, point) {
                point.draw();
            });
        }
}

Object.assign(LineSeries.prototype, {
    defaults: defaultConfig
})

export function line(this: Charts) {
        var chart,
            chartName,
            id = 0;
        if (this.grid) {
            const grid = this.grid;
            grid.charts.lines = grid.charts.lines || [];
            eachEntry(this.series.line, function(i, options) {
                options.index = id++;
                chartName = this.getChartName(options.name);
                const previous = this.historyCharts[chartName];
                if (previous && previous.type == 'line') {
                    chart = previous;
                    chart.update(options.data, options.index);
                } else {
                    chart = new LineSeries(options, this, options.zIndex);
                    chart.type = 'line';
                    this.historyCharts[chartName] = chart;
                }
                grid.charts.lines.push(chart);
                this.activedCharts.push(chart);
            }, this);
        }
    }
