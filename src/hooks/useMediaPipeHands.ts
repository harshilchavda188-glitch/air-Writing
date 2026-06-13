import { useEffect, useRef, useState } from 'react';
import type { Landmark } from '../types/mediapipe';

declare const Hands: {
  new (config?: { locateFile: (path: string) => string }): {
    setOptions(opts: {
      maxNumHands?: number;
      modelComplexity?: number;
      minDetectionConfidence?: number;
      minTrackingConfidence?: number;
    }): void;
    onResults(listener: (r: { multiHandLandmarks?: Landmark[][] }) => void): void;
    send(inputs: { image: HTMLVideoElement }): Promise<void>;
    close(): Promise<void>;
  };
};

// Global one-time patch: suppress MediaPipe WASM glog spam in console
(function patchMpConsole() {
  if (typeof window === 'undefined' || (window as any).__MP_PATCHED) return;
  (window as any).__MP_PATCHED = true;
  const isMp = (a: unknown) => typeof a === 'string' && /^[IWE]0000\s+\d+:\d+:\d+/.test(a);
  const origLog = console.log;
  const origWarn = console.warn;
  console.log = (...args) => { if (!isMp(args[0])) origLog.apply(console, args as any); };
  console.warn = (...args) => { if (!isMp(args[0])) origWarn.apply(console, args as any); };
})();

export function useMediaPipeHands(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean,
) {
  const landmarksRef = useRef<Landmark[][]>([]);
  const rafRef = useRef<number>(0);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      if (!enabled) return;
      if (typeof Hands === 'undefined') {
        setError('MediaPipe Hands failed to load.');
        return;
      }

      let hands: any;
      try {
        hands = new Hands({
          locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${f}`,
        });
        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.7,
        });
        hands.onResults((r: { multiHandLandmarks?: Landmark[][] }) => {
          landmarksRef.current = r.multiHandLandmarks ?? [];
        });
      } catch {
        setError('Failed to initialize hand tracking.');
        return;
      }

      let running = true;
      let lastSend = 0;
      const THROTTLE_MS = 33;

      async function loop() {
        if (!running) return;
        try {
          const v = videoRef.current;
          const now = performance.now();
          if (v && v.readyState >= 2 && !v.paused && (now - lastSend >= THROTTLE_MS)) {
            lastSend = now;
            await hands.send({ image: v });
          }
        } catch { /* skip */ }
        if (running) rafRef.current = requestAnimationFrame(loop);
      }
      rafRef.current = requestAnimationFrame(loop);

      return () => {
        running = false;
        cancelAnimationFrame(rafRef.current);
        if (hands) hands.close();
        landmarksRef.current = [];
      };
    } catch {
      setError('Unexpected error in hand tracking.');
    }
  }, [enabled, videoRef]);

  return { landmarksRef, error };
}
