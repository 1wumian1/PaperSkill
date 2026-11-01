import React from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import type { WidgetProps } from './registry';
import { C, TeaCup, clamp, useReducedMotion } from './vtw-kit';
import { omega } from './vtw-data';

// 封面：同一杯茶（同一张图 + 同一个问题），同一个时钟，同一把刻度。
// 左：原模型，32 层都带着 576 个视觉 token；右：VTW，前 16 层完整处理，第 17 层入口撤出。
// 每根竖条 = 一层的计算量，高度按 Eq. (1) 的 Ω(s) 外推（s ≈ 641，撤出后 ≈ 65）。
const N = 32;
const K = 16;
const S_FULL = 641.4;
const S_TEXT = 65.4;
const H = 4096;
const FULL = omega(S_FULL, H);
const TEXT_ONLY = omega(S_TEXT, H) / FULL;

export function VtwCover({ moduleId }: WidgetProps) {
  const { progress, playing } = useCoverPlayback();
  const reduced = useReducedMotion();
  const vtw = moduleId === 'newMethod';
  const p = reduced && !playing ? 1 : progress;
  const layers = clamp((p - 0.04) / 0.76, 0, 1) * N;
  const done = layers >= N - 1e-6;
  const lifted = vtw && layers >= K;
  const lift = vtw ? clamp((layers - K) / 1.5, 0, 1) : 0;
  // 茶色：前十几层快速变深（信息迁移的教学示意），两杯一致
  const tint = 0.15 + 0.7 * clamp(layers / 12, 0, 1);
  let spent = 0;
  for (let l = 0; l < Math.min(layers, N); l++) {
    const frac = Math.min(1, layers - l);
    spent += frac * (vtw && l >= K ? TEXT_ONLY : 1);
  }
  const ratio = (100 * spent) / N;
  const x0 = 236;
  const bw = 12.4;
  const base = 250;
  const hMax = 200;
  return (
    <div className="vtw vtw-cover" style={{ width: 664, height: 380 }}>
      <svg viewBox="0 0 664 300" width={664} height={300} role="img" aria-label={vtw ? `VTW：前 ${K} 层带着茶包（视觉 token），第 ${K + 1} 层起拿出茶包，只剩茶汤（文字 token）继续计算` : '原模型：32 层都带着茶包（视觉 token）计算'}>
        <rect x={0} y={0} width={664} height={290} rx={18} fill={C.bg} />
        <TeaCup x={112} y={250} w={170} tint={tint} bag={lifted ? 'up' : 'in'} lift={lift} steam={p * 20} />
        <text x={x0} y={30} className="vtw-svg-t is-muted">每根竖条 = 一层的计算量</text>
        <line x1={x0 - 4} y1={base} x2={x0 + N * bw} y2={base} stroke={C.line} strokeWidth={2} />
        {Array.from({ length: N }, (_, l) => {
          const on = l < layers;
          const vis = !(vtw && l >= K);
          const h = vis ? hMax : hMax * TEXT_ONLY;
          const tea = vis ? hMax * (1 - TEXT_ONLY) : 0;
          return (
            <g key={l} opacity={on ? 1 : 0.18}>
              <rect x={x0 + l * bw} y={base - h} width={bw - 3} height={h - tea} fill={C.waterLine} />
              {vis && <rect x={x0 + l * bw} y={base - tea} width={bw - 3} height={tea} fill={C.leaf} />}
            </g>
          );
        })}
        {vtw && (
          <g>
            <line x1={x0 + K * bw - 1.5} y1={38} x2={x0 + K * bw - 1.5} y2={base + 6} stroke={C.orange} strokeWidth={3} strokeDasharray="6 5" />
            <text x={x0 + K * bw + 6} y={68} className="vtw-svg-t" fill={C.orange}>
              第 {K + 1} 层入口
            </text>
          </g>
        )}
        <text x={x0} y={base + 32} className="vtw-svg-t is-muted">第 1 层</text>
        <text x={x0 + N * bw} y={base + 32} textAnchor="end" className="vtw-svg-t is-muted">第 32 层</text>
      </svg>
      <div className={`vtw-cover-result ${done ? (vtw ? 'is-ok' : 'is-old') : ''}`}>
        {done
          ? vtw
            ? `茶色不变，计算量约 ${ratio.toFixed(0)}%（Eq. 1 外推）`
            : '32 层都带着视觉 token：计算量 100%'
          : `已算到第 ${Math.max(1, Math.ceil(layers))} 层 · 累计 ${ratio.toFixed(0)}%`}
      </div>
    </div>
  );
}
