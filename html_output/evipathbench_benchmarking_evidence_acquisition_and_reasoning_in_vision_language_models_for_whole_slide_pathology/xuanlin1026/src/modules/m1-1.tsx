import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, map } from '../lib/canvasKit';
import {
  C,
  clearScene,
  drawMap,
  drawLoupe,
  drawPin,
  drawLegend,
  drawLabel,
  drawCheck,
  drawCross,
  drawCompare,
  type Rect,
} from '../lib/mapKit';
import type { WidgetProps } from './registry';

// ============================================================================
//  m1-1 「预先圈好的视野有多局限」（1080×280）
//  主导操作：拖动滑杆改变「别人替你圈好的区域」大小。
//  可见状态变化：镜圈变大、右侧覆盖占比条同步变化。
//  即时反馈：.feedback 三档文案；应有判断：区域预先给好，题目就不再考「找」。
// ============================================================================

/** 非颜色线索：由下方短横线组成的竖向「覆盖占比」条。 */
function drawCoverBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  frac: number,
  color: string
) {
  const filled = clamp(frac, 0, 1);
  ctx.save();
  ctx.fillStyle = C.white;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  const n = Math.max(28, Math.round(h / 6));
  for (let i = 0; i < n; i++) {
    const t = i / n;
    if (t > filled) break;
    const ty = y + h - 4 - t * (h - 8);
    ctx.beginPath();
    ctx.moveTo(x + 6, ty);
    ctx.lineTo(x + w - 6, ty);
    ctx.stroke();
  }
  // 顶端的短横线标记当前高度，颜色之外还有一个位置线索。
  const capY = y + h - 4 - filled * (h - 8);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 3, capY);
  ctx.lineTo(x + w - 3, capY);
  ctx.stroke();
  ctx.restore();
}

const W = 1080;
const H = 280;
const MAP: Rect = { x: 40, y: 30, w: 700, h: 174 };
const MAP_SEED = 20261011;
const TARGET = { x: 612, y: 128 };
const LENS = { x: 380, y: 118 };
const BAR = { x: 800, y: 34, w: 130, h: 140 };

export const M1_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [share, setShare] = useState(20);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const r = map(share, 0, 100, 34, 150);
    const d = Math.hypot(LENS.x - TARGET.x, LENS.y - TARGET.y);
    const hit = r >= d;
    const frac = clamp(r / d, 0, 1);
    clearScene(ctx, W, H);
    drawMap(ctx, MAP, MAP_SEED);
    drawPin(ctx, TARGET.x, TARGET.y, C.green, 1.1);
    drawLoupe(ctx, LENS.x, LENS.y, r, '2.5x', hit ? C.green : C.blue);
    drawLabel(ctx, '给定视野', clamp(LENS.x - r * 0.7, 52, 300), LENS.y - r - 12, {
      color: C.blue,
      size: 16,
    });
    drawLabel(ctx, '标注目标', TARGET.x, TARGET.y - 34, {
      color: C.green,
      size: 16,
      align: 'center',
    });
    // 盖到用对勾、没盖到在目标上打叉：状态不靠颜色单独承担。
    if (hit) drawCheck(ctx, LENS.x + r * 0.62, LENS.y - r * 0.62, 13, C.green);
    else drawCross(ctx, TARGET.x, TARGET.y - 20, 11, C.red);
    // 同一个尺度上比较「镜圈能到多远」与「目标有多远」，缺口一眼可见。
    drawCompare(
      ctx,
      40,
      H - 46,
      MAP.w,
      [
        { label: '视野半径', value: r, color: hit ? C.green : C.blue },
        { label: '到目标距离', value: d, color: C.orange },
      ],
      12,
      22
    );
    drawCoverBar(ctx, BAR.x, BAR.y, BAR.w, BAR.h, frac, hit ? C.green : C.red);
    drawLabel(ctx, '覆盖率', BAR.x + BAR.w / 2, BAR.y + BAR.h + 24, {
      color: C.muted,
      size: 14,
      align: 'center',
    });
    drawLegend(
      ctx,
      [
        { label: '给定视野', color: C.blue },
        { label: '标注目标', color: C.green },
        { label: '没盖到', color: C.red },
      ],
      960,
      44
    );
    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  }, [share]);

  const feedback =
    share < 30
      ? { text: '框得再小，也盖不到目标：给定视野解决的是解释，不是寻找。', cls: 'bad' }
      : share < 70
      ? { text: '覆盖了一部分，但选哪里仍然不是模型决定的。', cls: '' }
      : { text: '框得足够大才碰到目标，可这时它已经不是「定位」了。', cls: 'good' };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          预先给出的区域比例 <span className="val">{share}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={share}
          aria-label="预先给出的区域比例"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShare(clamp(Number(e.target.value), 0, 100))}
        />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M1_1;
