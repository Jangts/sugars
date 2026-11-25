/*! Ported from TangramJS painter/Charts/modules/radar.js. */
import type { ChartElement } from '../components/Abstract.js'
import type { Charts } from '../index.js'
import { Polar } from '../components/scales/Polar.js'
import { eachEntry } from '../series-data.js'
import { mergeOptions } from '../series-data.js'
import { defaults } from '../defaults.js'
import * as helpers from '../util/helpers.js'
import * as events from '../util/events.js'

export const radarDefaults = {
        radar: {
            show: true,
            zIndex: 0,
            center: ['50%', '50%'],
            radius: '75%',
            shape: 'polygon',
            splitArea: {
                show: true,
                areaStyle: {
                    color: null as string | readonly string[] | null
                }
            },
            axisLine: {
                show: true,
                onZero: false,
                lineStyle: {
                    color: "rgba(0,0,0,.2)",
                    width: 1
                }
            },
            splitNumber: 5,
            splitLine: {
                show: true,
                lineStyle: {
                    color: "rgba(0,0,0,.1)",
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
            indicator: []
        }
    }

export function buildRadar(this: Charts) {
        var radar = mergeOptions(defaults.radar, this.options.radar || {});

        var style = helpers.calculateCircleStyle(radar, this.width, this.height);

        var labels: string[] = [];
        var ranges: { min: number; max?: number }[] = [];
        const data = (this.series.radar ?? []).map(series => series.data);
        const count = data.reduce((max, values) => Math.max(max, values.length), 0);
        const indicators = radar.indicator.length ? radar.indicator : Array.from({ length: count }, (_, index) => {
            const values = data.map(row => Number(row[index])).filter(Number.isFinite);
            return { name: String(index + 1), min: Math.min(0, ...values), max: Math.max(1, ...values) };
        });
        eachEntry(indicators, function(i, indicator) {
            if (typeof indicator.name === 'string') {
                labels.push(indicator.name);
                ranges.push({
                    min: indicator.min || 0,
                    max: indicator.max
                });
            };

        });

        var polarOptions = {
            status: 6,
            ranges: ranges,
            splitNumber: radar.splitNumber,
            backgroundColors: radar.splitArea.show && radar.splitArea.areaStyle.color,

            display: (radar.show == true),
            hasBar: false,
            hasScatter: false,
            instance: this,
            ctx: this.getLayer(radar.zIndex).getContext("2d"),
            radius: style.radius,
            xCenter: style.x,
            yCenter: style.y,

            angleAxisMax: labels.length,
            angleAxisMin: 0,
            angleAxisShow: (radar.axisLine.show == true),
            angleAxisLineShow: (radar.axisLine.show == true),
            angleAxisLineWidth: radar.axisLine.lineStyle.width,
            angleAxisLineColor: radar.axisLine.lineStyle.color,

            angleSplitLineShow: (radar.splitLine.show == true),
            angleSplitLineArc: (radar.shape === 'circle'),
            angleSplitLineWidth: radar.splitLine.lineStyle.width,
            angleSplitLineColor: radar.splitLine.lineStyle.color,

            angleLabelsShow: (radar.axisLabel.show == true),
            angleLabelFontColor: radar.axisLabel.textStyle.fontColor,
            angleLabelFontSize: radar.axisLabel.textStyle.fontSize,
            angleLabelFontStyle: radar.axisLabel.textStyle.fontStyle,
            angleLabelFontFamily: radar.axisLabel.textStyle.fontFamily,

            angleLabels: labels,
            angleTemplateString: radar.axisLabel.formatter,
            angleOnZero: true,
            angleBeginAtZero: true,
            angleIntegersOnly: true,

            radiusAxisMax: null,
            radiusAxisMin: 0,
            radiusAxisShow: (radar.splitLine.show == true),
            radiusAxisLineShow: (radar.axisLine.show == true),
            radiusAxisLineWidth: radar.axisLine.lineStyle.width,
            radiusAxisLineColor: radar.axisLine.lineStyle.color,

            radiusSplitLineShow: (radar.splitLine.show == true),
            radiusSplitLineWidth: radar.splitLine.lineStyle.width,
            radiusSplitLineColor: radar.splitLine.lineStyle.color,

            radiusLabelsShow: false,
            radiusLabelFontColor: radar.axisLabel.textStyle.fontColor,
            radiusLabelFontSize: radar.axisLabel.textStyle.fontSize,
            radiusLabelFontStyle: radar.axisLabel.textStyle.fontSize,
            radiusLabelFontFamily: radar.axisLabel.textStyle.fontFamily,

            radiusLabels: [],
            radiusTemplateString: radar.axisLabel.formatter,
            radiusOnZero: true,
            radiusBeginAtZero: true,
            radiusIntegersOnly: true
        };

        if (this.radarpolar === null) {
            this.radarpolar = new Polar(polarOptions);
            Object.assign(this.radarpolar, {});

            events.bindHover(this, function(evt) {
                const scale = this.radarpolar;
                if (!scale) return;
                var actives: ChartElement[] = [],
                    restores = {
                        'display': 'emphasisDisplay',
                        'fillColor': 'emphasisFill',
                        'radius': 'emphasisRadius',
                        'strokeColor': 'emphasisStroke',
                        'strokeWidth': 'emphasisStrokeWidth'
                    };
                for (var i = 0; scale.charts.radarpolar && i < scale.charts.radarpolar.length && actives.length === 0; i++) {
                    var chart = scale.charts.radarpolar[i];
                    var activeSegments = chart.getSegmentsAtEvent(evt);
                    eachEntry(chart.segments, function(index, segment) {
                        segment.restore(Object.keys(restores));
                    });
                    if (activeSegments.length > 0) {
                        eachEntry(activeSegments, function(index, activeSegment) {
                            actives.push(activeSegment);
                            eachEntry(restores, function(normal, emphasis) {
                                activeSegment[normal] = activeSegment[emphasis];
                            });
                        });
                        break;
                    }
                };
                if (this.options.tooltip.show) {
                    this.showTooltip(actives, false, true);
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
            this.radarpolar.update(polarOptions);
        }
    }
