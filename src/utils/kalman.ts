import type { Point } from '../types/mediapipe';

export class KalmanFilter {
  private q: number;
  private r: number;
  private p: number;
  private k: number;
  private x: number;

  constructor(processNoise: number = 0.01, measurementNoise: number = 0.1) {
    this.q = processNoise;
    this.r = measurementNoise;
    this.p = 1;
    this.k = 0;
    this.x = 0;
  }

  update(measurement: number): number {
    this.p = this.p + this.q;
    this.k = this.p / (this.p + this.r);
    this.x = this.x + this.k * (measurement - this.x);
    this.p = (1 - this.k) * this.p;
    return this.x;
  }

  reset(): void {
    this.p = 1;
    this.k = 0;
    this.x = 0;
  }
}

export class PointKalmanFilter {
  private kx: KalmanFilter;
  private ky: KalmanFilter;

  constructor(processNoise: number = 0.01, measurementNoise: number = 0.1) {
    this.kx = new KalmanFilter(processNoise, measurementNoise);
    this.ky = new KalmanFilter(processNoise, measurementNoise);
  }

  update(point: Point): Point {
    return {
      x: this.kx.update(point.x),
      y: this.ky.update(point.y),
    };
  }

  reset(): void {
    this.kx.reset();
    this.ky.reset();
  }
}
