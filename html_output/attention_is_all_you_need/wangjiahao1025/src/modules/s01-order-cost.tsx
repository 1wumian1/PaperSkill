import React, { useState } from 'react';

const INK = '#21324a';
const MUTED = '#68778f';
const RED = '#c43f52';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const ORANGE = '#f07e47';
const LINE = '#d7deea';

const NAMES = ['钢琴', '吉他', '鼓', '人声', '贝斯', '长笛', '小号', '提琴', '口琴', '手鼓', '竖琴', '铃鼓'];

/** 顺序步数 n 与末位保真度：链越长，越必须排队，信息也越走样。 */
export const OrderCost = () => {
  const [n, setN] = useState(6);
  const fidelity = Math.pow(0.82, n - 1);
  const worst = fidelity < 0.35;

  return (
    <div style={{ height: '100%', display: 'flex', gap: 28, color: INK }}>
      <div style={{ flex: '1 1 62%', minWidth: 0, background: '#fbf7f2', borderRadius: 18, border: `1px solid ${LINE}`, padding: 18 }}>
        <svg viewBox="0 0 900 520" width="100%" height="100%" role="img" aria-label={`${n} 位乐手依次接力传递旋律`}>
          {[0, 1, 2].map((i) => (
            <line key={i} x1="40" y1={78 + i * 16} x2="860" y2={78 + i * 16} stroke="#eadfd0" strokeWidth="1.5" />
          ))}
          {Array.from({ length: n }).map((_, i) => {
            const gap = 820 / Math.max(1, n - 1);
            const x = 40 + i * gap;
            const r = Math.max(20, Math.min(34, gap * 0.32));
            const clarity = Math.pow(0.82, i);
            return (
              <g key={i}>
                <circle cx={x} cy="250" r={r} fill={i === 0 ? '#ffffff' : '#f3f6fb'} stroke={i === 0 ? GREEN : '#cbd4e1'} strokeWidth="2" />
                <circle cx={x} cy="250" r={r * 0.28} fill={i === 0 ? GREEN : ORANGE} opacity={i === 0 ? 1 : clarity} />
                <text x={x} y={250 + r + 30} textAnchor="middle" fontSize="24" fill={MUTED}>{NAMES[i]}</text>
                {[0, 1, 2].map((k) => (
                  <circle
                    key={k}
                    cx={x - 14 + k * 14}
                    cy={78 + k * 16}
                    r={Math.max(4, r * 0.17)}
                    fill={i === 0 ? GREEN : RED}
                    opacity={(i === 0 ? 0.95 : 0.25 + clarity * 0.7) * (i === 0 ? 1 : 1)}
                  />
                ))}
                {i < n - 1 && (
                  <g opacity={0.85}>
                    <line x1={x + r + 4} y1="250" x2={x + gap - r - 4} y2="250" stroke={RED} strokeWidth="2.5" strokeDasharray="7 6" />
                  </g>
                )}
                {i > 0 && (
                  <text x={x} y={250 - r - 16} textAnchor="middle" fontSize="22" fill={RED} opacity={0.5 + clarity * 0.5}>
                    {(clarity * 100).toFixed(0)}%
                  </text>
                )}
              </g>
            );
          })}
          <text x="40" y="470" fontSize="26" fill={RED}>第 t 位必须等第 t−1 位说完，才轮到自己</text>
          <text x="860" y="470" textAnchor="end" fontSize="26" fill={MUTED}>样本内并行度 = 1</text>
          <text x="860" y="502" textAnchor="end" fontSize="21" fill={MUTED}>沿位置维度；批内与特征维仍可并行</text>
        </svg>
      </div>

      <div style={{ flex: '1 1 38%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ background: '#ffffff', border: `1px solid ${LINE}`, borderRadius: 18, padding: '14px 22px' }}>
          <div style={{ fontSize: 26, color: MUTED }}>顺序步数</div>
          <div style={{ fontSize: 40, color: worst ? RED : BLUE, fontWeight: 700, lineHeight: 1.2 }}>{n} 步</div>
          <div style={{ marginTop: 8, fontSize: 26, color: MUTED }}>末位保真度</div>
          <div style={{ height: 14, background: '#eef2f7', borderRadius: 999, marginTop: 6, overflow: 'hidden' }}>
            <div style={{ width: `${fidelity * 100}%`, height: '100%', background: worst ? RED : GREEN, transition: 'width .15s' }} />
          </div>
          <div style={{ fontSize: 26, color: worst ? RED : INK, marginTop: 4 }}>{(fidelity * 100).toFixed(0)}%</div>
        </div>

        <div style={{ background: worst ? '#fdf2f4' : '#f7f9fc', border: `1px solid ${worst ? '#f0c9d0' : LINE}`, borderRadius: 18, padding: '14px 22px', flex: 1, minHeight: 0 }}>
          <div style={{ fontSize: 26, color: worst ? RED : INK }}>
            {worst
              ? '链到这么长，队尾几乎听不清开头那段旋律：每一步都要重新转述一次。'
              : '链还短的时候问题不明显；每加一位，就多一次等待和一次转述。'}
          </div>
          <div style={{ fontSize: 21, color: MUTED, marginTop: 8 }}>保真度曲线为教学示意，论文只说明顺序结构阻碍样本内并行。</div>
        </div>

        <label style={{ display: 'block', background: '#ffffff', border: `1px solid ${LINE}`, borderRadius: 18, padding: '12px 22px' }}>
          <span style={{ fontSize: 26, color: INK }}>链条长度 n = {n}</span>
          <input
            type="range"
            min={2}
            max={12}
            step={1}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            aria-label="链条长度"
            style={{ width: '100%', marginTop: 10, accentColor: BLUE }}
          />
        </label>
      </div>
    </div>
  );
};
