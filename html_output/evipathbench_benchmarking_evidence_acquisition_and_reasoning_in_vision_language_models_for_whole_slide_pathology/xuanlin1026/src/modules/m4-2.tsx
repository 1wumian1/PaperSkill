import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import {
  C,
  clearScene,
  drawMap,
  drawLoupe,
  drawPin,
  drawGauge,
  drawLabel,
  drawLegend,
  type Rect,
} from '../lib/mapKit';
import type { WidgetProps } from './registry';

// ============================================================================
//  m4-2 | 交互模块：切换三档探索预算，看模式 A 的平均交并比如何变化。
//  真实数字（论文 Table III，150 个查询）：GPT-5.2 在 2.5×/10×/40× 三列
//  (5,3,2)=0.002/0.007/0.000、(10,7,5)=0.086/0.059/0.066、(20,15,10)=0.006/0.033/0.003；
//  父框中心启发式 0.25–0.28（10×/40×）。
//  画面由共享地图工具包绘制；本文件只保留预算与曲线的排布。
// ============================================================================

const MAP: Rect = { x: 40, y: 40, w: 600, h: 200 };
const MAP_SEED = 20261011;

const W = 1080;
const H = 280;

type BudgetId = 'tight' | 'default' | 'loose';

interface BudgetRow {
  id: BudgetId;
  chip: string;
  pair: string;
  at25: number;
  at10: number;
  at40: number;
  counts: number[];
}

/** 三档探索预算与 GPT-5.2 在 2.5×/10×/40× 三列的平均交并比（论文 Table III）。 */
const BUDGETS: BudgetRow[] = [
  { id: 'tight', chip: '收紧 (5,3,2)', pair: '5 · 3 · 2', at25: 0.002, at10: 0.007, at40: 0.000, counts: [5, 3, 2] },
  { id: 'default', chip: '默认 (10,7,5)', pair: '10 · 7 · 5', at25: 0.086, at10: 0.059, at40: 0.066, counts: [10, 7, 5] },
  { id: 'loose', chip: '放宽 (20,15,10)', pair: '20 · 15 · 10', at25: 0.006, at10: 0.033, at40: 0.003, counts: [20, 15, 10] },
];

const BAR_X = [120, 180, 240];
const BASE_Y = 212;
const SCALE = 1500;
const barH = (v: number) => v * SCALE;

/** 三个预算档共用的横向位置：上方曲线点与下方条形一一对齐。 */
const KEY_X = [760, 860, 960];
const CURVE_Y = [132, 84, 130];
const BAR_BASE = 196;

const HEUR_Y = 95;

const PANEL_X = [1029, 1047, 1065];
const PANEL_Y = 212;
const PANEL_W = 14;
/** 面板里的柱子按每级最多 20 处等比换算，与 5/3/2、10/7/5、20/15/10 同比例。 */
const GAUGE_MAX = 20;
const GAUGE_H = GAUGE_MAX * 4.5;

/**
 * 右半幅：上为倒 U 形曲线（三档在 2.5× 列的取值），下为 2.5×/10× 两列真实
 * 平均交并比；最右是当前档位下每级允许查看的区域数。
 */
function drawBudgetInset(ctx: CanvasRenderingContext2D, sel: BudgetRow): void {
  // 基线与父框中心启发式的参考线。
  ctx.save();
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(700, BAR_BASE + 0.5);
  ctx.lineTo(1000, BAR_BASE + 0.5);
  ctx.stroke();
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(700, HEUR_Y);
  ctx.lineTo(1000, HEUR_Y);
  ctx.stroke();
  ctx.restore();

  // 倒 U 形曲线。
  ctx.save();
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 2;
  ctx.beginPath();
  BUDGETS.forEach((_b, i) => {
    if (i === 0) ctx.moveTo(KEY_X[i], CURVE_Y[i]);
    else ctx.lineTo(KEY_X[i], CURVE_Y[i]);
  });
  ctx.stroke();
  ctx.restore();

  BUDGETS.forEach((b, i) => {
    const selected = b.id === sel.id;
    ctx.save();
    ctx.fillStyle = selected ? C.orange : C.purple;
    ctx.beginPath();
    ctx.arc(KEY_X[i], CURVE_Y[i], selected ? 6 : 4.5, 0, Math.PI * 2);
    ctx.fill();
    if (selected) {
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(KEY_X[i], CURVE_Y[i], 10, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    drawLabel(
      ctx,
      b.at25.toFixed(3),
      i === 1 ? KEY_X[i] + 14 : i === 0 ? KEY_X[i] - 52 : KEY_X[i] + 14,
      CURVE_Y[i] - 10,
      { color: selected ? C.orange : C.muted, size: 14, align: i === 1 ? 'right' : 'left' }
    );
  });

  // 2.5× / 10× / 40× 三列并排柱：选中档用橙色并加描边。
  BUDGETS.forEach((b, i) => {
    const selected = b.id === sel.id;
    const drawBar = (x: number, v: number) => {
      const h = Math.max(3, barH(v));
      ctx.save();
      ctx.globalAlpha = selected ? 0.95 : 0.5;
      ctx.fillStyle = selected ? C.orange : C.blue;
      ctx.beginPath();
      ctx.roundRect(x, BASE_Y - h, 16, h, 4);
      ctx.fill();
      ctx.restore();
      if (selected) {
        ctx.save();
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, BASE_Y - h, 16, h, 4);
        ctx.stroke();
        ctx.restore();
      }
    };
    drawBar(BAR_X[i] - 26, b.at25);
    drawBar(BAR_X[i] - 8, b.at10);
    drawBar(BAR_X[i] + 10, b.at40);
  });
  // 列标签：三档柱子分别是哪一列。
  ['2.5×', '10×', '40×'].forEach((t, k) => {
    drawLabel(ctx, t, BAR_X[0] - 26 + k * 18 + 8, BASE_Y + 18, {
      color: C.muted,
      size: 13,
      align: 'center',
    });
  });

  // 最右：当前档位下每级允许查看的区域数（5/3/2、10/7/5 或 20/15/10）。
  ctx.save();
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PANEL_X[0] - 8, PANEL_Y + 0.5);
  ctx.lineTo(PANEL_X[2] + PANEL_W, PANEL_Y + 0.5);
  ctx.stroke();
  ctx.restore();
  sel.counts.forEach((v, i) => {
    drawGauge(ctx, PANEL_X[i], PANEL_Y - GAUGE_H, PANEL_W, GAUGE_H, v / GAUGE_MAX, C.orange);
  });
}

