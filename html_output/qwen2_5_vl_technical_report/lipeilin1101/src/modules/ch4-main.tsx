import { useState } from 'react';
import { C, SceneCanvas, Feedback, Metrics, drawScene, drawPaper, drawPlant, drawFrame, rr, line, txt } from './PlantKit';

const WIDTH = 1080;
const HEIGHT = 280;
const shapes = ['4×1280', '5120', '3584'];
const names = ['相邻特征', '沿维拼接', '两层映射'];
const feedback = [
  '四个相邻 patch 的特征，每个 1280 维。',
  '沿特征维拼接为 5120 维，顺序保留局部相邻关系。',
  '7B 版本经两层 MLP 得到 3584 维；这不是四块像素取平均。',
];

function arrow(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, color: string) {
  line(ctx, x1, y, x2, y, color, 2);
  line(ctx, x2 - 9, y - 6, x2, y, color, 2);
  line(ctx, x2 - 9, y + 6, x2, y, color, 2);
}

export function Chapter4Main() {
  const [step, setStep] = useState(0);

  return <div>
    <SceneCanvas width={WIDTH} height={HEIGHT} animate={false}
      label={`7B视觉特征合并，第${step + 1}步：${names[step]}，当前形状${shapes[step]}`}
      draw={(ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        drawScene(ctx, w, h);
        drawPaper(ctx, 34, 36, 250, 218);
        drawPaper(ctx, 324, 36, 392, 218);
        drawPaper(ctx, 756, 36, 290, 218);
        const colors = [C.blue, C.dark, C.orange, C.purple];
        const gx = 69;
        const gy = 62;
        const size = 176;
        ctx.save();
        ctx.beginPath();
        ctx.rect(gx, gy, size, size);
        ctx.clip();
        drawPlant(ctx, gx + size / 2, gy + size - 5, 1.02, 0);
        ctx.restore();
        for (let i = 0; i < 4; i++) {
          const x = gx + (i % 2) * size / 2;
          const y = gy + Math.floor(i / 2) * size / 2;
          drawFrame(ctx, x, y, size / 2, size / 2, colors[i]);
        }
        arrow(ctx, 292, 315, 145, C.muted);
        if (step === 0) {
          for (let i = 0; i < 4; i++) {
            const x = 402 + (i % 2) * 126;
            const y = 72 + Math.floor(i / 2) * 88;
            rr(ctx, x, y, 108, 64, 7, C.bg, colors[i], 2);
            for (let j = 0; j < 5; j++) line(ctx, x + 16 + j * 18, y + 18, x + 16 + j * 18, y + 46, colors[i], 2);
          }
        } else if (step === 1) {
          for (let i = 0; i < 4; i++) {
            const x = 348 + i * 86;
            rr(ctx, x, 112, 86, 66, 0, C.bg, colors[i], 2);
            for (let j = 0; j < 4; j++) line(ctx, x + 15 + j * 18, 130, x + 15 + j * 18, 160, colors[i], 2);
          }
        } else {
          rr(ctx, 421, 88, 58, 112, 10, C.light, C.blue, 2);
          rr(ctx, 567, 88, 58, 112, 10, C.light, C.blue, 2);
          arrow(ctx, 489, 557, 145, C.blue);
          for (const x of [450, 596]) {
            for (let j = 0; j < 4; j++) {
              ctx.beginPath();
              ctx.arc(x, 109 + j * 23, 4, 0, Math.PI * 2);
              ctx.fillStyle = C.blue;
              ctx.fill();
            }
          }
        }
        if (step === 2) {
          arrow(ctx, 725, 747, 145, C.blue);
          rr(ctx, 805, 94, 192, 102, 10, C.bg, C.blue, 3);
          for (let i = 0; i < 8; i++) line(ctx, 829 + i * 21, 117, 829 + i * 21, 173, C.blue, 2);
        } else {
          ctx.save();
          ctx.setLineDash([6, 6]);
          rr(ctx, 805, 94, 192, 102, 10, undefined, C.border, 2);
          ctx.restore();
        }
        txt(ctx, names[step], 520, 26, 20, C.text, 'center');
        txt(ctx, shapes[step], step === 2 ? 901 : 520, 233, 20, C.blue, 'center');
      }} />
    <div className="controls step-ctrl">
      <button type="button" className="btn tiny ghost" disabled={step === 0} onClick={() => setStep(value => Math.max(0, value - 1))}>上一步</button>
      <span className="step-label">步骤 <b>{step + 1}</b> / 3 · {names[step]}</span>
      <button type="button" className="btn tiny" disabled={step === 2} onClick={() => setStep(value => Math.min(2, value + 1))}>下一步</button>
    </div>
    <p className="step-desc" aria-label="完整形状链：四乘1280，经拼接成为5120，再经两层MLP成为3584">
      7B 形状链：{shapes.map((shape, index) => <span key={shape}>
        {index > 0 ? ' → ' : ''}
        <span style={{ color: step === index ? C.blue : C.muted, fontWeight: step === index ? 700 : 400 }} aria-current={step === index ? 'step' : undefined}>{shape}</span>
      </span>)}
    </p>
    <Metrics items={[
      { label: '当前形状', value: shapes[step] },
      { label: '合并前相邻位置数', value: 4 },
      { label: '送入 7B 语言模型', value: step === 2 ? '1 个视觉 token' : '尚未完成' },
    ]} />
    <Feedback tone="blue">{feedback[step]}</Feedback>
  </div>;
}
