export function computePressure(
  velocity: number,
  minPressure: number = 0.3,
  maxPressure: number = 1.0,
): number {
  if (velocity <= 0) return maxPressure;
  const raw = 1 / velocity;
  return Math.max(minPressure, Math.min(maxPressure, raw));
}

export function computeVelocity(
  dx: number,
  dy: number,
  dt: number,
): number {
  if (dt <= 0) return 0;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist / dt;
}
