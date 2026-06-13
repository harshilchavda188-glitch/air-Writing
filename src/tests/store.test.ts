import { describe, it, expect, beforeEach } from 'vitest';
import { useDrawingStore } from '../store/drawingStore';
import type { Stroke } from '../types/mediapipe';

function makeStroke(id: string): Stroke {
  return { id, points: [{ x: 0, y: 0, pressure: 0.5, timestamp: 0 }], color: '#fff', size: 5, opacity: 1, brushType: 'neon', timestamp: Date.now() };
}

describe('drawingStore', () => {
  beforeEach(() => {
    useDrawingStore.setState({ strokes: [], undoStack: [], redoStack: [] });
  });

  it('adds a stroke', () => {
    const s = makeStroke('t1');
    useDrawingStore.getState().addStroke(s);
    expect(useDrawingStore.getState().strokes).toHaveLength(1);
  });

  it('clears canvas', () => {
    useDrawingStore.getState().addStroke(makeStroke('t1'));
    useDrawingStore.getState().clearCanvas();
    expect(useDrawingStore.getState().strokes).toHaveLength(0);
  });

  it('undo restores previous state', () => {
    useDrawingStore.getState().addStroke(makeStroke('t1'));
    useDrawingStore.getState().undo();
    expect(useDrawingStore.getState().strokes).toHaveLength(0);
  });

  it('redo restores undone state', () => {
    useDrawingStore.getState().addStroke(makeStroke('t1'));
    useDrawingStore.getState().undo();
    useDrawingStore.getState().redo();
    expect(useDrawingStore.getState().strokes).toHaveLength(1);
  });

  it('setBrushType changes brush and size', () => {
    useDrawingStore.getState().setBrushType('fire');
    expect(useDrawingStore.getState().brushType).toBe('fire');
    expect(useDrawingStore.getState().brushSize).toBe(10);
  });

  it('setBrushColor updates color', () => {
    useDrawingStore.getState().setBrushColor('#ff0000');
    expect(useDrawingStore.getState().brushColor).toBe('#ff0000');
  });

  it('addColorToHistory adds and deduplicates', () => {
    useDrawingStore.getState().addColorToHistory('#ff0000');
    useDrawingStore.getState().addColorToHistory('#00ff00');
    useDrawingStore.getState().addColorToHistory('#ff0000');
    const hist = useDrawingStore.getState().colorHistory;
    expect(hist[0]).toBe('#ff0000');
    expect(hist.filter(c => c === '#ff0000')).toHaveLength(1);
  });

  it('restore replaces strokes and stacks', () => {
    useDrawingStore.getState().addStroke(makeStroke('t1'));
    useDrawingStore.getState().restore({ strokes: [], undoStack: [], redoStack: [] });
    expect(useDrawingStore.getState().strokes).toHaveLength(0);
  });

  it('setPerformance updates metrics', () => {
    useDrawingStore.getState().setPerformance({ fps: 60, particleCount: 100 });
    const p = useDrawingStore.getState().performance;
    expect(p.fps).toBe(60);
    expect(p.particleCount).toBe(100);
  });
});
