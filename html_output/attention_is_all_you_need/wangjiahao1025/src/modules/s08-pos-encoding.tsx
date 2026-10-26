import React, { useState } from 'react';

const INK = '#21324a';
const MUTED = '#68778f';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const ORANGE = '#f07e47';
const PURPLE = '#7c3aed';
const LINE = '#d7deea';

const D_MODEL = 512;
const DIMS = [
  { i: 0, color: BLUE, label: 'i=0' },
  { i: 4, color: GREEN, label: 'i=4' },
  { i: 8, color: ORANGE, label: 'i=8' },
  { i: 20, color: PURPLE, label: 'i=20' },
];
const MAXPOS = 40;

const pe = (pos: number, i: number) => Math.sin(pos / Math.pow(10000, (2 * i) / D_MODEL));
const wavelength = (i: number) => 2 * Math.PI * Math.pow(10000, (2 * i) / D_MODEL);

/** 位置编码：没有循环结构，也要让模型知道第几拍。 */
export const PosEncoding = () => {
  const [pos, setPos] = useState(12);
  const W = 1280;
  const H = 300;
  const x = (p: number) => 70 + (p / MAXPOS) * (W - 120);
  const y = (v: number) => 150 - v * 100;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16, color: INK }}>
      <div style={{ flex: 1, minHeight: 0, background: '#ffffff', border: `1px solid ${LINE}`, borderRadius: 18, padding: '10px 18px' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label="不同维度的正弦位置编码波形">
          <line x1="70" y1={y(0)} x2={W - 50} y2={y(0)} stroke={LINE} strokeWidth="2" />
          {[0, 10, 20, 30, 40].map((p) => (
            <g key={p}>
              <line x1={x(p)} y1={y(0) - 6} x2={x(p)} y2={y(0) + 8} stroke="#9fb0c8" strokeWidth="2" />
              <text x={x(p)} y={H - 12} textAnchor="middle" fontSize="20" fill={MUTED}>第 {p} 拍</text>
            </g>
          ))}
          {DIMS.map((d) => {
            const pts = Array.from({ length: 161 }).map((_, k) => {
              const p = (k / 160) * MAXPOS;
              return `${x(p).toFixed(1)},${y(pe(p, d.i)).toFixed(1)}`;
            });
            return <polyline key={d.i} points={pts.join(' ')} fill="none" stroke={d.color} strokeWidth="3" opacity="0.85" />;
          })}

          <line x1={x(pos)} y1="26" x2={x(pos)} y2={y(0) + 40} stroke={INK} strokeWidth="3" strokeDasharray="7 6" />
          <line x1={x(pos + 5)} y1="26" x2={x(pos + 5)} y2={y(0) + 40} stroke={ORANGE} strokeWidth="3" strokeDasharray="7 6" opacity="0.6" />
          <text x={x(pos)} y="20" textAnchor="middle" fontSize="22" fill={INK}>pos={pos}</text>
          <text x={x(pos + 5)} y="20" textAnchor="middle" fontSize="22" fill={ORANGE}>pos+5</text>
        </svg>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, background: '#f7f9fc', border: `1px solid ${LINE}`, borderRadius: 16, padding: '12px 20px' }}>
          <div style={{ fontSize: 22, color: PURPLE, fontWeight: 700, marginBottom: 4 }}>
            位置编码 Positional Encoding · PE(pos,2i)=sin(pos/10000^(2i/d_model))，与词嵌入逐元素相加
          </div>
          <div style={{ fontSize: 'var(--ppt-body-text)' }}>
            第 {pos} 拍：{DIMS.map((d) => `${d.label} ${pe(pos, d.i).toFixed(2)}`).join(' · ')}
          </div>
          <div style={{ fontSize: 22, color: MUTED, marginTop: 6 }}>
            偶数维取 sin、奇数维取 cos；波长从 2π 到 10000·2π 按等比排列
          </div>
        </div>
        <div style={{ flex: 1, background: '#ffffff', border: `1px solid ${LINE}`, borderRadius: 16, padding: '12px 20px' }}>
          <div style={{ fontSize: 'var(--ppt-body-text)', color: INK }}>
            当前维度波长：{DIMS.map((d) => `${d.label} ${wavelength(d.i).toFixed(1)}`).join(' · ')}
          </div>
          <div style={{ fontSize: 22, color: MUTED, marginTop: 6 }}>
            小 i 变化快（辨近处），大 i 变化慢（辨远处）
          </div>
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fffaf6', border: '1px solid #f3ddc9', borderRadius: 16, padding: '10px 20px' }}>
        <span style={{ fontSize: 'var(--ppt-body-text)', whiteSpace: 'nowrap' }}>pos = {pos}</span>
        <input
          type="range"
          min={0}
          max={MAXPOS - 5}
          step={1}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label="位置 pos"
          style={{ flex: 1, accentColor: ORANGE }}
        />
        <span style={{ fontSize: 22, color: MUTED }}>固定偏移 5 拍的两条竖线始终只差一个线性变换</span>
      </label>
    </div>
  );
};
