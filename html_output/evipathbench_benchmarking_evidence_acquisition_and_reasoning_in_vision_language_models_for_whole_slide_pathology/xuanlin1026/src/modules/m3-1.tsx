import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import {
  C,
  clearScene,
  drawMap,
  drawLoupe,
  drawPin,
  drawTarget,
  drawLabel,
  drawNumber,
  drawLegend,
  type Rect,
} from '../lib/mapKit';
import type { WidgetProps } from './registry';

// ============================================================================
//  m3-1 | 交互模块：点击三档放大倍数，同一处区域里可辨的结构细节随之变化。
//  一个状态对象同时驱动画面、数值行与 .feedback。
//  真实数字（论文 p.3 Fig.3(a) 的 T2 任务用量）：2.5× 1,240 块；10× 3,788 块；
//  40× 5,256 块。
//  画面由共享地图工具包绘制；本文件只保留右侧图块面板的排布。
// ============================================================================

const MAP: Rect = { x: 40, y: 40, w: 600, h: 200 };
const MAP_SEED = 20261011;

const W = 1080;
const H = 280;
const PIN = { x: 460, y: 140 };

type Zoom = '2.5x' | '10x' | '40x';

const ZOOM_ROWS: { id: Zoom; chip: string; radius: number; structure: string; tiles: string }[] = [
  { id: '2.5x', chip: '2.5× 整体形态', radius: 86, structure: '整体形态', tiles: '1,240' },
  { id: '10x', chip: '10× 生长方式', radius: 56, structure: '生长方式', tiles: '3,788' },
  { id: '40x', chip: '40× 细胞核细节', radius: 34, structure: '细胞核细节', tiles: '5,256' },
];

/** 右侧图块面板的排布：卡片、结构名与论文里的图块数量。 */
const PANEL: Rect = { x: 680, y: 60, w: 330, h: 160 };
const GRID_X = 695;
const GRID_Y = 118;
const GRID_W = 310;
const GRID_H = 90;

/** 该档倍率下画出的图块阵列：倍数越高，格子越密。 */
function drawTilePanel(
  ctx: CanvasRenderingContext2D,
  zoom: Zoom,
  structure: string,
  tiles: string
): void {
  ctx.save();
  ctx.fillStyle = C.white;
  ctx.globalAlpha = 0.92;
  ctx.beginPath();
  ctx.roundRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 12);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  const wanted = zoom === '2.5x' ? { cols: 5, rows: 4 } : zoom === '10x' ? { cols: 8, rows: 6 } : { cols: 12, rows: 8 };
  const gap = 8;
  const fit = (c: number, r: number) =>
    Math.min((GRID_W - gap * (c - 1)) / c, (GRID_H - gap * (r - 1)) / r);
  // 倍率越高，格子越密；但格子必须保持可见，所以按可用空间收敛阵列规模。
  let cols = wanted.cols;
  let rows = wanted.rows;
  while (fit(cols, rows) < 8 && (cols > 4 || rows > 3)) {
    cols = Math.max(4, cols - 2);
    rows = Math.max(3, rows - 2);
  }
  const cell = fit(cols, rows);
  const gridW = cols * cell + (cols - 1) * gap;
  const gridH = rows * cell + (rows - 1) * gap;
  const gx = GRID_X + (GRID_W - gridW) / 2;
  const gy = GRID_Y + (GRID_H - gridH) / 2;
  const dot = Math.max(1, Math.min(3, cell / 3));

  ctx.save();
  ctx.fillStyle = zoom === '2.5x' ? C.light : C.dark;
  ctx.globalAlpha = 0.45;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.beginPath();
      ctx.roundRect(gx + c * (cell + gap), gy + r * (cell + gap), cell, cell, dot);
      ctx.fill();
    }
  }
  ctx.restore();

  // 结构名（短标签）+ 该倍率的图块数量（裸数字）。
  drawLabel(ctx, structure, 695, 96, { color: C.text, size: 16 });
  drawNumber(ctx, tiles, 926, 96, C.orange, 24);
  drawLabel(ctx, '图块阵列 示意', 695, 208, { color: C.muted, size: 14 });
}

interface M31State {
  zoom: Zoom;
  seen: Zoom[];
}

export const M3_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<M31State>({ zoom: '2.5x', seen: ['2.5x'] });
  const row = ZOOM_ROWS.find((it) => it.id === state.zoom) || ZOOM_ROWS[0];

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
    const current = ZOOM_ROWS.find((it) => it.id === state.zoom) || ZOOM_ROWS[0];

    clearScene(ctx, W, H);
    drawMap(ctx, MAP, MAP_SEED);
    // 另外两档的视野范围画成淡色虚线圈：倍率越高，视野越小的对比一眼可见。
    ZOOM_ROWS.forEach((it) => {
      if (it.id === current.id) return;
      ctx.save();
      ctx.strokeStyle = C.muted;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(PIN.x, PIN.y, it.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
    drawLoupe(ctx, PIN.x, PIN.y, current.radius, current.id, C.blue, 1);
    drawTarget(ctx, PIN.x, PIN.y, 12, C.green);
    drawPin(ctx, PIN.x, PIN.y, C.green);
    drawTilePanel(ctx, current.id, current.structure, current.tiles);
    drawLegend(
      ctx,
      [
        { label: '当前视野', color: C.blue },
        { label: '标注目标', color: C.green },
        { label: '其它档位', color: C.muted },
      ],
      640,
      244
    );
    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  }, [state]);

  const pick = (id: Zoom) => {
    setState((prev) => ({
      zoom: id,
      seen: prev.seen.indexOf(id) < 0 ? prev.seen.concat([id]) : prev.seen,
    }));
  };

  const allSeen = ZOOM_ROWS.every((it) => state.seen.indexOf(it.id) >= 0);
  const baseText =
    state.zoom === '2.5x'
      ? '2.5×：先看整体形态，判断哪里可疑。'
      : state.zoom === '10x'
      ? '10×：看生长方式与组织构筑。'
      : '40×：看细胞核形态细节；倍数越高视野越小。';
  const text = allSeen ? baseText + '你已经走过论文里的三档：2.5×→10×→40×。' : baseText;
  const cls = allSeen ? 'good' : '';

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="chip-row">
        {ZOOM_ROWS.map((it) => (
          <button
            key={it.id}
            type="button"
            className={it.id === state.zoom ? 'chip selected' : 'chip'}
            onClick={() => pick(it.id)}
          >
            {it.chip}
          </button>
        ))}
      </div>
      <div className="ctrl">
        <label>
          当前档位 <span className="val">{state.zoom === '2.5x' ? '2.5×' : state.zoom === '10x' ? '10×' : '40×'}</span>
        </label>
        <label>
          可辨结构 <span className="val">{row.structure}</span>
        </label>
        <label>
          该倍率图块数（T2 题池） <span className="val">{row.tiles}</span>
        </label>
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M3_1;
