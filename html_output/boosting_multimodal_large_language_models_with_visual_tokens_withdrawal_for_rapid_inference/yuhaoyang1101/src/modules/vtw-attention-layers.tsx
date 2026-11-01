import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Feedback, GuessCard, Range, Seg, useGuess, useTween, waterTint } from './vtw-kit';
import { LAYERS, layerShares, type ModelKey } from './vtw-attn';

// 3.1 深层注意力流向：输出位置（注意力矩阵最后一行）把注意力分给四类 token 的比例随层变化。
// 曲线按图 4 的形状手绘（教学示意），可确定的数字只有正文的“80% 以上给 35 个系统 token、视觉 token 约 5%”。
type Tok = 'sys' | 'vis' | 'ins' | 'out';
const NAME: Record<Tok, string> = { sys: '系统 ×35', vis: '视觉 ×576', ins: '指令', out: '输出' };
const COUNT: Record<Tok, number> = { sys: 35, vis: 576, ins: 30, out: 1 };
const COL: Record<Tok, string> = { sys: C.sys, vis: C.leaf, ins: C.waterLine, out: C.out };
const TOKS: Tok[] = ['sys', 'vis', 'ins', 'out'];
type Mode = 'demo' | 'guess';
type Measure = 'total' | 'per';
const QS: { layer: number; q: string; answer: Tok; explain: string }[] = [
  { layer: 0, q: '第 0 层（最浅），输出位置的注意力最多给了哪类 token？', answer: 'vis', explain: '最浅一层还在“看图”：视觉 token 拿到的注意力最多。' },
  { layer: 3, q: '到第 3 层，最粗的光束指向哪类 token？', answer: 'sys', explain: '第 2 层起对系统 token 的注意力急升，视觉 token 很快降到约 5%。' },
  { layer: 24, q: '深层第 24 层呢？', answer: 'sys', explain: '中深层大部分注意力停在 35 个系统 token 上（正文：80% 以上）。' },
];

