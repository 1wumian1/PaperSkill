import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import { C, clearScene, drawMap, drawLoupe, drawPin, drawTarget, drawLabel, type Rect } from '../lib/mapKit';
import type { WidgetProps } from './registry';

// ============================================================================
//  ana-1 — 生活比喻动画（560×140）
//  一个主体：一枚放大镜；一个动作：从地图左上角平移到中央的橙色图钉处；
//  镜圈内地形由模糊变清晰，循环一次 3.2 秒。绘制全部走统一工具包。
// ============================================================================

const ANA_W = 560;
const ANA_H = 140;
const ANA_SEED = 20261011;
const MAP: Rect = { x: 24, y: 20, w: 300, h: 100 };

export const Ana1: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, ANA_W, ANA_H);
    } catch {
      return;
    }
    const pin = { x: 288, y: 78 };
    let raf: number | null = null;
    const t0 = performance.now();

    const render = (t: number) => {
      const phase = ((t - t0) % 3200) / 3200;
      const sweepT = clamp(phase / 0.78, 0, 1);
      const e = easeInOutQuad(sweepT);
      const cx = lerp(66, pin.x, e);
      const cy = lerp(46, pin.y, e);
      const d = Math.hypot(cx - pin.x, cy - pin.y);
      // 清晰度只由距离决定：镜圈压到图钉上时最清楚。
      const clarity = clamp(1 - d / 120, 0, 1);
      clearScene(ctx, ANA_W, ANA_H);
      drawMap(ctx, MAP, ANA_SEED);
      // 目的地的十字准星与图钉叠在一处，形成与颜色无关的方向线索。
      drawTarget(ctx, pin.x, pin.y, 9, C.orange);
      drawPin(ctx, pin.x, pin.y, C.orange, 1.1);
      // 镜圈内地形随清晰度变密（2.5×→40× 的层次由 clarity 表达）。
      drawLoupe(ctx, cx, cy, 30, '10x', C.blue, clarity);
      drawLabel(ctx, '沿图找目标', 548, 132, { color: C.muted, size: 15, align: 'right' });
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (t: number) => {
      render(t);
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

  return (
    <canvas
      ref={ref}
      width={ANA_W}
      height={ANA_H}
      aria-label="一把放大镜在地图上移动到橙色图钉处，镜圈里的地形从模糊变清晰"
    />
  );
};

export default Ana1;
