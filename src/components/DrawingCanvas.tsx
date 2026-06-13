import { useEffect } from 'react';
import { resizeCanvas } from '../utils/canvasHelpers';

export function DrawingCanvas({
  canvasRef,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}) {
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const c: HTMLCanvasElement = cvs;
    function resize() { resizeCanvas(c); }
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [canvasRef]);

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        aria-label="Interactive air drawing canvas"
      />
    </div>
  );
}
