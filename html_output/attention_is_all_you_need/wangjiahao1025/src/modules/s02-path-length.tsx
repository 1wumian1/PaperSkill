import React, { useState } from 'react';

const INK = '#21324a';
const MUTED = '#68778f';
const RED = '#c43f52';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const ORANGE = '#f07e47';
const LINE = '#d7deea';

type LayerKind = 'self' | 'rnn' | 'conv';

const KINDS: { id: LayerKind; label: string; parallel: string; path: string; color: string }[] = [
  { id: 'self', label: '自注意力', parallel: 'O(n)', path: 'O(1)', color: GREEN },
  { id: 'rnn', label: '循环层', parallel: 'O(1)', path: 'O(n)', color: RED },
  { id: 'conv', label: '卷积层 (k=3)', parallel: 'O(n)', path: 'O(log_k n)', color: ORANGE },
];

/** 路径长度：从第 1 位到目标位置要走几手。 */
export const PathLength = () => {
  const N = 8;
  const [target, setTarget] = useState(7);
  const [kind, setKind] = useState<LayerKind>('rnn');
  const active = KINDS.find((k) => k.id === kind)!;
  const hops = kind === 'self' ? 1 : kind === 'rnn' ? target - 1 : Math.ceil(Math.log(target) / Math.log(3));

  const cellX = (i: number) => 70 + i * 104;

  return (
    <div style={{ height: '100%', display: 'flex', gap: 28, color: INK }}>
      <div style={{ flex: '1 1 64%', minWidth: 0, background: '#fbf7f2', borderRadius: 18, border: `1px solid ${LINE}`, padding: 18 }}>
        <svg viewBox="0 0 900 520" width="100%" height="100%" role="img" aria-label="从位置 1 到目标位置的信息路径">
          <text x="40" y="46" fontSize="26" fill={MUTED}>点击一个小节，选择目标位置</text>

          {Array.from({ length: N }).map((_, i) => {
            const x = cellX(i);
            const isTarget = i === target - 1;
            return (
              <g key={i} onClick={() => setTarget(i + 1)} style={{ cursor: 'pointer' }} role="button" aria-label={`选择位置 ${i + 1}`}>
                <rect
                  x={x - 42}
                  y="86"
                  width="84"
                  height="76"
                  rx="14"
                  fill={isTarget ? '#fff4ec' : i === 0 ? '#eef8f3' : '#ffffff'}
                  stroke={isTarget ? ORANGE : i === 0 ? GREEN : '#cbd4e1'}
                  strokeWidth={isTarget ? 4 : 2}
                />
                <text x={x} y="134" textAnchor="middle" fontSize="26" fill={isTarget ? ORANGE : MUTED}>第 {i + 1} 拍</text>
              </g>
            );
          })}

          {kind === 'self' &&
            (() => {
              const x1 = cellX(0);
              const x2 = cellX(target - 1);
              return (
                <g>
                  <path d={`M ${x1 + 8} 176 Q ${(x1 + x2) / 2} 268 ${x2 - 8} 176`} fill="none" stroke={GREEN} strokeWidth="5" />
                  <circle cx={x2 - 8} cy="176" r="8" fill={GREEN} />
                  <text x={(x1 + x2) / 2} y="292" textAnchor="middle" fontSize="26" fill={GREEN}>一步直达</text>
                </g>
              );
            })()}

          {kind === 'rnn' &&
            Array.from({ length: target - 1 }).map((_, i) => {
              const x1 = cellX(i);
              const x2 = cellX(i + 1);
              return (
                <g key={i}>
                  <line x1={x1 + 8} y1="200" x2={x2 - 8} y2="200" stroke={RED} strokeWidth="5" strokeDasharray="9 7" />
                  <polygon points={`${x2 - 8},200 ${x2 - 20},194 ${x2 - 20},206`} fill={RED} />
                </g>
              );
            })}
          {kind === 'rnn' && (
            <text x={cellX(0)} y="248" fontSize="26" fill={RED}>
              必须经过中间每一拍才能到第 {target} 拍
            </text>
          )}

          {kind === 'conv' &&
            (() => {
              const nodes = [0, 3, 6, target - 1].filter((v, i, arr) => v < target && arr.indexOf(v) === i);
              return (
                <g>
                  {nodes.slice(0, -1).map((n, i) => (
                    <line key={n} x1={cellX(n)} y1="200" x2={cellX(nodes[i + 1])} y2="200" stroke={ORANGE} strokeWidth="5" />
                  ))}
                  <text x={cellX(0)} y="248" fontSize="26" fill={ORANGE}>核宽 3 的卷积，每层把可见范围扩大 3 倍</text>
                </g>
              );
            })()}

          <line x1="40" y1="330" x2="860" y2="330" stroke={LINE} strokeWidth="2" />
          <text x="40" y="382" fontSize="28" fill={INK}>最大路径长度</text>
          <text x="40" y="440" fontSize="44" fill={active.color} fontWeight={700}>
            {kind === 'self' ? '1 步' : kind === 'rnn' ? `${target - 1} 步` : `${hops} 步`}
          </text>
          <text x="380" y="382" fontSize="28" fill={INK}>并行度</text>
          <text x="380" y="440" fontSize="44" fill={active.color} fontWeight={700}>{active.parallel}</text>
          <text x="640" y="382" fontSize="28" fill={INK}>每层计算</text>
          <text x="640" y="440" fontSize="44" fill={MUTED} fontWeight={700}>{kind === 'self' ? 'O(n²·d)' : kind === 'rnn' ? 'O(n·d²)' : 'O(k·n·d²)'}</text>
        </svg>
      </div>

      <div style={{ flex: '1 1 36%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {KINDS.map((k) => (
          <button
            key={k.id}
            onClick={() => setKind(k.id)}
            aria-pressed={kind === k.id}
            style={{
              textAlign: 'left',
              fontSize: 'var(--ppt-body-text)',
              padding: '18px 22px',
              borderRadius: 16,
              cursor: 'pointer',
              background: kind === k.id ? '#ffffff' : '#f7f9fc',
              border: `2px solid ${kind === k.id ? k.color : LINE}`,
              color: kind === k.id ? k.color : INK,
            }}
          >
            <strong>{k.label}</strong>
            <div style={{ fontSize: 24, color: MUTED, marginTop: 4 }}>路径 {k.path} · 并行度 {k.parallel}</div>
          </button>
        ))}
        <div style={{ background: '#f7f9fc', border: `1px solid ${LINE}`, borderRadius: 16, padding: '18px 22px', flex: 1 }}>
          <div style={{ fontSize: 'var(--ppt-body-text)' }}>
            {kind === 'self' ? '任意两拍之间只隔一步，长距离依赖不必经过中间人。' : kind === 'rnn' ? '信号要走完中间每一拍，越远的依赖越难学。' : '卷积要靠堆叠扩大感受野，路径随层数增长。'}
          </div>
          <div style={{ fontSize: 20, color: MUTED, marginTop: 8, lineHeight: 1.4 }}>
            并行度＝同一时刻可同时推进的位置数。循环层逐位串行，自注意力与卷积层沿位置整体并行。
            <br />
            <span style={{ fontSize: 18 }}>数值取自原文 Table 1（page 6）。</span>
          </div>
        </div>
      </div>
    </div>
  );
};
