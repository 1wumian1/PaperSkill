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
  drawCheck,
  drawCross,
  drawLabel,
  drawLegend,
  drawValueBar,
  type Rect,
  type Pt,
} from '../lib/mapKit';
import type { WidgetProps } from './registry';

// ============================================================================
//  §6 模块 6.1「把三档发现整合成一个结论」：按顺序读入三档发现，再从四个结论
//  里选一个。论文的 T4 是纯文本输入，三条发现缺一不可。绘制工具包来自共享
//  「地图勘察 + 放大镜」工具包；本文件只保留自己的路径节点、要点卡片与选项卡片。
//  画面 1080x280。
// ============================================================================

const W = 1080;
const H = 280;
const MAP_SEED = 20261015;

type ZoomKey = '2.5x' | '10x' | '40x';

const M61_LEVELS: { label: string; zoom: ZoomKey; point: string }[] = [
  { label: '2.5×', zoom: '2.5x', point: '整体结构以管状与腺样排列为主' },
  { label: '10×', zoom: '10x', point: '腺体拥挤、排列紊乱' },
  { label: '40×', zoom: '40x', point: '细胞核多形性伴深染' },
];

const M61_OPTIONS: { key: string; text: string }[] = [
  { key: 'A', text: '黏液癌' },
  { key: 'B', text: '浸润性小叶癌' },
  { key: 'C', text: '浸润性导管癌（非特殊型）' },
  { key: 'D', text: '髓样癌' },
];
const CORRECT_KEY = 'C';

const PANEL: Rect = { x: 24, y: 36, w: 250, h: 216 };
const NODE_X = 150;
const NODE_Y = [80, 145, 210];
const NODE_R = 11;
const BULLET_X = 336;
const BULLET_Y = [74, 140, 206];
const OPT_X = 676;
const OPT_W = 374;
const OPT_H = 36;
const OPT_Y = [66, 116, 166, 216];

interface M61State {
  read: number;
  choice: string | null;
}

/** 要点卡片：白色圆角底 + 左侧镜圈，保证要点在缩放下也读得清。 */
function drawPointCard(ctx: CanvasRenderingContext2D, y: number, zoom: ZoomKey, title: string, body: string): void {
  const card: Rect = { x: BULLET_X - 22, y: y - 24, w: 330, h: 56 };
  ctx.save();
  ctx.fillStyle = C.white;
  ctx.globalAlpha = 0.88;
  ctx.beginPath();
  ctx.roundRect(card.x, card.y, card.w, card.h, 10);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(card.x, card.y, card.w, card.h, 10);
  ctx.stroke();
  ctx.restore();
  drawLoupe(ctx, BULLET_X - 2, y + 6, 15, zoom, C.green);
  drawLabel(ctx, title, BULLET_X + 24, y - 2, { size: 14, color: C.muted });
  drawLabel(ctx, body, BULLET_X + 24, y + 20, { size: 15, color: C.text });
}

