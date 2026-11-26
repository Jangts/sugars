/*! Ported from TangramJS painter/Charts/types/Pie.js. */
import type { PieSeries as PieOptions, Datum } from '../types.js'
import { SeriesRenderer, type ResolvedSeries } from './Abstract.js'
import { Arc } from '../components/sharps/Arc.js'
import { mergeOptions } from '../series-data.js'
import { isNumeric } from '../util/helpers.js'
import { isPercent } from '../util/helpers.js'
import * as helpers from '../util/helpers.js'
import { shapeWith } from '../components/Abstract.js'
import { eachEntry } from '../series-data.js'
import { maxNumber } from '../series-data.js'
import { sum } from 'lodash-es'
import * as events from '../util/events.js'
import type { ChartElement } from '../components/Abstract.js'
import type { Charts } from '../index.js'
import { visitUntil } from '../series-data.js'

var defaultConfig = {
            name: '',
            zIndex: 0,
            center: ['50%', '50%'],
            radius: [0, '75%', '80%'],
            roseType: false,
            itemStyle: {
                normal: {
                    color: null,
                    borderColor: '#000',
                    borderWidth: 0,
                },
                emphasis: {
                    color: null,
                    borderColor: null,
                    borderWidth: 1
                }
            },
            label: {
                normal: {
                    show: false,
                    position: 'outside',
                    formatter: '',
                    textStyle: {
                        color: '#fff',
                        fontStyle: 'normal',
                        fontWeight: 'normal',
                        fontFamily: '\'Microsoft YaHei\', \'Hiragino Sans\', \'Helvetica Neue\', \'Helvetica\', \'Arial\', sans-serif',
                        fontSize: 12,
                    }
                },
                emphasis: {
                    show: false,
                    formatter: '',
                    textStyle: {
                        color: '#fff',
                        fontStyle: 'normal',
                        fontWeight: 'normal',
                        fontFamily: '\'Microsoft YaHei\', \'Hiragino Sans\', \'Helvetica Neue\', \'Helvetica\', \'Arial\', sans-serif',
                        fontSize: 12,
                    }
                }
            },
            animateRotate: true,
            animateScale: false,
            data: []
        };

