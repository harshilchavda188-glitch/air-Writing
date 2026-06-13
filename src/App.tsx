import { useRef, useCallback, useEffect } from 'react';
import { WebcamFeed } from './components/WebcamFeed';
import { DrawingCanvas } from './components/DrawingCanvas';
import { ControlPanel, PerformancePanel } from './components/ControlPanel';
import { GestureIndicator } from './components/GestureIndicator';
import { TutorialOverlay } from './components/TutorialOverlay';
import { useWebcam } from './hooks/useWebcam';
import { useMediaPipeHands } from './hooks/useMediaPipeHands';
import { useGestureRecognition } from './hooks/useGestureRecognition';
import { useAnimationLoop } from './hooks/useAnimationLoop';
import { useDrawingStore } from './store/drawingStore';
import { startAutoSave, stopAutoSave, restoreAutoSave } from './services/autoSave';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { videoRef, startCamera, stopCamera, status, error: camErr } = useWebcam();
  const we = useDrawingStore((s) => s.webcamEnabled);
  const sv = useDrawingStore((s) => s.showVideo);
  const tw = useDrawingStore((s) => s.toggleWebcam);

  const { landmarksRef, error: mpErr } = useMediaPipeHands(videoRef, we);
  const { processLandmarks } = useGestureRecognition();

  const getGesture = useCallback(
    (lm: Parameters<typeof processLandmarks>[0], multi?: Parameters<typeof processLandmarks>[1]) =>
      processLandmarks(lm, multi),
    [processLandmarks],
  );

  useAnimationLoop({ canvasRef, landmarksRef, getGesture, enabled: we });

  useEffect(() => {
    if (we) startCamera();
    else stopCamera();
  }, [we, startCamera, stopCamera]);

  useEffect(() => {
    startAutoSave();
    restoreAutoSave();
    return () => stopAutoSave();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          useDrawingStore.getState().redo();
        } else {
          e.preventDefault();
          useDrawingStore.getState().undo();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app">
      <DrawingCanvas canvasRef={canvasRef} />
      <WebcamFeed videoRef={videoRef} showVideo={sv} />
      <GestureIndicator />
      <PerformancePanel />
      <ControlPanel />
      <TutorialOverlay />

      {status === 'requesting' && (
        <div className="overlay"><div className="overlay-content">Requesting camera access...</div></div>
      )}

      {status === 'error' && (
        <div className="overlay">
          <div className="overlay-content overlay-error">
            <p>{camErr}</p>
            <button className="ctrl-btn" onClick={() => { tw(); setTimeout(() => tw(), 100); }}>Retry</button>
          </div>
        </div>
      )}

      {mpErr && we && (
        <div className="overlay"><div className="overlay-content overlay-error"><p>{mpErr}</p></div></div>
      )}

      {!we && status === 'idle' && (
        <div className="overlay">
          <div className="overlay-content">
            <h2>Air Drawing Studio</h2>
            <p>Move your finger in the air to draw</p>
            <button className="ctrl-btn start-btn" onClick={tw}>Start Camera</button>
          </div>
        </div>
      )}
    </div>
  );
}
