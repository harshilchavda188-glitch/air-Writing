import type { Stroke, Point } from '../types/mediapipe';
import { interpolateStrokePoints } from '../utils/splines';

function hsl(h: number, s: number, l: number): string {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function drawNeonStroke(ctx: CanvasRenderingContext2D, stroke: Stroke, glowScale: number): void {
  if (stroke.points.length < 2) return;

  ctx.save();

  const { color, size, opacity } = stroke;

  if (stroke.brushType === 'rainbow') {
    const pts = interpolateStrokePoints(stroke.points, 10);
    if (pts.length < 2) { ctx.restore(); return; }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    drawRainbowStroke(ctx, pts, stroke, glowScale);
  } else if (stroke.brushType === 'trail') {
    const pts = interpolateStrokePoints(stroke.points, 10);
    if (pts.length < 2) { ctx.restore(); return; }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    drawTrailStroke(ctx, pts, stroke, glowScale);
  } else if (stroke.brushType === 'pen') {
    const pts = interpolateStrokePoints(stroke.points, 4);
    if (pts.length < 2) { ctx.restore(); return; }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    drawPenStroke(ctx, pts, color, size, opacity);
  } else if (stroke.brushType === 'marker') {
    const pts = interpolateStrokePoints(stroke.points, 6);
    if (pts.length < 2) { ctx.restore(); return; }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    drawMarkerStroke(ctx, pts, color, size, opacity, glowScale);
  } else if (stroke.brushType === 'calligraphy') {
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
    drawCalligraphyStroke(ctx, stroke.points, color, opacity);
  } else {
    const pts = interpolateStrokePoints(stroke.points, 10);
    if (pts.length < 2) { ctx.restore(); return; }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    drawNeonGlow(ctx, pts, color, size, opacity, glowScale);
  }

  ctx.restore();
}

function drawNeonGlow(
  ctx: CanvasRenderingContext2D,
  pts: Point[],
  color: string,
  size: number,
  opacity: number,
  glowScale: number,
): void {
  const glow = Math.max(size * 3 * glowScale, 15);

  ctx.globalAlpha = opacity * 0.3;
  ctx.shadowBlur = glow;
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 1.8;
  drawPath(ctx, pts);
  ctx.stroke();

  ctx.globalAlpha = opacity * 0.7;
  ctx.shadowBlur = glow * 0.5;
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  drawPath(ctx, pts);
  ctx.stroke();

  ctx.globalAlpha = opacity * 0.9;
  ctx.shadowBlur = size * 0.3;
  ctx.shadowColor = '#ffffff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(size * 0.25, 1);
  drawPath(ctx, pts);
  ctx.stroke();
}

function drawRainbowStroke(
  ctx: CanvasRenderingContext2D,
  pts: Point[],
  stroke: Stroke,
  glowScale: number,
): void {
  const { size, opacity } = stroke;
  const glow = Math.max(size * 3 * glowScale, 15);

  ctx.globalAlpha = opacity;
  ctx.shadowBlur = glow * 0.5;
  ctx.shadowColor = '#ffffff';

  for (let i = 0; i < pts.length - 1; i++) {
    const t = i / (pts.length - 1);
    const hue = (t * 360 + performance.now() * 0.05) % 360;
    const c = hsl(hue, 100, 60);

    ctx.strokeStyle = c;
    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(pts[i].x, pts[i].y);
    const xc = (pts[i].x + pts[i + 1].x) / 2;
    const yc = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
    ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
    ctx.stroke();
  }

  ctx.globalAlpha = opacity * 0.5;
  ctx.shadowBlur = glow;
  ctx.shadowColor = '#ffffff';
  ctx.lineWidth = size * 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  drawPath(ctx, pts);
  ctx.stroke();
}

function drawTrailStroke(
  ctx: CanvasRenderingContext2D,
  pts: Point[],
  stroke: Stroke,
  glowScale: number,
): void {
  const { color, size, opacity } = stroke;
  const glow = Math.max(size * 3 * glowScale, 15);

  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';

  for (let i = 0; i < pts.length - 1; i++) {
    const t = i / (pts.length - 1);
    const trailAlpha = (t / pts.length) * 0.3;

    const w = size * (0.3 + t * 1.2);

    ctx.globalAlpha = trailAlpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = w * 2.5;
    ctx.beginPath();
    ctx.moveTo(pts[i].x, pts[i].y);
    ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
    ctx.stroke();
  }

  ctx.globalAlpha = opacity * 0.8;
  ctx.shadowBlur = glow * 0.6;
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  drawPath(ctx, pts);
  ctx.stroke();

  ctx.globalAlpha = opacity;
  ctx.shadowBlur = size * 0.3;
  ctx.shadowColor = '#ffffff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(size * 0.2, 1);
  drawPath(ctx, pts);
  ctx.stroke();
}

function drawPenStroke(
  ctx: CanvasRenderingContext2D,
  pts: Point[],
  color: string,
  size: number,
  opacity: number,
): void {
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.stroke();
}

function drawMarkerStroke(
  ctx: CanvasRenderingContext2D,
  pts: Point[],
  color: string,
  size: number,
  opacity: number,
  glowScale: number,
): void {
  const glow = Math.max(size * 2 * glowScale, 8);

  ctx.globalAlpha = opacity * 0.35;
  ctx.shadowBlur = glow;
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 1.4;
  drawPath(ctx, pts);
  ctx.stroke();

  ctx.globalAlpha = opacity * 0.75;
  ctx.shadowBlur = glow * 0.3;
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  drawPath(ctx, pts);
  ctx.stroke();
}

function drawCalligraphyStroke(
  ctx: CanvasRenderingContext2D,
  rawPts: import('../types/mediapipe').StrokePoint[],
  color: string,
  opacity: number,
): void {
  if (rawPts.length < 2) return;
  const pts = interpolateStrokePoints(rawPts, 8);
  if (pts.length < 2) return;

  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.shadowBlur = 0;

  for (let i = 0; i < pts.length - 1; i++) {
    const pressure = rawPts[Math.min(i, rawPts.length - 1)].pressure;
    const w = Math.max(1, pressure * 8);
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(pts[i].x, pts[i].y);
    ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
    ctx.stroke();
  }
}

function drawPath(ctx: CanvasRenderingContext2D, pts: Point[]): void {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const xc = (pts[i].x + pts[i + 1].x) / 2;
    const yc = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last.x, last.y);
}

export function drawAllStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  width: number,
  height: number,
  glowIntensity: number,
): void {
  ctx.clearRect(0, 0, width, height);
  for (const s of strokes) {
    if (s.points.length < 2) continue;
    drawNeonStroke(ctx, s, glowIntensity);
  }
}