interface M42State {
  budget: BudgetId;
  seen: BudgetId[];
}

export const M4_2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<M42State>({ budget: 'default', seen: ['default'] });
  const curIndex = BUDGETS.findIndex((b) => b.id === state.budget);
  const cur = BUDGETS[curIndex < 0 ? 1 : curIndex];

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    try {
      setupCanvas(canvas, W, H);
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const idx = BUDGETS.findIndex((b) => b.id === state.budget);
    const sel = BUDGETS[idx < 0 ? 1 : idx];

    // 图与曲线同屏：不铺勘察网格，免得和数值争夺注意力。
    clearScene(ctx, W, H, false);
    drawMap(ctx, MAP, MAP_SEED);
    drawLoupe(ctx, 470, 140, 34, '40x', C.blue, 1);
    drawPin(ctx, 470, 140, C.green);
    drawLabel(ctx, '示意', 628, 62, { color: C.muted, size: 14, align: 'right' });
    drawLabel(ctx, '平均交并比', 700, 42, { color: C.text, size: 16 });
    drawBudgetInset(ctx, sel);
    drawLabel(ctx, '当前预算', 1079, 74, { color: C.orange, size: 14, align: 'right' });
    drawLegend(
      ctx,
      [
        { label: '当前预算档（2.5× 列）', color: C.orange },
        { label: '10× / 40× 列对照', color: C.blue },
        { label: '父框中心启发式 0.25–0.28', color: C.red },
      ],
      700,
      230,
      20
    );

    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  }, [state]);

  const pick = (id: BudgetId) => {
    setState((prev) => ({
      budget: id,
      seen: prev.seen.indexOf(id) < 0 ? prev.seen.concat([id]) : prev.seen,
    }));
  };

  const allSeen = BUDGETS.every((b) => state.seen.indexOf(b.id) >= 0);
  const baseText =
    cur.id === 'tight'
      ? '收紧到 (5,3,2)：GPT-5.2 在 2.5× 的平均交并比掉到 0.002。'
      : cur.id === 'default'
      ? '默认 (10,7,5) 是这三档里最好的一档：2.5× 为 0.086。'
      : '放宽到 (20,15,10)：反而降到 0.006——更多探索放大了空间漂移。';
  const cls = cur.id === 'default' ? 'good' : 'bad';
  const extra = allSeen ? '三档都看过了：并不是看得越多就越准。' : '';

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="chip-row">
        {BUDGETS.map((b) => (
          <button
            key={b.id}
            type="button"
            className={b.id === state.budget ? 'chip selected' : 'chip'}
            onClick={() => pick(b.id)}
          >
            {b.chip}
          </button>
        ))}
      </div>
      <div className="ctrl">
        <label>
          当前预算（2.5×/10×/40× 每级可看几处） <span className="val">{cur.pair}</span>
        </label>
        <label>
          2.5× 平均交并比 <span className="val">{cur.at25.toFixed(3)}</span>
        </label>
        <label>
          10× 平均交并比 <span className="val">{cur.at10.toFixed(3)}</span>
        </label>
        <label>
          40× 平均交并比 <span className="val">{cur.at40.toFixed(3)}</span>
        </label>
        <label>
          父框中心启发式 <span className="val">0.25–0.28</span>
        </label>
      </div>
      <div className={`feedback ${cls}`}>
        {baseText}
        {extra ? ' ' + extra : ''}
        <br />
        三列数值均出自 Table III（50 张切片、每张 3 个查询、150 个查询/模型/预算）；父框中心启发式在 10×/40× 两列为 0.25–0.28。
      </div>
    </div>
  );
};

export default M4_2;
