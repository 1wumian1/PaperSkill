import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  rand,
  clearScene,
  drawMap,
  drawLoupe,
  drawPin,
  drawBox,
  drawRoute,
  drawCross,
  drawLabel,
  drawNumber,
  drawLegend,
  dimRect,
  type Rect,
  type Pt,
} from '../lib/mapKit';
import type { WidgetProps } from './registry';

// ============================================================================
//  §5 模块 5.2「覆盖率怎么掉的」：逐级前进，看三级保留树在同一段路径上
//  如何收窄。数值取论文 Table IV 默认保留表 (6,3,2)，只画正文给出的
//  无条件命中率 54.82 / 19.89 / 2.24。绘制工具包来自共享「地图勘察 + 放大镜」
//  工具包；本文件只保留自己的层级树、折线与步进面板。画面 1080x280。
// ============================================================================

const W = 1080;
const H = 280;
const MAP_SEED = 20261014;
const TREE_PANEL: Rect = { x: 40, y: 34, w: 480, h: 212 };

type ZoomKey = '2.5x' | '10x' | '40x';

const LEVELS: { label: string; zoom: ZoomKey; count: number }[] = [
  { label: '2.5×', zoom: '2.5x', count: 6 },
  { label: '10×', zoom: '10x', count: 3 },
  { label: '40×', zoom: '40x', count: 2 },
];
const LVL_Y = [64, 132, 200];
const BLK_W = 22;
const BLK_H = 30;
const BLK_GAP = 6;
const BLK_X0 = 146;
const CROSSED_X1 = 512;
const ANCHOR_X = 118;

const XS = [780, 880, 980];
const AXIS_X = 700;
const AXIS_Y = 232;
const AXIS_TOP = 60;
const Y_MAX = 60;
// 只画论文正文给出的可读数值：Table IV 默认保留表 (6,3,2) 下 Gemini-3-Flash 的
// 无条件命中率 54.82 / 19.89 / 2.24（45 张切片子集，直接测量）。
const UNCOND = [54.82, 19.89, 2.24];

const STEP_MIN = 1;
const STEP_MAX = 3;

interface M52State {
  step: number;
}

function py(v: number): number {
  return AXIS_Y - (v / Y_MAX) * (AXIS_Y - AXIS_TOP);
}

