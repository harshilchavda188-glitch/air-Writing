import { create } from 'zustand';
import type {
  GestureMode,
  BrushType,
  Stroke,
  BrushConfig,
  PerformanceMetrics,
  HistoryEntry,
} from '../types/mediapipe';

export const BRUSH_CONFIGS: Record<BrushType, BrushConfig> = {
  neon: { type: 'neon', label: 'Neon', icon: '✨', glowIntensity: 1, particleEmission: 0, defaultSize: 8 },
  spark: { type: 'spark', label: 'Spark', icon: '⚡', glowIntensity: 0.6, particleEmission: 15, defaultSize: 6 },
  fire: { type: 'fire', label: 'Fire', icon: '🔥', glowIntensity: 0.8, particleEmission: 20, defaultSize: 10 },
  smoke: { type: 'smoke', label: 'Smoke', icon: '💨', glowIntensity: 0.3, particleEmission: 12, defaultSize: 14 },
  galaxy: { type: 'galaxy', label: 'Galaxy', icon: '🌌', glowIntensity: 0.9, particleEmission: 25, defaultSize: 7 },
  rainbow: { type: 'rainbow', label: 'Rainbow', icon: '🌈', glowIntensity: 1, particleEmission: 8, defaultSize: 9 },
  trail: { type: 'trail', label: 'Trail', icon: '🌊', glowIntensity: 0.7, particleEmission: 10, defaultSize: 11 },
  pen: { type: 'pen', label: 'Pen', icon: '🖊️', glowIntensity: 0, particleEmission: 0, defaultSize: 3 },
  marker: { type: 'marker', label: 'Marker', icon: '🖍️', glowIntensity: 0.3, particleEmission: 3, defaultSize: 6 },
  calligraphy: { type: 'calligraphy', label: 'Calligraphy', icon: '🖌️', glowIntensity: 0, particleEmission: 0, defaultSize: 5 },
};

const MAX_HISTORY = 100;

interface DrawingStore {
  brushColor: string;
  brushSize: number;
  brushType: BrushType;
  glowIntensity: number;
  opacity: number;
  currentGesture: GestureMode;
  webcamEnabled: boolean;
  showVideo: boolean;
  eraserRadius: number;
  strokes: Stroke[];
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
  colorHistory: string[];
  performance: PerformanceMetrics;
  tutorialSeen: boolean;
  gestureHoldStart: number | null;

  setBrushColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setBrushType: (type: BrushType) => void;
  setGlowIntensity: (intensity: number) => void;
  setOpacity: (opacity: number) => void;
  setCurrentGesture: (gesture: GestureMode) => void;
  setGestureHoldStart: (time: number | null) => void;
  toggleWebcam: () => void;
  toggleVideo: () => void;
  clearCanvas: () => void;
  setStrokes: (strokes: Stroke[]) => void;
  addStroke: (stroke: Stroke) => void;
  undo: () => void;
  redo: () => void;
  setEraserRadius: (radius: number) => void;
  pushHistory: () => void;
  setPerformance: (metrics: Partial<PerformanceMetrics>) => void;
  addColorToHistory: (color: string) => void;
  dismissTutorial: () => void;
  restore: (state: { strokes: Stroke[]; undoStack: HistoryEntry[]; redoStack: HistoryEntry[] }) => void;
}

export const useDrawingStore = create<DrawingStore>((set, get) => ({
  brushColor: '#00ffff',
  brushSize: 8,
  brushType: 'neon' as BrushType,
  glowIntensity: 1,
  opacity: 1,
  currentGesture: 'idle' as GestureMode,
  webcamEnabled: false,
  showVideo: true,
  eraserRadius: 30,
  strokes: [],
  undoStack: [],
  redoStack: [],
  colorHistory: ['#00ffff', '#ff00ff', '#00ff00', '#aa00ff', '#ff8800', '#ffffff'],
  performance: { fps: 0, handConfidence: 0, gestureConfidence: 0, particleCount: 0, strokeCount: 0 },
  tutorialSeen: localStorage.getItem('airdrawing_tutorial_seen') === 'true',
  gestureHoldStart: null,

  setBrushColor: (color) => set({ brushColor: color }),
  setBrushSize: (size) => set({ brushSize: size }),
  setBrushType: (type) => {
    const cfg = BRUSH_CONFIGS[type];
    set({ brushType: type, brushSize: cfg.defaultSize, glowIntensity: cfg.glowIntensity });
  },
  setGlowIntensity: (intensity) => set({ glowIntensity: intensity }),
  setOpacity: (opacity) => set({ opacity }),
  setCurrentGesture: (gesture) => set({ currentGesture: gesture }),
  setGestureHoldStart: (time) => set({ gestureHoldStart: time }),
  toggleWebcam: () => set((s) => ({ webcamEnabled: !s.webcamEnabled })),
  toggleVideo: () => set((s) => ({ showVideo: !s.showVideo })),
  clearCanvas: () => {
    const s = get();
    const entry: HistoryEntry = { strokes: [...s.strokes], timestamp: Date.now() };
    set({ strokes: [], undoStack: [...s.undoStack.slice(-(MAX_HISTORY - 1)), entry], redoStack: [] });
  },
  setStrokes: (strokes) => set({ strokes }),
  addStroke: (stroke) => {
    const s = get();
    const entry: HistoryEntry = { strokes: [...s.strokes], timestamp: Date.now() };
    set({
      strokes: [...s.strokes, stroke],
      undoStack: [...s.undoStack.slice(-(MAX_HISTORY - 1)), entry],
      redoStack: [],
    });
  },
  undo: () => {
    const s = get();
    if (s.undoStack.length === 0) return;
    const prev = s.undoStack[s.undoStack.length - 1];
    const redoEntry: HistoryEntry = { strokes: [...s.strokes], timestamp: Date.now() };
    set({
      strokes: prev.strokes,
      undoStack: s.undoStack.slice(0, -1),
      redoStack: [...s.redoStack, redoEntry],
    });
  },
  redo: () => {
    const s = get();
    if (s.redoStack.length === 0) return;
    const next = s.redoStack[s.redoStack.length - 1];
    const undoEntry: HistoryEntry = { strokes: [...s.strokes], timestamp: Date.now() };
    set({
      strokes: next.strokes,
      undoStack: [...s.undoStack, undoEntry],
      redoStack: s.redoStack.slice(0, -1),
    });
  },
  setEraserRadius: (radius) => set({ eraserRadius: radius }),
  pushHistory: () => {
    const s = get();
    const entry: HistoryEntry = { strokes: [...s.strokes], timestamp: Date.now() };
    set({ undoStack: [...s.undoStack.slice(-(MAX_HISTORY - 1)), entry] });
  },
  setPerformance: (metrics) =>
    set((s) => ({ performance: { ...s.performance, ...metrics } })),
  addColorToHistory: (color) =>
    set((s) => {
      const filtered = s.colorHistory.filter((c) => c !== color);
      return { colorHistory: [color, ...filtered].slice(0, 10) };
    }),
  dismissTutorial: () => {
    localStorage.setItem('airdrawing_tutorial_seen', 'true');
    set({ tutorialSeen: true });
  },
  restore: (state) => set({ strokes: state.strokes, undoStack: state.undoStack, redoStack: state.redoStack }),
}));
