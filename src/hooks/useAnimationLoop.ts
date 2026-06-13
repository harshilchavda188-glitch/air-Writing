import { useEffect, useRef } from 'react';
import type { Landmark, GestureMode, StrokePoint, Stroke } from '../types/mediapipe';
import { useDrawingStore } from '../store/drawingStore';
import { ParticlePool, emitSpark, emitFire, emitSmoke, emitGalaxy, emitRainbow, emitInk, renderParticles } from '../particles/ParticlePool';
import { drawAllStrokes } from '../rendering/neonRenderer';
import { computePressure, computeVelocity } from '../utils/pressure';
import { recognizeGesture } from '../utils/gestureUtils';

interface Opts {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  landmarksRef: React.RefObject<Landmark[][]>;
  getGesture: (lm: Landmark[] | undefined, multi?: Landmark[][]) => GestureMode;
  enabled: boolean;
}

const EMA_FACTOR = 0.65;
const MIN_DIST = 0.3;
const ERASER_THRESHOLD = 8;
const MOVE_SELECT_THRESHOLD = 60;
const MOVE_GROUP_THRESHOLD = 40;

export function useAnimationLoop({ canvasRef, landmarksRef, getGesture, enabled }: Opts) {
  const rafRef = useRef(0);
  const strokeRef = useRef<StrokePoint[]>([]);
  const drawingRef = useRef(false);
  const smoothRef = useRef<{ x: number; y: number } | null>(null);
  const prevTime = useRef(0);
  const prevPt = useRef<{ x: number; y: number } | null>(null);
  const strokeIdCounter = useRef(0);
  const eraserActiveRef = useRef(false);
  const lastEraserPos = useRef<{ x: number; y: number } | null>(null);

  const fpsFrames = useRef<number[]>([]);
  const particlePool = useRef(new ParticlePool(5000));
  const cursorPosRef = useRef<{ x: number; y: number } | null>(null);
  const cursorModeRef = useRef<'drawing' | 'eraser' | 'move' | null>(null);

  const movingStrokeIds0 = useRef<Set<string>>(new Set());
  const moveStartPos0 = useRef<{ x: number; y: number } | null>(null);
  const originalPoints0 = useRef<Map<string, StrokePoint[]>>(new Map());

  const cursorPos2Ref = useRef<{ x: number; y: number } | null>(null);
  const cursorMode2Ref = useRef<'move' | null>(null);
  const movingStrokeIds1 = useRef<Set<string>>(new Set());
  const moveStartPos1 = useRef<{ x: number; y: number } | null>(null);
  const originalPoints1 = useRef<Map<string, StrokePoint[]>>(new Map());

  useEffect(() => {
    if (!enabled) {
      strokeRef.current = [];
      drawingRef.current = false;
      smoothRef.current = null;
      movingStrokeIds1.current.clear();
      moveStartPos1.current = null;
      originalPoints1.current.clear();
      cursorPos2Ref.current = null;
      cursorMode2Ref.current = null;
      const c = canvasRef.current;
      if (c) {
        const ctx = c.getContext('2d');
        if (ctx) {
          const s = useDrawingStore.getState();
          drawAllStrokes(ctx, s.strokes, c.clientWidth, c.clientHeight, s.glowIntensity);
        }
      }
      return;
    }

    particlePool.current.reset();

    function loop(time: number) {
      const lm = landmarksRef.current;
      const hand0 = lm.length > 0 ? lm[0] : undefined;
      const hand1 = lm.length > 1 ? lm[1] : undefined;
      const gesture = getGesture(hand0, lm.length > 1 ? lm : undefined);
      const gesture1 = hand1 ? recognizeGesture(hand1, undefined) : 'idle';

      const c = canvasRef.current;
      if (!c) { rafRef.current = requestAnimationFrame(loop); return; }
      const ctx = c.getContext('2d');
      if (!ctx) { rafRef.current = requestAnimationFrame(loop); return; }

      const w = c.clientWidth;
      const h = c.clientHeight;
      const store = useDrawingStore.getState();

      const now = performance.now();
      fpsFrames.current = fpsFrames.current.filter(t => now - t < 1000);
      fpsFrames.current.push(now);

      store.setPerformance({ handConfidence: hand0 ? 1 : 0 });

      if (gesture === 'drawing' && hand0) {
        const raw = {
          x: (1 - hand0[8].x) * w,
          y: hand0[8].y * h,
        };

        if (!smoothRef.current) { smoothRef.current = { ...raw }; }

        smoothRef.current.x += (raw.x - smoothRef.current.x) * EMA_FACTOR;
        smoothRef.current.y += (raw.y - smoothRef.current.y) * EMA_FACTOR;

        const pt = smoothRef.current;
        cursorPosRef.current = { ...pt };
        cursorModeRef.current = 'drawing';
        const dx = raw.x - pt.x;
        const dy = raw.y - pt.y;
        const dt = time - prevTime.current;
        const vel = computeVelocity(dx, dy, dt || 16);

        const dist = prevPt.current ? Math.hypot(pt.x - prevPt.current.x, pt.y - prevPt.current.y) : 999;

        if (!drawingRef.current) {
          if (strokeRef.current.length > 1) {
            finalizeStroke(store);
          }
          strokeRef.current = [];
          drawingRef.current = true;
          smoothRef.current = { ...raw };
        }

        if (dist > MIN_DIST) {
          const pressure = computePressure(vel);
          strokeRef.current.push({ x: pt.x, y: pt.y, pressure, timestamp: time });
          prevPt.current = { ...pt };

          emitParticles(store, pt.x, pt.y);
        }
        prevTime.current = time;
      } else if (gesture === 'eraser' && hand0) {
        finalizeIfDrawing(store);
        smoothRef.current = null;
        prevPt.current = null;

        const ex = (1 - hand0[8].x) * w;
        const ey = hand0[8].y * h;
        cursorPosRef.current = { x: ex, y: ey };
        cursorModeRef.current = 'eraser';

        const shouldErase = (() => {
          const lastPos = lastEraserPos.current;
          return !lastPos || Math.hypot(ex - lastPos.x, ey - lastPos.y) >= ERASER_THRESHOLD;
        })();

        if (shouldErase) {
          lastEraserPos.current = { x: ex, y: ey };

          if (!eraserActiveRef.current) {
            store.pushHistory();
            eraserActiveRef.current = true;
          }

          const r = store.eraserRadius;
          const cur = useDrawingStore.getState().strokes;
          if (cur.length > 0) {
            const upd = cur.flatMap(s => {
              const segs: StrokePoint[][] = [];
              let curSeg: StrokePoint[] = [];
              for (const p of s.points) {
                const inside = Math.hypot(p.x - ex, p.y - ey) <= r;
                if (!inside) {
                  curSeg.push(p);
                } else {
                  if (curSeg.length >= 2) segs.push(curSeg);
                  curSeg = [];
                }
              }
              if (curSeg.length >= 2) segs.push(curSeg);
              if (segs.length === 0) return [];
              return segs.map((seg, i) => ({
                ...s,
                id: i === 0 ? s.id : `${s.id}_seg${i}`,
                points: seg,
              }));
            });
            useDrawingStore.getState().setStrokes(upd);
          }
        }
      } else {
        finalizeIfDrawing(store);
        smoothRef.current = null;
        prevPt.current = null;
        eraserActiveRef.current = false;
        lastEraserPos.current = null;
        cursorPosRef.current = null;
        cursorModeRef.current = null;
      }

      if (gesture === 'move' && hand0) {
        finalizeIfDrawing(store);
        smoothRef.current = null;
        prevPt.current = null;
        eraserActiveRef.current = false;
        lastEraserPos.current = null;

        const mx = (1 - hand0[8].x) * w;
        const my = hand0[8].y * h;
        cursorPosRef.current = { x: mx, y: my };
        cursorModeRef.current = 'move';

        if (movingStrokeIds0.current.size === 0) {
          const nearest = findNearestStroke(store.strokes, mx, my, MOVE_SELECT_THRESHOLD);
          if (nearest) {
            const groupIds = findGroupedStrokeIds(store.strokes, nearest.id, MOVE_GROUP_THRESHOLD);
            movingStrokeIds0.current = new Set(groupIds);
            moveStartPos0.current = { x: mx, y: my };
            const map = new Map<string, StrokePoint[]>();
            for (const sid of groupIds) {
              const st = store.strokes.find(s => s.id === sid);
              if (st) map.set(sid, st.points.map((p: StrokePoint) => ({ ...p })));
            }
            originalPoints0.current = map;
            store.pushHistory();
          }
        } else {
          const dx = mx - moveStartPos0.current!.x;
          const dy = my - moveStartPos0.current!.y;
          const cur = useDrawingStore.getState().strokes;
          const ids = movingStrokeIds0.current;
          const upd = cur.map(s => {
            if (!ids.has(s.id)) return s;
            const orig = originalPoints0.current.get(s.id);
            if (!orig) return s;
            return {
              ...s,
              points: orig.map(p => ({ ...p, x: p.x + dx, y: p.y + dy })),
            };
          });
          useDrawingStore.getState().setStrokes(upd);
        }
      } else if (movingStrokeIds0.current.size > 0) {
        movingStrokeIds0.current.clear();
        moveStartPos0.current = null;
        originalPoints0.current.clear();
      }

      if (gesture1 === 'move' && hand1) {
        const mx = (1 - hand1[8].x) * w;
        const my = hand1[8].y * h;
        cursorPos2Ref.current = { x: mx, y: my };
        cursorMode2Ref.current = 'move';

        if (movingStrokeIds1.current.size === 0) {
          const nearest = findNearestStroke(store.strokes, mx, my, MOVE_SELECT_THRESHOLD);
          if (nearest) {
            const groupIds = findGroupedStrokeIds(store.strokes, nearest.id, MOVE_GROUP_THRESHOLD);
            movingStrokeIds1.current = new Set(groupIds);
            moveStartPos1.current = { x: mx, y: my };
            const map = new Map<string, StrokePoint[]>();
            for (const sid of groupIds) {
              const st = store.strokes.find(s => s.id === sid);
              if (st) map.set(sid, st.points.map((p: StrokePoint) => ({ ...p })));
            }
            originalPoints1.current = map;
            store.pushHistory();
          }
        } else {
          const dx = mx - moveStartPos1.current!.x;
          const dy = my - moveStartPos1.current!.y;
          const cur = useDrawingStore.getState().strokes;
          const ids = movingStrokeIds1.current;
          const upd = cur.map(s => {
            if (!ids.has(s.id)) return s;
            const orig = originalPoints1.current.get(s.id);
            if (!orig) return s;
            return {
              ...s,
              points: orig.map(p => ({ ...p, x: p.x + dx, y: p.y + dy })),
            };
          });
          useDrawingStore.getState().setStrokes(upd);
        }
      } else if (movingStrokeIds1.current.size > 0) {
        movingStrokeIds1.current.clear();
        moveStartPos1.current = null;
        originalPoints1.current.clear();
        cursorPos2Ref.current = null;
        cursorMode2Ref.current = null;
      }

      const dt2 = 1 / 60;
      particlePool.current.update(dt2);

      const strokes = useDrawingStore.getState().strokes;
      drawAllStrokes(ctx, strokes, w, h, store.glowIntensity);

      if (strokeRef.current.length >= 2) {
        const temp: Stroke = {
          id: 'temp',
          points: [...strokeRef.current],
          color: store.brushColor,
          size: store.brushSize,
          opacity: store.opacity,
          brushType: store.brushType,
          timestamp: Date.now(),
        };
        drawAllStrokes(ctx, [temp], w, h, store.glowIntensity);
      }

      renderParticles(ctx, particlePool.current);

      const cursorPos = cursorPosRef.current;
      const cursorMode = cursorModeRef.current;
      if (cursorPos && cursorMode) {
        ctx.save();
        const cx = cursorPos.x;
        const cy = cursorPos.y;
        const pulse = Math.sin(performance.now() * 0.006) * 0.3 + 0.7;

        if (cursorMode === 'drawing') {
          const r = Math.max(store.brushSize / 2, 3);
          const crossLen = r + 20;

          ctx.globalAlpha = 0.4 * pulse;
          ctx.strokeStyle = store.brushColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx - crossLen, cy); ctx.lineTo(cx + crossLen, cy);
          ctx.moveTo(cx, cy - crossLen); ctx.lineTo(cx, cy + crossLen);
          ctx.stroke();

          ctx.globalAlpha = 0.25 * pulse;
          ctx.strokeStyle = store.brushColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, r + 12, 0, Math.PI * 2);
          ctx.stroke();

          ctx.globalAlpha = 0.5;
          ctx.shadowBlur = 20;
          ctx.shadowColor = store.brushColor;
          ctx.fillStyle = store.brushColor;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowBlur = 0;
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cx, cy, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.globalAlpha = 0.6;
          ctx.fillStyle = '#ffffff';
          ctx.font = '11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${store.brushSize}px`, cx, cy - crossLen - 10);
        } else if (cursorMode === 'eraser') {
          const r = store.eraserRadius;

          ctx.globalAlpha = 0.3 * pulse;
          ctx.strokeStyle = 'rgba(255,80,80,0.5)';
          ctx.lineWidth = 1;
          const crossLen = r + 15;
          ctx.beginPath();
          ctx.moveTo(cx - crossLen, cy); ctx.lineTo(cx + crossLen, cy);
          ctx.moveTo(cx, cy - crossLen); ctx.lineTo(cx, cy + crossLen);
          ctx.stroke();

          ctx.globalAlpha = 0.5;
          ctx.strokeStyle = 'rgba(255,80,80,0.7)';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.globalAlpha = 0.25;
          ctx.fillStyle = 'rgba(255,80,80,0.15)';
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();

          ctx.globalAlpha = 0.8;
          ctx.fillStyle = 'rgba(255,80,80,0.9)';
          ctx.beginPath();
          ctx.arc(cx, cy, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (cursorMode === 'move') {
          const r = 18;
          const arrowDist = 14;

          ctx.globalAlpha = 0.6 * pulse;
          ctx.strokeStyle = '#ffcc00';
          ctx.lineWidth = 2;
          [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => {
            const ax = cx + dx * arrowDist;
            const ay = cy + dy * arrowDist;
            ctx.beginPath();
            ctx.moveTo(ax - dx * 6 - dy * 4, ay - dy * 6 - dx * 4);
            ctx.lineTo(ax, ay);
            ctx.lineTo(ax - dx * 6 + dy * 4, ay - dy * 6 + dx * 4);
            ctx.stroke();
          });

          ctx.globalAlpha = 0.3;
          ctx.strokeStyle = '#ffcc00';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();

          ctx.globalAlpha = 0.2;
          ctx.fillStyle = 'rgba(255,204,0,0.15)';
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();

          ctx.globalAlpha = 0.9;
          ctx.fillStyle = '#ffcc00';
          ctx.beginPath();
          ctx.arc(cx, cy, 4, 0, Math.PI * 2);
          ctx.fill();

          if (movingStrokeIds0.current.size > 0) {
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = '#ffcc00';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('DRAG', cx, cy - r - 12);
          }
        }
        ctx.restore();
      }

      if (cursorPos2Ref.current && cursorMode2Ref.current) {
        ctx.save();
        const cx = cursorPos2Ref.current.x;
        const cy = cursorPos2Ref.current.y;
        const pulse2 = Math.sin(performance.now() * 0.006 + 1) * 0.3 + 0.7;
        const r = 18;
        const arrowDist = 14;

        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('HAND 2', cx, cy - r - 18);

        ctx.globalAlpha = 0.6 * pulse2;
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 2;
        [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => {
          const ax = cx + dx * arrowDist;
          const ay = cy + dy * arrowDist;
          ctx.beginPath();
          ctx.moveTo(ax - dx * 6 - dy * 4, ay - dy * 6 - dx * 4);
          ctx.lineTo(ax, ay);
          ctx.lineTo(ax - dx * 6 + dy * 4, ay - dy * 6 + dx * 4);
          ctx.stroke();
        });

        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.globalAlpha = 0.2;
        ctx.fillStyle = 'rgba(255,204,0,0.15)';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();

        if (movingStrokeIds1.current.size > 0) {
          ctx.globalAlpha = 0.8;
          ctx.fillStyle = '#ffcc00';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('DRAG', cx, cy - r - 12);
        }
        ctx.restore();
      }

      const activeParticles = particlePool.current.activeCount;
      const fps = fpsFrames.current.length;
      useDrawingStore.getState().setPerformance({ fps, particleCount: activeParticles, strokeCount: strokes.length });

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [canvasRef, landmarksRef, getGesture, enabled]);

  function finalizeIfDrawing(store: ReturnType<typeof useDrawingStore.getState>) {
    if (!drawingRef.current) return;
    if (strokeRef.current.length > 1) finalizeStroke(store);
    strokeRef.current = [];
    drawingRef.current = false;
  }

  function finalizeStroke(store: ReturnType<typeof useDrawingStore.getState>) {
    const stroke: Stroke = {
      id: `s_${Date.now()}_${strokeIdCounter.current++}`,
      points: [...strokeRef.current],
      color: store.brushColor,
      size: store.brushSize,
      opacity: store.opacity,
      brushType: store.brushType,
      timestamp: Date.now(),
    };
    useDrawingStore.getState().addStroke(stroke);
  }

  function findGroupedStrokeIds(strokes: Stroke[], nearestId: string, threshold: number): string[] {
    const nearest = strokes.find(s => s.id === nearestId);
    if (!nearest) return [nearestId];
    const ids: string[] = [nearestId];
    for (const s of strokes) {
      if (s.id === nearestId) continue;
      let connected = false;
      for (const p of s.points) {
        for (const np of nearest.points) {
          if (Math.hypot(p.x - np.x, p.y - np.y) < threshold) {
            connected = true;
            break;
          }
        }
        if (connected) break;
      }
      if (connected) ids.push(s.id);
    }
    return ids;
  }

  function findNearestStroke(strokes: Stroke[], x: number, y: number, threshold: number): Stroke | null {
    let nearest: Stroke | null = null;
    let minDist = threshold;
    for (const s of strokes) {
      for (const p of s.points) {
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < minDist) {
          minDist = d;
          nearest = s;
        }
      }
    }
    return nearest;
  }

  function emitParticles(store: ReturnType<typeof useDrawingStore.getState>, x: number, y: number) {
    const pool = particlePool.current;
    switch (store.brushType) {
      case 'spark': emitSpark(pool, x, y, store.brushColor, Math.round(store.brushSize * 0.8)); break;
      case 'fire': emitFire(pool, x, y, Math.round(store.brushSize * 0.6)); break;
      case 'smoke': emitSmoke(pool, x, y, Math.round(store.brushSize * 0.5)); break;
      case 'galaxy': emitGalaxy(pool, x, y, store.brushColor, Math.round(store.brushSize * 0.7)); break;
      case 'rainbow': emitRainbow(pool, x, y, Math.round(store.brushSize * 0.6)); break;
      case 'trail': emitSmoke(pool, x, y, Math.round(store.brushSize * 0.4)); break;
      case 'marker': emitInk(pool, x, y, store.brushColor, 2); break;
    }
  }
}