export class PieSeries extends SeriesRenderer {
    declare defaults: any
    initialize(input: object) {
            var instance = this.instance,
                options = mergeOptions(this.defaults, input) as ResolvedSeries<PieOptions>,
                barStrokeWidth = parseInt(String(options.itemStyle.normal.borderWidth)),
                emphasisRadius;


            var style = helpers.calculateDoughnutStyle(options, instance.width, instance.height),
                maxRadius = style.maxRadius,
                innerRadius = style.innerRadius,
                outerRadius = style.outerRadius,
                x = style.x,
                y = style.y;

            if (Array.isArray(options.radius) && options.radius[2]) {
                if (isPercent(options.radius[2])) {
                    emphasisRadius = maxRadius * parseInt(options.radius[2]) / 100
                } else if (isNumeric(options.radius[2])) {
                    emphasisRadius = parseFloat(options.radius[2]);
                } else {
                    emphasisRadius = outerRadius + 5;
                }
            } else {
                emphasisRadius = outerRadius + 5;
            }

            this.options = {
                index: options.index,
                name: options.name,
                animateRotate: options.animateRotate,
                animateScale: options.animateScale,

                innerRadius: innerRadius,
                outerRadius: outerRadius,
                emphasisRadius: emphasisRadius,
                fillColor: options.itemStyle.normal.color,
                emphasisFill: options.itemStyle.emphasis.color,
                center: [x, y],

                segmentShowStroke: (barStrokeWidth > 0),
                segmentStrokeColor: options.itemStyle.normal.borderColor || '#FFFFFF',
                segmentStrokeWidth: barStrokeWidth,

                legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<segments.length; i++){%><li><span style=\"background-color:<%=segments[i].fillColor%>\"><%if(segments[i].label){%><%=segments[i].label%><%}%></span></li><%}%></ul>"
            };

            if (options.roseType) {
                switch (options.roseType) {
                    case 'area':
                        this.options.type = 'area';
                        break;
                    case 'angle':
                        this.options.type = 'angle';
                        break;
                    default:
                        this.options.type = 'radius';
                }
            } else {
                this.options.type = 'pie';
            }

            this.ArcClass = shapeWith(Arc, {
                ctx: this.ctx,
                showStroke: this.options.segmentShowStroke,
                strokeWidth: this.options.segmentStrokeWidth,
                strokeColor: this.options.segmentStrokeColor,
                x: x,
                y: y,
                innerRadius: this.options.animateScale ? 0 : this.options.innerRadius,
                emphasisRadius: this.options.animateScale ? 0 : this.options.emphasisRadius,
                //oRadius: (this.options.outerRadius - this.options.innerRadius),
                iRadius: this.options.innerRadius,
                eRadius: this.options.emphasisRadius,
                startAngle: Math.PI * 1.5
            });

            this.segments = [];
            this.buildSegment(options.data.flatMap(value => {
                const datum = typeof value === 'number' ? { value } : value;
                return datum && Number.isFinite(datum.value) && datum.value >= 0 ? [datum] : [];
            }));

        }
    buildSegment(data: readonly Datum<number>[]) {
            this.calculateTotalAndMax(data);
            eachEntry(data, function(index, elem) {
                this.addSegment(index, elem, data.length);
            }, this);
        }
    update(data: readonly Datum<number>[]) {
            this.calculateTotalAndMax(data);
            var leng = maxNumber([data.length, this.segments.length]);
            eachEntry(this.segments, function(index, segment) {
                segment.value = data && data[index] && data[index].value || 0,
                    segment.restore(['fillColor', 'oRadius']);
                segment.outerRadius = this.options.outerRadius;
                segment.innerRadius = this.options.innerRadius;
                segment.emphasisRadius = this.options.emphasisRadius;
                segment.save();
            }, this);
            for (var index = this.segments.length; index < data.length; index++) {
                this.addSegment(index, data[index]!, leng);
            }
        }
    addSegment(index: number, elem: Datum<number>, leng: number) {
            var h = (360 * index / leng + 350) % 360,
                s = [70, 85, 60, 35, 40, 35, 100, 95, 30, 35, 10, 65],
                l = [60, 60, 60, 50, 50, 50, 40, 40, 35, 60, 70, 60],
                e = [70, 70, 70, 60, 60, 60, 50, 50, 50, 70, 75, 70],
                i = Math.floor((h + 15) / 30),
                angle = this.calculateCircumference(elem.value),
                radius = this.calculateRadius(elem.value),
                fillColor, emphasisFill;

            if (elem.itemStyle && elem.itemStyle.normal && elem.itemStyle.normal.color) {
                fillColor = elem.itemStyle.normal.color;
            } else {
                switch (this.options.fillColor == null ? "" : typeof this.options.fillColor) {
                    case 'object':
                        fillColor = this.options.fillColor[index];
                        break;
                    case 'string':
                        fillColor = this.options.fillColor;
                        break;
                    default:
                        fillColor = 'hsl(' + h + ', ' + s[i % 12] + '%, ' + l[i % 12] + '%)';
                }
            }

            if (elem.itemStyle && elem.itemStyle.emphasis && elem.itemStyle.emphasis.color) {
                emphasisFill = elem.itemStyle.emphasis.color;
            } else {
                switch (this.options.emphasisFill == null ? "" : typeof this.options.emphasisFill) {
                    case 'object':
                        emphasisFill = this.options.emphasisFill[index];
                        break;
                    case 'string':
                        emphasisFill = this.options.emphasisFill;
                        break;
                    default:
                        emphasisFill = 'hsl(' + h + ', ' + s[i % 12] + '%, ' + e[i % 12] + '%)';
                }
            }

            var segment = new this.ArcClass({
                value: elem.value,
                label: elem.name,
                fillColor: fillColor,
                emphasisFill: emphasisFill,
                circumference: this.options.animateRotate ? 0 : angle,
                outerRadius: this.options.animateScale ? 0 : radius,
                oRadius: radius
            });
            this.segments.push(segment);
            segment.save();
        }
    calculateTotalAndMax(data: readonly Datum<number>[]) {
            var values: number[] = [];
            if (this.options.type === 'area') {
                eachEntry(data, function(index, segment) {
                    values.push(Math.sqrt(segment.value));
                }, this);
            } else {
                eachEntry(data, function(index, segment) {
                    values.push(parseFloat(segment.value));
                }, this);
            }
            this.length = data.length;
            this.total = sum(values);
            this.max = maxNumber(values);
        }
    calculateCircumference(value: number) {
            if (this.total > 0) {
                switch (this.options.type) {
                    case 'area':
                        return (Math.PI * 2) * (Math.sqrt(value) / this.total);
                    case 'radius':
                        return (Math.PI * 2) * (1 / this.length);
                    case 'angle':
                    case 'pie':
                        return (Math.PI * 2) * (value / this.total);
                }
            } else {
                return 0;
            }
        }
    calculateRadius(value: number) {
            if (this.total > 0) {
                switch (this.options.type) {
                    case 'area':
                        return (this.options.outerRadius - this.options.innerRadius) * (Math.sqrt(value) / this.max) + this.options.innerRadius;
                    case 'radius':
                    case 'angle':
                        return (this.options.outerRadius - this.options.innerRadius) * (value / this.max) + this.options.innerRadius;
                    case 'pie':
                        return this.options.outerRadius;
                }
            } else {
                return 0;
            }
        }
    removeSegment(index: string | number) {
            index = parseInt(index as string) || 0;
            this.segments.splice(index, 1);
        }
    getSegmentsAtEvent(e: MouseEvent | TouchEvent) {
            var segmentsArray: ChartElement[] = [];
            var location = events.getRelativePosition(e);
            eachEntry(this.segments, function(index, segment) {
                if (segment.inRange(location.x, location.y))
                    segmentsArray.push(segment);
                segment.restore(['fillColor', 'oRadius']);
            }, this);
            return segmentsArray;
        }
    draw(easeDecimal?: number) {
            var animDecimal = easeDecimal ?? 1;
            eachEntry(this.segments, function(index, segment) {
                segment.transition({
                    circumference: this.calculateCircumference(segment.value),
                    outerRadius: this.calculateRadius(segment.value),
                    innerRadius: segment.iRadius
                }, animDecimal);
                segment.endAngle = segment.startAngle + segment.circumference;
                if (index < this.segments.length - 1) {
                    this.segments[index + 1]!.startAngle = segment.endAngle;
                }
                segment.draw();
            }, this);

        }
}

