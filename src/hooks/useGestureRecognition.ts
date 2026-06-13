import { useRef, useCallback } from 'react';
import type { Landmark, GestureMode } from '../types/mediapipe';
import { recognizeGesture } from '../utils/gestureUtils';
import { useDrawingStore } from '../store/drawingStore';

const STABILITY_FRAMES = 2;

export function useGestureRecognition() {
  const prevRef = useRef<GestureMode>('idle');
  const stableRef = useRef(0);
  const setGesture = useDrawingStore((s) => s.setCurrentGesture);

  const processLandmarks = useCallback(
    (landmarks: Landmark[] | undefined, multiHand?: Landmark[][]): GestureMode => {
      if (!landmarks || landmarks.length === 0) {
        if (prevRef.current !== 'idle') { prevRef.current = 'idle'; stableRef.current = 0; setGesture('idle'); }
        return 'idle';
      }
      const g = recognizeGesture(landmarks, multiHand);
      if (g === prevRef.current) {
        stableRef.current++;
      } else {
        stableRef.current = 0;
        prevRef.current = g;
      }
      const emitted = stableRef.current >= STABILITY_FRAMES ? g : 'idle';
      setGesture(emitted);
      return emitted;
    },
    [setGesture],
  );

  return { processLandmarks };
}
