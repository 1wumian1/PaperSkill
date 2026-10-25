import React, { useState } from 'react';
import { Surface, C, drawPhoto, line, round, label } from './llava-kit';

const tasks = [
  { name: '描述画面', question: '画面里有什么？', answer: '桌上有一个杯子，里面放着三支铅笔。', evidence: '类别与数量', judgment: '两种回答都能列出物品。只看这一问，还不能区分是否会遵循不同指令。' },
  { name: '解释用途', question: '这个杯子在这里被用来做什么？', answer: '它被当作笔筒，用来收纳铅笔。判断依据是杯中装着文具。', evidence: '杯子与铅笔的关系', judgment: '同样的物体，换了问题就需要换一种组织答案的方式：从“有什么”转到“在做什么”。' },
  { name: '判断边界', question: '这些铅笔是谁的？', answer: '仅凭这张图无法确定主人。画面展示了物品，没有提供所有者的信息。', evidence: '画面未提供身份信息', judgment: '按要求作答也包括承认信息不足。语言常识不能替代画面中缺失的证据。' },
] as const;

export const LLaVAC1: React.FC = () => {
  const [task, setTask] = useState(1);
  const [revealed, setRevealed] = useState(false);
  const current = tasks[task];
  const select = (index: number) => { setTask(index); setRevealed(false); };
  const responseStyle: React.CSSProperties = { padding: '18px 20px', borderRadius: 12, border: `1px solid ${C.border}`, minHeight: 132, background: '#fff' };
  return <div>
    <div className="chip-row" aria-label="选择提问任务">
      {tasks.map((item, index) => <button type="button" key={item.name} className={`chip ${task === index ? 'selected' : ''}`} aria-pressed={task === index} onClick={() => select(index)}>{item.name}</button>)}
    </div>
    <div style={{ padding: '0 0 16px', textAlign: 'center', color: C.ink }}><span style={{ color: C.muted }}>同一张图 · 当前问题</span><br/><strong>{current.question}</strong></div>
    <Surface height={320} label={`杯子与三支铅笔的教学插画；当前关注${current.evidence}`} draw={c => {
      drawPhoto(c, 49, 22, 392, 273);
      const focus = task === 0 ? { x: 155, y: 44, w: 185, h: 210 } : { x: 151, y: 88, w: 205, h: 172 };
      if (task < 2) {
        c.save(); c.setLineDash([7, 6]); round(c, focus.x, focus.y, focus.w, focus.h, 16, '', C.orange); c.restore();
        line(c, focus.x + focus.w, focus.y + focus.h / 2, 516, 154, C.orange, 2);
      } else {
        c.save(); c.setLineDash([7, 6]); round(c, 78, 43, 332, 225, 16, '', C.border); c.restore();
        line(c, 441, 154, 516, 154, C.border, 2);
      }
      round(c, 526, 42, 500, 231, 18, C.paper, C.border);
      label(c, task === 2 ? '证据不足' : '观察依据', 563, 84, task === 2 ? C.muted : C.blue, 24);
      if (task === 0) {
        for (let i = 0; i < 3; i++) {
          const x = 620 + i * 100;
          round(c, x, 128, 18, 91, 5, ['#bca46d', '#7b957d', '#bc8b77'][i]);
          c.beginPath(); c.moveTo(x, 128); c.lineTo(x + 9, 108); c.lineTo(x + 18, 128); c.fillStyle = '#d8bd94'; c.fill();
          line(c, x + 5, 140, x + 5, 207, '#ffffff70', 2);
        }
      } else if (task === 1) {
        c.save(); c.beginPath(); c.roundRect(570, 106, 401, 133, 12); c.clip();
        drawPhoto(c, 542, -1, 435, 324); c.restore();
        c.strokeStyle = '#b7c7b2'; c.lineWidth = 2; c.strokeRect(570, 106, 401, 133);
      } else {
        c.beginPath(); c.arc(772, 166, 58, 0, Math.PI * 2); c.strokeStyle = '#cbd5ce'; c.lineWidth = 3; c.stroke();
        label(c, '?', 772, 188, C.muted, 70, 'center');
      }
    }}/>
    <div className="ctrl" style={{ justifyContent: 'center' }}><button type="button" className="tiny" onClick={() => setRevealed(value => !value)}>{revealed ? '收起回答' : '比较回答'}</button></div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 14 }} aria-live="polite">
      <section aria-label="固定描述回答" style={responseStyle}>
        <div style={{ color: C.muted, marginBottom: 10, fontSize: 16, fontWeight: 700 }}>固定描述</div>
        <div style={{ color: revealed && task !== 0 ? C.muted : C.ink }}>{revealed ? tasks[0].answer : '等待比较，先想一想：只描述物体能回答当前问题吗？'}</div>
      </section>
      <section aria-label="按指令组织的回答" style={{ ...responseStyle, background: revealed ? '#f0f7f1' : '#f8fafc', borderColor: revealed ? '#bfd9c5' : C.border }}>
        <div style={{ color: revealed ? C.green : C.blue, marginBottom: 10, fontSize: 16, fontWeight: 700 }}>按指令组织回答</div>
        <div style={{ color: C.ink }}>{revealed ? current.answer : '同一张图，答案会围绕当前问题组织。'}</div>
      </section>
    </div>
    <div className={`feedback ${revealed ? 'good' : ''}`} style={{ minHeight: 72 }} aria-live="polite">{revealed ? current.judgment : '选择一个问题，再比较两种回答。插画与答案均为教学编写，不是浏览器中的模型推理结果。'}</div>
  </div>;
};