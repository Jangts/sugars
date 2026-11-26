/*! Adapted from TangramJS painter/canvas.js. */

/* 提供多个图层和系列共用的 Canvas 操作，包括像素比缩放、文字测量与基础路径。 */

export function fontString(pixelSize: number, fontStyle: string, fontFamily: string): string {
  return `${fontStyle} ${pixelSize}px ${fontFamily}`
}

export function longestText(ctx: CanvasRenderingContext2D, font: string, strings: readonly unknown[]): number {
  ctx.font = font
  return strings.reduce<number>((longest, value) => Math.max(longest, ctx.measureText(String(value)).width), 0)
}

export function drawRoundedRectangle(ctx: CanvasRenderingContext2D, x: number, y: number,
  width: number, height: number, radius: number): void {
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, Math.max(0, radius))
}

export function drawDashLine(ctx: CanvasRenderingContext2D, x1: number, y1: number,
  x2: number, y2: number, dashLength = 5): void {
  ctx.save()
  ctx.beginPath()
  ctx.setLineDash([Math.max(1, dashLength)])
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.restore()
}
