import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';

const INK = '#21324a';
const MUTED = '#68778f';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const ORANGE = '#f07e47';
const PURPLE = '#7c3aed';
const LINE = '#d7deea';

const LABELS = ['钢琴', '吉他', '鼓', '人声'];
const VALUES = [
  [2, 0, 1],
  [0, 2, 1],
  [1, 1, 0],
  [0, 1, 2],
];
const DIMS = ['d₁', 'd₂', 'd₃'];

/** 输出 = 权重 × value 之和：拖动音量推子，看输出向量如何被重新混合。 */
export const AttentionMix = () => {
  const [w, setW] = useState([0.4, 0.3, 0.2, 0.1]);

  const setWeight = (i: number, value: number) => {
    const v = Math.max(0, Math.min(1, value));
    const rest = 1 - v;
    const othersSum = w.reduce((s, x, j) => (j === i ? s : s + x), 0);
    const next = w.map((x, j) => {
      if (j === i) return v;
      if (othersSum <= 1e-6) return rest / 3;
      return (x / othersSum) * rest;
    });
    setW(next);
  };

  const out = [0, 1, 2].map((d) => VALUES.reduce((s, v, i) => s + v[d] * w[i], 0));
  const outMax = Math.max(1, ...out);

  return (
    <div style={{ height: '100%', display: 'flex', gap: 26, color: INK }}>
      <div style={{ flex: '1 1 50%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 'var(--ppt-body-heading)', color: INK }}>注意力音量（权重和为 1）</div>
        {LABELS.map((label, i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 78, fontSize: 'var(--ppt-body-text)', color: MUTED }}>{label}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={w[i]}
              onChange={(e) => setWeight(i, Number(e.target.value))}
              aria-label={`${label} 的注意力权重`}
              style={{ flex: 1, accentColor: BLUE }}
            />
            <span style={{ width: 88, textAlign: 'right', fontSize: 'var(--ppt-body-text)', color: BLUE }}>{(w[i] * 100).toFixed(0)}%</span>
          </div>
        ))}
        <div style={{ background: '#f7f9fc', border: `1px solid ${LINE}`, borderRadius: 16, padding: '14px 18px', fontSize: 'var(--ppt-body-text)' }}>
          权重合计 <strong style={{ color: GREEN }}>{(w.reduce((a, b) => a + b, 0) * 100).toFixed(0)}%</strong> · 拖动任意一条，其余按比例自动让位
        </div>

        <div style={{ flex: 1, minHeight: 0, background: '#fffaf6', border: '1px solid #f3ddc9', borderRadius: 16, padding: '14px 20px' }}>
          <div style={{ fontSize: 'var(--ppt-body-heading)', color: INK }}>被混合的 value 向量</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 18px', marginTop: 10 }}>
            {LABELS.map((label, i) => (
              <div key={label} style={{ fontSize: 24, color: MUTED }}>
                {label}：[{VALUES[i].join(', ')}]
              </div>
            ))}
          </div>
          <div style={{ fontSize: 22, color: MUTED, marginTop: 10 }}>输出向量落在四者的凸组合内，不会跑出这个范围。</div>
        </div>
      </div>

      <div style={{ flex: '1 1 50%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: '#ffffff', border: `1px solid ${LINE}`, borderRadius: 18, padding: '16px 20px' }}>
          <div style={{ fontSize: 'var(--ppt-body-text)', color: INK }}>
            <strong>
              <SymbolHint meaning="Q：查询矩阵，每行是一个位置「我需要什么」。形状 n×d_k。">Q</SymbolHint>
              {' Kᵀ / √'}
              <SymbolHint meaning="d_k：键与查询的维度，本文每个头取 64；除以它的平方根可控制点积的量级。">d_k</SymbolHint>
              {' → softmax → × '}
              <SymbolHint meaning="V：值矩阵，真正被加权求和的内容。形状 n×d_v。">V</SymbolHint>
            </strong>
            {'  →  输出向量'}
          </div>
          <div style={{ fontSize: 24, color: MUTED, marginTop: 8 }}>
            Attention(Q,K,V) = softmax(QKᵀ/√d_k)V，本文式(1)
          </div>
        </div>

        <div style={{ flex: 1, background: '#f7f9fc', border: `1px solid ${LINE}`, borderRadius: 18, padding: '16px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
          <div style={{ fontSize: 'var(--ppt-body-heading)', color: INK }}>加权求和后的输出</div>
          {out.map((v, d) => (
            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ width: 46, fontSize: 'var(--ppt-body-text)', color: PURPLE }}>{DIMS[d]}</span>
              <div style={{ flex: 1, height: 30, background: '#ffffff', border: `1px solid ${LINE}`, borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ width: `${(v / outMax) * 100}%`, height: '100%', background: PURPLE, opacity: 0.75, transition: 'width .15s' }} />
              </div>
              <span style={{ width: 72, textAlign: 'right', fontSize: 'var(--ppt-body-text)' }}>{v.toFixed(2)}</span>
            </div>
          ))}
          <div style={{ fontSize: 'var(--ppt-body-text)', color: ORANGE }}>
            {w[0] > 0.6 ? '钢琴几乎盖住其他人，输出接近钢琴的 value。' : w[0] < 0.1 ? '钢琴几乎被静音，输出主要由其余声部决定。' : '几个声部按比例叠在一起，输出是它们的凸组合。'}
          </div>
          <div style={{ fontSize: 22, color: MUTED }}>value 取 3 维小向量作示意；和为 1 由 softmax 保证。</div>
        </div>
      </div>
    </div>
  );
};
