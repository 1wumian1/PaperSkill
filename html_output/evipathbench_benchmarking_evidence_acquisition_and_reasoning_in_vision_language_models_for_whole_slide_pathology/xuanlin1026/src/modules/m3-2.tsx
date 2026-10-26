import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  clearScene,
  drawMap,
  drawRoute,
  drawBox,
  drawPin,
  drawCross,
  dimRect,
  drawLabel,
  drawLegend,
  type Rect,
} from '../lib/mapKit';
import type { WidgetProps } from './registry';

// ============================================================================
//  m3-2 | 交互模块：用上一步/下一步走完一条诊断路径，看每一级被允许放大的
//  范围如何被上一级锁定，被放弃的分支如何留在画面上。步骤 0–3 对应
//  整张缩略图 → 2.5× → 10× → 40×。
//  画面上的选框尺寸直接读出（标注「示意」），不是论文数值；由此算出的
//  范围百分比一律标注「据此推得」。
//  画面由共享地图工具包绘制；本文件只保留逐级选框的排布。
// ============================================================================

const MAP: Rect = { x: 40, y: 40, w: 600, h: 200 };
const MAP_SEED = 20261011;

const W = 1080;
const H = 280;

/** 选框尺寸直接取自画面坐标（示意），不是论文数值。
 *  每一级选框都必须落在上一级选框之内，也落在整张地图之内。 */
const RECS: Rect[] = [
  { x: MAP.x, y: MAP.y, w: MAP.w, h: MAP.h },
  { x: 344, y: 88, w: 296, h: 152 },
  { x: 404, y: 112, w: 168, h: 96 },
  { x: 444, y: 128, w: 84, h: 56 },
];

/** 被放弃的分支：压暗的虚线框 + 红色叉号（颜色之外还有形状线索）。 */
const BRANCHES: (Rect & { at: number })[] = [
  { x: 152, y: 66, w: 110, h: 66, at: 1 },
  { x: 528, y: 150, w: 96, h: 58, at: 2 },
];

const TARGET = { x: 470, y: 156 };

/**
 * 逐级路径：已走过的选框留成虚线，当前这一级用实线加角标表示已锁定；
 * 被放弃的分支压暗并画叉。返回本步可见的选框，供标签使用。
 */
function drawStepPath(ctx: CanvasRenderingContext2D, step: number): Rect[] {
  const boxes = RECS.slice(0, step + 1);
  const path = boxes.map((b) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 }));
  drawRoute(ctx, path);

  for (let i = 1; i < boxes.length; i++) {
    const b = boxes[i];
    if (i === boxes.length - 1) drawBox(ctx, b.x, b.y, b.w, b.h, C.orange, 2.5, false);
    else drawBox(ctx, b.x, b.y, b.w, b.h, C.purple, 1, true);
  }

  BRANCHES.filter((br) => step >= br.at).forEach((br) => {
    dimRect(ctx, br, 0.35);
    drawBox(ctx, br.x, br.y, br.w, br.h, C.red, 2, true);
    drawCross(ctx, br.x + br.w / 2, br.y + br.h / 2, 11, C.red);
  });

  return boxes;
}

interface M32State {
  step: number;
  seen: number[];
}

export const M3_2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<M32State>({ step: 0, seen: [0] });

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
    const step = clamp(state.step, 0, 3);

    clearScene(ctx, W, H);
    drawMap(ctx, MAP, MAP_SEED);
    const boxes = drawStepPath(ctx, step);
    if (step >= 3) drawPin(ctx, TARGET.x, TARGET.y, C.green);
    const cur = boxes[boxes.length - 1];
    drawLabel(ctx, `选框 ${cur.w}×${cur.h}`, 672, 82, { color: C.orange, size: 16 });
    drawLabel(ctx, '范围示意', 1030, 258, { color: C.muted, size: 16, align: 'right' });
    drawLegend(
      ctx,
      [
        { label: '当前可选范围', color: C.orange },
        { label: '放弃的分支', color: C.red },
        { label: '标注目标', color: C.green },
      ],
      672,
      152
    );
    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  }, [state]);

  const go = (next: number) => {
    const v = clamp(next, 0, 3);
    setState((prev) => ({ step: v, seen: prev.seen.indexOf(v) < 0 ? prev.seen.concat([v]) : prev.seen }));
  };

  const cur = RECS[clamp(state.step, 0, 3)];
  const reached3 = state.seen.indexOf(3) >= 0;
  const baseText =
    state.step === 0
      ? '根节点是整张缩略图。'
      : state.step === 1
      ? '2.5×：在整张图的范围内选第一处。'
      : state.step === 2
      ? '10×：只能在上一级框内选，选框缩到 168×96（约占整图 11.8%，据此推得）。'
      : '40×：选框只剩 84×56（约占整图 3.3%，据此推得）；被放弃的分支不会回来。';
  const text = reached3 && state.step !== 3 ? baseText + '你已经走到 40×：被放弃的分支不会回来。' : baseText;
  const cls = state.step === 3 ? 'good' : '';

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="step-ctrl">
        <button type="button" className="tiny" onClick={() => go(state.step - 1)} disabled={state.step <= 0}>
          上一步
        </button>
        <span className="step-label">
          步骤 <b>{state.step}</b> / 3
        </span>
        <button type="button" className="tiny" onClick={() => go(state.step + 1)} disabled={state.step >= 3}>
          下一步
        </button>
        <button type="button" className="tiny" onClick={() => go(0)}>
          重置
        </button>
      </div>
      <div className="ctrl">
        <label>
          这一级可选范围 <span className="val">{`${cur.w}×${cur.h}`}</span>
        </label>
        <label>
          当前步骤 <span className="val">{state.step}</span>
        </label>
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M3_2;
