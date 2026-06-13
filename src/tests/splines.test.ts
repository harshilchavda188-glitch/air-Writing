import { describe, it, expect } from 'vitest';
import { catmullRom2D, interpolateStrokePoints } from '../utils/splines';
import type { StrokePoint } from '../types/mediapipe';

describe('catmullRom2D', () => {
  it('returns midpoint for t=0.5 on linear points', () => {
    const r = catmullRom2D({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 10 }, { x: 10, y: 10 }, 0.5);
    expect(r.x).toBeCloseTo(5, 1);
    expect(r.y).toBeCloseTo(5, 1);
  });

  it('returns p1 for t=0', () => {
    const r = catmullRom2D({ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 10, y: 10 }, { x: 15, y: 15 }, 0);
    expect(r.x).toBeCloseTo(5, 1);
    expect(r.y).toBeCloseTo(5, 1);
  });
});

describe('interpolateStrokePoints', () => {
  it('returns at least 2 points for 2 input points', () => {
    const pts: StrokePoint[] = [
      { x: 0, y: 0, pressure: 0.5, timestamp: 0 },
      { x: 10, y: 10, pressure: 0.5, timestamp: 1 },
    ];
    const result = interpolateStrokePoints(pts, 8);
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0]).toEqual({ x: 0, y: 0 });
    expect(result[result.length - 1]).toEqual({ x: 10, y: 10 });
  });

  it('handles single point', () => {
    const pts: StrokePoint[] = [{ x: 5, y: 5, pressure: 0.5, timestamp: 0 }];
    const result = interpolateStrokePoints(pts, 8);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ x: 5, y: 5 });
  });
});
