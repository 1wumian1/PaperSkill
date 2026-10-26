import React, { useEffect, useRef } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { C, clearScene, drawMap, drawLabel, drawPin, dimRect, rand, type Rect } from '../lib/mapKit';
import type { WidgetProps } from './registry';

// ============================================================================
//  封面 · 传统方法一侧（560×280）
//  同一张铺开的地图，但诊断区域是别人预先裁好的：一个固定的红色选框，两处本可
//  继续放大的可疑区域已经暗掉并被划掉，旁边一枚锁形标记。
//  画布比例 2:1，与封面栏宽度接近，因此等比缩放后文字不会被压成竖长条。
// ============================================================================

const W = 560;
const H = 280;
const MAP: Rect = { x: 16, y: 14, w: 318, h: 196 };
const SEED = 20261011;
const FIXED: Rect = { x: 104, y: 62, w: 124, h: 78 };

function drawLock(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(x, y - 4, 13, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = C.red;
  ctx.beginPath();
  ctx.roundRect(x - 21, y - 4, 42, 36, 7);
  ctx.fill();
  ctx.fillStyle = C.white;
  ctx.beginPath();
  ctx.arc(x, y + 10, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 3, y + 10, 6, 11);
  ctx.restore();
}

export const HeroOld: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    clearScene(ctx, W, H);
    drawMap(ctx, MAP, SEED);

    // 被放弃、再也回不来的可疑区域。
    const pruned: Rect[] = [
      { x: 32, y: 30, w: 88, h: 58 },
      { x: 238, y: 122, w: 82, h: 50 },
    ];
    pruned.forEach((r) => {
      dimRect(ctx, r, 0.5);
      ctx.save();
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 3;
      ctx.setLineDash([7, 5]);
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(r.x + r.w * 0.26, r.y + r.h * 0.26);
      ctx.lineTo(r.x + r.w * 0.74, r.y + r.h * 0.74);
      ctx.moveTo(r.x + r.w * 0.74, r.y + r.h * 0.26);
      ctx.lineTo(r.x + r.w * 0.26, r.y + r.h * 0.74);
      ctx.stroke();
      ctx.restore();
    });

    // 被预先裁好、唯一还亮着的那一块。
    ctx.save();
    ctx.fillStyle = C.white;
    ctx.globalAlpha = 0.97;
    ctx.beginPath();
    ctx.roundRect(FIXED.x, FIXED.y, FIXED.w, FIXED.h, 5);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.roundRect(FIXED.x, FIXED.y, FIXED.w, FIXED.h, 5);
    ctx.clip();
    ctx.fillStyle = '#eae4dc';
    ctx.fillRect(FIXED.x, FIXED.y, FIXED.w, FIXED.h);
    ctx.strokeStyle = '#cdc4b8';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 12; i++) {
      const bx = FIXED.x + 10 + rand(SEED + 3, i * 2) * (FIXED.w - 20);
      const by = FIXED.y + 10 + rand(SEED + 3, i * 2 + 1) * (FIXED.h - 20);
      ctx.beginPath();
      ctx.ellipse(bx, by, 6 + rand(SEED, i) * 5, 4 + rand(SEED, i + 9) * 4, rand(SEED, i + 2) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#9c8f80';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(
        FIXED.x + 16 + rand(SEED + 5, i * 3) * (FIXED.w - 32),
        FIXED.y + 14 + rand(SEED + 5, i * 3 + 1) * (FIXED.h - 28),
        2.8,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 4;
    ctx.strokeRect(FIXED.x, FIXED.y, FIXED.w, FIXED.h);
    ctx.restore();

    drawPin(ctx, FIXED.x + FIXED.w / 2, FIXED.y + FIXED.h - 3, C.orange, 1.1);

    // 锁：模型无法自己挪动这个框。
    drawLock(ctx, 424, 74);
    drawLabel(ctx, '已给定', 424, 168, { color: C.red, size: 22, align: 'center', bold: true });
    drawLabel(ctx, '区域不由模型选', 170, 250, { color: C.red, size: 20, align: 'center', bold: true });

    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  }, []);

  return <canvas ref={ref} width={W} height={H} />;
};

export default HeroOld;
