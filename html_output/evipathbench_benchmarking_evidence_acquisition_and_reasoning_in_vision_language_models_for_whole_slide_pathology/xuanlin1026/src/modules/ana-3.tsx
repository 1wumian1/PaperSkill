import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  clearScene,
  drawMap,
  drawLoupe,
  drawPin,
  drawTarget,
  drawLabel,
  type Rect,
} from '../lib/mapKit';
import type { WidgetProps } from './registry';

// ============================================================================
//  ana-3 | 生活比喻动画：图钉落定后，镜圈从 2.5× 换到 10× 再换到 40×，
//  圈内的纹理一层层变密。一个主体（镜圈）、一个动作（换档放大）、一个目标
//  （绿色目标点）。画面全部由共享地图工具包绘制，本文件只保留排布。
// ============================================================================

const ANA_W = 560;
const ANA_H = 140;
const LOOP_MS = 2400;
const FRAME_MS = 800;
const MAP_SEED = 20261011;

const ZOOMS: ('2.5x' | '10x' | '40x')[] = ['2.5x', '10x', '40x'];
const RADII = [86, 56, 34];
/** 三档落在同一处，只换放大范围：框越往里越小。 */
const FRAMES: Rect[] = [
  { x: 16, y: 8, w: 528, h: 124 },
  { x: 24, y: 20, w: 380, h: 100 },
  { x: 24, y: 20, w: 300, h: 100 },
];
const PIN = { x: 258, y: 78 };

export const Ana3: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    try {
      setupCanvas(canvas, ANA_W, ANA_H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const t0 = performance.now();
    const render = (t: number) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const k = clamp(Math.floor(((t - t0) % LOOP_MS) / FRAME_MS), 0, 2);
      const zoom = ZOOMS[k];
      const r = RADII[k];

      clearScene(ctx, ANA_W, ANA_H);
      drawMap(ctx, FRAMES[k], MAP_SEED);
      drawLoupe(ctx, PIN.x, PIN.y, r, zoom, C.blue, 1);
      drawTarget(ctx, PIN.x, PIN.y, 12, C.green);
      drawPin(ctx, PIN.x, PIN.y, C.green);
      drawLabel(ctx, zoom === '2.5x' ? '2.5× 档' : zoom === '10x' ? '10× 档' : '40× 档', 18, 26, {
        color: C.blue,
        size: 16,
        bold: true,
      });
      drawLabel(ctx, '三档换镜 示意', 542, 132, { color: C.muted, size: 16, align: 'right' });
    };
    const tick = (t: number) => {
      render(t);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={ANA_W} height={ANA_H} />;
};

export default Ana3;
