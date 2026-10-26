import React, { useState } from 'react';

const INK = '#21324a';
const MUTED = '#68778f';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const ORANGE = '#f07e47';
const LINE = '#d7deea';

type Part = {
  id: string;
  name: string;
  side: '编码器' | '解码器' | '两端';
  desc: string;
  dims: string;
  box: { left: number; top: number; width: number; height: number };
};

const PARTS: Part[] = [
  {
    id: 'enc-self',
    name: '编码器自注意力',
    side: '编码器',
    desc: 'Q、K、V 全部来自上一层编码器输出，每个位置都能看输入序列的所有位置。',
    dims: 'h=8 头，每头 d_k=d_v=64，输出 512',
    box: { left: 20.6, top: 59.4, width: 24.5, height: 6.2 },
  },
  {
    id: 'enc-ffn',
    name: '编码器前馈网络',
    side: '编码器',
    desc: '对每个位置独立做两层全连接，中间接 ReLU，不跨位置混合信息。',
    dims: '512 → 2048 → 512',
    box: { left: 20.9, top: 43.2, width: 24.5, height: 6.2 },
  },
  {
    id: 'dec-cross',
    name: '编码器—解码器注意力',
    side: '解码器',
    desc: 'Q 来自解码器上一层，K、V 来自编码器输出：每个解码位置都能看完整输入。',
    dims: 'Q 来自解码器，K、V 来自编码器输出',
    box: { left: 55.1, top: 40.6, width: 24.5, height: 6.2 },
  },
  {
    id: 'dec-mask',
    name: '掩码自注意力',
    side: '解码器',
    desc: '把未来位置设为 −∞，只允许看当前位置及更早的位置，保持自回归性质。',
    dims: '与上一页的 4×4 掩码矩阵同一机制',
    box: { left: 55.3, top: 58.0, width: 24.5, height: 6.2 },
  },
  {
    id: 'dec-ffn',
    name: '解码器前馈网络',
    side: '解码器',
    desc: '与编码器同构的逐位置全连接层，各层参数不共享。',
    dims: '512 → 2048 → 512',
    box: { left: 55.1, top: 27.0, width: 24.5, height: 6.2 },
  },
  {
    id: 'pos',
    name: '位置编码注入',
    side: '两端',
    desc: '把与嵌入同维的正弦编码加到输入嵌入上，让同时计算的模型知道先后。',
    dims: '与嵌入同维 512，直接相加',
    box: { left: 14.6, top: 74.2, width: 17.5, height: 5.2 },
  },
];

/** 原文 Figure 1：点击部件，阅读它的输入来源与维度。 */
export const ArchStack = () => {
  const [sel, setSel] = useState('enc-self');
  const part = PARTS.find((p) => p.id === sel)!;

  return (
    <div style={{ height: '100%', display: 'flex', gap: 26, color: INK }}>
      <div style={{ height: '100%', aspectRatio: '930 / 1361', position: 'relative', background: '#ffffff', border: `1px solid ${LINE}`, borderRadius: 16, padding: 8 }}>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <img
            src="./images/fig1-transformer.png"
            alt="Transformer 架构图（原论文 Figure 1）"
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
          {PARTS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSel(p.id)}
              aria-label={p.name}
              title={p.name}
              style={{
                position: 'absolute',
                left: `${p.box.left}%`,
                top: `${p.box.top}%`,
                width: `${p.box.width}%`,
                height: `${p.box.height}%`,
                background: sel === p.id ? 'rgba(240,126,71,0.26)' : 'rgba(240,126,71,0.04)',
                border: `3px solid ${sel === p.id ? ORANGE : 'rgba(240,126,71,0.4)'}`,
                borderRadius: 8,
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {PARTS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSel(p.id)}
              aria-pressed={sel === p.id}
              style={{
                cursor: 'pointer',
                fontSize: 24,
                padding: '8px 16px',
                borderRadius: 999,
                border: `2px solid ${sel === p.id ? ORANGE : LINE}`,
                background: sel === p.id ? '#fff4ec' : '#ffffff',
                color: sel === p.id ? ORANGE : MUTED,
              }}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div style={{ background: '#f7f9fc', border: `1px solid ${LINE}`, borderRadius: 16, padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 'var(--ppt-body-emphasis)', color: BLUE }}>{part.name}</div>
          <div style={{ fontSize: 24, color: GREEN }}>{part.side}</div>
          <div style={{ fontSize: 'var(--ppt-body-text)' }}>{part.desc}</div>
          <div style={{ fontSize: 'var(--ppt-body-text)', color: MUTED }}>{part.dims}</div>
        </div>

        <div style={{ flex: 1, minHeight: 0, background: '#ffffff', border: `1px solid ${LINE}`, borderRadius: 16, padding: '14px 22px', display: 'flex', alignItems: 'center' }}>
          <div style={{ fontSize: 'var(--ppt-body-text)', color: MUTED }}>
            数据在每一层走一遍：<strong style={{ color: INK }}>自注意力 → 残差+LN → 前馈 512→2048→512 → 残差+LN</strong>，再交给下一层。
          </div>
        </div>

        <div style={{ background: '#ffffff', border: `1px solid ${LINE}`, borderRadius: 16, padding: '14px 22px', fontSize: 'var(--ppt-body-text)' }}>
          每个子层：LayerNorm(x + Sublayer(x))
          <div style={{ fontSize: 22, color: MUTED, marginTop: 6 }}>
            编码器、解码器各 N=6 层；图取自原文 Figure 1（page 3），可按 Ctrl+滚轮放大查看。
          </div>
        </div>
      </div>
    </div>
  );
};
