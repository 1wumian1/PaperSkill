import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import {
  C,
  rand,
  clearScene,
  drawMap,
  drawLoupe,
  drawPin,
  drawBox,
  drawCheck,
  drawLabel,
  drawLegend,
  type Rect,
  type Pt,
} from '../lib/mapKit';
import type { WidgetProps } from './registry';

// ============================================================================
//  §6 生活比喻动画：三张按倍率排列的卡片被依次推入同一条固定凹槽，
//  凹槽末端的目标标记由灰变绿。绘制工具包来自共享「地图勘察 + 放大镜」
//  工具包；本文件只保留自己的凹槽、卡片队列与推入编排。560x140，循环 3.0 秒。
// ============================================================================

const ANA_W = 560;
const ANA_H = 140;
const ANA_DUR = 3000;
const ANA_SEED = 20261013;

const ANA_MAP: Rect = { x: 12, y: 12, w: 536, h: 116 };
const GROOVE = { x: 170, y: 70, w: 280, h: 50 };
const SLOT_W = 64;
const SLOT_H = 40;
const SLOT_Y = GROOVE.y + 5;
const ENTRY_X = 488;
const MARK_X = 148;
const MARK_Y = GROOVE.y + 30;
const STAGGER = 0.16;
const TRAVEL = 0.45;

const CARD_ZOOMS: ('2.5x' | '10x' | '40x')[] = ['2.5x', '10x', '40x'];

function slotX(i: number): number {
  return GROOVE.x + 8 + i * 92;
}

function cardProgress(phase: number, i: number): number {
  return clamp((phase - i * STAGGER) / TRAVEL, 0, 1);
}

/** 凹槽本体：白色底、左端开口、内部虚线参考框。 */
function drawGroove(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.fillStyle = C.white;
  ctx.globalAlpha = 0.72;
  ctx.beginPath();
  ctx.roundRect(GROOVE.x - 8, GROOVE.y - 8, GROOVE.w + 16, GROOVE.h + 16, 12);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(GROOVE.x + GROOVE.w, GROOVE.y);
  ctx.lineTo(GROOVE.x, GROOVE.y);
  ctx.lineTo(GROOVE.x, GROOVE.y + GROOVE.h);
  ctx.lineTo(GROOVE.x + GROOVE.w, GROOVE.y + GROOVE.h);
  ctx.stroke();
  ctx.restore();
  drawBox(ctx, GROOVE.x + 4, GROOVE.y + 4, GROOVE.w - 8, GROOVE.h - 8, C.axis, 1, true);
}

function renderScene(ctx: CanvasRenderingContext2D, phase: number): void {
  const allSeated = phase > 0.84;
  clearScene(ctx, ANA_W, ANA_H);
  drawMap(ctx, ANA_MAP, ANA_SEED);

  // 固定凹槽：左侧开口朝右，卡片从右端被推入。
  drawGroove(ctx);

  const seat: Pt = { x: slotX(0) + SLOT_W / 2, y: SLOT_Y + SLOT_H / 2 };
  const mark: Pt = { x: MARK_X, y: MARK_Y };
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = C.route;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(seat.x, seat.y);
  ctx.lineTo(mark.x, mark.y);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = allSeated ? C.green : C.muted;
  ctx.lineWidth = allSeated ? 3.5 : 2;
  ctx.lineCap = 'round';
  if (!allSeated) ctx.setLineDash([7, 6]);
  ctx.beginPath();
  ctx.moveTo(seat.x, seat.y);
  ctx.lineTo(mark.x, mark.y);
  ctx.stroke();
  ctx.restore();

  for (let i = 0; i < 3; i++) {
    const p = easeInOutQuad(cardProgress(phase, i));
    const x = lerp(ENTRY_X, slotX(i), p);
    const settled = p > 0.995;
    ctx.save();
    ctx.fillStyle = C.white;
    ctx.globalAlpha = 0.96;
    ctx.beginPath();
    ctx.roundRect(x, SLOT_Y, SLOT_W, SLOT_H, 8);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = settled ? C.green : C.axis;
    ctx.lineWidth = settled ? 3 : 2;
    ctx.beginPath();
    ctx.roundRect(x, SLOT_Y, SLOT_W, SLOT_H, 8);
    ctx.stroke();
    drawLoupe(ctx, x + SLOT_W / 2, SLOT_Y + SLOT_H / 2, 13, CARD_ZOOMS[i], C.blue);
    if (settled) drawCheck(ctx, x + 16, SLOT_Y + SLOT_H - 12, 7, C.green);
  }

  // 推入的手指：贴在队列最后一枚还在移动的卡片右侧。
  let rearmost = -1;
  for (let i = 0; i < 3; i++) {
    if (cardProgress(phase, i) > 0) rearmost = i;
  }
  if (rearmost >= 0 && !allSeated) {
    const fx = lerp(ENTRY_X, slotX(rearmost), easeInOutQuad(cardProgress(phase, rearmost))) + SLOT_W + 12;
    const fy = SLOT_Y + SLOT_H / 2;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = C.orange;
    ctx.beginPath();
    ctx.roundRect(fx, fy - 6, 16, 12, 5);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(fx - 1, fy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawPin(ctx, MARK_X, MARK_Y, allSeated ? C.green : C.muted, 1.1);

  drawLabel(ctx, '三档发现', 26, 32, { size: 16, color: C.text });
  drawLegend(
    ctx,
    [
      { label: '已就位', color: C.green },
      { label: '待推入', color: C.muted },
    ],
    398,
    34,
    22
  );
}

export const Ana6: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [seated, setSeated] = useState(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, ANA_W, ANA_H);
    } catch {
      return;
    }
    let raf: number | null = null;
    let shown = -1;
    const t0 = performance.now();
    const tick = (t: number) => {
      const phase = ((((t - t0) % ANA_DUR) + ANA_DUR) % ANA_DUR) / ANA_DUR;
      let count = 0;
      for (let i = 0; i < 3; i++) {
        if (cardProgress(phase, i) > 0.995) count += 1;
      }
      renderScene(ctx, phase);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      if (count !== shown) {
        shown = count;
        setSeated(count);
      }
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas ref={ref} width={ANA_W} height={ANA_H} data-seated={seated} />;
};

export default Ana6;
