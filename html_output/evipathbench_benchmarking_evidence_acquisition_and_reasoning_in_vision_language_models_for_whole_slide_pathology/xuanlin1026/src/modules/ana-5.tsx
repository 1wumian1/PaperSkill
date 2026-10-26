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
  drawCross,
  drawLabel,
  drawLegend,
  dimRect,
  type Rect,
  type Pt,
} from '../lib/mapKit';
import type { WidgetProps } from './registry';

// ============================================================================
//  §5 生活比喻动画：一枚图钉钉在地图上，镜圈每上升一档倍率，
//  圈外的区域就被逐个打上红叉并变暗，最后一档只剩很小一块亮区。
//  绘制工具包来自共享「地图勘察 + 放大镜」工具包；本文件只保留自己的
//  分档状态机、图块网格与场景编排。560x140，一次循环 3.4 秒。
// ============================================================================

const ANA_W = 560;
const ANA_H = 140;
const ANA_DUR = 3400;
const ANA_SEED = 20261012;

type ZoomKey = '2.5x' | '10x' | '40x';

const STAGES: { zoom: ZoomKey; label: string; r: number; keep: number[] }[] = [
  { zoom: '2.5x', label: '2.5×', r: 30, keep: [0, 1, 2, 3, 4, 5, 6, 7] },
  { zoom: '10x', label: '10×', r: 22, keep: [2, 3, 6, 7] },
  { zoom: '40x', label: '40×', r: 15, keep: [2, 3] },
];

const ANA_MAP: Rect = { x: 16, y: 12, w: 300, h: 116 };
const ANA_TILE_COUNT = 8;

/** 8 块 40x34 的候选图块：4 列 x 2 行，留出路线与镜圈的位置。 */
const TILE_X0 = 52;
const TILE_Y0 = 30;
const TILE_W = 40;
const TILE_H = 34;
const TILE_DX = 56;
const TILE_DY = 42;

function tileRect(i: number): Rect {
  const col = i % 4;
  const row = Math.floor(i / 4);
  return { x: TILE_X0 + col * TILE_DX, y: TILE_Y0 + row * TILE_DY, w: TILE_W, h: TILE_H };
}

function tileCenter(i: number): Pt {
  const r = tileRect(i);
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

function renderScene(ctx: CanvasRenderingContext2D, stageIndex: number, local: number): void {
  // idx 先夹到合法档位再索引，配平 t0 之前出现的负相位。
  const idx = clamp(Math.round(stageIndex), 0, STAGES.length - 1);
  const s = STAGES[idx];
  const next = STAGES[Math.min(STAGES.length - 1, idx + 1)];
  const r = lerp(s.r, next.r, easeInOutQuad(local));
  const dim = clamp(local * 3, 0, 1);
  const focus = tileCenter(2);

  clearScene(ctx, ANA_W, ANA_H);
  drawMap(ctx, ANA_MAP, ANA_SEED);

  // 已勘察路线：实线走保留下来的一支，虚线通向被放弃的一支。
  const keptPath: Pt[] = [{ x: 286, y: 24 }, tileCenter(2), tileCenter(6), tileCenter(7)];
  const lostPath: Pt[] = [tileCenter(6), tileCenter(4)];
  ctx.save();
  ctx.globalAlpha = 0.42;
  ctx.lineWidth = 8;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = C.route;
  ctx.beginPath();
  ctx.moveTo(keptPath[0].x, keptPath[0].y);
  for (let i = 1; i < keptPath.length; i++) ctx.lineTo(keptPath[i].x, keptPath[i].y);
  ctx.stroke();
  ctx.strokeStyle = C.muted;
  ctx.beginPath();
  ctx.moveTo(lostPath[0].x, lostPath[0].y);
  ctx.lineTo(lostPath[1].x, lostPath[1].y);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = C.route;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(keptPath[0].x, keptPath[0].y);
  for (let i = 1; i < keptPath.length; i++) ctx.lineTo(keptPath[i].x, keptPath[i].y);
  ctx.stroke();
  ctx.strokeStyle = C.muted;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(lostPath[0].x, lostPath[0].y);
  ctx.lineTo(lostPath[1].x, lostPath[1].y);
  ctx.stroke();
  ctx.restore();

  for (let i = 0; i < ANA_TILE_COUNT; i++) {
    const box = tileRect(i);
    const kept = s.keep.indexOf(i) >= 0;
    if (!kept) {
      // 被划掉的图块：暗底 + 红叉，形状本身就是线索，不只靠颜色。
      dimRect(ctx, box, 0.12 + 0.28 * dim, C.text);
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.65 * dim;
      drawCross(ctx, box.x + box.w / 2, box.y + box.h / 2, 8, C.red);
      ctx.restore();
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1;
      ctx.strokeRect(box.x, box.y, box.w, box.h);
    } else {
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.roundRect(box.x, box.y, box.w, box.h, 6);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(box.x, box.y, box.w, box.h, 6);
      ctx.stroke();
    }
  }

  drawBox(ctx, focus.x - 30, focus.y - 25, 60, 50, C.blue, 2, true);
  drawLoupe(ctx, focus.x, focus.y, r, s.zoom, C.blue);
  drawPin(ctx, focus.x, focus.y, C.orange, 0.9);

  drawLabel(ctx, s.label, ANA_W - 24, 32, { size: 20, color: C.blue, align: 'right', bold: true });
  drawLabel(ctx, '保留', ANA_W - 118, 78, { size: 14, color: C.text });
  drawLegend(ctx, [{ label: '划掉', color: C.red }], ANA_W - 118, 104);
}

export const Ana5: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState(0);

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
      // t0 在第一帧之前采样，(t - t0) 可能略为负；先把相位拉回 [0, 1)。
      const phase = ((((t - t0) % ANA_DUR) + ANA_DUR) % ANA_DUR) / ANA_DUR;
      const st = clamp(Math.floor(phase * STAGES.length), 0, STAGES.length - 1);
      const local = clamp(phase * STAGES.length - st, 0, 1);
      renderScene(ctx, st, local);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      if (st !== shown) {
        shown = st;
        setStage(st);
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

  return <canvas ref={ref} width={ANA_W} height={ANA_H} data-stage={stage} />;
};

export default Ana5;
