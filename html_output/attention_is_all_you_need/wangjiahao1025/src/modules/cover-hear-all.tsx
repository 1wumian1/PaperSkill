import React from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';

const MUTED = '#68778f';
const GREEN = '#228d5c';
const BLUE = '#27446e';
const ORANGE = '#f07e47';

const NAMES = ['钢琴', '吉他', '鼓', '人声'];
const CX = 332;
const CY = 158;
const RX = 128;
const RY = 76;

function seat(i: number) {
  const angle = -Math.PI / 2 + (i * Math.PI * 2) / NAMES.length;
  return { x: CX + RX * Math.cos(angle), y: CY + RY * Math.sin(angle) };
}

/** 封面·本文方法：四个人同时演奏，每人按需要分配对其他声部的注意力音量。 */
export const CoverHearAll = () => {
  const { progress } = useCoverPlayback();
  const p = Math.max(0, Math.min(1, progress));
  const weights = [0.42, 0.27, 0.19, 0.12];

  return (
    <svg viewBox="0 0 664 324" width="100%" height="100%" style={{ display: 'block' }} role="img" aria-label="Transformer：四位乐手同时演奏并按权重相互听取">
      <rect x="0" y="0" width="664" height="324" rx="18" fill="#f4faf6" />

      {NAMES.map((_, i) =>
        NAMES.map((__, j) => {
          if (i === j) return null;
          const a = seat(i);
          const b = seat(j);
          const mx = (a.x + b.x) / 2 + (CX - (a.x + b.x) / 2) * 0.4;
          const my = (a.y + b.y) / 2 + (CY - (a.y + b.y) / 2) * 0.4;
          const base = weights[(i + j) % weights.length];
          const active = Math.max(0, Math.sin((p * Math.PI * 2) - i * 0.7)) * base;
          return (
            <path
              key={`${i}-${j}`}
              d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
              stroke={GREEN}
              strokeWidth={1.5 + active * 7}
              fill="none"
              opacity={0.12 + active * 0.7}
            />
          );
        }),
      )}

      <circle cx={CX} cy={CY} r="36" fill="#ffffff" stroke={GREEN} strokeWidth="2.5" />
      {[0, 1, 2, 3].map((i) => {
        const h = 8 + 42 * weights[i] * (0.55 + 0.45 * p);
        return <rect key={i} x={CX - 25 + i * 14} y={CY + 24 - h} width="10" height={h} rx="3" fill={GREEN} opacity={0.9} />;
      })}

      {NAMES.map((name, i) => {
        const s = seat(i);
        const pulse = 0.5 + 0.5 * Math.sin(p * Math.PI * 2 + i);
        return (
          <g key={name}>
            <circle cx={s.x} cy={s.y} r={32 + pulse * 2.5} fill="#ffffff" stroke={GREEN} strokeWidth="2.5" />
            <circle cx={s.x} cy={s.y - 8} r="8" fill={i === 0 ? ORANGE : BLUE} />
            <text x={s.x} y={s.y + 20} textAnchor="middle" fontSize="21" fill={MUTED}>{name}</text>
          </g>
        );
      })}

      <text x={CX} y="24" textAnchor="middle" fontSize="22" fill="#4b6b58">每个人都在听所有人</text>
      <text x="34" y="300" fontSize="26" fill={GREEN}>同时演奏 · 顺序步数 O(1)</text>
      <text x="630" y="300" textAnchor="end" fontSize="26" fill={MUTED}>权重和 = 1</text>
    </svg>
  );
};
