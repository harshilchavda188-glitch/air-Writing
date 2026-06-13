import { describe, it, expect } from 'vitest';
import { recognizeGesture, getFingerState, checkHoldGesture } from '../utils/gestureUtils';
import type { Landmark } from '../types/mediapipe';

function makeLandmarks(config: { tip: number[]; pip: number[] }): Landmark[] {
  const lm: Landmark[] = [];
  const tipSet = new Set(config.tip);
  const pipSet = new Set(config.pip);
  for (let i = 0; i < 21; i++) {
    if (tipSet.has(i)) {
      lm.push({ x: 0.5, y: 0.35, z: 0, visibility: 1 });
    } else if (pipSet.has(i)) {
      lm.push({ x: 0.5, y: 0.55, z: 0, visibility: 1 });
    } else {
      lm.push({ x: 0.5, y: 0.5, z: 0, visibility: 1 });
    }
  }
  return lm;
}

describe('getFingerState', () => {
  it('detects extended index finger', () => {
    const lm = makeLandmarks({ tip: [8], pip: [6] });
    const state = getFingerState(lm);
    expect(state.index).toBe(true);
  });

  it('detects folded index finger', () => {
    const lm = makeLandmarks({ tip: [6], pip: [8] });
    const state = getFingerState(lm);
    expect(state.index).toBe(false);
  });
});

describe('recognizeGesture', () => {
  it('returns drawing when only index is extended', () => {
    const lm = makeLandmarks({ tip: [8], pip: [6, 10, 14, 18] });
    expect(recognizeGesture(lm, undefined)).toBe('drawing');
  });

  it('returns eraser when all fingers extended', () => {
    const lm = makeLandmarks({ tip: [4, 8, 12, 16, 20], pip: [3, 6, 10, 14, 18] });
    expect(recognizeGesture(lm, undefined)).toBe('eraser');
  });

  it('returns paused when fist', () => {
    const lm = makeLandmarks({ tip: [6, 10, 14, 18], pip: [8, 12, 16, 20] });
    expect(recognizeGesture(lm, undefined)).toBe('paused');
  });

  it('returns idle for ambiguous gesture', () => {
    const lm = makeLandmarks({ tip: [4, 8], pip: [6, 10, 14, 18] });
    expect(recognizeGesture(lm, undefined)).toBe('idle');
  });
});

describe('checkHoldGesture', () => {
  it('returns not triggered when holdStart is null', () => {
    const r = checkHoldGesture(null, 1000);
    expect(r.triggered).toBe(false);
    expect(r.progress).toBe(0);
  });

  it('returns triggered after duration', () => {
    const r = checkHoldGesture(Date.now() - 1500, 1000);
    expect(r.triggered).toBe(true);
    expect(r.progress).toBe(1);
  });

  it('returns progress between 0 and 1', () => {
    const r = checkHoldGesture(Date.now() - 500, 1000);
    expect(r.triggered).toBe(false);
    expect(r.progress).toBeCloseTo(0.5, 1);
  });
});
