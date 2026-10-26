import React, { useState } from 'react';

const INK = '#21324a';
const MUTED = '#68778f';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#f07e47';
const LINE = '#d7deea';

const D = 512;
const NMINS = 64;
const NMAX = 4096;
const YMIN = 1e5;
const YMAX = 2e10;

const selfCost = (n: number) => n * n * D;
const rnnCost = (n: number) => n * D * D;

/** 适用范围：n² 代价与路径优势的取舍。 */
export const Limits = () => {
  const [n, setN] = useState(512);
  const W = 900;
  const H = 320;
  const lx = (v: number) => 80 + ((Math.log10(v) - Math.log10(NMINS)) / (Math.log10(NMAX) - Math.log10(NMINS))) * (W - 140);
  const ly = (v: number) => 270 - ((Math.log10(v) - Math.log10(YMIN)) / (Math.log10(YMAX) - Math.log10(YMIN))) * 220;

  const curve = (f: (n: number) => number) =>
    Array.from({ length: 120 })
      .map((_, k) => {
        const v = Math.pow(10, Math.log10(NMINS) + (k / 119) * (Math.log10(NMAX) - Math.log10(NMINS)));
        return `${lx(v).toFixed(1)},${ly(f(v)).toFixed(1)}`;
      })
      .join(' ');

  const faster = n <= D;

  return (
    <div style={{ height: '100%', display: 'flex', gap: 24, color: INK }}>
      <div style={{ flex: '1 1 58%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ flex: 1, minHeight: 0, background: '#ffffff', border: `1px solid ${LINE}`, borderRadius: 18, padding: '10px 16px' }}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label="自注意力与循环层每层计算量随序列长度的变化">
            <line x1="80" y1="270" x2={W - 50} y2="270" stroke="#9fb0c8" strokeWidth="2" />
            {[64, 128, 512, 2048, 4096].map((v) => (
              <g key={v}>
                <line x1={lx(v)} y1="266" x2={lx(v)} y2="276" stroke="#9fb0c8" strokeWidth="2" />
                <text x={lx(v)} y="296" textAnchor="middle" fontSize="20" fill={MUTED}>{v}</text>
              </g>
            ))}
            <polyline points={curve(selfCost)} fill="none" stroke={BLUE} strokeWidth="4" />
            <polyline points={curve(rnnCost)} fill="none" stroke={RED} strokeWidth="4" strokeDasharray="10 6" />
            <line x1={lx(D)} y1="40" x2={lx(D)} y2="270" stroke={ORANGE} strokeWidth="2" strokeDasharray="5 5" />
            <text x={lx(D)} y="34" textAnchor="middle" fontSize="20" fill={ORANGE}>n = d = 512</text>

            <circle cx={lx(n)} cy={ly(selfCost(n))} r="8" fill={BLUE} />
            <circle cx={lx(n)} cy={ly(rnnCost(n))} r="8" fill={RED} />
            <text x={lx(n)} y={ly(selfCost(n)) - 16} textAnchor="middle" fontSize="20" fill={BLUE}>自注意力</text>
            <text x={lx(n)} y={ly(rnnCost(n)) + 28} textAnchor="middle" fontSize="20" fill={RED}>循环层</text>
          </svg>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#f7f9fc', border: `1px solid ${LINE}`, borderRadius: 16, padding: '10px 20px' }}>
          <span style={{ fontSize: 'var(--ppt-body-text)', whiteSpace: 'nowrap' }}>n = {n}</span>
          <input
            type="range"
            min={Math.log2(NMINS)}
            max={Math.log2(NMAX)}
            step={0.25}
            value={Math.log2(n)}
            onChange={(e) => setN(Math.round(Math.pow(2, Number(e.target.value))))}
            aria-label="序列长度"
            style={{ flex: 1, accentColor: BLUE }}
          />
          <span style={{ fontSize: 'var(--ppt-body-text)', color: faster ? GREEN : RED }}>
            {faster ? '自注意力每层更省' : '循环层每层更省'}
          </span>
        </label>
      </div>

      <div style={{ flex: '1 1 42%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: '#ffffff', border: `1px solid ${LINE}`, borderRadius: 16, padding: '14px 20px' }}>
          <div style={{ fontSize: 'var(--ppt-body-text)' }}>
            每层计算：自注意力 <strong style={{ color: BLUE }}>{(selfCost(n) / 1e6).toFixed(1)}M</strong>
            {' vs '}循环 <strong style={{ color: RED }}>{(rnnCost(n) / 1e6).toFixed(1)}M</strong>
          </div>
          <div style={{ fontSize: 22, color: MUTED, marginTop: 6 }}>按 O(n²·d) 与 O(n·d²)、d=512 计算</div>
        </div>

        {[
          { t: '效率只在 n < d 时占优', d: '序列一长，n² 项反超；论文也指出可用受限自注意力把路径长度换成 O(n/r)。' },
          { t: '可解释性是定性观察', d: '附录图 3–5 只说明部分头呈现与句法、指代相关的行为，不等于因果解释。' },
          { t: '数值需注明出处', d: 'EN-FR big 在 Table 2 为 41.8，正文 §6.1 写作 41.0，引用时要说明。' },
        ].map((b) => (
          <div key={b.t} style={{ flex: 1, background: '#f7f9fc', border: `1px solid ${LINE}`, borderRadius: 16, padding: '12px 20px' }}>
            <div style={{ fontSize: 'var(--ppt-body-heading)', color: BLUE }}>{b.t}</div>
            <div style={{ fontSize: 24, color: MUTED, marginTop: 4 }}>{b.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
