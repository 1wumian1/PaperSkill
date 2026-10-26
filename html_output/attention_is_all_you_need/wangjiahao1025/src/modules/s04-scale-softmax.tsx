import React, { useState } from 'react';

const INK = '#21324a';
const MUTED = '#68778f';
const RED = '#c43f52';
const GREEN = '#228d5c';
const BLUE = '#27446e';
const ORANGE = '#f07e47';
const LINE = '#d7deea';

const BASE = [2.4, 1.1, 0.3, -0.6];
const DKS = [8, 16, 64, 256, 512, 1024];
const LABELS = ['钢琴', '吉他', '鼓', '人声'];

function softmax(xs: number[]) {
  const m = Math.max(...xs);
  const ex = xs.map((x) => Math.exp(x - m));
  const s = ex.reduce((a, b) => a + b, 0);
  return ex.map((v) => v / s);
}
const entropy = (p: number[]) => -p.reduce((s, v) => s + (v > 0 ? v * Math.log(v) : 0), 0);

/** 缩放的必要性：d_k 变大时点积幅度变大，softmax 会饱和。 */
export const ScaleSoftmax = () => {
  const [idx, setIdx] = useState(2);
  const dk = DKS[idx];
  const grow = Math.sqrt(dk / 64);
  const raw = BASE.map((v) => v * grow);
  const scaled = BASE.map((v) => v / 8);
  const pRaw = softmax(raw);
  const pScaled = softmax(scaled);
  const maxRaw = Math.max(...pRaw);
  const maxScaled = Math.max(...pScaled);

  const panel = (title: string, sub: string, p: number[], color: string, max: number, ent: number) => (
    <div style={{ flex: 1, minWidth: 0, background: '#ffffff', border: `2px solid ${color}22`, borderRadius: 18, padding: '18px 20px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 'var(--ppt-body-heading)', color }}>{title}</div>
      <div style={{ fontSize: 24, color: MUTED, marginBottom: 8 }}>{sub}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 220 }}>
        {p.map((v, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ fontSize: 24, color: INK, marginBottom: 4 }}>{(v * 100).toFixed(0)}%</div>
            <div style={{ width: '80%', height: `${Math.max(2, v * 180)}px`, background: color, borderRadius: 6, transition: 'height .15s' }} />
            <div style={{ fontSize: 22, color: MUTED, marginTop: 6 }}>{LABELS[i]}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 'var(--ppt-body-text)', color: INK, marginTop: 10 }}>
        最大权重 {(max * 100).toFixed(0)}% · 熵 {ent.toFixed(2)}
      </div>
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16, color: INK }}>
      <div style={{ display: 'flex', gap: 20, flex: 1, minHeight: 0 }}>
        {panel('不缩放', 'logits = q·k', pRaw, RED, maxRaw, entropy(pRaw))}
        {panel('除以 √d_k', 'logits = q·k / √d_k', pScaled, GREEN, maxScaled, entropy(pScaled))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, background: '#f7f9fc', border: `1px solid ${LINE}`, borderRadius: 16, padding: '12px 22px' }}>
        <span style={{ fontSize: 'var(--ppt-body-text)', whiteSpace: 'nowrap' }}>d_k = <strong style={{ color: ORANGE }}>{dk}</strong></span>
        <input
          type="range"
          min={0}
          max={DKS.length - 1}
          step={1}
          value={idx}
          onChange={(e) => setIdx(Number(e.target.value))}
          aria-label="键维度 d_k"
          style={{ flex: 1, accentColor: ORANGE }}
        />
        <span style={{ fontSize: 'var(--ppt-body-text)', minWidth: 0 }}>
          {maxRaw > 0.9 ? '不缩放时只剩一个人在大声演奏，其余几乎听不见；缩放后还能听见各声部。' : '维度还小时两者差别不大。'}
        </span>
      </div>
      <div style={{ fontSize: 22, color: MUTED }}>
        以 d_k=64 时的分数为基准按 √(d_k/64) 放大量级，属示意的量级模拟；论文论证见 page 4 §3.2.1 与脚注 4。
      </div>
    </div>
  );
};
