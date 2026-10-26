import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, clamp, easeInOutQuad } from '../lib/canvasKit';
import {
  C,
  rand,
  clearScene,
  drawMap,
  drawLoupe,
  drawPin,
  drawBox,
  drawRoute,
  drawLabel,
  drawValueBar,
  drawLegend,
  frame,
  type Rect,
  type Pt,
} from '../lib/mapKit';
import type { WidgetProps } from './registry';

// ============================================================================
//  §6 模块 6.2「同一批模型，四项表现差多远」：按一下开始，所有条从同一条
//  基线在同一 1.4 秒内生长（带轻微错峰）并停在真实数值上；蓝色虚线是专家参考。
//  绘制工具包来自共享「地图勘察 + 放大镜」工具包；本文件只保留自己的赛道、
//  刻度与右侧读数面板。画面 1080x280。
// ============================================================================

const W = 1080;
const H = 280;
const MAP_SEED = 20261016;

const BAR_X0 = 320;
const PLOT_W = 480;
const BAR_H = 26;
const STAGGER = 0.06;
const SPAN = 0.82;
const RUN_MS = 1400;
const PY0 = 250;
const PY_TOP = 56;
const INSET: Rect = { x: 838, y: 96, w: 210, h: 148 };

type RaceMetric = 'acc' | 'iou';

interface RaceBar {
  label: string;
  value: number;
  text: string;
  color: string;
  tickAt?: number;
  tickText?: string;
}

const ACC_BARS: RaceBar[] = [
  { label: 'T4 专家', value: 96.6, text: '96.6', color: C.blue },
  { label: 'T4 最好模型', value: 93.4, text: '93.4', color: C.green },
  { label: 'T1 最好模型', value: 63.5, text: '63.5', color: C.red, tickAt: 93.6, tickText: '93.6' },
  { label: 'T2 最好模型', value: 67.7, text: '67.7', color: C.red, tickAt: 92.3, tickText: '92.3' },
];

const IOU_BARS: RaceBar[] = [
  { label: '模式 A 最好模型', value: 0.086, text: '0.086', color: C.red },
  { label: '父框中心启发式', value: 0.28, text: '0.25–0.28', color: C.purple },
];

const ACC_FOOTER = 'T4：七个模型 >92%，最好的三个开源权重 ≤26B；T3B 52.2 → 2.02';
const IOU_FOOTER = '模式 A：50 张切片、150 个查询；父框中心启发式取 10×/40×';

interface M62State {
  metric: RaceMetric;
  started: boolean;
  phase: number;
  runId: number;
}

function rowY(i: number): number {
  return 62 + i * 48;
}

/** 竖向虚线刻度：专家参考值一贯到底，与红/紫/绿的条在颜色上区分开。 */
function needle(ctx: CanvasRenderingContext2D, x: number, color: string): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(x, PY_TOP - 6);
  ctx.lineTo(x, PY0 - 10);
  ctx.stroke();
  ctx.restore();
}

/** 赛道：一条共用基线、四等分刻度、所有条共用的零起点。 */
function drawTrack(ctx: CanvasRenderingContext2D, scale: number, reference: number): void {
  ctx.save();
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(BAR_X0, PY_TOP);
  ctx.lineTo(BAR_X0, PY0);
  ctx.lineTo(BAR_X0 + PLOT_W, PY0);
  ctx.stroke();
  ctx.restore();

  // 基线左端的零标：所有条都从这里长出来。
  ctx.save();
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(BAR_X0, PY_TOP - 8);
  ctx.lineTo(BAR_X0, PY_TOP + 6);
  ctx.stroke();
  ctx.restore();

  for (let k = 1; k <= 4; k++) {
    const x = BAR_X0 + (PLOT_W * k) / 4;
    const v = (scale * k) / 4;
    ctx.save();
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, PY_TOP);
    ctx.lineTo(x, PY0);
    ctx.stroke();
    ctx.restore();
    drawLabel(ctx, v >= 1 ? String(Math.round(v)) : v.toFixed(2), x, PY0 + 22, {
      size: 14,
      color: C.muted,
      align: 'center',
    });
  }

  needle(ctx, BAR_X0 + (reference / scale) * PLOT_W, C.blue);
}

