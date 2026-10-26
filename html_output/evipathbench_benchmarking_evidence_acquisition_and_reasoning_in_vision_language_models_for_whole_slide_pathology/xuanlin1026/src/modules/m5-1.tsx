import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  clearScene,
  drawTileGrid,
  drawCross,
  drawCheck,
  drawLabel,
  drawNumber,
  drawValueBar,
  type Rect,
  type TileState,
} from '../lib/mapKit';
import type { WidgetProps } from './registry';

// ============================================================================
//  §5 模块 5.1「保留几块才够」（1080×280）
//  主导操作：拖动 1–10 的刻度滑轨决定 2.5× 这一级保留几块。
//  可见状态变化：左侧 12 块图块里被保留的块点亮、其余打叉；右侧「阳性保留 n/2」
//  与三档随机采样基线同步高亮。即时反馈：.feedback 两档文案。
//  版面分三块互不重叠：左＝图块阵列，右上＝阳性保留读数，右下＝基线对照 + 图例。
// ============================================================================

const W = 1080;
const H = 280;

const TILE_COLS = 4;
const TILE_ROWS = 3;
const GRID: Rect = { x: 44, y: 62, w: 556, h: 168 };
const TILE_GAP = 12;

const K_MIN = 1;
const K_MAX = 10;
const K_DEFAULT = 6;

const ALL_TILES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
/** 两块阳性图块（与标注区域重叠超过 5% 面积），落在阵列的第 2、7 位。 */
const POSITIVE = [1, 6];
/** 打分从高到低的固定顺序：前两块里只有一块是阳性，所以 K 太小时必定漏掉一块。 */
const ORDER = [1, 4, 0, 6, 9, 2, 7, 11, 3, 5, 10, 8];

/** 论文 Table IV 2.5× 列上随机采样基线的三档取值（K=1/3/6）。 */
const SAMPLE_BASELINE: { k: number; n: number; text: string }[] = [
  { k: 1, n: 6.58, text: '6.58' },
  { k: 3, n: 18.42, text: '18.42' },
  { k: 6, n: 30.7, text: '30.70' },
];

const PANEL: Rect = { x: 636, y: 44, w: 412, h: 200 };

interface M51State {
  k: number;
}

function tileRect(i: number): Rect {
  const col = i % TILE_COLS;
  const row = Math.floor(i / TILE_COLS);
  const tw = (GRID.w - TILE_GAP * (TILE_COLS - 1)) / TILE_COLS;
  const th = (GRID.h - TILE_GAP * (TILE_ROWS - 1)) / TILE_ROWS;
  return {
    x: GRID.x + col * (tw + TILE_GAP),
    y: GRID.y + row * (th + TILE_GAP),
    w: tw,
    h: th,
  };
}

function retainedTiles(k: number): number[] {
  return ORDER.slice(0, clamp(k, K_MIN, K_MAX));
}

function retainedPositives(k: number): number {
  const kept = retainedTiles(k);
  let n = 0;
  POSITIVE.forEach((p) => {
    if (kept.indexOf(p) >= 0) n += 1;
  });
  return n;
}

/** 图例：三个条目横排，放在自己的一行里，不与数值条重叠。 */
function drawLegendRow(
  ctx: CanvasRenderingContext2D,
  items: { label: string; color: string }[],
  x: number,
  y: number
): void {
  let cx = x;
  items.slice(0, 3).forEach((it) => {
    ctx.save();
    ctx.fillStyle = it.color;
    ctx.beginPath();
    ctx.roundRect(cx, y - 7, 13, 10, 3);
    ctx.fill();
    ctx.restore();
    drawLabel(ctx, it.label, cx + 18, y + 1, { color: C.muted, size: 14 });
    cx += 18 + it.label.length * 14 + 22;
  });
}

