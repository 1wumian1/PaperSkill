import React, { useState } from 'react';

const INK = '#21324a';
const MUTED = '#68778f';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const ORANGE = '#f07e47';
const PURPLE = '#7c3aed';
const LINE = '#d7deea';

const D_MODEL = 512;
const TRAIN_LEN = 40;
const MAXPOS = 120;

const pe = (pos: number, i: number) => Math.sin(pos / Math.pow(10000, (2 * i) / D_MODEL));
const DIMS = [
  { i: 8, color: BLUE, label: 'i=8' },
  { i: 20, color: ORANGE, label: 'i=20' },
];

/** 正弦位置编码的外推性：函数对任意 pos 有定义，学习表只有训练时见过的那些行。 */
export const PosExtrapolate = () => {
  const [pos, setPos] = useState(80);
  const W = 1280;
  const H = 250;
  const AXIS = 140;
  const AMP = 78;
  const x = (p: number) => 70 + (p / MAXPOS) * (W - 120);
  const y = (v: number) => AXIS - v * AMP;
  const outside = pos >= TRAIN_LEN;
  const labelX = Math.min(Math.max(x(pos), 100), W - 100);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12, color: INK }}>
      <div style={{ flex: 1, minHeight: 0, background: '#ffffff', border: `1px solid ${LINE}`, borderRadius: 18, padding: '8px 16px' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label="正弦位置编码在训练长度之外仍有定义">
          <rect x={x(0)} y={y(1) - 8} width={x(TRAIN_LEN) - x(0)} height={y(-1) - y(1) + 16} fill="#eef8f3" />
          <rect x={x(TRAIN_LEN)} y={y(1) - 8} width={x(MAXPOS) - x(TRAIN_LEN)} height={y(-1) - y(1) + 16} fill="#fff4ec" />

          <rect x="70" y="12" width="18" height="18" fill="#eef8f3" stroke={GREEN} strokeWidth="2" />
          <text x="96" y="29" fontSize="21" fill={GREEN}>训练时见过的长度 0–{TRAIN_LEN}</text>
          <rect x="360" y="12" width="18" height="18" fill="#fff4ec" stroke={ORANGE} strokeWidth="2" />
          <text x="386" y="29" fontSize="21" fill={ORANGE}>训练时从未出现的长度</text>

          <line x1={x(TRAIN_LEN)} y1={y(1) - 8} x2={x(TRAIN_LEN)} y2={y(-1) + 8} stroke={ORANGE} strokeWidth="3" strokeDasharray="8 6" />
          <line x1={x(0)} y1={y(0)} x2={x(MAXPOS)} y2={y(0)} stroke={LINE} strokeWidth="2" />

          {[0, 20, 40, 60, 80, 100, 120].map((p) => (
            <g key={p}>
              <line x1={x(p)} y1={y(0) - 6} x2={x(p)} y2={y(0) + 8} stroke="#9fb0c8" strokeWidth="2" />
              <text x={x(p)} y={H - 6} textAnchor="middle" fontSize="20" fill={MUTED}>第 {p} 拍</text>
            </g>
          ))}

          {DIMS.map((d) => {
            const pts = Array.from({ length: 241 }).map((_, k) => {
              const p = (k / 240) * MAXPOS;
              return `${x(p).toFixed(1)},${y(pe(p, d.i)).toFixed(1)}`;
            });
            return <polyline key={d.i} points={pts.join(' ')} fill="none" stroke={d.color} strokeWidth="3" opacity="0.85" />;
          })}

          <line x1={x(pos)} y1={y(1) - 8} x2={x(pos)} y2={y(-1) + 8} stroke={INK} strokeWidth="3" strokeDasharray="7 6" />
          <text
            x={labelX}
            y="58"
            textAnchor="middle"
            fontSize="21"
            fill={INK}
            fontWeight="700"
            stroke="#ffffff"
            strokeWidth="5"
            paintOrder="stroke"
          >
            pos = {pos}
          </text>
        </svg>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, background: '#f7f9fc', border: `1px solid ${LINE}`, borderRadius: 14, padding: '8px 16px' }}>
          <div style={{ fontSize: 21, color: PURPLE, fontWeight: 700 }}>正弦编码：任意 pos 都有定义</div>
          <div style={{ fontSize: 22, color: INK, marginTop: 2 }}>
            pos={pos} → {DIMS.map((d) => `${d.label} ${pe(pos, d.i).toFixed(3)}`).join(' · ')}
          </div>
          <div style={{ fontSize: 20, color: MUTED, marginTop: 2 }}>同一个公式，超出训练长度只是换个 pos 代入</div>
        </div>
        <div style={{ flex: 1, background: outside ? '#fff4ec' : '#f7f9fc', border: `1px solid ${outside ? ORANGE : LINE}`, borderRadius: 14, padding: '8px 16px' }}>
          <div style={{ fontSize: 21, color: outside ? ORANGE : PURPLE, fontWeight: 700 }}>可学习嵌入：只有 {TRAIN_LEN} 行</div>
          <div style={{ fontSize: 22, color: outside ? ORANGE : INK, marginTop: 2 }}>
            pos={pos} → {outside ? `越界，表中没有第 ${pos} 行` : `取第 ${pos} 行参数`}
          </div>
          <div style={{ fontSize: 20, color: MUTED, marginTop: 2 }}>表长训练前就定死，更长序列没有参数</div>
        </div>
        <div style={{ flex: 1, background: '#f7f9fc', border: `1px solid ${LINE}`, borderRadius: 14, padding: '8px 16px' }}>
          <div style={{ fontSize: 21, color: GREEN, fontWeight: 700 }}>相对位移也能表达</div>
          <div style={{ fontSize: 22, color: INK, marginTop: 2 }}>PE(pos+k) 可由 PE(pos) 经固定线性变换得到</div>
          <div style={{ fontSize: 20, color: MUTED, marginTop: 2 }}>来自和角公式：sin/cos 可展开成同一频率的线性组合</div>
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fffaf6', border: '1px solid #f3ddc9', borderRadius: 14, padding: '6px 20px' }}>
        <span style={{ fontSize: 'var(--ppt-body-text)', whiteSpace: 'nowrap' }}>pos = {pos}</span>
        <input
          type="range"
          min={0}
          max={MAXPOS}
          step={1}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label="位置 pos"
          style={{ flex: 1, accentColor: ORANGE }}
        />
        <span style={{ fontSize: 21, color: outside ? ORANGE : MUTED, whiteSpace: 'nowrap' }}>
          {outside ? `已超出训练长度 ${TRAIN_LEN}` : '训练范围内'}
        </span>
      </label>
    </div>
  );
};
