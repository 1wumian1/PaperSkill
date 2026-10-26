import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  clearScene,
  drawMap,
  drawLoupe,
  drawPin,
  drawTarget,
  drawCheck,
  drawCross,
  drawLabel,
  drawLegend,
  drawValueBar,
  type Rect,
} from '../lib/mapKit';
import type { WidgetProps } from './registry';

// ============================================================================
//  m4-1 | 交互模块：用鼠标拖动放大镜到地图上你认为最可疑的位置（也可用键盘
//  方向键微调，步长 8px），松手后看它离标注目标有多远。距离、命中判定与
//  .feedback 由同一个状态对象驱动。
//  论文真实结果（p.4 Table I / p.5 Table III，150 个查询、默认预算）：
//  最好模型平均交并比 0.086；父框中心启发式在 10×/40× 列 0.25–0.28。
//  画面由共享地图工具包绘制；本文件只保留拖拽与键盘的命中判定。
// ============================================================================

const MAP: Rect = { x: 40, y: 40, w: 600, h: 200 };
const MAP_SEED = 20261011;

const W = 1080;
const H = 280;
const LOUPE_R = 34;
const HIT_R = 34;
const STEP = 8;
/** 标注目标必须落在地图内，否则钳制后的镜圈永远够不着它，命中态就形同虚设。 */
const TARGET = { x: 512, y: 158 };
const START = { x: 240, y: 140 };
/** 距离条的满量程取地图宽度：只是把远近画出来，不代表论文里的任何数值。 */
const METER_SPAN = MAP.w;

interface M41State {
  cx: number;
  cy: number;
  dragging: boolean;
}

const computeDist = (s: M41State) => Math.hypot(s.cx - TARGET.x, s.cy - TARGET.y);

export const M4_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<M41State>({ cx: START.x, cy: START.y, dragging: false });
  const stateRef = useRef<M41State>(state);
  stateRef.current = state;

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
    const d = computeDist(state);
    const hit = d <= HIT_R;
    const tone = hit ? C.green : C.red;

    clearScene(ctx, W, H);
    drawMap(ctx, MAP, MAP_SEED);
    drawTarget(ctx, TARGET.x, TARGET.y, 12, C.green);
    // 放大镜：镜圈带手柄，本身就是要拖的那个物件。
    drawLoupe(ctx, state.cx, state.cy, LOUPE_R, '40x', tone, 1);
    drawPin(ctx, state.cx, state.cy, C.orange);
    drawPin(ctx, TARGET.x, TARGET.y, C.green);

    // 颜色之外的第二重线索：命中画对勾，未命中画叉。
    if (hit) drawCheck(ctx, 674, 62, 11, tone);
    else drawCross(ctx, 674, 62, 9, tone);

    drawLabel(ctx, hit ? '命中' : '未命中', 698, 68, { color: tone, size: 18, bold: true });
    drawLabel(ctx, `${Math.round(d)} 像素`, 674, 100, { color: C.muted, size: 16 });
    drawValueBar(ctx, 674, 112, 328, 9, clamp(1 - d / METER_SPAN, 0, 1), tone);
    drawLegend(
      ctx,
      [
        { label: '镜圈（40×）', color: C.blue },
        { label: '标注目标', color: C.green },
        { label: '当前落点', color: C.orange },
      ],
      674,
      202
    );
    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  }, [state]);

  /** CSS 像素 → 内部分辨率像素，随画面缩放等比换算。 */
  const toIntrinsic = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvas = ref.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    return {
      x: ((clientX - rect.left) / rect.width) * W,
      y: ((clientY - rect.top) / rect.height) * H,
    };
  };

  const place = (x: number, y: number, dragging: boolean) => {
    const nx = clamp(x, MAP.x + LOUPE_R, MAP.x + MAP.w - LOUPE_R);
    const ny = clamp(y, MAP.y + LOUPE_R, MAP.y + MAP.h - LOUPE_R);
    setState({ cx: nx, cy: ny, dragging });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toIntrinsic(e.clientX, e.clientY);
    if (!p) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    place(p.x, p.y, true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.dragging) return;
    const p = toIntrinsic(e.clientX, e.clientY);
    if (!p) return;
    place(p.x, p.y, true);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const p = toIntrinsic(e.clientX, e.clientY);
    if (p) place(p.x, p.y, false);
    else setState((prev) => ({ ...prev, dragging: false }));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    let dx = 0;
    let dy = 0;
    if (e.key === 'ArrowLeft') dx = -STEP;
    else if (e.key === 'ArrowRight') dx = STEP;
    else if (e.key === 'ArrowUp') dy = -STEP;
    else if (e.key === 'ArrowDown') dy = STEP;
    else return;
    e.preventDefault();
    setState((prev) => ({
      cx: clamp(prev.cx + dx, MAP.x + LOUPE_R, MAP.x + MAP.w - LOUPE_R),
      cy: clamp(prev.cy + dy, MAP.y + LOUPE_R, MAP.y + MAP.h - LOUPE_R),
      dragging: false,
    }));
  };

  const d = computeDist(state);
  const hit = d <= HIT_R;

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        tabIndex={0}
        style={{ cursor: state.dragging ? 'grabbing' : 'grab', touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      />
      <div className="ctrl">
        <label>
          镜圈圆心 <span className="val">{`${Math.round(state.cx)},${Math.round(state.cy)}`}</span>
        </label>
        <label>
          到目标距离 <span className="val">{d.toFixed(1)}</span>
        </label>
        <label>
          命中判定 <span className="val">{hit ? '命中' : '未命中'}</span>
        </label>
      </div>
      <div className={`feedback ${hit ? 'good' : 'bad'}`}>
        {hit
          ? '命中：人眼拖一次就能碰到，而模型在 150 个查询上平均交并比不到 0.09。'
          : '没命中目标点；论文里最好的模型平均交并比也只有 0.086。'}
        <br />
        一个不需要模型的父框中心启发式在 10×/40× 上达到 0.25–0.28，比每个被评测的 VLM 都高 3–4 倍。
      </div>
    </div>
  );
};

export default M4_1;