function renderScene(ctx: CanvasRenderingContext2D, s: M51State): void {
  const kept = retainedTiles(s.k);
  const n = retainedPositives(s.k);

  clearScene(ctx, W, H);

  // ---- 左：图块阵列（只画状态，不画跨格路线，避免画面被线穿过） ----
  const states: Record<number, TileState> = {};
  ALL_TILES.forEach((i) => {
    const isKept = kept.indexOf(i) >= 0;
    const isPos = POSITIVE.indexOf(i) >= 0;
    // 保留下来的阳性块同时给「橙色实心 + 绿边 + 对勾」三重线索，避免只看到绿色
    // 就被理解成「没保留」。
    if (isPos && isKept) states[i] = 'kept-positive';
    else if (isKept) states[i] = 'kept';
    else if (isPos) states[i] = 'dropped';
    else states[i] = 'base';
  });
  drawTileGrid(ctx, { rect: GRID, cols: TILE_COLS, rows: TILE_ROWS, states, gap: TILE_GAP });

  // 被漏掉的那块阳性图块，在格子上再加一个红叉，形状线索之外还有文字说明。
  POSITIVE.forEach((p) => {
    if (states[p] !== 'dropped') return;
    const r = tileRect(p);
    drawCross(ctx, r.x + r.w / 2, r.y + r.h / 2, 11, C.red);
  });

  drawLabel(ctx, '2.5× 这一级的候选图块', GRID.x, 44, { size: 16, color: C.text });
  drawLabel(
    ctx,
    kept.length >= K_MAX ? `已保留 ${kept.length} 块` : `已保留 ${kept.length} / ${ALL_TILES.length} 块`,
    GRID.x + GRID.w,
    44,
    { size: 15, color: C.orange, align: 'right', bold: true }
  );

  // ---- 右：读数与基线对照面板 ----
  ctx.save();
  ctx.fillStyle = C.white;
  ctx.globalAlpha = 0.94;
  ctx.beginPath();
  ctx.roundRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 12);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  drawLabel(ctx, '阳性保留', PANEL.x + 22, PANEL.y + 32, { size: 15, color: C.muted });
  drawNumber(
    ctx,
    `${n} / ${POSITIVE.length}`,
    PANEL.x + 150,
    PANEL.y + 40,
    n === POSITIVE.length ? C.green : C.red,
    34
  );
  if (n === POSITIVE.length) drawCheck(ctx, PANEL.x + 118, PANEL.y + 30, 11, C.green);
  else drawCross(ctx, PANEL.x + 118, PANEL.y + 30, 9, C.red);

  // 分隔线：读数区与基线区各占一块，避免元素互相压住。
  ctx.save();
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PANEL.x + 20, PANEL.y + 62);
  ctx.lineTo(PANEL.x + PANEL.w - 20, PANEL.y + 62);
  ctx.stroke();
  ctx.restore();

  drawLabel(ctx, '随机采样命中率（2.5×，越高越好）', PANEL.x + 22, PANEL.y + 86, {
    size: 14,
    color: C.muted,
  });

  const barX = PANEL.x + 196;
  const barW = PANEL.w - 196 - 56;
  SAMPLE_BASELINE.forEach((row, i) => {
    const y = PANEL.y + 116 + i * 28;
    const active = row.k === s.k;
    drawLabel(ctx, `K=${row.k}`, PANEL.x + 22, y + 4, {
      size: 15,
      color: active ? C.orange : C.muted,
      bold: active,
    });
    drawLabel(ctx, row.text, PANEL.x + 84, y + 4, {
      size: 16,
      color: active ? C.orange : C.text,
      bold: active,
    });
    // 非当前档也用可见的蓝色填充，三档长度才读得出来；当前档改用橙色点亮。
    drawValueBar(ctx, barX, y - 8, barW, 11, row.n / 33, active ? C.orange : '#8fa3c4');
  });

  drawLegendRow(
    ctx,
    [
      { label: '阳性块', color: C.green },
      { label: '已保留', color: C.orange },
      { label: '已划掉', color: C.red },
    ],
    PANEL.x + 22,
    PANEL.y + PANEL.h - 12
  );
}

function feedbackOf(s: M51State): { cls: string; text: string } {
  const n = retainedPositives(s.k);
  // 在这组示意阵列里，要同时留住两块阳性至少要保留到 ORDER 中第二个阳性块所在位
  // （从 1 开始计数）：这是本示意的几何关系，不是论文数字。
  const threshold = Math.max(...POSITIVE.map((p) => ORDER.indexOf(p) + 1));
  const head =
    n < POSITIVE.length
      ? {
          cls: 'bad',
          text: `你现在只留下了 ${n} 个阳性块：没保留的分支在下一级一律算漏检（这组示意里要 K≥${threshold} 才能同时留住两块）。`,
        }
      : {
          cls: 'good',
          text: '2 个阳性块都留住了；论文里随机采样在 K=6 时 2.5× 命中率为 30.70%。',
        };
  return { cls: head.cls, text: `${head.text} 论文默认在 2.5×/10×/40× 保留 (6,3,2) 块。` };
}

export const M5_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [state, setState] = useState<M51State>({ k: K_DEFAULT });

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
        <label>
          保留数量 K <span className="val">{state.k}</span>
        </label>
        <input
          id={`rail-${chapterId}-${moduleId}`}
          type="range"
          min={K_MIN}
          max={K_MAX}
          step={1}
          value={state.k}
          aria-label="保留数量 K"
          aria-valuemin={K_MIN}
          aria-valuemax={K_MAX}
          aria-valuenow={state.k}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setState({ k: clamp(Number(e.target.value), K_MIN, K_MAX) })
          }
        />
        <span className="val">拖动滑块或按左右方向键调整</span>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default M5_1;
