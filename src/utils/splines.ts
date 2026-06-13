import type { StrokePoint, Point } from '../types/mediapipe';

export function catmullRom2D(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number,
): Point {
  function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      0.5 *
      (2 * p1 +
        (-p0 + p2) * t +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
        (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
    );
  }
  return {
    x: catmullRom(p0.x, p1.x, p2.x, p3.x, t),
    y: catmullRom(p0.y, p1.y, p2.y, p3.y, t),
  };
}

export function interpolateStrokePoints(
  points: StrokePoint[],
  segmentsPerPair: number = 8,
): Point[] {
  if (points.length < 2) return points.map((p) => ({ x: p.x, y: p.y }));
  if (points.length === 2) {
    const result: Point[] = [];
    for (let i = 0; i <= segmentsPerPair; i++) {
      const t = i / segmentsPerPair;
      result.push({
        x: points[0].x + (points[1].x - points[0].x) * t,
        y: points[0].y + (points[1].y - points[0].y) * t,
      });
    }
    return result;
  }

  const result: Point[] = [];
  const lastIdx = points.length - 1;
  for (let i = 0; i < lastIdx; i++) {
    const p0 = i > 0
      ? points[i - 1]
      : { x: 2 * points[0].x - points[1].x, y: 2 * points[0].y - points[1].y };
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < lastIdx - 1
      ? points[i + 2]
      : { x: 2 * points[lastIdx].x - points[lastIdx - 1].x, y: 2 * points[lastIdx].y - points[lastIdx - 1].y };

    for (let j = 0; j < segmentsPerPair; j++) {
      const t = j / segmentsPerPair;
      result.push(catmullRom2D(p0, p1, p2, p3, t));
    }
  }
  const last = points[lastIdx];
  result.push({ x: last.x, y: last.y });
  return result;
}
