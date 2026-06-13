import type { Landmark, FingerState, GestureMode, Point } from '../types/mediapipe';

const INDEX_TIP = 8;
const INDEX_PIP = 6;
const MIDDLE_TIP = 12;
const MIDDLE_PIP = 10;
const RING_TIP = 16;
const RING_PIP = 14;
const PINKY_TIP = 20;
const PINKY_PIP = 18;
const THUMB_TIP = 4;
const THUMB_IP = 3;
const INDEX_MCP = 5;

function isFingerExtended(landmarks: Landmark[], tipIdx: number, pipIdx: number): boolean {
  return landmarks[tipIdx].y < landmarks[pipIdx].y;
}

function isThumbExtended(landmarks: Landmark[]): boolean {
  const tip = landmarks[THUMB_TIP];
  const ip = landmarks[THUMB_IP];
  const mcp = landmarks[INDEX_MCP];
  const distToIndex = Math.hypot(tip.x - mcp.x, tip.y - mcp.y);
  const distToIp = Math.hypot(tip.x - ip.x, tip.y - ip.y);
  return distToIndex > distToIp * 1.5;
}

export function getFingerState(landmarks: Landmark[]): FingerState {
  return {
    thumb: isThumbExtended(landmarks),
    index: isFingerExtended(landmarks, INDEX_TIP, INDEX_PIP),
    middle: isFingerExtended(landmarks, MIDDLE_TIP, MIDDLE_PIP),
    ring: isFingerExtended(landmarks, RING_TIP, RING_PIP),
    pinky: isFingerExtended(landmarks, PINKY_TIP, PINKY_PIP),
  };
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function getPinchDistance(landmarks: Landmark[]): number {
  return distance(
    { x: landmarks[THUMB_TIP].x, y: landmarks[THUMB_TIP].y },
    { x: landmarks[INDEX_TIP].x, y: landmarks[INDEX_TIP].y },
  );
}

export function getMiddlePinchDistance(landmarks: Landmark[]): number {
  return distance(
    { x: landmarks[THUMB_TIP].x, y: landmarks[THUMB_TIP].y },
    { x: landmarks[MIDDLE_TIP].x, y: landmarks[MIDDLE_TIP].y },
  );
}

const PINCH_THRESHOLD = 0.04;

function isPinching(landmarks: Landmark[]): boolean {
  const dx = landmarks[INDEX_TIP].x - landmarks[THUMB_TIP].x;
  const dy = landmarks[INDEX_TIP].y - landmarks[THUMB_TIP].y;
  return Math.hypot(dx, dy) < PINCH_THRESHOLD;
}

export function recognizeGesture(
  landmarks: Landmark[],
  multiHand: Landmark[][] | undefined,
): GestureMode {
  const finger = getFingerState(landmarks);
  const extCount =
    (finger.thumb ? 1 : 0) +
    (finger.index ? 1 : 0) +
    (finger.middle ? 1 : 0) +
    (finger.ring ? 1 : 0) +
    (finger.pinky ? 1 : 0);

  if (finger.index && finger.middle && finger.ring && !finger.pinky && !finger.thumb) return 'move';

  if (isPinching(landmarks) && !finger.middle && !finger.ring && !finger.pinky) return 'move';

  if (extCount >= 4 && finger.thumb) return 'eraser';

  if (finger.index && !finger.middle && !finger.ring && !finger.pinky) return 'drawing';

  if (extCount <= 1 && !finger.thumb) return 'paused';

  if (finger.index && finger.middle && !finger.ring && !finger.pinky) {
    if (multiHand && multiHand.length >= 2) return 'clear';
    return 'save';
  }

  return 'idle';
}

export function checkHoldGesture(
  holdStart: number | null,
  requiredMs: number,
): { triggered: boolean; progress: number } {
  if (!holdStart) return { triggered: false, progress: 0 };
  const elapsed = Date.now() - holdStart;
  const progress = Math.min(elapsed / requiredMs, 1);
  return { triggered: elapsed >= requiredMs, progress };
}
