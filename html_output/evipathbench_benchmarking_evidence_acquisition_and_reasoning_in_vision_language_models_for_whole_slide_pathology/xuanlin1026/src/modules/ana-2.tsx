import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, FONT, clearScene, drawMap, drawLoupe, drawPin, drawCheck, type Rect } from '../lib/mapKit';
import type { WidgetProps } from './registry';

// ============================================================================
//  ana-2 — 生活比喻动画（560×140）
//  一个主体：停在图钉处的放大镜；一个动作：右侧两张小卡片交替高亮，
//  「图像→说明」与「说明→图像」轮换，2.8 秒一循环。绘制全部走统一工具包。
// ============================================================================

const ANA_W = 560;
const ANA_H = 140;
const ANA_SEED = 20261011;
const MAP: Rect = { x: 20, y: 20, w: 260, h: 100 };

/** 非颜色线索：当前方向卡片左侧用对勾，另一张只留空心圆点。 */
function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  active: boolean
) {
  ctx.save();
  ctx.fillStyle = C.white;
  ctx.globalAlpha = active ? 1 : 0.8;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 9);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = active ? C.blue : C.axis;
  ctx.lineWidth = active ? 3 : 1.5;
  ctx.stroke();
  ctx.restore();
  if (active) drawCheck(ctx, x + 19, y + h / 2, 9, C.blue);
  else {
    ctx.save();
    ctx.strokeStyle = C.muted;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + 19, y + h / 2, 5.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.fillStyle = active ? C.text : C.muted;
  ctx.font = `${active ? '600 ' : ''}15px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText(text, x + 34, y + h / 2 + 5);
  ctx.restore();
}

export const Ana2: React.FC<WidgetProps> = () => {
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
    const pin = { x: 150, y: 84 };
    let raf: number | null = null;
    const t0 = performance.now();

    const render = (t: number) => {
      const phase = ((t - t0) % 2800) / 2800;
      const second = phase >= 0.5;
      clearScene(ctx, ANA_W, ANA_H);
      drawMap(ctx, MAP, ANA_SEED);
      drawPin(ctx, pin.x, pin.y, C.green, 1.1);
      drawLoupe(ctx, pin.x, pin.y, 32, '10x', C.blue);
      drawCard(ctx, 300, 34, 238, 34, '图像 → 说明', !second);
      drawCard(ctx, 300, 80, 238, 34, '说明 → 图像', second);
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
      aria-label="放大镜停在图钉处不动，右侧两张对照卡片交替高亮，表示图像到说明与说明到图像两个方向轮换"
    />
  );
};

export default Ana2;
