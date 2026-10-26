import React, { useState } from 'react';

const INK = '#21324a';
const MUTED = '#68778f';
const RED = '#c43f52';
const GREEN = '#228d5c';
const BLUE = '#27446e';
const ORANGE = '#f07e47';
const PURPLE = '#7c3aed';
const LINE = '#d7deea';

const HEADS = 8;

/** 单头平均 vs 多头分工：同一个输入，两种关系能否同时被分辨。 */
export const MultiheadSplit = () => {
  const [heads, setHeads] = useState<1 | 8>(1);
  const [focus, setFocus] = useState(3);
  const single = heads === 1;

  const rhythm = single ? 0.5 : 0.9;
  const harmony = single ? 0.5 : 0.85;

  return (
    <div style={{ height: '100%', display: 'flex', gap: 26, color: INK }}>
      <div style={{ flex: '1 1 56%', minWidth: 0, background: '#fbf7f2', borderRadius: 18, border: `1px solid ${LINE}`, padding: '18px 22px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
          {([1, 8] as const).map((h) => (
            <button
              key={h}
              onClick={() => setHeads(h)}
              aria-pressed={heads === h}
              style={{
                cursor: 'pointer',
                fontSize: 'var(--ppt-body-text)',
                padding: '10px 22px',
                borderRadius: 999,
                border: `2px solid ${heads === h ? (h === 1 ? RED : GREEN) : LINE}`,
                background: heads === h ? '#ffffff' : '#f7f9fc',
                color: heads === h ? (h === 1 ? RED : GREEN) : MUTED,
              }}
            >
              {h === 1 ? '单头 (h=1)' : '八头 (h=8)'}
            </button>
          ))}
        </div>

        <svg viewBox="0 0 760 300" width="100%" height="100%" role="img" aria-label={single ? '单头注意力把两种关系平均掉' : '八个头分别关注不同关系'}>
          {single ? (
            <g>
              {[
                { x: 200, y: 130, name: '钢琴' },
                { x: 560, y: 130, name: '吉他' },
                { x: 380, y: 34, name: '鼓' },
                { x: 380, y: 236, name: '人声' },
              ].map((v) => (
                <g key={v.name}>
                  <line x1={v.x} y1={v.y} x2={380 + (v.x - 380) * 0.42} y2={130 + (v.y - 130) * 0.42} stroke="#cbd4e1" strokeWidth="4" />
                  <circle cx={v.x} cy={v.y} r="26" fill="#ffffff" stroke="#cbd4e1" strokeWidth="2" />
                  <text x={v.x} y={v.y + 8} textAnchor="middle" fontSize="20" fill={MUTED}>{v.name}</text>
                </g>
              ))}
              <circle cx="380" cy="130" r="72" fill="#ffffff" stroke={RED} strokeWidth="4" />
              <text x="380" y="122" textAnchor="middle" fontSize="30" fill={RED}>平均</text>
              <text x="380" y="156" textAnchor="middle" fontSize="22" fill={MUTED}>节奏 + 和声</text>
              <text x="380" y="286" textAnchor="middle" fontSize="26" fill={RED}>四路信息被压成同一个表示，两类关系各占一半</text>
            </g>
          ) : (
            <g>
              {Array.from({ length: HEADS }).map((_, i) => {
                const x = 60 + i * 92;
                const isRhythm = i === 2;
                const isHarmony = i === 5;
                const isFocus = i === focus;
                const color = isRhythm ? ORANGE : isHarmony ? PURPLE : '#cbd4e1';
                return (
                  <g key={i} onClick={() => setFocus(i)} style={{ cursor: 'pointer' }} role="button" aria-label={`选择第 ${i + 1} 个头`}>
                    <rect x={x - 34} y="70" width="68" height={isFocus ? 132 : 120} rx="12" fill={isRhythm || isHarmony ? '#ffffff' : '#f7f9fc'} stroke={isFocus ? BLUE : color} strokeWidth={isFocus ? 4 : 2} />
                    <text x={x} y="112" textAnchor="middle" fontSize="22" fill={MUTED}>头 {i + 1}</text>
                    <text x={x} y="150" textAnchor="middle" fontSize="20" fill={color}>{isRhythm ? '节奏' : isHarmony ? '和声' : '其它'}</text>
                    {[0, 1, 2].map((k) => (
                      <rect key={k} x={x - 22} y={168 + k * 10} width="44" height="6" rx="3" fill={color} opacity={(isRhythm || isHarmony ? 0.85 : 0.3) - k * 0.2} />
                    ))}
                  </g>
                );
              })}
              <text x="380" y="236" textAnchor="middle" fontSize="26" fill={GREEN}>拼接 8 个头，再乘 W^O 融合</text>
              <text x="380" y="272" textAnchor="middle" fontSize="24" fill={MUTED}>当前查看：头 {focus + 1}（不同头关注不同子空间）</text>
            </g>
          )}
        </svg>
      </div>

      <div style={{ flex: '1 1 44%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[
          { name: '节奏型', v: rhythm, color: ORANGE, head: '头 3' },
          { name: '和声进行', v: harmony, color: PURPLE, head: '头 6' },
        ].map((r) => (
          <div key={r.name} style={{ background: '#ffffff', border: `1px solid ${LINE}`, borderRadius: 16, padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--ppt-body-text)' }}>
              <span>{r.name}</span>
              <span style={{ color: single ? RED : r.color }}>{single ? '听不清' : r.head}</span>
            </div>
            <div style={{ height: 16, background: '#eef2f7', borderRadius: 999, marginTop: 10, overflow: 'hidden' }}>
              <div style={{ width: `${r.v * 100}%`, height: '100%', background: single ? RED : r.color, transition: 'width .18s' }} />
            </div>
            <div style={{ fontSize: 24, color: MUTED, marginTop: 6 }}>可分辨度 {(r.v * 100).toFixed(0)}%</div>
          </div>
        ))}

        <div style={{ flex: 1, background: single ? '#fdf2f4' : '#f4faf6', border: `1px solid ${single ? '#f0c9d0' : '#cce5d8'}`, borderRadius: 16, padding: '16px 20px', fontSize: 'var(--ppt-body-text)' }}>
          {single
            ? '一个头只能给出一种加权，把节奏与和声平均在一起，两边都变钝。'
            : '把 Q、K、V 各投影 8 次，每个头在自己的 64 维子空间里做注意力，两类关系可以同时保留。'}
          <div style={{ fontSize: 22, color: MUTED, marginTop: 10 }}>
            可分辨度为教学示意的编码；论文的配置是 h=8、d_k=d_v=d_model/h=64（page 5 §3.2.2）。
          </div>
        </div>
      </div>
    </div>
  );
};
