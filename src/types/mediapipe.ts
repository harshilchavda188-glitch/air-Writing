export interface Point {
  x: number;
  y: number;
}

export interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface Handedness {
  index: number;
  score: number;
  label: 'Right' | 'Left';
}

export interface Results {
  multiHandLandmarks: Landmark[][];
  multiHandWorldLandmarks: Landmark[][];
  multiHandedness: Handedness[];
  image: HTMLCanvasElement | HTMLImageElement | ImageBitmap;
}

export type GestureMode =
  | 'idle'
  | 'drawing'
  | 'paused'
  | 'eraser'
  | 'undo'
  | 'redo'
  | 'clear'
  | 'save'
  | 'move';

export type BrushType = 'neon' | 'spark' | 'fire' | 'smoke' | 'galaxy' | 'rainbow' | 'trail' | 'pen' | 'marker' | 'calligraphy';

export interface BrushConfig {
  type: BrushType;
  label: string;
  icon: string;
  glowIntensity: number;
  particleEmission: number;
  defaultSize: number;
}

export type ExportFormat = 'png' | 'jpeg' | 'svg';

export interface ExportOptions {
  format: ExportFormat;
  quality: number;
  transparent: boolean;
  resolution: 'standard' | '4k';
}

export interface Stroke {
  id: string;
  points: StrokePoint[];
  color: string;
  size: number;
  opacity: number;
  brushType: BrushType;
  timestamp: number;
}

export interface FingerState {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
}

export interface HandGestureState {
  gesture: GestureMode;
  confidence: number;
  holdProgress: number;
  fingerState: FingerState;
  indexTip: Point | null;
  thumbTip: Point | null;
}

export interface PerformanceMetrics {
  fps: number;
  handConfidence: number;
  gestureConfidence: number;
  particleCount: number;
  strokeCount: number;
}

export interface HistoryEntry {
  strokes: Stroke[];
  timestamp: number;
}
