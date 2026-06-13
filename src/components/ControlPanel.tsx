import { useDrawingStore, BRUSH_CONFIGS } from '../store/drawingStore';
import type { BrushType } from '../types/mediapipe';
import { exportArtwork } from '../services/exportService';

const COLORS = ['#00ffff', '#ff00ff', '#00ff00', '#aa00ff', '#ff8800', '#ffffff'];

export function PerformancePanel() {
  const perf = useDrawingStore((s) => s.performance);

  if (!perf.fps) return null;

  return (
    <div className="perf-panel" role="status" aria-label="Performance metrics">
      <span className="perf-item">{perf.fps} FPS</span>
      <span className="perf-item">{perf.particleCount} particles</span>
      <span className="perf-item">{perf.strokeCount} strokes</span>
    </div>
  );
}

export function ControlPanel() {
  const bc = useDrawingStore((s) => s.brushColor);
  const bs = useDrawingStore((s) => s.brushSize);
  const bt = useDrawingStore((s) => s.brushType);
  const op = useDrawingStore((s) => s.opacity);
  const gi = useDrawingStore((s) => s.glowIntensity);
  const er = useDrawingStore((s) => s.eraserRadius);
  const we = useDrawingStore((s) => s.webcamEnabled);
  const sv = useDrawingStore((s) => s.showVideo);
  const ch = useDrawingStore((s) => s.colorHistory);
  const st = useDrawingStore((s) => s.strokes);
  const undoStack = useDrawingStore((s) => s.undoStack);
  const redoStack = useDrawingStore((s) => s.redoStack);

  const setBC = useDrawingStore((s) => s.setBrushColor);
  const setBS = useDrawingStore((s) => s.setBrushSize);
  const setBT = useDrawingStore((s) => s.setBrushType);
  const setOp = useDrawingStore((s) => s.setOpacity);
  const setGI = useDrawingStore((s) => s.setGlowIntensity);
  const setER = useDrawingStore((s) => s.setEraserRadius);
  const clearCanvas = useDrawingStore((s) => s.clearCanvas);
  const toggleWebcam = useDrawingStore((s) => s.toggleWebcam);
  const toggleVideo = useDrawingStore((s) => s.toggleVideo);
  const undo = useDrawingStore((s) => s.undo);
  const redo = useDrawingStore((s) => s.redo);
  const addColor = useDrawingStore((s) => s.addColorToHistory);

  const brushes: BrushType[] = ['neon', 'spark', 'fire', 'smoke', 'galaxy', 'pen', 'marker', 'calligraphy'];

  return (
    <div className="control-panel" role="toolbar" aria-label="Drawing controls">
      <div className="control-section">
        <label className="control-label">Brush</label>
        <div className="brush-grid">
          {brushes.map((b) => {
            const cfg = BRUSH_CONFIGS[b];
            return (
              <button
                key={b}
                className={`brush-btn${bt === b ? ' active' : ''}`}
                onClick={() => setBT(b)}
                aria-label={`${cfg.label} brush`}
                aria-pressed={bt === b}
                title={cfg.label}
              >
                {cfg.icon}
              </button>
            );
          })}
        </div>
      </div>

      <div className="control-section">
        <label className="control-label">Color</label>
        <div className="color-grid">
          {COLORS.map((c) => (
            <button
              key={c}
              className={`color-btn${bc === c ? ' active' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => { setBC(c); addColor(c); }}
              aria-label={`Color ${c}`}
              aria-pressed={bc === c}
            />
          ))}
          <input
            type="color"
            value={bc}
            onChange={(e) => { setBC(e.target.value); addColor(e.target.value); }}
            className="color-picker"
            aria-label="Custom color"
          />
        </div>
        {ch.length > 6 && (
          <div className="color-history">
            {ch.slice(0, 10).map((c) => (
              <button
                key={c}
                className="color-hist-btn"
                style={{ backgroundColor: c }}
                onClick={() => setBC(c)}
                aria-label={`Recent color ${c}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="control-section">
        <label className="control-label">Size: {bs}px</label>
        <input type="range" min={1} max={40} value={bs} onChange={(e) => setBS(+e.target.value)} className="slider" aria-label="Brush size" />
      </div>

      <div className="control-section">
        <label className="control-label">Glow</label>
        <input type="range" min={0} max={2} step={0.1} value={gi} onChange={(e) => setGI(+e.target.value)} className="slider" aria-label="Glow intensity" />
      </div>

      <div className="control-section">
        <label className="control-label">Opacity</label>
        <input type="range" min={0.1} max={1} step={0.1} value={op} onChange={(e) => setOp(+e.target.value)} className="slider" aria-label="Opacity" />
      </div>

      <div className="control-section">
        <label className="control-label">Eraser: {er}px</label>
        <input type="range" min={10} max={80} value={er} onChange={(e) => setER(+e.target.value)} className="slider" aria-label="Eraser radius" />
      </div>

      <div className="control-section control-buttons">
        <button className={`ctrl-btn ${we ? 'active' : ''}`} onClick={toggleWebcam} aria-label="Toggle webcam">
          {we ? 'Stop Cam' : 'Start Cam'}
        </button>
        <button className="ctrl-btn" onClick={toggleVideo} aria-label="Toggle video preview">
          {sv ? 'Hide Vid' : 'Show Vid'}
        </button>
        <button className="ctrl-btn" onClick={undo} disabled={undoStack.length === 0} aria-label="Undo">
          Undo
        </button>
        <button className="ctrl-btn" onClick={redo} disabled={redoStack.length === 0} aria-label="Redo">
          Redo
        </button>
        <button className="ctrl-btn" onClick={clearCanvas} disabled={st.length === 0} aria-label="Clear all">
          Clear
        </button>
        <button className="ctrl-btn" onClick={() => exportArtwork({ format: 'png', quality: 1, transparent: false, resolution: 'standard' })} disabled={st.length === 0} aria-label="Save PNG">
          PNG
        </button>
        <button className="ctrl-btn" onClick={() => exportArtwork({ format: 'jpeg', quality: 0.92, transparent: false, resolution: 'standard' })} disabled={st.length === 0} aria-label="Save JPEG">
          JPEG
        </button>
        <button className="ctrl-btn" onClick={() => exportArtwork({ format: 'svg', quality: 1, transparent: false, resolution: 'standard' })} disabled={st.length === 0} aria-label="Save SVG">
          SVG
        </button>
        <button className="ctrl-btn" onClick={() => exportArtwork({ format: 'png', quality: 1, transparent: true, resolution: '4k' })} disabled={st.length === 0} aria-label="Export 4K PNG">
          4K PNG
        </button>
      </div>
    </div>
  );
}
