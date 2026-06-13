import type { GestureMode } from '../types/mediapipe';
import { useDrawingStore } from '../store/drawingStore';

const LABELS: Record<GestureMode, { text: string; icon: string }> = {
  idle: { text: 'Show Hand', icon: '👋' },
  drawing: { text: 'Drawing', icon: '✏️' },
  eraser: { text: 'Eraser', icon: '🧹' },
  paused: { text: 'Paused', icon: '✊' },
  undo: { text: 'Undo', icon: '↩️' },
  redo: { text: 'Redo', icon: '↪️' },
  clear: { text: 'Clear', icon: '🗑️' },
  save: { text: 'Save', icon: '💾' },
  move: { text: 'Move', icon: '✋' },
};

const HINTS: Partial<Record<GestureMode, string>> = {
  drawing: 'Point index finger',
  eraser: 'Open all fingers',
  paused: 'Make a fist',
  move: '3 fingers or pinch',
};

export function GestureIndicator() {
  const gesture = useDrawingStore((s) => s.currentGesture);
  const we = useDrawingStore((s) => s.webcamEnabled);
  const { text, icon } = LABELS[gesture];
  const hint = HINTS[gesture];

  return (
    <div
      className={`gesture-indicator gesture-${gesture}`}
      role="status"
      aria-live="polite"
      aria-label={hint ? `${text} - ${hint}` : text}
    >
      <span className="gesture-icon">{icon}</span>
      <span className="gesture-text">{text}</span>
      {hint && we && <span className="gesture-hint">{hint}</span>}
    </div>
  );
}
