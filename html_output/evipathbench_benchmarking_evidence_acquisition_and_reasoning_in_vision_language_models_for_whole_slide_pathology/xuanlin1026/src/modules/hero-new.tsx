import React, { useEffect, useRef } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import {
  C,
  clearScene,
  drawMap,
  drawLabel,
  drawLoupe,
  drawRoute,
  drawBox,
  drawTarget,
  drawCheck,
  type Rect,
  type Pt,
} from '../lib/mapKit';
import type { WidgetProps } from './registry';

// ============================================================================
//  封面 · 本文方法一侧（560×280）
//  与「传统方法」用同一张地图、同一尺寸：没人替你把区域圈好，观察者自己选点，
//  把放大镜移到目标处，并按 2.5×→10×→40× 三档逐级看清细节。
//  右侧三档清单与左图的三级选框对应；画布比例 2:1，等比缩放后文字不会变形。
// ============================================================================

const W = 560;
const H = 280;
const MAP: Rect = { x: 16, y: 14, w: 318, h: 196 };
const SEED = 20261011;
const TARGET = { x: 236, y: 116 };
const LENS = { x: 386, y: 132, r: 62 };

const LEVELS: { label: string; color: string }[] = [
  { label: '2.5×', color: C.blue },
  { label: '10×', color: C.blue },
  { label: '40×', color: C.green },
];

export const HeroNew: React.FC<WidgetProps> = () => {
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

    // 自己走出来的勘察路线：从图角出发，逐级收窄到目标处。
    const route: Pt[] = [
      { x: 34, y: 186 },
      { x: 118, y: 168 },
      { x: 186, y: 140 },
      { x: TARGET.x, y: TARGET.y },
    ];
    drawRoute(ctx, route);

    // 三档选框：越往里越小，最后一档用实线加角标表示已锁定。
    drawBox(ctx, 142, 74, 158, 112, C.blue, 2.5, true);
    drawBox(ctx, 172, 90, 98, 78, C.blue, 2.5, true);
    drawBox(ctx, 194, 102, 54, 44, C.green, 3, false);

    drawTarget(ctx, TARGET.x, TARGET.y, 9, C.green);

    // 放大镜压在目标处，镜内是细节；一条短引线说明镜内就是选框里的那一点。
    drawLoupe(ctx, LENS.x, LENS.y, LENS.r, '40x', C.blue, 1);
    ctx.save();
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(TARGET.x + 22, TARGET.y - 4);
    ctx.quadraticCurveTo(TARGET.x + 56, TARGET.y - 34, LENS.x - LENS.r * 0.86, LENS.y - LENS.r * 0.34);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(LENS.x - LENS.r * 0.28, LENS.y - LENS.r * 0.1, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = C.green;
    ctx.beginPath();
    ctx.arc(LENS.x - LENS.r * 0.28, LENS.y - LENS.r * 0.1, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 三档放大清单：统一放在右下角的卡片里，与镜圈、选框都不重叠。
    ctx.save();
    ctx.fillStyle = C.white;
    ctx.globalAlpha = 0.86;
    ctx.beginPath();
    ctx.roundRect(452, 60, 92, 132, 10);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    LEVELS.forEach((lv, i) => {
      const y = 96 + i * 38;
      drawCheck(ctx, 470, y - 5, 8, C.green);
      drawLabel(ctx, lv.label, 488, y, { color: i === 2 ? C.green : C.blue, size: 20, bold: true });
    });

    drawLabel(ctx, '放大三档', 170, 250, { color: C.green, size: 20, align: 'center', bold: true });

    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  }, []);

  return <canvas ref={ref} width={W} height={H} />;
};

export default HeroNew;