function renderScene(ctx: CanvasRenderingContext2D, s: M52State): void {
  // 右侧是图表面：不铺测绘网格，免得细格与折线互相干扰。
  clearScene(ctx, W, H, false);
  drawMap(ctx, TREE_PANEL, MAP_SEED);

  const anchors: Pt[] = LEVELS.map((_lv, i) => ({
    x: ANCHOR_X,
    y: LVL_Y[i] + BLK_H,
  }));
  const rootAnchor = { x: ANCHOR_X, y: 38 };

  // 逐级树：走过的段加粗，还没走到的段用虚线（不可逆的未达状态）。
  drawRoute(ctx, [rootAnchor].concat(anchors).slice(0, s.step + 1), false);
  drawRoute(ctx, [rootAnchor].concat(anchors).slice(s.step), true);

  LEVELS.forEach((lv, i) => {
    const y = LVL_Y[i];
    const reached = i + 1 <= s.step;
    const current = i + 1 === s.step;
    drawLabel(ctx, lv.label, 58, y + 21, {
      size: 16,
      color: current ? C.blue : C.muted,
      bold: current,
    });

    // 这一级保留下来的图块：走到就点亮成橙色，还没走到是浅色。
    const bw = lv.count * (BLK_W + BLK_GAP) - BLK_GAP;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = reached ? C.orange : C.paper;
    ctx.beginPath();
    ctx.roundRect(BLK_X0 - 5, y - 5, bw + 10, BLK_H + 10, 8);
    ctx.fill();
    ctx.restore();

    for (let j = 0; j < lv.count; j++) {
      const bx = BLK_X0 + j * (BLK_W + BLK_GAP);
      ctx.save();
      ctx.fillStyle = reached ? C.orange : C.white;
      ctx.globalAlpha = reached ? 0.92 : 0.85;
      ctx.beginPath();
      ctx.roundRect(bx, y, BLK_W, BLK_H, 6);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = reached ? C.deep : C.axis;
      ctx.lineWidth = reached ? 1.6 : 1;
      ctx.beginPath();
      ctx.roundRect(bx, y, BLK_W, BLK_H, 6);
      ctx.stroke();
    }

    // 这一级没被保留的部分：暗底 + 红叉，只给形状与「被划掉」，不给数量。
    const cx0 = BLK_X0 + bw + 10;
    const crossed: Rect = { x: cx0, y, w: CROSSED_X1 - cx0, h: BLK_H };
    dimRect(ctx, crossed, 0.14, C.text);
    drawBox(ctx, crossed.x, crossed.y, crossed.w, crossed.h, C.red, 1.5, true);
    drawCross(ctx, crossed.x + crossed.w / 2, crossed.y + crossed.h / 2, 9, C.red);

    if (current) {
      drawBox(ctx, BLK_X0 - 11, y - 10, bw + 22, BLK_H + 20, C.blue, 2.5, false);
      drawLoupe(ctx, BLK_X0 + BLK_W / 2, y + BLK_H / 2, 17, lv.zoom, C.blue);
      drawPin(ctx, anchors[i].x, anchors[i].y, C.blue, 0.85);
    }
  });

  drawLabel(ctx, '逐级保留', 40, 26, { size: 16, color: C.text });

  // 右侧：0–60 的纵轴，无条件命中率一条折线，共用一个基线。
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(AXIS_X, AXIS_TOP);
  ctx.lineTo(AXIS_X, AXIS_Y);
  ctx.lineTo(1010, AXIS_Y);
  ctx.stroke();
  drawLabel(ctx, String(Y_MAX), AXIS_X - 10, AXIS_TOP + 6, {
    size: 14,
    color: C.muted,
    align: 'right',
  });
  drawLabel(ctx, '0', AXIS_X - 10, AXIS_Y + 5, {
    size: 14,
    color: C.muted,
    align: 'right',
  });
  LEVELS.forEach((lv, i) => {
    drawLabel(ctx, lv.label, XS[i], 258, { size: 15, color: C.muted, align: 'center' });
  });
  drawLegend(
    ctx,
    [
      { label: '无条件', color: C.blue },
      { label: '尚未走到', color: C.muted },
      { label: '已划掉', color: C.red },
    ],
    700,
    40,
    22
  );

  for (let i = 0; i < XS.length - 1; i++) {
    const done = i + 1 < s.step;
    ctx.save();
    ctx.strokeStyle = done ? C.blue : C.axis;
    ctx.lineWidth = done ? 3.5 : 2;
    if (!done) ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(XS[i], py(UNCOND[i]));
    ctx.lineTo(XS[i + 1], py(UNCOND[i + 1]));
    ctx.stroke();
    ctx.restore();
  }
  XS.forEach((x, i) => {
    const reached = i < s.step;
    ctx.save();
    ctx.fillStyle = reached ? C.blue : C.white;
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, py(UNCOND[i]), reached ? 7 : 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });

  const ci = s.step - 1;
  drawNumber(ctx, String(UNCOND[ci]), XS[ci] + 12, py(UNCOND[ci]) + 20, C.blue, 20);
}

function feedbackOf(s: M52State): { cls: string; text: string } {
  let head: { cls: string; text: string };
  if (s.step === 1) {
    head = { cls: '', text: '2.5×：无条件命中率 54.82%，首级选择还看得过去。' };
  } else if (s.step === 2) {
    head = { cls: '', text: '10×：无条件命中率掉到 19.89%——一半以上的阳性块已经不可达。' };
  } else {
    head = { cls: 'bad', text: '40×：无条件只剩 2.24%——大部分阳性块在前两级就被剪掉了。' };
  }
  return {
    cls: head.cls,
    text: `${head.text} 数值出自 Table IV 默认保留表 (6,3,2)、45 张切片子集；摘要中另一条独立测量给出 52.2%→18.5%→2.02%。`,
  };
}

export const M5_2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [state, setState] = useState<M52State>({ step: STEP_MIN });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx = ctxRef.current;
    if (!ctx) {
      try {
        ctx = setupCanvas(canvas, W, H);
      } catch {
        return;
      }
      ctxRef.current = ctx;
    } else {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const dpr = window.devicePixelRatio || 1;
      ctx.scale(dpr, dpr);
    }
    renderScene(ctx, state);
    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  }, [state]);

  const fb = feedbackOf(state);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <span>
          当前倍率步骤 <span className="val">{state.step} / {STEP_MAX}</span>
        </span>
      </div>
      <div className="chip-row">
        <button
          type="button"
          className="chip"
          disabled={state.step <= STEP_MIN}
          onClick={() => setState((prev) => ({ step: clamp(prev.step - 1, STEP_MIN, STEP_MAX) }))}
        >
          上一步
        </button>
        <button
          type="button"
          className="chip"
          disabled={state.step >= STEP_MAX}
          onClick={() => setState((prev) => ({ step: clamp(prev.step + 1, STEP_MIN, STEP_MAX) }))}
        >
          下一步
        </button>
        <button
          type="button"
          className="chip"
          disabled={state.step === STEP_MIN}
          onClick={() => setState({ step: STEP_MIN })}
        >
          重置
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default M5_2;
