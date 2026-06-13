import type { ExportOptions, Stroke } from '../types/mediapipe';
import { useDrawingStore } from '../store/drawingStore';

export async function exportArtwork(options: ExportOptions): Promise<void> {
  const canvas = document.querySelector('.drawing-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  const { format, quality, transparent, resolution } = options;
  const dpr = window.devicePixelRatio || 1;

  let w = canvas.clientWidth;
  let h = canvas.clientHeight;

  if (resolution === '4k') {
    w = 3840;
    h = 2160;
  }

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = w * dpr;
  exportCanvas.height = h * dpr;
  const ctx = exportCanvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  if (!transparent) {
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, w, h);
  }

  const strokes = useDrawingStore.getState().strokes;
  const { drawAllStrokes } = await import('../rendering/neonRenderer');
  drawAllStrokes(ctx, strokes, w, h, 1);

  if (format === 'svg') {
    exportAsSVG(strokes, transparent);
    return;
  }

  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  const ext = format === 'png' ? 'png' : 'jpg';

  const link = document.createElement('a');
  link.download = `air-drawing.${ext}`;
  link.href = exportCanvas.toDataURL(mimeType, quality);
  link.click();
}

function exportAsSVG(strokes: Stroke[], transparent: boolean): void {
  const w = 1920;
  const h = 1080;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
  if (!transparent) {
    svg += `<rect width="${w}" height="${h}" fill="#050505"/>`;
  }
  for (const stroke of strokes) {
    if (stroke.points.length < 2) continue;
    const pts = stroke.points
      .map((p) => `${(p.x / window.innerWidth) * w},${(p.y / window.innerHeight) * h}`)
      .join(' ');
    svg += `<polyline points="${pts}" fill="none" stroke="${stroke.color}" stroke-width="${stroke.size}" stroke-linecap="round" stroke-linejoin="round" opacity="${stroke.opacity}"/>`;
  }
  svg += '</svg>';

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const link = document.createElement('a');
  link.download = 'air-drawing.svg';
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}
