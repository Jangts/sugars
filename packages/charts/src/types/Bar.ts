/*! Ported from TangramJS painter/Charts/types/Bar.js. */
import type { BarSeries as BarOptions } from '../types.js'
import { SeriesRenderer, type ResolvedSeries } from './Abstract.js'
import { Rectangle } from '../components/sharps/Rectangle.js'
import { mergeOptions } from '../series-data.js'
import { shapeWith } from '../components/Abstract.js'
import { eachEntry } from '../series-data.js'
import * as events from '../util/events.js'
import { visitUntil } from '../series-data.js'
import type { Grid } from '../components/scales/Grid.js'
import type { ChartElement } from '../components/Abstract.js'
import type { Charts } from '../index.js'

export class BarSeries extends SeriesRenderer {
    declare defaults: any
    initialize(input: object) {
            var options = mergeOptions(this.defaults, input) as ResolvedSeries<BarOptions>,
                barStrokeWidth = parseInt(String(options.itemStyle.normal.barBorderWidth));
            this.options = {
                index: options.index,
                name: options.name,
                barShowStroke: (barStrokeWidth > 0),
                barStrokeWidth: barStrokeWidth,
                barValueSpacing: options.barGap,
                barDatasetSpacing: options.barCategoryGap,
                fillColor: options.itemStyle.normal.color || this.instance.options.barColorDefaults[options.index % this.instance.options.barColorDefaults.length],
                strokeColor: options.itemStyle.normal.barBorderColor,
                emphasisFill: options.itemStyle.emphasis.color || this.instance.options.barColorDefaultsEmphasis[options.index % this.instance.options.barColorDefaultsEmphasis.length],
                emphasisStroke: options.itemStyle.emphasis.barBorderColor,
                emphasisStrokeWidth: options.itemStyle.emphasis.barBorderWidth,

                legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].fillColor%>\"><%if(datasets[i].label){%><%=datasets[i].label%><%}%></span></li><%}%></ul>"
            }
            this.segments = []
            this.grid = this.instance.grid;
            this.BarClass = shapeWith(Rectangle, {
                ctx: this.ctx,
                grid: this.grid,
                itemLabel: this.options.name,
                showStroke: this.options.barShowStroke,
                fillColor: this.options.fillColor,
                emphasisFill: this.options.emphasisFill,
                strokeColor: this.options.strokeColor,
                emphasisStroke: this.options.emphasisStroke,
                strokeWidth: this.options.barStrokeWidth,
                emphasisStrokeWidth: this.options.emphasisStrokeWidth,
            });
            this.buildSegments(options.data);

        }
    buildSegments(data: BarOptions["data"]) {
            eachEntry(data, function(index, value) {
                this.addSegment(index, value);
            }, this);
        }
    update(data: BarOptions["data"], datasetIndex?: number) {
            data = data || [];
            eachEntry(this.segments, function(index, segment) {
                segment.value1 = ((segment.type === 2) || (segment.type === 3)) ? (data[index] as readonly [number, number])[0] : 0,
                    segment.value2 = ((segment.type === 2) || (segment.type === 3)) ? (data[index] as readonly [number, number])[1] : data[index],
                    segment.restore(['fillColor', 'strokeColor', 'strokeWidth']);
                segment.save();
                this.calculate(index, segment);
            }, this);
            for (var index = this.segments.length; index < data.length; index++) {
                this.addSegment(index, data[index]!);
            }
        }
    addSegment(index: number, value: BarOptions["data"][number] | undefined) {
            if (this.grid.status < 4 && value != null) {
                if (typeof value === 'number') {
                    var segment = new this.BarClass({
                        type: this.grid.status,
                        value1: 0,
                        value2: value,
                        value: value
                    });
                } else if (typeof value === 'object') {
                    if ('value' in value) {
                        if (typeof value.value === 'number') {
                            var segment = new this.BarClass({
                                type: this.grid.status,
                                value1: 0,
                                value2: value.value,
                                value: value.value
                            });
                        } else if (typeof value.value === 'object') {
                            var segment = new this.BarClass({
                                type: this.grid.status + 2,
                                value1: value.value[0],
                                value2: value.value[1],
                                value: value.value
                            });
                        }
                        if (!segment) return;
                        if (value.itemStyle && value.itemStyle.normal && value.itemStyle.normal.color) {
                            segment.fillColor = value.itemStyle.normal.color;
                        }
                        if (value.itemStyle && value.itemStyle.emphasis && value.itemStyle.emphasis.color) {
                            segment.emphasisFill = value.itemStyle.emphasis.color;
                        }
                    } else {
                        var segment = new this.BarClass({
                            type: this.grid.status + 2,
                            value1: value[0],
                            value2: value[1],
                            value: value
                        });
                    }
                }
                if (!segment) return;
                segment.label = (segment.grid.status === 1) ? segment.grid.yLabels[index] : segment.grid.xLabels[index];
                segment.titleLabel = segment.label;
                this.segments.push(segment);
                this.calculate(index, segment);
                segment.save();
            }
        }
    calculate(index: number, segment: ChartElement) {
            var length = this.instance.series.bar?.length ?? 1;
            var setGap = this.options.barDatasetSpacing;
            var valGap = this.options.barValueSpacing;
            switch (segment.type) {
                case 0:
                    var width = segment.grid.calculateBarWidth(length, setGap, valGap),
                        x = segment.grid.calculateBarX(length, this.options.index, index, setGap, valGap),
                        y = segment.grid.calculateY(segment.value2);
                    Object.assign(segment, {
                        radius: width / 2,
                        x: x,
                        y: y,
                        X: x,
                        Y: y,
                        x1: x,
                        y1: segment.grid.baseY,
                        x2: x,
                        y2: segment.grid.baseY,
                    });
                    break;
                case 1:
                    var height = segment.grid.calculateBarHeight(length, setGap, valGap),
                        x = segment.grid.calculateX(segment.value2),
                        y = segment.grid.calculateBarY(length, this.options.index, index, setGap, valGap);
                    Object.assign(segment, {
                        radius: height / 2,
                        x: x,
                        y: y,
                        X: x,
                        Y: y,
                        x1: segment.grid.baseX,
                        y1: y,
                        x2: segment.grid.baseX,
                        y2: y
                    });
                    break;
                case 2:
                    var width = segment.grid.calculateBarWidth(length, setGap, valGap),
                        x = segment.grid.calculateBarX(length, this.options.index, index, setGap, valGap),
                        y1 = segment.grid.calculateY(segment.value1),
                        y2 = segment.grid.calculateY(segment.value2);
                    Object.assign(segment, {
                        radius: width / 2,
                        x: x,
                        y: (y1 + y2) / 2,
                        X: x,
                        Y: y2,
                        x1: x,
                        y1: y1,
                        x2: x,
                        y2: y1
                    });
                    break;
                case 3:
                    var height = segment.grid.calculateBarHeight(length, setGap, valGap),
                        x1 = segment.grid.calculateX(segment.value1),
                    x2 = segment.grid.calculateX(segment.value2),
                    y = segment.grid.calculateBarY(length, this.options.index, index, setGap, valGap);
                    Object.assign(segment, {
                        radius: height / 2,
                        x: (x1 + x2) / 2,
                        y: y,
                        X: x2,
                        Y: y,
                        x1: x1,
                        y1: y,
                        x2: x1,
                        y2: y
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
            var ctx = this.ctx,
                datasetIndex = this.options.index;
            var length = this.instance.series.bar?.length ?? 1;
            var setGap = this.options.barDatasetSpacing;
            var valGap = this.options.barValueSpacing;

            if (this.grid.status === 1) {
                eachEntry(this.segments, function(index, segment) {
                    if (segment.hasValue()) {
                        segment.transition({
                            radius: segment.grid.calculateBarHeight(length, setGap, valGap) / 2,
                            x1: segment.x1,
                            y1: segment.y,
                            x2: segment.X,
                            y2: segment.Y
                        }, easingDecimal).draw();
                    }
                }, this);
            } else {
                eachEntry(this.segments, function(index, segment) {
                    if (segment.hasValue()) {
                        segment.transition({
                            radius: segment.grid.calculateBarWidth(length, setGap, valGap) / 2,
                            x1: segment.x,
                            y1: segment.y1,
                            x2: segment.X,
                            y2: segment.Y
                        }, easingDecimal).draw();
                    }
                }, this);
            }
        }
}

Object.assign(BarSeries.prototype, {
    defaults: {
            name: '',
            zIndex: 0,
            itemStyle: {
                normal: {
                    color: null,
                    barBorderColor: '#000',
                    barBorderWidth: 0
                },
                emphasis: {
                    color: null,
                    barBorderColor: '#000',
                    barBorderWidth: 0
                },
            },
            barWidth: 'auto',
            barMaxWidth: 'auto',
            barGap: 5,
            barCategoryGap: 3,
            data: []
        }
})

export function bar(this: Charts) {
        var chart,
            chartName,
            id = 0;
        const grid = this.grid;
        if (grid) {
            grid.charts.bars = [];
            Object.assign(grid, {
                calculateBarX: function(this: Grid, datasetCount: number, datasetIndex: number, barIndex: number, datasetSpacing: number, valueSpacing: number) {
                    var xWidth = this.calculateBaseWidth(valueSpacing),
                        xAbsolute = this.calculateX(barIndex) - (xWidth / 2),
                        barWidth = this.calculateBarWidth(datasetCount, datasetSpacing, valueSpacing);
                    return xAbsolute + (barWidth * datasetIndex) + (datasetIndex * datasetSpacing) + barWidth / 2;
                },
                calculateBaseWidth: function(this: Grid, valueSpacing: number) {
                    return (this.calculateX(1) - this.calculateX(0)) - (2 * valueSpacing);
                },
                calculateBarWidth: function(this: Grid, datasetCount: number, datasetSpacing: number, valueSpacing: number) {
                    //The padding between datasets is to the right of each bar, providing that there are more than 1 dataset
                    var baseWidth = this.calculateBaseWidth(valueSpacing) - ((datasetCount - 1) * datasetSpacing);
                    return Math.max(0, baseWidth / datasetCount);
                },

                calculateBarY: function(this: Grid, datasetCount: number, datasetIndex: number, barIndex: number, datasetSpacing: number, valueSpacing: number) {
                    var yHeight = this.calculateBaseHeight(valueSpacing),
                        yAbsolute = this.calculateY(barIndex) + (yHeight / 2),
                        barHeight = this.calculateBarHeight(datasetCount, datasetSpacing, valueSpacing);
                    return yAbsolute - (barHeight * datasetIndex) - (datasetIndex * datasetSpacing) - barHeight / 2;
                },
                calculateBaseHeight: function(this: Grid, valueSpacing: number) {
                    return (this.calculateY(0) - this.calculateY(1)) - (2 * valueSpacing);
                },
                calculateBarHeight: function(this: Grid, datasetCount: number, datasetSpacing: number, valueSpacing: number) {
                    //The padding between datasets is to the right of each bar, providing that there are more than 1 dataset
                    var baseHeight = this.calculateBaseHeight(valueSpacing) - ((datasetCount - 1) * datasetSpacing);
                    return Math.max(0, baseHeight / datasetCount);
                }
            });

            eachEntry(this.series.bar, function(i, options) {
                options.index = id++;
                chartName = this.getChartName(options.name);
                const previous = this.historyCharts[chartName];
                if (previous && previous.type == 'bar') {
                    chart = previous;
                    chart.update(options.data, options.index);
                } else {
                    chart = new BarSeries(options, this, options.zIndex);
                    chart.type = 'bar';
                    this.historyCharts[chartName] = chart;
                }
                grid.charts.bars.push(chart);
                this.activedCharts.push(chart);
            }, this);
        }
    }
