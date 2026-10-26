import React from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';

const INK = '#21324a';
const MUTED = '#68778f';
const RED = '#c43f52';
const BLUE = '#27446e';
const ORANGE = '#f07e47';

const NAMES = ['钢琴', '吉他', '鼓', '人声'];

/** 封面·旧方法：四个人排成一列依次口述旋律，必须等前一位说完。 */
export const CoverRelay = () => {
  const { progress } = useCoverPlayback();
  const p = Math.max(0, Math.min(1, progress));
  const active = Math.min(NAMES.length - 1, Math.floor(p * NAMES.length));
  const passed = active;

  return (
    <svg viewBox="0 0 664 324" width="100%" height="100%" style={{ display: 'block' }} role="img" aria-label="循环网络：四位乐手依次接力传递旋律">
      <rect x="0" y="0" width="664" height="324" rx="18" fill="#fbf7f2" />
      {[0, 1, 2].map((i) => (
        <line key={i} x1="40" y1={96 + i * 18} x2="624" y2={96 + i * 18} stroke="#e6dccf" strokeWidth="1.5" />
      ))}

      {NAMES.map((name, i) => {
        const x = 92 + i * 160;
        const isActive = i === active;
        const isPassed = i < active;
        const clarity = Math.pow(0.78, i);
        return (
          <g key={name}>
            <circle cx={x} cy={196} r="34" fill={isActive ? BLUE : isPassed ? '#e9edf4' : '#ffffff'} stroke={isActive ? BLUE : '#cbd4e1'} strokeWidth="2" />
            <circle cx={x} cy={196} r="10" fill={isActive ? '#ffffff' : isPassed ? '#c3ccda' : ORANGE} opacity={isActive ? 0.9 : 1} />
            <text x={x} y={252} textAnchor="middle" fontSize="28" fill={isActive ? BLUE : MUTED}>{name}</text>

            {[0, 1, 2].map((k) => (
              <circle
                key={k}
                cx={x - 22 + k * 22}
                cy={96 + k * 18}
                r="6"
                fill={isPassed ? RED : BLUE}
                opacity={(isPassed ? 0.35 : 0.85) * clarity}
              />
            ))}

            {i < NAMES.length - 1 && (
              <g opacity={i < passed ? 0.9 : 0.18}>
                <line x1={x + 36} y1={196} x2={x + 122} y2={196} stroke={i < passed ? RED : '#cbd4e1'} strokeWidth="3" strokeDasharray="8 7" />
                <polygon points={`${x + 122},196 ${x + 110},190 ${x + 110},202`} fill={i < passed ? RED : '#cbd4e1'} />
                <text x={x + 79} y={180} textAnchor="middle" fontSize="22" fill={i < passed ? RED : MUTED}>口述</text>
              </g>
            )}
          </g>
        );
      })}

      <text x="40" y="296" fontSize="26" fill={RED}>
        顺序步数 {passed} / 3 · 队尾保真度 {(Math.pow(0.78, 3) * 100).toFixed(0)}%
      </text>
      <text x="624" y="296" textAnchor="end" fontSize="26" fill={MUTED}>第 {Math.min(4, active + 1)} 位才能开始</text>
    </svg>
  );
};
