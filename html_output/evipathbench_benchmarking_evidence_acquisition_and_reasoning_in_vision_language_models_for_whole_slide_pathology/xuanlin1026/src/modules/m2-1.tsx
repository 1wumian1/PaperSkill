import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  C,
  FONT,
  rand,
  clearScene,
  drawMap,
  drawLoupe,
  drawBox,
  drawLabel,
  drawLegend,
  drawCheck,
  drawCross,
  type Rect,
} from '../lib/mapKit';
import type { WidgetProps } from './registry';

// ============================================================================
//  m2-1 「四个候选里选一个」（1080×280）
//  主导操作：点击四个候选描述之一。可见状态变化：所选条加粗、正解变绿打勾、
//  误选变红打叉、得分由 0/1 变 1/1 或 0/1。即时反馈见 .feedback。
// ============================================================================

const OPTIONS: { key: string; text: string; correct: boolean }[] = [
  // 选项顺序与措辞对照论文图 1 的 T1 示例题干（原文要点已改写为简短中文）。
  // 论文未在正文标注该示例的正确选项，因此这里把与区域结构相符的一项设为教学示意正解。
  { key: 'A', text: '细胞核多形性伴深染', correct: false },
  { key: 'B', text: '腺体拥挤，排列紧密', correct: true },
  { key: 'C', text: '正常结肠黏膜', correct: false },
  { key: 'D', text: '黏液背景', correct: false },
];

const W = 1080;
const H = 280;
const MAP_SEED = 20261011;
const MAP: Rect = { x: 40, y: 24, w: 1206, h: 232 };
const VIEW = { x: 60, y: 34, w: 210, h: 210 };
const OPT = { x: 320, y: 46, w: 620, h: 44, gap: 12 };

export const M2_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<{ choice: number | null; picked: boolean }>({
    choice: null,
    picked: false,
  });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    clearScene(ctx, W, H);
    drawMap(ctx, MAP, MAP_SEED);
    const cx = VIEW.x + VIEW.w / 2;
    const cy = VIEW.y + VIEW.h / 2;
    drawLoupe(ctx, cx, cy, 84, '10x', C.blue);
    drawBox(ctx, VIEW.x, VIEW.y, VIEW.w, VIEW.h, C.blue, 2, false);
    // 镜片里再叠一层随机纹理，让「10× 区域」看起来真的被放大过。
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 80, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = C.deep;
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 26; i++) {
      const px = cx - 78 + rand(MAP_SEED + 5, i * 3) * 156;
      const py = cy - 78 + rand(MAP_SEED + 5, i * 3 + 1) * 156;
      ctx.globalAlpha = 0.26 + 0.34 * rand(MAP_SEED + 5, i * 3 + 2);
      ctx.beginPath();
      ctx.ellipse(px, py, 5 + rand(MAP_SEED, i) * 9, 4 + rand(MAP_SEED, i + 7) * 6, rand(MAP_SEED, i + 2) * Math.PI, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    drawLabel(ctx, '10× 区域', VIEW.x, VIEW.y - 8, { color: C.blue, size: 16 });
    OPTIONS.forEach((op, i) => {
      const y = OPT.y + i * (OPT.h + OPT.gap);
      const isChoice = state.choice === i;
      const showRight = state.picked && op.correct;
      const showWrong = state.picked && isChoice && !op.correct;
      ctx.save();
      ctx.fillStyle = C.white;
      ctx.globalAlpha = showWrong ? 0.86 : 1;
      ctx.beginPath();
      ctx.roundRect(OPT.x, y, OPT.w, OPT.h, 9);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = showRight ? C.green : showWrong ? C.red : isChoice ? C.blue : C.axis;
      ctx.lineWidth = isChoice || showRight || showWrong ? 3 : 1.5;
      ctx.stroke();
      ctx.restore();
      drawLabel(ctx, `${op.key}  ${op.text}`, OPT.x + 16, y + 29, {
        color: showRight ? C.green : showWrong ? C.red : C.text,
        size: 17,
        bold: isChoice,
      });
      // 对勾 / 叉号：正确与误选各有一个形状线索。
      if (showRight) drawCheck(ctx, OPT.x + OPT.w - 26, y + OPT.h / 2, 10, C.green);
      if (showWrong) drawCross(ctx, OPT.x + OPT.w - 26, y + OPT.h / 2, 9, C.red);
    });
    drawLegend(
      ctx,
      [
        { label: '正解', color: C.green },
        { label: '误选', color: C.red },
      ],
      OPT.x,
      OPT.y + 4 * (OPT.h + OPT.gap) + 20
    );
    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  }, [state]);

  const onPick = (i: number) => setState({ choice: i, picked: true });

  const correct = state.picked && state.choice !== null && OPTIONS[state.choice].correct;
  const feedbackCls = !state.picked ? '' : correct ? 'good' : 'bad';
  const feedbackText = !state.picked
    ? '先自己判断，再看答案。'
    : correct
    ? '正确：这条描述与区域内的结构一致。论文图 1 的示例题只给出题干与四个选项，未在正文标注答案；本处把与区域结构相符的一项设为教学示意正解。'
    : '不正确：这条描述来自同一器官同一倍率的其它发现，属于同源干扰项。';
  const note = state.picked
    ? '同类题目共 10,284 道，四个选项来自同一器官—倍率单元，倍率前缀被去掉以避免提示。'
    : '';

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="chip-row" role="group" aria-label="候选描述">
        {OPTIONS.map((op, i) => (
          <button
            key={op.key}
            type="button"
            className={`chip${state.choice === i ? ' selected' : ''}`}
            aria-pressed={state.choice === i}
            onClick={() => onPick(i)}
          >
            {op.key}　{op.text}
          </button>
        ))}
      </div>
      <div className="ctrl">
        <label>
          本题得分 <span className="val">{correct ? '1/1' : '0/1'}</span>
        </label>
      </div>
      <div className={`feedback ${feedbackCls}`}>
        {feedbackText}
        {note ? ` ${note}` : ''}
      </div>
    </div>
  );
};

export default M2_1;
