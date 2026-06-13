import { useEffect } from 'react';
import { useDrawingStore } from '../store/drawingStore';

export function TutorialOverlay() {
  const seen = useDrawingStore((s) => s.tutorialSeen);
  const dismiss = useDrawingStore((s) => s.dismissTutorial);

  useEffect(() => {
    if (seen) return;
    const t = setTimeout(dismiss, 30000);
    return () => clearTimeout(t);
  }, [seen, dismiss]);

  if (seen) return null;

  return (
    <div className="tutorial-overlay" role="dialog" aria-label="Tutorial">
      <div className="tutorial-content">
        <h2>Welcome to Air Drawing Studio</h2>
        <ul>
          <li><strong>✏️ Draw</strong> — Point index finger, fold others</li>
          <li><strong>✊ Pause</strong> — Make a fist</li>
          <li><strong>🖐️ Erase</strong> — Open palm</li>
          <li><strong>🤏 Undo</strong> — Thumb+Index pinch (hold 1s)</li>
          <li><strong>🤌 Redo</strong> — Thumb+Middle pinch (hold 1s)</li>
          <li><strong>✌️ Save</strong> — Victory sign (hold 2s)</li>
          <li><strong>🤲 Clear</strong> — Both palms open (hold 3s)</li>
        </ul>
        <button className="ctrl-btn" onClick={dismiss} aria-label="Dismiss tutorial">Got it!</button>
      </div>
    </div>
  );
}
