import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, map } from '../lib/canvasKit';
import {
  C,
  FONT,
  MONO,
  clearScene,
  drawValueBar,
  drawGauge,
  drawLabel,
  drawLegend,
  drawCross,
  drawNumber,
} from '../lib/mapKit';
import type { WidgetProps } from './registry';

// ============================================================================
//  m2-2 「换个方向问，分数怎么变」（1080×280）
//  主导操作：切换 T1 / T2 两个方向。可见状态变化：条形长度、颜色与条端数值同步替换。
//  即时反馈：.feedback 给出该方向的真实数值与阅读口径。
//  数值全部来自论文 Table I / §IV-B，不得改动。
// ============================================================================

interface BarGroup {
  name: string;
  t1: number;
  t2: number;
  best: boolean;
}

const GROUPS: BarGroup[] = [
  { name: '随机', t1: 25.0, t2: 25.0, best: false },
  { name: '最高频', t1: 26.35, t2: 25.78, best: false },
  { name: 'Patho-R1', t1: 20.2, t2: 21.89, best: false },
  { name: 'Quilt', t1: 7.03, t2: 6.75, best: false },
  { name: 'LLaVA-Med', t1: 20.49, t2: 18.65, best: false },
  { name: 'Gemini-3-F', t1: 63.48, t2: 67.74, best: true },
];

const EXPERTS: Record<'T1' | 'T2', number> = { T1: 93.6, T2: 92.3 };

const W = 1080;
const H = 280;
const BASE_Y = 212;
const MAX_V = 70;
const BAR_W = 78;
const FIRST_X = 96;
const STEP = 138;

export const M2_2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [dir, setDir] = useState<'T1' | 'T2'>('T1');

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    // 纯图表场景：不用底纹格子，免得和数据条抢注意力。
    clearScene(ctx, W, H, false);
    const y = (v: number) => BASE_Y - map(v, 0, MAX_V, 0, BASE_Y - 58);
    const yRand = y(25);
    const yAxis = y(MAX_V);
    ctx.save();
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(66, BASE_Y);
    ctx.lineTo(1030, BASE_Y);
    ctx.stroke();
    ctx.restore();
    // 坐标轴刻度：顶部 70，中间 0，属于图表而不是场景标签。
    drawLabel(ctx, '70', 60, yAxis + 5, { color: C.muted, size: 14, align: 'right' });
    drawLabel(ctx, '0', 60, BASE_Y + 5, { color: C.muted, size: 14, align: 'right' });
    drawLabel(ctx, '准确率 % 越高越好', 66, 34, { color: C.text, size: 16 });
    // 横向值条：当前方向最强模型相对 0–100 的位置，与图例颜色语义一致。
    const peak = dir === 'T1' ? 63.48 : 67.74;
    drawValueBar(ctx, 292, 22, 232, 12, peak / 100, C.green, C.axis);
    ctx.save();
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = C.muted;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(66, yRand);
    ctx.lineTo(1030, yRand);
    ctx.stroke();
    ctx.restore();
    GROUPS.forEach((g, i) => {
      const v = dir === 'T1' ? g.t1 : g.t2;
      const bx = FIRST_X + i * STEP;
      const by = y(v);
      const color = v < 25 ? C.red : g.best ? C.green : C.blue;
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.roundRect(bx, by, BAR_W, BASE_Y - by, 5);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      // 低于随机的条在条内画一个叉号，颜色之外再加一个形状线索。
      if (v < 25) drawCross(ctx, bx + BAR_W / 2, by + (BASE_Y - by) / 2, 9, C.white);
      ctx.fillStyle = C.text;
      ctx.font = `16px ${MONO}`;
      ctx.textAlign = 'center';
      ctx.fillText(v.toFixed(2), bx + BAR_W / 2, by - 7);
      ctx.fillStyle = C.muted;
      ctx.font = `14px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(g.name, bx + BAR_W / 2, BASE_Y + 20);
    });
    // 纵向量规：同一堆数值的第二种读法，一眼看出离专家线还有多远。
    ctx.save();
    ctx.fillStyle = C.white;
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.roundRect(934, 62, 130, 158, 10);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    drawGauge(ctx, 946, 76, 26, 118, EXPERTS[dir] / 100, C.blue);
    drawLabel(ctx, '离专家', 1012, 104, { color: C.blue, size: 16 });
    drawNumber(ctx, EXPERTS[dir].toFixed(1), 1012, 132, C.blue, 22);
    // 图例放在条区右侧空白处，不与任何数据条重叠。
    drawLegend(
      ctx,
      [
        { label: '低于随机', color: C.red },
        { label: '最强模型', color: C.green },
        { label: '专家参考', color: C.blue },
      ],
      486,
      44
    );
    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  }, [dir]);

  const feedbackText =
    dir === 'T1'
      ? '图像→文字：最强模型 63.5%，但三个 7B 模型（Patho-R1 约 20–22%、Quilt-LLaVA 约 7%、LLaVA-Med 约 19–20%）低于 25% 的随机基线。'
      : '文字→图像：最强模型 67.7%；换成文字去认图，同源题目给出不同分数，说明两个方向不是一回事。';

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="chip-row" role="group" aria-label="提问方向">
        <button
          type="button"
          className={`chip${dir === 'T1' ? ' selected' : ''}`}
          aria-pressed={dir === 'T1'}
          onClick={() => setDir('T1')}
        >
          图像→文字（T1）
        </button>
        <button
          type="button"
          className={`chip${dir === 'T2' ? ' selected' : ''}`}
          aria-pressed={dir === 'T2'}
          onClick={() => setDir('T2')}
        >
          文字→图像（T2）
        </button>
      </div>
      <div className="ctrl">
        <label>
          当前方向最强模型 <span className="val">{dir === 'T1' ? '63.48' : '67.74'}%</span>
        </label>
      </div>
      <div className={`feedback ${dir === 'T1' ? '' : 'good'}`}>{feedbackText}</div>
    </div>
  );
};

export default M2_2;