export function VtwAttentionLayers(_: WidgetProps) {
  const [mode, setMode] = useState<Mode>('demo');
  const [model, setModel] = useState<ModelKey>('7b');
  const [layer, setLayer] = useState(20);
  const [measure, setMeasure] = useState<Measure>('total');
  const g = useGuess(QS.map((x) => ({ q: x.q, answer: x.answer, explain: x.explain, options: TOKS.map((t) => ({ value: t, label: NAME[t].split(' ')[0] + ' token' })) })));
  const N = LAYERS[model];
  const L = mode === 'guess' ? QS[g.i].layer : Math.min(layer, N - 1);
  const hidden = mode === 'guess' && g.picked === null;
  const sh = layerShares(model, L);
  const w = TOKS.map((t) => (measure === 'per' ? sh[t] / COUNT[t] : sh[t]));
  const maxW = Math.max(...w);
  const tw = TOKS.map((_, i) => w[i] / maxW);
  const a0 = useTween(tw[0]);
  const a1 = useTween(tw[1]);
  const a2 = useTween(tw[2]);
  const a3 = useTween(tw[3]);
  const aw = [a0, a1, a2, a3];
  const top = TOKS[w.indexOf(maxW)];
  // 曲线区
  const cx0 = 70;
  const cw = 800;
  const cy0 = 398;
  const chH = 170;
  const X = (i: number) => cx0 + (i / (N - 1)) * cw;
  const Yc = (v: number) => cy0 + chH - v * chH;
  const path = (t: Tok) =>
    Array.from({ length: N }, (_, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Yc(layerShares(model, i)[t]).toFixed(1)}`).join(' ');
  return (
    <div className="vtw vtw-at">
      <svg viewBox="0 0 900 622" width={900} height={622} className="vtw-stage" role="img" aria-label={hidden ? `第 ${L} 层，先猜注意力最多给了哪类 token` : `第 ${L} 层（示意曲线）：最粗的光束指向${NAME[top]}`}>
        <text x={40} y={52} className="vtw-svg-t is-muted">
          第 {L} 层：正在预测下一个词的位置在看谁
        </text>
        {TOKS.map((t, i) => {
          const y = 96 + i * 74;
          const width = hidden ? 6 : 4 + aw[i] * 56;
          return (
            <g key={t}>
              <path d={`M184 200 C 360 200, 420 ${y + 24}, 580 ${y + 24}`} fill="none" stroke={hidden ? '#d7deea' : COL[t]} strokeWidth={width} strokeLinecap="butt" opacity={t === 'sys' ? 0.9 : 0.85} />
              <rect x={590} y={y} width={270} height={52} rx={10} fill={t === 'ins' ? waterTint(0.15) : t === 'out' ? '#e7ebf1' : '#fff'} stroke={COL[t]} strokeWidth={top === t && !hidden ? 5 : 2} />
              <text x={612} y={y + 37} className="vtw-svg-t is-b">
                {NAME[t]}
              </text>
            </g>
          );
        })}
        {/* 输出位置（注意力矩阵最后一行）：画在光束之上 */}
        <circle cx={130} cy={200} r={54} fill="#fffdf8" stroke={C.blue} strokeWidth={5} />
        <text x={130} y={210} textAnchor="middle" className="vtw-svg-t is-b" fill={C.blue}>
          下一词
        </text>
        <text x={cx0} y={cy0 - 18} className="vtw-svg-t is-muted">
          注意力比例随层变化（按图 4 形状示意）
        </text>
        <line x1={cx0} y1={cy0 + chH} x2={cx0 + cw} y2={cy0 + chH} stroke={C.line} strokeWidth={2} />
        {!hidden && TOKS.map((t) => <path key={t} d={path(t)} fill="none" stroke={COL[t]} strokeWidth={t === 'sys' || t === 'vis' ? 5 : 3} />)}
        <line x1={X(L)} y1={cy0 - 4} x2={X(L)} y2={cy0 + chH} stroke={C.blue} strokeWidth={4} />
        <text x={cx0} y={cy0 + chH + 32} className="vtw-svg-t is-muted">
          0
        </text>
        <text x={cx0 + cw} y={cy0 + chH + 32} textAnchor="end" className="vtw-svg-t is-muted">
          {N - 1}（层索引）
        </text>
      </svg>
      <div className="vtw-at-side">
        <Seg<Mode>
          label="模式"
          value={mode}
          onChange={(m) => {
            setMode(m);
            g.restart();
          }}
          options={[
            { value: 'demo', label: '自己拖动' },
            { value: 'guess', label: '先猜（挑战）' },
          ]}
        />
        {mode === 'demo' ? (
          <>
            <Seg<ModelKey>
              label="模型"
              value={model}
              onChange={(m) => {
                setModel(m);
                setLayer((l) => Math.min(l, LAYERS[m] - 1));
              }}
              options={[
                { value: '7b', label: '7B · 32 层' },
                { value: '13b', label: '13B · 40 层' },
              ]}
            />
            <Range label="层索引（0 起，图 4 横轴）" value={L} min={0} max={N - 1} onChange={setLayer} tone="blue" display={`第 ${L} 层`} />
            <Seg<Measure>
              label="计量方式"
              value={measure}
              onChange={setMeasure}
              tone="orange"
              options={[
                { value: 'total', label: '按类型总量' },
                { value: 'per', label: '按每个 token' },
              ]}
            />
            <Feedback tone={L <= 1 ? 'warn' : 'info'}>
              {measure === 'per'
                ? '平均到每个 token：按正文约数（80% / 35 对 5% / 576），单个系统 token 约是单个视觉 token 的 260 倍（外推）。'
                : L <= 1
                  ? '浅层还在看图：视觉 token 拿到的注意力最多。'
                  : '这一层大部分注意力停在 35 个系统 token 上，576 个视觉 token 只分到细细一束。'}
            </Feedback>
          </>
        ) : (
          <GuessCard g={g} />
        )}
      </div>
    </div>
  );
}
