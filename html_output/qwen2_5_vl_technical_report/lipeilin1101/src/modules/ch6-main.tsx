import { useState } from 'react';
import { C, SceneCanvas, Chips, Feedback, Metrics, drawScene, drawPaper, drawPlant, drawFrame, line, rr, txt } from './PlantKit';

const generationFeedback = [
  '模型在图像和指令条件下生成文本；这里按字段展示教学步骤。',
  '先展开JSON模板，此时还没有位置答案。每个展示步骤可能包含若干生成token。',
  '已得到左上角，边界仍未完整。',
  '四个坐标构成一个候选框；结构尚未闭合，不能当作完整JSON解析。',
  '完成后分别检查结构、范围和目标身份；页面没有调用模型。'
];

export function Chapter6Main() {
  const [step, setStep] = useState(0);
  const [caseIndex, setCaseIndex] = useState(0);
  const boxes = [[350, 60, 450, 200], [500, 60, 600, 200], [60, 60, 160, 200]];
  const box = boxes[caseIndex];
  const complete = step === 4;
  const output = ['', '{ "框": [', `{ "框": [${box[0]}, ${box[1]},`, `{ "框": [${box.join(', ')}]`, `{ "框": [${box.join(', ')}] }`][step];
  const format = complete ? '可解析' : '待完成';
  const range = !complete ? '待完成' : caseIndex === 1 ? '越界' : '有效';
  const identity = !complete ? '待完成' : caseIndex === 0 ? '匹配' : caseIndex === 1 ? '未核对' : '不匹配';
  const caseFeedback = [
    '此插画中三项核对通过：JSON可解析，坐标在560×280内，框围住右侧窄叶。这里只核验预设示例。',
    'JSON可解析，但右边界600超过输入宽度560。范围检查失败，应先处理越界，再核对目标。',
    'JSON可解析、坐标也有效，但框落在左侧宽叶；格式正确与定位正确不是一回事。'
  ];
  const stepNames = ['未生成', '模板开头', '左上坐标', '右下坐标', '完整对象'];
  return <>
    <div className="controls ctrl">
      <span>指令：定位右侧窄叶</span>
      <button className="chip" onClick={() => setStep(p => Math.min(4, p + 1))} disabled={complete}>下一步</button>
      <button className="chip" onClick={() => { setStep(0); setCaseIndex(0); }}>重置</button>
      <span aria-live="polite">{step}/4 · {stepNames[step]}</span>
    </div>
    <SceneCanvas width={1080} height={280} animate={false} label="按字段逐步显示候选框，完成后检查结构、范围和目标身份"
      draw={(ctx, w, h) => {
        ctx.clearRect(0, 0, w, h); drawScene(ctx, w, h);
        ctx.save(); ctx.translate(36, 40); ctx.scale(.8, .8);
        drawPaper(ctx, 0, 0, 560, 280);
        drawPlant(ctx, 110, 200, .82, 0); drawPlant(ctx, 250, 200, .82, 1); drawPlant(ctx, 400, 200, .82, 2);
        if (step >= 2) {
          const color = complete ? caseIndex === 0 ? C.green : C.red : C.blue;
          if (step === 2) {
            line(ctx, box[0], box[1], box[0] + 28, box[1], color, 3);
            line(ctx, box[0], box[1], box[0], box[1] + 28, color, 3);
          } else drawFrame(ctx, box[0], box[1], box[2] - box[0], box[3] - box[1], color, !complete);
          ctx.fillStyle = color; ctx.beginPath(); ctx.arc(box[0], box[1], 4, 0, 2 * Math.PI); ctx.fill();
        }
        ctx.restore();
        txt(ctx, '候选框', 260, 24, 20, C.blue, 'center');
        txt(ctx, '输出检查', 810, 24, 20, C.blue, 'center');
        drawPaper(ctx, 608, 40, 408, 224);
        for (let i = 0; i < 4; i++) rr(ctx, 644, 65 + i * 31, [260, 190, 284, 224][i], 11, 5, i < step ? C.light : C.bg);
        if (complete) {
          [true, caseIndex !== 1, caseIndex === 0].forEach((valid, i) => {
            const cx = 690 + i * 120;
            const pending = i === 2 && caseIndex === 1;
            const color = pending ? C.muted : valid ? C.green : C.red;
            ctx.beginPath(); ctx.arc(cx, 223, 15, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
            if (pending) line(ctx, cx - 6, 223, cx + 6, 223, '#ffffff', 2);
            else if (valid) { line(ctx, cx - 7, 223, cx - 1, 229, '#ffffff', 2); line(ctx, cx - 1, 229, cx + 8, 216, '#ffffff', 2); }
            else { line(ctx, cx - 6, 217, cx + 6, 229, '#ffffff', 2); line(ctx, cx + 6, 217, cx - 6, 229, '#ffffff', 2); }
          });
        }
      }} />
    <pre className="feedback" aria-label="逐步生成的结构化输出" aria-live="polite" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontStyle: 'normal', minHeight: '3em' }}><code>{output || '尚未生成输出'}</code></pre>
    {complete && <Chips options={['合法匹配', '坐标越界', '合法错框']} value={caseIndex} onChange={setCaseIndex} />}
    <Metrics items={[{ label: '结构检查', value: format }, { label: '范围检查', value: range }, { label: '目标身份', value: identity }]} />
    <Feedback tone={complete ? caseIndex === 0 ? 'green' : 'red' : 'blue'}>{complete ? caseFeedback[caseIndex] : generationFeedback[step]} 教学示意，非模型预测。</Feedback>
  </>;
}
