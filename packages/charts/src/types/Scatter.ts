/*! Ported from TangramJS painter/Charts/types/Scatter.js. */
import type { ScatterSeries as ScatterOptions } from '../types.js'
import { SeriesRenderer, type ResolvedSeries } from './Abstract.js'
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
        symbolSize: 10,
        itemStyle: {
            normal: {
                color: null,
                borderColor: null,
                borderWidth: 0
            },
            emphasis: {
                color: null,
                borderColor: null,
                borderWidth: 0
            }
        },
        hitDetectionRadius: 10,
        data: []
    };

export class ScatterSeries extends SeriesRenderer {
    declare defaults: any
    initialize(input: object) {
            var instance = this.instance,
                options = mergeOptions(this.defaults, input) as ResolvedSeries<ScatterOptions>;
            this.options = {
                index: options.index,
                name: options.name,

                pointDot: options.showPoint,
                pointColor: options.itemStyle.normal.color || this.instance.options.lineColorDefaults[options.index % this.instance.options.lineColorDefaults.length],
                symbolSize: options.symbolSize,
                pointStrokeColor: options.itemStyle.normal.borderColor || '#FFFFFF',
                pointDotStrokeWidth: options.itemStyle.normal.borderWidth,

                pointEmphasisFill: options.itemStyle.emphasis.color || '#FFFFFF',
                pointEmphasisStroke: options.itemStyle.emphasis.borderColor || options.itemStyle.normal.borderColor || this.instance.options.lineColorDefaults[options.index % this.instance.options.lineColorDefaults.length],
                pointEmphasisStrokeWidth: options.itemStyle.emphasis.borderWidth,

                pointHitDetectionRadius: options.hitDetectionRadius,

                legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].strokeColor%>\"><%if(datasets[i].label){%><%=datasets[i].label%><%}%></span></li><%}%></ul>",
            };

            this.segments = [];
            this.grid = this.instance.grid;
            this.PointClass = shapeWith(Point, {
                type: this.grid.status,
                ctx: this.ctx,
                grid: this.grid,
                itemLabel: this.options.name,
                display: this.options.pointDot,
                radius: 1,
                globalAlpha: 0.85,
                emphasisDisplay: true,
                fillColor: this.options.pointColor,
                emphasisFill: this.options.pointEmphasisFill || this.options.pointColor,
                emphasisRadius: this.options.pointEmphasisRadius,
                strokeColor: this.options.pointStrokeColor,
                emphasisStroke: this.options.pointEmphasisStroke || this.options.pointStrokeColor,
                strokeWidth: this.options.pointDotStrokeWidth,
                emphasisStrokeWidth: this.options.pointEmphasisStrokeWidth,
                hitDetectionRadius: this.options.pointHitDetectionRadius,
                strictHover: true
            });
            this.buildSegment(options.data);
        }
    buildSegment(data: ScatterOptions["data"]) {
            eachEntry(data, function(index, value) {
                if (Array.isArray(value) && Number.isFinite(value[0]) && Number.isFinite(value[1])) this.addSegment(index, value as unknown as readonly [number, number]);
            }, this);
        }
    update(data: ScatterOptions["data"]) {
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
        }
    addSegment(index: number, value: ScatterOptions["data"][number] | undefined) {
            var segment = new this.PointClass({
                type: this.grid.status,
                value: value,
                label: (this.grid.status === 1) ? this.grid.yLabels[index] : this.grid.xLabels[index]
            });
            this.segments.push(segment);
            this.calculate(index, segment);
            segment.x = segment.X;
            segment.y = segment.Y;
            segment.emphasisRadius = segment.R * 1.2;
            segment.save();
        }
    calculate(index: number, segment: ChartElement) {
            Object.assign(segment, {
                X: this.grid.calculateX(segment.value[0]),
                Y: this.grid.calculateY(segment.value[1]),
                R: (function(symbolSize, value) {
                    if (typeof symbolSize === 'number') {
                        return Math.max(0, symbolSize / 2);
                    }
                    if (typeof symbolSize === 'function') {
                        var val = symbolSize(value);
                        if (Number.isFinite(val)) {
                            return Math.max(0, val / 2);
                        }
                    }
                    return 5;
                })(this.options.symbolSize, segment.value)
            });
        }
    removeSegment(index: string | number) {
            index = parseInt(index as string) || 0;
            this.segments.splice(index, 1);
        }
    getSegmentsAtEvent(e: MouseEvent | TouchEvent, charts?: SeriesRenderer[]) {
            var segmentsArray: ChartElement[] = [],
                eventPosition = events.getRelativePosition(e);
            visitUntil(this.segments, function(index, segment) {
                if (segment.inRange(eventPosition.x, eventPosition.y)) {
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
            var easingDecimal = ease ?? 1;
            var ctx = this.ctx;

            eachEntry(this.segments, function(index, segment) {
                segment.transition({
                    x: segment.X,
                    y: segment.Y,
                    radius: segment.R
                }, easingDecimal).draw();
            }, this);
        }
}

Object.assign(ScatterSeries.prototype, {
    defaults: defaultConfig
})

export function scatter(this: Charts) {
        var chart,
            chartName,
            id = 0;
        const grid = this.grid;
        if (grid) {
            grid.charts.scatters = [];
            eachEntry(this.series.scatter, function(i, options) {
                options.index = id++;
                chartName = this.getChartName(options.name);
                const previous = this.historyCharts[chartName];
                if (previous && previous.type == 'scatter') {
                    chart = previous;
                    chart.update(options.data, options.index);
                } else {
                    chart = new ScatterSeries(options, this, options.zIndex);
                    chart.type = 'scatter';
                    this.historyCharts[chartName] = chart;
                }
                grid.charts.scatters.push(chart);
                this.activedCharts.push(chart);
            }, this);
        };
    }