function renderScene(ctx: CanvasRenderingContext2D, s: M62State): void {
  const acc = s.metric === 'acc';
  const bars = acc ? ACC_BARS : IOU_BARS;
  const scale = acc ? 100 : 0.28;
  const reference = acc ? 96.6 : 0.28;

  // 纯图表面：不铺测绘网格，免得细格与条长互相干扰。
  clearScene(ctx, W, H, false);
  drawLabel(ctx, acc ? ACC_FOOTER : IOU_FOOTER, 40, 30, { size: 14, color: C.muted });

  // 所有条共用同一条基线；专家参考作为一贯到底的虚线刻度。
  drawTrack(ctx, scale, reference);

  bars.forEach((b, i) => {
    const y = rowY(i);
    drawLabel(ctx, b.label, BAR_X0 - 16, y + 19, {
      size: 16,
      color: C.text,
      align: 'right',
    });

    const p = s.started ? easeInOutQuad(clamp((s.phase - i * STAGGER) / SPAN, 0, 1)) : 0;
    const frac = b.value / scale;
    const len = frac * PLOT_W * p;

    // 浅色轨道标出满程，再用同一支笔从基线向右生长。
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = C.axis;
    ctx.beginPath();
    ctx.roundRect(BAR_X0, y, PLOT_W, BAR_H, 7);
    ctx.fill();
    ctx.restore();
    if (p > 0) {
      drawValueBar(ctx, BAR_X0, y, len, BAR_H, 1, b.color, 'rgba(255,255,255,0)');
      // 条头留一道浅色边，动画中点也能看清条在生长。
      if (p < 1) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = C.white;
        ctx.beginPath();
        ctx.roundRect(BAR_X0 + len - 6, y, 6, BAR_H, 3);
        ctx.fill();
        ctx.restore();
      }
    }

    // 该行右上角的虚线小刻度：同批其他任务上最好模型的成绩。
    if (b.tickAt !== undefined) {
      const tx = BAR_X0 + (b.tickAt / scale) * PLOT_W;
      ctx.save();
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(tx, y - 4);
      ctx.lineTo(tx, y + BAR_H + 4);
      ctx.stroke();
      ctx.restore();
      if (b.tickText) {
        drawLabel(ctx, b.tickText, tx, y - 11, {
          size: 14,
          color: C.blue,
          align: 'center',
          bold: true,
        });
      }
    }

    if (s.started) {
      const overflow = len + 10 + b.text.length * 10 > PLOT_W + 40;
      if (overflow) {
        drawLabel(ctx, b.text, BAR_X0 + len - 10, y + 19, {
          size: 17,
          color: C.white,
          align: 'right',
          bold: true,
        });
      } else {
        drawLabel(ctx, b.text, BAR_X0 + len + 10, y + 19, {
          size: 17,
          color: C.text,
          bold: true,
        });
      }
    }
  });

  // 右侧读数面板：专家参考与当前指标同框，颜色与图例一致。
  const panel: Rect = { x: 838, y: 44, w: 210, h: 46 };
  ctx.save();
  ctx.fillStyle = C.white;
  ctx.globalAlpha = 0.82;
  ctx.beginPath();
  ctx.roundRect(panel.x, panel.y, panel.w, panel.h, 10);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
  frame(ctx, panel, C.axis, 1.5);
  drawLabel(ctx, '专家参考', 850, 62, { size: 14, color: C.muted });
  drawLabel(ctx, acc ? '96.6' : '0.28', 850, 84, { size: 22, color: C.blue, bold: true });
  drawValueBar(ctx, 964, 74, 68, 10, acc ? 0.966 : 1, C.blue);

  // 右侧小地图：准确率一档是「证据已给」，定位一档是「自己找位置」。
  drawMap(ctx, INSET, MAP_SEED + 7);
  if (acc) {
    drawBox(ctx, INSET.x + 22, INSET.y + 26, 120, 64, C.blue, 2.5, false);
    drawPin(ctx, INSET.x + 82, INSET.y + 74, C.green, 0.9);
  } else {
    const lens = { x: INSET.x + 54, y: INSET.y + 46 };
    const target = { x: INSET.x + 152, y: INSET.y + 116 };
    drawRoute(ctx, [lens, target], true);
    drawLoupe(ctx, lens.x, lens.y, 24, '40x', C.red);
    drawPin(ctx, target.x, target.y, C.green, 0.9);
  }

  drawLegend(
    ctx,
    acc
      ? [
          { label: '专家参考', color: C.blue },
          { label: '论文方法最好', color: C.green },
          { label: '落后项', color: C.red },
        ]
      : [
          { label: '论文方法最好', color: C.red },
          { label: '父框中心启发式', color: C.purple },
        ],
    700,
    62,
    26
  );
}

function feedbackOf(s: M62State): { cls: string; text: string } {
  if (!s.started) {
    return { cls: '', text: '按一下「开始对比」，让数值从同一条基线生长出来。' };
  }
  const tail =
    '结论限于：自主导航只覆盖乳腺队列、模式 A 面板较窄、两种模式都使用固定预算或保留表、93% 受四选一格式限定。';
  if (s.metric === 'acc') {
    return {
      cls: 'good',
      text: `证据给定后整合已接近专家（96.6 对 93.4），但判读与核对仍差 26–30 个百分点。${tail}`,
    };
  }
  return {
    cls: 'bad',
    text: `定位是另一回事：最好的模型只有 0.086，而一个不需要模型的中心启发式就有 0.25–0.28。${tail}`,
  };
}

export const M6_2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [state, setState] = useState<M62State>({
    metric: 'acc',
    started: false,
    phase: 0,
    runId: 0,
  });

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

  useEffect(() => {
    if (!state.started) return;
    let raf: number | null = null;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = clamp((t - t0) / RUN_MS, 0, 1);
      setState((prev) => (prev.phase === p ? prev : { ...prev, phase: p }));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [state.started, state.runId]);

  const startRace = () => {
    setState((prev) => ({ ...prev, started: true, phase: 0, runId: prev.runId + 1 }));
  };

  const switchMetric = (metric: RaceMetric) => {
    setState((prev) => {
      if (prev.metric === metric) return prev;
      return {
        ...prev,
        metric,
        phase: 0,
        runId: prev.started ? prev.runId + 1 : prev.runId,
      };
    });
  };

  const fb = feedbackOf(state);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <span>对比指标</span>
        <span className="val">{state.metric === 'acc' ? '准确率' : '平均交并比'}</span>
      </div>
      <div className="chip-row">
        <button
          type="button"
          className={`chip${state.metric === 'acc' ? ' selected' : ''}`}
          onClick={() => switchMetric('acc')}
        >
          准确率（越高越好）
        </button>
        <button
          type="button"
          className={`chip${state.metric === 'iou' ? ' selected' : ''}`}
          onClick={() => switchMetric('iou')}
        >
          定位的平均交并比（越高越好）
        </button>
      </div>
      <div className="chip-row">
        <button type="button" className="chip" disabled={state.started} onClick={startRace}>
          开始对比
        </button>
        <button type="button" className="chip" disabled={!state.started} onClick={startRace}>
          重播
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default M6_2;