function renderScene(ctx: CanvasRenderingContext2D, s: M61State): void {
  clearScene(ctx, W, H);
  drawMap(ctx, PANEL, MAP_SEED);

  const nodes: Pt[] = M61_LEVELS.map((_lv, i) => ({ x: NODE_X, y: NODE_Y[i] }));
  const routePts = [{ x: NODE_X, y: 46 }].concat(nodes);
  if (s.read > 0) drawRoute(ctx, routePts.slice(0, s.read + 1), false);
  if (s.read < M61_LEVELS.length) drawRoute(ctx, routePts.slice(s.read), true);

  M61_LEVELS.forEach((lv, i) => {
    const read = i < s.read;
    const next = i === s.read;
    // 已读入的节点给对勾，不只靠颜色区分状态。
    ctx.beginPath();
    ctx.arc(NODE_X, NODE_Y[i], NODE_R, 0, Math.PI * 2);
    ctx.fillStyle = read ? C.green : C.white;
    ctx.fill();
    ctx.strokeStyle = next ? C.blue : read ? C.green : C.muted;
    ctx.lineWidth = 2;
    ctx.stroke();
    drawLabel(ctx, lv.label, NODE_X + 24, NODE_Y[i] + 6, {
      size: 15,
      color: next ? C.blue : C.muted,
      bold: next,
    });
    if (read) drawCheck(ctx, NODE_X, NODE_Y[i], 6, C.white);
    if (next) drawBox(ctx, NODE_X - 21, NODE_Y[i] - 21, 42, 42, C.blue, 2.5, true);
  });

  M61_LEVELS.forEach((lv, i) => {
    if (i >= s.read) return;
    drawPointCard(ctx, BULLET_Y[i], lv.zoom, `${lv.label} 要点`, lv.point);
  });

  if (s.read >= M61_LEVELS.length) {
    M61_OPTIONS.forEach((o, i) => {
      const y = OPT_Y[i];
      const chosen = s.choice === o.key;
      const showCorrect = s.choice !== null && o.key === CORRECT_KEY;
      const showWrong = chosen && o.key !== CORRECT_KEY;
      ctx.save();
      ctx.globalAlpha = chosen ? 0.97 : 0.82;
      ctx.fillStyle = C.white;
      ctx.beginPath();
      ctx.roundRect(OPT_X, y, OPT_W, OPT_H, 10);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = showCorrect ? C.green : showWrong ? C.red : chosen ? C.orange : C.axis;
      ctx.lineWidth = showCorrect || showWrong ? 3 : 2;
      ctx.beginPath();
      ctx.roundRect(OPT_X, y, OPT_W, OPT_H, 10);
      ctx.stroke();
      drawLabel(ctx, `${o.key} ${o.text}`, OPT_X + 20, y + 24, { size: 16, color: C.text });
      if (showCorrect) drawCheck(ctx, OPT_X + OPT_W - 26, y + 18, 9, C.green);
      if (showWrong) drawCross(ctx, OPT_X + OPT_W - 26, y + 18, 9, C.red);
    });
  } else {
    // 还没读完三档：四条结论先以灰底占位，读完才可点。
    M61_OPTIONS.forEach((o, i) => {
      const y = OPT_Y[i];
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = C.paper;
      ctx.beginPath();
      ctx.roundRect(OPT_X, y, OPT_W, OPT_H, 10);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(OPT_X, y, OPT_W, OPT_H, 10);
      ctx.stroke();
      drawValueBar(ctx, OPT_X + 18, y + 16, 120, 6, 0.35, C.axis);
    });
  }

  drawLegend(
    ctx,
    [
      { label: '已读入', color: C.green },
      { label: '待读入', color: C.muted },
    ],
    40,
    250,
    22
  );
}

function feedbackOf(s: M61State): { cls: string; text: string } {
  if (s.read < M61_LEVELS.length) {
    return { cls: '', text: '还缺一档：论文的整合任务是文本输入，三条发现缺一不可。' };
  }
  if (s.choice === null) {
    return { cls: '', text: '三条发现都读入了，现在从四个结论里选一个。' };
  }
  const tail = '论文的 T4 共 51,167 道四选一，输入只有器官与三条发现，不含图像。';
  if (s.choice === CORRECT_KEY) {
    return {
      cls: 'good',
      text: `按论文图 2 的示例设定，C（非特殊型浸润性导管癌）为本题正解；该图只列出四个选项，正文未标注答案。${tail}`,
    };
  }
  return {
    cls: 'bad',
    text: `本题按论文图 2 的示例设定 C 为正解；论文报告 T4 总体准确率 93.4% 时，错误主要落在这一档。${tail}`,
  };
}

export const M6_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [state, setState] = useState<M61State>({ read: 0, choice: null });

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
        <span>按顺序读入三档发现</span>
        <span className="val">
          已读入 {state.read} / {M61_LEVELS.length}
        </span>
      </div>
      <div className="chip-row">
        {M61_LEVELS.map((lv, i) => (
          <button
            key={lv.label}
            type="button"
            className="chip"
            disabled={i !== state.read}
            onClick={() =>
              setState((prev) => ({ ...prev, read: clamp(prev.read + 1, 0, M61_LEVELS.length) }))
            }
          >
            读入 {lv.label}
          </button>
        ))}
      </div>
      {state.read >= M61_LEVELS.length && (
        <div className="chip-row">
          {M61_OPTIONS.map((o) => (
            <button
              key={o.key}
              type="button"
              className={`chip${state.choice === o.key ? ' selected' : ''}`}
              onClick={() => setState((prev) => ({ ...prev, choice: o.key }))}
            >
              {o.key} {o.text}
            </button>
          ))}
        </div>
      )}
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default M6_1;
