import React, { useState } from 'react';

const INK = '#21324a';
const MUTED = '#68778f';
const GREEN = '#228d5c';
const BLUE = '#27446e';
const ORANGE = '#f07e47';
const LINE = '#d7deea';

type Row = { name: string; bleu: number; cost: string; ours?: 'base' | 'big' };

const DATA: Record<'ende' | 'enfr', Record<'single' | 'ensemble', Row[]>> = {
  ende: {
    single: [
      { name: 'ByteNet', bleu: 23.75, cost: '未报告' },
      { name: 'GNMT + RL', bleu: 24.6, cost: '2.3×10¹⁹' },
      { name: 'ConvS2S', bleu: 25.16, cost: '9.6×10¹⁸' },
      { name: 'MoE', bleu: 26.03, cost: '2.0×10¹⁹' },
      { name: 'Transformer (base)', bleu: 27.3, cost: '3.3×10¹⁸', ours: 'base' },
      { name: 'Transformer (big)', bleu: 28.4, cost: '2.3×10¹⁹', ours: 'big' },
    ],
    ensemble: [
      { name: 'GNMT + RL Ensemble', bleu: 26.3, cost: '1.8×10²⁰' },
      { name: 'ConvS2S Ensemble', bleu: 26.36, cost: '7.7×10¹⁹' },
    ],
  },
  enfr: {
    single: [
      { name: 'Deep-Att + PosUnk', bleu: 39.2, cost: '1.0×10²⁰' },
      { name: 'GNMT + RL', bleu: 39.92, cost: '1.4×10²⁰' },
      { name: 'ConvS2S', bleu: 40.46, cost: '1.5×10²⁰' },
      { name: 'MoE', bleu: 40.56, cost: '1.2×10²⁰' },
      { name: 'Transformer (base)', bleu: 38.1, cost: '未报告', ours: 'base' },
      { name: 'Transformer (big)', bleu: 41.8, cost: '2.3×10¹⁹', ours: 'big' },
    ],
    ensemble: [
      { name: 'Deep-Att + PosUnk Ensemble', bleu: 40.4, cost: '8.0×10²⁰' },
      { name: 'GNMT + RL Ensemble', bleu: 41.16, cost: '1.1×10²¹' },
      { name: 'ConvS2S Ensemble', bleu: 41.29, cost: '1.2×10²¹' },
    ],
  },
};

/** Table 2：质量与训练算力，仅在同一协议内比较。 */
export const BleuCost = () => {
  const [task, setTask] = useState<'ende' | 'enfr'>('ende');
  const [kind, setKind] = useState<'single' | 'ensemble'>('single');
  const rows = DATA[task][kind];
  const max = 45;

  const btn = (active: boolean, color: string): React.CSSProperties => ({
    cursor: 'pointer',
    fontSize: 24,
    padding: '8px 18px',
    borderRadius: 999,
    border: `2px solid ${active ? color : LINE}`,
    background: active ? '#ffffff' : '#f7f9fc',
    color: active ? color : MUTED,
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14, color: INK }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button onClick={() => setTask('ende')} aria-pressed={task === 'ende'} style={btn(task === 'ende', BLUE)}>WMT14 EN-DE</button>
        <button onClick={() => setTask('enfr')} aria-pressed={task === 'enfr'} style={btn(task === 'enfr', BLUE)}>WMT14 EN-FR</button>
        <span style={{ width: 20 }} />
        <button onClick={() => setKind('single')} aria-pressed={kind === 'single'} style={btn(kind === 'single', GREEN)}>单模型</button>
        <button onClick={() => setKind('ensemble')} aria-pressed={kind === 'ensemble'} style={btn(kind === 'ensemble', ORANGE)}>集成</button>
        <span style={{ marginLeft: 'auto', fontSize: 22, color: MUTED }}>newstest2014 · BLEU 越高越好 · 算力越低越好</span>
      </div>

      <div style={{ flex: 1, minHeight: 0, background: '#ffffff', border: `1px solid ${LINE}`, borderRadius: 18, padding: '16px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
        {rows.map((r) => {
          const color = r.ours ? GREEN : '#9fb0c8';
          return (
            <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ width: 300, fontSize: 24, color: r.ours ? GREEN : MUTED, fontWeight: r.ours ? 700 : 400 }}>{r.name}</span>
              <div style={{ flex: 1, height: 28, background: '#f1f5fa', borderRadius: 6, position: 'relative' }}>
                <div style={{ width: `${(r.bleu / max) * 100}%`, height: '100%', background: color, borderRadius: 6, transition: 'width .2s' }} />
              </div>
              <span style={{ width: 76, textAlign: 'right', fontSize: 24, color: r.ours ? GREEN : INK }}>{r.bleu.toFixed(2)}</span>
              <span style={{ width: 132, textAlign: 'right', fontSize: 22, color: MUTED }}>{r.cost}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, background: kind === 'ensemble' ? '#fffaf6' : '#f4faf6', border: `1px solid ${kind === 'ensemble' ? '#f3ddc9' : '#cce5d8'}`, borderRadius: 16, padding: '12px 20px', fontSize: 'var(--ppt-body-text)' }}>
          {task === 'ende'
            ? kind === 'ensemble'
              ? '集成里最好的是 ConvS2S Ensemble 26.36；而 Transformer (big) 单模型 28.4 已超过全部集成。'
              : 'big 模型 28.4 BLEU：比最佳单模型 MoE（26.03）高 2.4，并超过全部集成（最高 26.36）；摘要与 §6.1 的原话都是 including ensembles。'
            : kind === 'ensemble'
              ? '集成里最好的是 ConvS2S Ensemble 41.29；Transformer (big) 单模型按 Table 2 为 41.8。'
              : 'big 模型按 Table 2 为 41.8 BLEU，训练算力 2.3×10¹⁹；论文正文 §6.1 同段落写作 41.0。'}
        </div>
        <div style={{ flex: 1, background: '#f7f9fc', border: `1px solid ${LINE}`, borderRadius: 16, padding: '12px 20px', fontSize: 22, color: MUTED }}>
          {kind === 'ensemble' ? '当前显示集成结果，与单模型不可直接比较。' : '当前显示单模型结果。'} 柱形为零基线，横轴上限 45 BLEU。
        </div>
      </div>
    </div>
  );
};
