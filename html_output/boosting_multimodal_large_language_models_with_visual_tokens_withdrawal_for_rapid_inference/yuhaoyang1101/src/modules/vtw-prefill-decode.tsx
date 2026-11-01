import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Btn, C, Feedback, TokenRect, waterTint } from './vtw-kit';

// 5.2 一次推理的 7 步（8 层小模型，K = 4，教学示意）：预填充时在第 5 层入口切掉视觉 token，
// 解码时新 token 在浅层读含视觉 token 的缓存、在深层只读文字缓存。代码引自官方实现（固定 commit b9cb126）。
const L = 8;
const K = 4;
const STEPS: { title: string; text: string; code: number[]; ask?: { q: string; yes: boolean; explain: string } }[] = [
  { title: '预填充：第 1–4 层', text: '整段输入（系统、视觉、问题）一起计算，每层把 K/V 写进缓存。', code: [] },
  { title: '第 5 层入口：切掉视觉 token', text: 'layer_idx 等于 k 且处在预填充时，把 hidden_states 与 position_ids 中视觉 token 那一段切掉。', code: [0, 1, 2] },
  { title: '预填充：第 5–8 层', text: '深层只算系统与文字 token，缓存里也没有视觉 token。', code: [] },
  { title: '输出第一个词 y₁', text: '预填充结束得到第一个词；第 7 章的 KL 校准只比较这一步的分布。', code: [] },
  { title: '解码：新词进入浅层', text: '新词在第 1–4 层计算注意力。', code: [], ask: { q: '它能读到视觉 token 的缓存吗？', yes: true, explain: '能：浅层缓存是撤出前写下的，里面有视觉 token。' } },
  { title: '解码：新词进入深层', text: '新词在第 5–8 层计算注意力。', code: [0], ask: { q: '这一步会再次触发撤出吗？', yes: false, explain: '不会：解码时 seq_length = 1，撤出条件不成立；深层缓存本来就没有视觉 token。' } },
  { title: '重复直到生成结束', text: '每一步都复用缓存，不需要注意力分数，也不再改动 token 集合。', code: [] },
];
const CODE = [
  'if layer_idx == k and seq_length > 1:',
  '    h = cat([h[:, :sys], h[:, sys+img:]])',
  '    p = cat([p[:, :sys], p[:, sys+img:]])',
];

export function VtwPrefillDecode(_: WidgetProps) {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<Record<number, boolean>>({});
  const st = STEPS[step];
  const decoding = step >= 4;
  const cell = 40;
  const gx = 120;
  const rowY = (l: number) => 34 + (L - l) * 56;
  const cols = 1 + 4 + 2 + (step >= 3 ? 1 : 0) + (decoding ? 1 : 0);
  const activeRows = (l: number) => (step === 0 ? l <= K : step === 1 ? l === K + 1 : step === 2 ? l > K : step === 4 ? l <= K : step === 5 ? l > K : true);
  const asked = st.ask;
  const answered = asked ? answer[step] !== undefined : true;
  return (
    <div className="vtw vtw-pd">
      <svg viewBox="0 0 640 622" width={640} height={622} className="vtw-stage" role="img" aria-label={`第 ${step + 1} 步：${st.title}`}>
        {Array.from({ length: L }, (_, i) => {
          const l = i + 1;
          const vis = l <= K;
          const act = activeRows(l);
          return (
            <g key={l} opacity={act ? 1 : 0.35}>
              <text x={gx - 16} y={rowY(l) + 30} textAnchor="end" className="vtw-svg-t is-muted">
                {l === 1 || l === K || l === K + 1 || l === L ? l : ''}
              </text>
              <TokenRect x={gx} y={rowY(l)} s={cell} kind="sys" />
              {[0, 1, 2, 3].map((j) => (
                <TokenRect key={j} x={gx + (1 + j) * 50} y={rowY(l)} s={cell} kind="vis" faded={!vis} struck={step === 1 && l === K + 1} />
              ))}
              {[0, 1].map((j) => (
                <TokenRect key={j} x={gx + (5 + j) * 50} y={rowY(l)} s={cell} kind="ins" tint={(Math.min(l, K) / K) * 0.85} />
              ))}
              {step >= 3 && <TokenRect x={gx + 7 * 50} y={rowY(l)} s={cell} kind="out" faded={step === 3 && l < L} />}
              {decoding && <TokenRect x={gx + 8 * 50} y={rowY(l)} s={cell} kind="out" faded={!act} />}
              {decoding && act && step < 6 && (
                <path d={`M${gx + 8 * 50} ${rowY(l) + cell / 2} C ${gx + 6 * 50} ${rowY(l) - 18}, ${gx + 2 * 50} ${rowY(l) - 18}, ${gx + (vis ? 1 : 5) * 50 + cell / 2} ${rowY(l)}`} fill="none" stroke={vis ? C.leaf : C.waterLine} strokeWidth={3} />
              )}
            </g>
          );
        })}
        <line x1={gx - 8} y1={rowY(K) - 8} x2={gx + cols * 50} y2={rowY(K) - 8} stroke={C.orange} strokeWidth={4} strokeDasharray="10 8" />
        <text x={gx} y={rowY(1) + 84} className="vtw-svg-t is-muted">
          {decoding ? '新词（右侧黑块）读缓存：棕线 = 视觉缓存' : 'K = 4：第 5 层入口撤出'}
        </text>
        <text x={gx} y={rowY(1) + 124} className="vtw-svg-t is-muted">
          {decoding ? '浅蓝线 = 只有文字的缓存' : '8 层小模型（教学示意）'}
        </text>
      </svg>
      <div className="vtw-pd-side">
        <p className="vtw-h">
          {step + 1} / 7　{st.title}
        </p>
        <p>{st.text}</p>
        <pre className="vtw-code" aria-label="官方代码 VTW.py 第 308–314 行节选：h 为 hidden_states，p 为 position_ids">
          {CODE.map((line, i) => (
            <span key={i} className={st.code.includes(i) ? 'is-hl' : ''}>
              {line}
              {'\n'}
            </span>
          ))}
        </pre>
        {asked && (
          <div className="vtw-pd-ask">
            <span className="vtw-guess-k">先猜</span>
            {asked.q}
            {!answered ? (
              <span className="vtw-pd-ask-btns">
                <Btn onClick={() => setAnswer({ ...answer, [step]: true })}>会 / 能</Btn>
                <Btn onClick={() => setAnswer({ ...answer, [step]: false })}>不会 / 不能</Btn>
              </span>
            ) : null}
          </div>
        )}
        {asked && answered ? (
          <Feedback tone={answer[step] === asked.yes ? 'ok' : 'warn'}>
            <b>{answer[step] === asked.yes ? '猜对了。' : '再想想。'}</b>
            {asked.explain}
          </Feedback>
        ) : (
          !asked && <Feedback tone={step === 1 ? 'warn' : 'info'}>{step === 6 ? '撤出只在预填充做一次——这是它能兼容 KV Cache 的原因。' : step === 3 ? '到这里，前 4 层里流进文字 token 的图像信息已经够用。' : '点“下一步”继续。'}</Feedback>
        )}
        <div className="vtw-pd-nav">
          <Btn onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            上一步
          </Btn>
          <Btn primary onClick={() => setStep((s) => Math.min(6, s + 1))} disabled={step === 6 || !answered}>
            下一步
          </Btn>
          <Btn
            onClick={() => {
              setStep(0);
              setAnswer({});
            }}
          >
            重来
          </Btn>
        </div>
      </div>
    </div>
  );
}
