/*! Ported from TangramJS painter/Charts/util/helpers.js. */

/* 将图表配置换算为绘图区、刻度和坐标，供直角坐标、极坐标与扇区共用。 */

import { minNumber, maxNumber } from "../series-data.js"

type XY = { x: number; y: number }
type CircleOptions = Pick<import('../types.js').PieSeries, 'center' | 'radius'>

export function aliasPixel(pixelWidth: number) {
  return (pixelWidth % 2 === 0) ? 0 : 0.5;
}

export function calculateCircleStyle(options: CircleOptions, width: number, height: number) {
  var maxRadius = minNumber([width, height]) / 2;
  let radius = maxRadius * 0.75,
      x = width / 2,
      y = height / 2;

  if (options.radius) {
      if (isPercent(options.radius)) {
          radius = maxRadius * parseInt(options.radius as string) / 100
      } else if (isNumeric(options.radius)) {
          radius = parseFloat(options.radius as string);
      }
  }

  if (Array.isArray(options.center) && options.center.length === 2) {
      if (isPercent(options.center[0])) {
          x = width * parseInt(options.center[0] as string) / 100
      } else if (isNumeric(options.center[0])) {
          x = parseFloat(options.center[0] as string);
      }
      if (isPercent(options.center[1])) {
          y = height * parseInt(options.center[1] as string) / 100
      } else if (isNumeric(options.center[1])) {
          y = parseFloat(options.center[1] as string);
      }
  }
  return {
      maxRadius: maxRadius,
      radius: radius,
      x: x,
      y: y
  }
}

export function calculateDoughnutStyle(options: CircleOptions, width: number, height: number) {
  var maxRadius = minNumber([width, height]) / 2;
  let innerRadius = 0,
      outerRadius = maxRadius * 0.75,
      x = width / 2,
      y = height / 2;
  if (isNumeric(options.radius)) outerRadius = Number(options.radius);
  else if (isPercent(options.radius)) outerRadius = maxRadius * parseFloat(options.radius as string) / 100;
  else if (Array.isArray(options.radius)) {
      if (options.radius[0]) {
          if (isPercent(options.radius[0])) {
              innerRadius = maxRadius * parseInt(options.radius[0] as string) / 100
          } else if (isNumeric(options.radius[0])) {
              innerRadius = parseFloat(options.radius[0] as string);
          }
      }
      if (options.radius[1]) {
          if (isPercent(options.radius[1])) {
              outerRadius = maxRadius * parseInt(options.radius[1] as string) / 100
          } else if (isNumeric(options.radius[1])) {
              outerRadius = parseFloat(options.radius[1] as string);
          }
      }

  }

  if (Array.isArray(options.center) && options.center.length === 2) {
      if (isPercent(options.center[0])) {
          x = width * parseInt(options.center[0] as string) / 100
      } else if (isNumeric(options.center[0])) {
          x = parseFloat(options.center[0] as string);
      }
      if (isPercent(options.center[1])) {
          y = height * parseInt(options.center[1] as string) / 100
      } else if (isNumeric(options.center[1])) {
          y = parseFloat(options.center[1] as string);
      }
  }
  return {
      maxRadius: maxRadius,
      innerRadius: innerRadius,
      outerRadius: outerRadius,
      x: x,
      y: y
  }
}

export function calculateOrderOfMagnitude(val: number) {
  return Math.floor(Math.log(val) / Math.LN10);
}

type RectangleOptions = import('../types.js').GridOptions

export function calculateRectangleStyle(options: RectangleOptions, width: number, height: number) {
  const size = (value: RectangleOptions['width'], total: number, fallback = 0) =>
    isPercent(value) ? total * Number.parseFloat(String(value)) / 100 : isNumeric(value) ? Number(value) : fallback
  const right = size(options.right, width)
  const top = size(options.top, height)
  const bottom = size(options.bottom, height)
  const specifiedWidth = size(options.width, width, NaN)
  const left = size(options.left, width, Number.isFinite(specifiedWidth) ? width - right - specifiedWidth : 0)
  return {
    width: Math.max(0, size(options.width, width, width - left - right)),
    height: Math.max(0, size(options.height, height, height - top - bottom)),
    top,
    left,
  }
}