Object.assign(PieSeries.prototype, {
    defaults: defaultConfig
})

export function pie(this: Charts) {
        var chart,
            chartName,
            id = 0;
        eachEntry(this.series.pie, function(i, options) {
            //options.index = id++;
            chartName = this.getChartName(options.name);
            const previous = this.historyCharts[chartName];
            if (previous && previous.type == 'pie') {
                chart = previous;
                chart.update(options.data, options.index);
            } else {
                chart = new PieSeries(options, this, options.zIndex);
                chart.type = 'pie';
                this.historyCharts[chartName] = chart;
                events.bindHover(this, function(evt) {
                    var activeSegments: ChartElement[] = [];
                    visitUntil(this.activedCharts, function(i, chart) {
                        activeSegments = chart.getSegmentsAtEvent(evt);
                        if (activeSegments.length) {
                            return false;
                        }
                    });
                    eachEntry(activeSegments, function(index, activeSegment) {
                        activeSegment.fillColor = activeSegment.emphasisFill;
                        activeSegment.oRadius = activeSegment.eRadius;
                    });
                    if (this.options.tooltip.show) {
                        this.showTooltip(activeSegments);
                    }
                    if (activeSegments.length > 0) {
                        this.actived = 1;
                        this.Element.style.cursor = 'pointer';
                    } else {
                        this.actived = 0;
                        this.Element.style.cursor = 'default';
                    }
                });
            }
            this.activedCharts.push(chart);
        }, this);
    }
