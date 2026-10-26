import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  clearScene,
  drawMap,
  drawRoute,
  drawLoupe,
  drawPin,
  drawCross,
  drawLabel,
  type Pt,
  type Rect,
} from '../lib/mapKit';
import type { WidgetProps } from './registry';

// ============================================================================
//  ana-4 | 生活比喻动画：镜圈沿一条折返虚线路线来回寻找，三次落点依次停在
//  目标旁，最后一次偏离目标点一点。一个主体（镜圈）、一个动作（来回找）、
//  一个目标（绿色目标点）。3.2 秒一循环。
//  画面全部由共享地图工具包绘制，本文件只保留排布与节奏。
// ============================================================================

const ANA_W = 560;
const ANA_H = 140;
const SEG_MS = 860;
const HOLD_MS = 260;
const CYCLE_MS = SEG_MS * 3 + HOLD_MS * 3;
const MAP_SEED = 20261011;

const MAP_RECT: Rect = { x: 24, y: 20, w: 512, h: 100 };
const TARGET: Pt = { x: 404, y: 84 };
const WAYPOINTS: Pt[] = [
  { x: 70, y: 66 },
  { x: 150, y: 104 },
  { x: 240, y: 62 },
  { x: 330, y: 104 },
];
const ROUTE: Pt[] = [WAYPOINTS[0], ...WAYPOINTS.slice(1), TARGET];

export const Ana4: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const p = ((t - t0) % CYCLE_MS) / CYCLE_MS;
      const seg = clamp(Math.floor(p * 3), 0, 2);
      const local = clamp(p * 3 - seg, 0, 1);
      const eased = local < 0.8 ? local / 0.8 : 1;
      const from = WAYPOINTS[seg];
      const to = WAYPOINTS[seg + 1];
      const dx = 16 * Math.sin(eased * Math.PI);
      const cx = from.x + (to.x - from.x) * eased + dx;
      const cy = from.y + (to.y - from.y) * eased - dx * 0.5;

      clearScene(ctx, ANA_W, ANA_H);
      drawMap(ctx, MAP_RECT, MAP_SEED);
      drawRoute(ctx, ROUTE, true);
      for (let i = 0; i <= seg; i++) {
        drawCross(ctx, WAYPOINTS[i].x, WAYPOINTS[i].y, 7, C.red);
      }
      drawLoupe(ctx, cx, cy, 30, '10x', C.blue, 1);
      drawPin(ctx, TARGET.x, TARGET.y, C.green);
      drawLabel(ctx, '折返路线 示意', 30, 34, { color: C.muted, size: 16 });
      drawLabel(ctx, '落点偏离', 552, 132, { color: C.red, size: 16, align: 'right' });
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

export default Ana4;