export function calculateScaleRange(valuesArray: number[], drawingSize: number, textSize: number, startFromZero: boolean, integersOnly: boolean, isXoA = false, isPolar = false) {
  const minSteps = isPolar && isXoA ? 4 : 2
  const maxSteps = Math.min(20, Math.floor((isPolar && isXoA ? Math.PI * drawingSize * 2 : drawingSize) / (textSize * 1.5)))
  let skipFitting = !(maxSteps > minSteps)

  var minValue = minNumber(valuesArray),
      maxValue = maxNumber(valuesArray);

  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
    minValue = 0
    maxValue = 1
  }
  if (startFromZero && maxValue < 0) maxValue = 0
  if (maxValue === minValue) {
      maxValue += 0.5;
      if (minValue >= 0.5 && !startFromZero) {
          minValue -= 0.5;
      } else {
          maxValue += 0.5;
      }
  }

  var valueRange = Math.abs(maxValue - minValue),
      rangeOrderOfMagnitude = calculateOrderOfMagnitude(valueRange),
      graphMax = Math.ceil(maxValue / (1 * Math.pow(10, rangeOrderOfMagnitude))) * Math.pow(10, rangeOrderOfMagnitude),
      graphMin = (startFromZero && minValue >= 0) ? 0 : Math.floor(minValue / (1 * Math.pow(10, rangeOrderOfMagnitude))) * Math.pow(10, rangeOrderOfMagnitude),
      graphRange = graphMax - graphMin,
      stepValue = Math.pow(10, rangeOrderOfMagnitude),
      numberOfSteps = Math.round(graphRange / stepValue);

  while ((numberOfSteps > maxSteps || (numberOfSteps * 2) < maxSteps) && !skipFitting) {
      if (numberOfSteps > maxSteps) {
          stepValue *= 2;
          numberOfSteps = Math.round(graphRange / stepValue);
          // 刻度步数须为整数。无法配平时回退到最少步数。
          if (numberOfSteps % 1 !== 0) {
              skipFitting = true;
          }
      } else {
          // 对整数值域先考虑整数步长。
          if (integersOnly && rangeOrderOfMagnitude >= 0) {
              // 只有缩小后仍是整数步长时才增加刻度密度。
              if (stepValue / 2 % 1 === 0) {
                  stepValue /= 2;
                  numberOfSteps = Math.round(graphRange / stepValue);
              } else {
                  break;
              }
          } else {
              stepValue /= 2;
              numberOfSteps = Math.round(graphRange / stepValue);
          }
      }
  }

  if (skipFitting) {
      numberOfSteps = minSteps;
      stepValue = graphRange / numberOfSteps;
  }

  if (isPolar) {
      return [numberOfSteps, stepValue] as [number, number];
  }

  if (isXoA) {
      return {
          xSteps: numberOfSteps,
          xStepValue: stepValue,
          minX: graphMin,
          maxX: graphMin + (numberOfSteps * stepValue)
      };
  }

  return {
      ySteps: numberOfSteps,
      yStepValue: stepValue,
      minY: graphMin,
      maxY: graphMin + (numberOfSteps * stepValue)
  };
}

export function getAngleFromPoint(centrePoint: XY, anglePoint: XY) {
  var distanceFromXCenter = anglePoint.x - centrePoint.x,
      distanceFromYCenter = anglePoint.y - centrePoint.y,
      radialDistanceFromCenter = Math.sqrt(distanceFromXCenter * distanceFromXCenter + distanceFromYCenter * distanceFromYCenter);

  var angle = Math.PI * 2 + Math.atan2(distanceFromYCenter, distanceFromXCenter);

  // 左上象限的角度需要补一周，使角度顺着绘制方向连续。
  if (distanceFromXCenter < 0 && distanceFromYCenter < 0) {
      angle += Math.PI * 2;
  }

  return {
      angle: angle,
      distance: radialDistanceFromCenter
  };
}

export function splineCurve(FirstPoint: XY, MiddlePoint: XY, AfterPoint: XY, t: number) {
  var d01 = Math.sqrt(Math.pow(MiddlePoint.x - FirstPoint.x, 2) + Math.pow(MiddlePoint.y - FirstPoint.y, 2)),
      d12 = Math.sqrt(Math.pow(AfterPoint.x - MiddlePoint.x, 2) + Math.pow(AfterPoint.y - MiddlePoint.y, 2)),
      fa = t * d01 / (d01 + d12 || 1),
      // 用相邻折线段的长度比例缩放曲线控制点。
      fb = t * d12 / (d01 + d12 || 1);
  return {
      inner: {
          x: MiddlePoint.x - fa * (AfterPoint.x - FirstPoint.x),
          y: MiddlePoint.y - fa * (AfterPoint.y - FirstPoint.y)
      },
      outer: {
          x: MiddlePoint.x + fb * (AfterPoint.x - FirstPoint.x),
          y: MiddlePoint.y + fb * (AfterPoint.y - FirstPoint.y)
      }
  };
}

export function isNumeric(value: unknown): boolean {
  return (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) && Number.isFinite(Number(value))
}

export function isPercent(value: unknown): boolean {
  return typeof value === 'string' && /^-?(?:[0-9]+(?:[.][0-9]+)?|[.][0-9]+)%$/.test(value)
}

export function getDecimalPlaces(value: number): number {
  const [coefficient, exponent = '0'] = String(value).split('e')
  return Math.max(0, (coefficient?.split('.')[1]?.length ?? 0) - Number(exponent))
}

export function template(
  format: string | ((value: any) => string) | undefined, values: Record<string, unknown>,
): string {
  if (typeof format === 'function') return String(format(values))
  if (format === '<%if (label){%><%=label%> : <%}%><%= value %>') {
    return values.label ? `${values.label} : ${values.value ?? ''}` : String(values.value ?? '')
  }
  return (format ?? '<%= value %>').replace(/<%=\s*(\w+)\s*%>/g,
    (_, key: string) => String(values[key] ?? ''))
}
