# Air Drawing Studio

Touchless air drawing application using hand gesture recognition via webcam. Draw, erase, and move strokes in real-time using only your fingers.

## Features

- **Air Drawing** — Point your index finger to draw on canvas
- **Multiple Brush Styles** — Neon, Spark, Fire, Smoke, Galaxy, Rainbow, Trail, Pen, Marker, Calligraphy
- **Gesture Controls** — Switch between drawing, eraser, move, pause, save, clear with hand poses
- **Move Strokes** — Three-finger gesture or pinch to grab and drag letters/strokes (groups nearby strokes as a letter)
- **Two-Hand Support** — Draw with one hand, move strokes with the other simultaneously
- **Undo / Redo** — Ctrl+Z / Ctrl+Shift+Z keyboard shortcuts
- **Eraser** — Open all fingers to erase strokes
- **Export** — Save artwork as PNG, JPEG, SVG (up to 4K resolution)
- **Auto-Save** — Progress persists across sessions via IndexedDB
- **Particle Effects** — Each brush has unique particle animations
- **Pressure Sensitivity** — Calligraphy brush width varies with finger speed

## Gesture Reference

| Gesture | Action |
|---------|--------|
| 👆 Index finger only | Draw |
| ✊ Fist | Pause |
| 🖐️ All fingers open | Eraser |
| 🤏 Pinch (thumb + index) | Move / Drag |
| ✌️ Three fingers (index+middle+ring) | Move / Drag |
| ✌️ Index + middle (one hand) | Save |
| ✌️ Index + middle (two hands) | Clear canvas |

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | React 19 |
| **Language** | TypeScript |
| **Bundler** | Vite 8 |
| **State** | Zustand 5 |
| **Hand Tracking** | MediaPipe Hands (CDN) |
| **Rendering** | Canvas 2D API |
| **Testing** | Vitest + jsdom |
| **Storage** | IndexedDB (idb-keyval) |

## Dependencies

### Runtime
| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19.2.7 | UI framework |
| `react-dom` | ^19.2.7 | DOM rendering |
| `zustand` | ^5.0.14 | State management |
| `@mediapipe/hands` | ^0.4.16 | Hand landmark detection (CDN) |

### Dev
| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ~6.0.2 | Type checking |
| `vite` | ^8.0.12 | Dev server & bundler |
| `@vitejs/plugin-react` | ^6.0.2 | React Fast Refresh |
| `vitest` | ^4.1.8 | Test runner |
| `jsdom` | ^29.1.1 | DOM environment for tests |
| `@testing-library/react` | ^16.3.2 | React test utilities |
| `@testing-library/jest-dom` | ^6.9.1 | DOM matchers |
| `@types/react` | ^19.2.17 | React types |
| `@types/react-dom` | ^19.2.3 | ReactDOM types |

## Project Structure

```
src/
├── main.tsx                 # Entry point
├── App.tsx                  # Root component (orchestrates everything)
├── index.css                # Global styles
│
├── components/
│   ├── ControlPanel.tsx      # Brush controls, export, undo/redo buttons
│   ├── DrawingCanvas.tsx     # Full-screen canvas with auto-resize
│   ├── GestureIndicator.tsx  # Current gesture mode display
│   ├── TutorialOverlay.tsx   # First-time welcome overlay
│   └── WebcamFeed.tsx        # Webcam video element
│
├── hooks/
│   ├── useAnimationLoop.ts   # Core render loop (draw, erase, move)
│   ├── useGestureRecognition.ts  # Gesture stability filtering
│   ├── useMediaPipeHands.ts  # MediaPipe model initialization
│   └── useWebcam.ts          # Camera stream management
│
├── utils/
│   ├── gestureUtils.ts       # Finger state & gesture classification
│   ├── splines.ts            # Catmull-Rom interpolation
│   ├── pressure.ts           # Velocity & pressure computation
│   ├── kalman.ts             # Kalman filter for smoothing
│   └── canvasHelpers.ts      # Canvas DPR setup & coordinate math
│
├── rendering/
│   └── neonRenderer.ts       # All brush rendering (neon, pen, marker, etc.)
│
├── particles/
│   └── ParticlePool.ts       # Object-pool particle system + emitters
│
├── store/
│   └── drawingStore.ts       # Zustand store (strokes, history, settings)
│
├── services/
│   ├── autoSave.ts           # IndexedDB persistence
│   └── exportService.ts      # PNG/JPEG/SVG export
│
├── types/
│   └── mediapipe.ts          # TypeScript interfaces
│
└── tests/
    ├── gestureUtils.test.ts
    ├── splines.test.ts
    └── store.test.ts
```

## Getting Started

### Prerequisites
- Node.js >= 18
- npm >= 9
- Webcam (for gesture tracking)

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens at `http://localhost:5173`. Grant camera access when prompted.

### Build

```bash
npm run build
```

Output in `dist/` — deployable to any static host.

### Preview Build

```bash
npm run preview
```

### Test

```bash
npm test           # Run once
npm run test:watch # Watch mode
```

## Browser Support

Chrome, Edge, Firefox (requires webcam access). MediaPipe Hands works best in Chromium-based browsers.

## How It Works

1. **Camera** captures video frames
2. **MediaPipe Hands** detects 21 hand landmarks per hand at ~30fps
3. **Gesture recognition** classifies finger poses into Drawing, Eraser, Move, Pause, Save, Clear
4. **Animation loop** smooths positions with EMA filter, samples points at 0.3px minimum distance, and renders strokes on a full-screen canvas
5. **Stroke grouping** — when using Move gesture, all strokes within 40px of the grabbed stroke move together as a letter
6. **Persistence** — strokes auto-save to IndexedDB every 30 seconds
