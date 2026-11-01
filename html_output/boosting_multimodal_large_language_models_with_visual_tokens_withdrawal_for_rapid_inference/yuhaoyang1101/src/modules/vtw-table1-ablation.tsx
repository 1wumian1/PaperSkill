import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Feedback, GuessCard, Seg, TeaCup, useGuess, useTween } from './vtw-kit';
import { TABLE1 } from './vtw-data';

// 4.2 表 1 消融（LLaVA-1.5-7B，MME 总分，单次运行）：柱状图数值即论文原值，不随任何控件改变。
// 三只茶杯对应三种条件：(a) 不放茶包；(b) 前 16 层放一包“假茶包”（无内容白图）再拿出；(c) 前 16 层放真茶包再拿出。
type Key = 'base' | 'a' | 'b' | 'c';
type Mode = 'guess' | 'look';
const CUPS: { key: Exclude<Key, 'base'>; label: string; tint: number; bag: 'none' | 'up'; fake?: boolean }[] = [
  { key: 'a', label: '(a) 不给图', tint: 0.04, bag: 'none' },
  { key: 'b', label: '(b) 前 16 层给白图', tint: 0.75, bag: 'up', fake: true },
  { key: 'c', label: '(c) 前 16 层给原图', tint: 0.82, bag: 'up' },
];
const EXPLAIN: Record<Key, string> = {
  base: '原模型：32 层都带着原图，MME 总分 1866.10。',
  a: '完全不给图，只靠问题作答：970.89。',
  b: '前 16 层给白图再撤出：845.39，比不给图还低 125.50——写进文字 token 的“错误图像信息”撤出后仍在起作用。',
  c: '前 16 层给原图再撤出：1872.43，与原模型相近（单次运行，差 6.33 分无法判断是否超出评测波动）。',
};

export function VtwTable1Ablation(_: WidgetProps) {
  const [mode, setMode] = useState<Mode>('guess');
  const [sel, setSel] = useState<Key>('b');
  const g = useGuess([
    {
      q: '三种做法里，哪一种的 MME 总分最低？',
      answer: 'b' as Key,
      explain: '白图比不给图还低。',
      options: [
        { value: 'a' as Key, label: '(a) 不给图' },
        { value: 'b' as Key, label: '(b) 白图' },
        { value: 'c' as Key, label: '(c) 原图' },
      ],
    },
  ]);
  const reveal = mode === 'look' || g.picked !== null;
  const score = (k: Key) => TABLE1.find((r) => r.key === k)!.score;
  const grow = useTween(reveal ? 1 : 0, 700);
  const x0 = 200;
  const W = 600;
  const maxV = 2000;
  return (
    <div className="vtw vtw-t1">
      <svg viewBox="0 0 900 622" width={900} height={622} className="vtw-stage" role="group" aria-label="表 1 的三种条件与 MME 总分">
        {CUPS.map((c, i) => (
          <g
            key={c.key}
            className="vtw-hit"
            role="button"
            tabIndex={0}
            aria-label={`查看 ${c.label}`}
            onClick={() => setSel(c.key)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSel(c.key);
              }
            }}
          >
            <rect x={20 + i * 290} y={10} width={280} height={276} rx={16} fill={sel === c.key ? '#fff' : 'transparent'} stroke={sel === c.key ? C.blue : 'transparent'} strokeWidth={4} />
            <TeaCup x={160 + i * 290} y={222} w={150} tint={c.tint} bag={c.bag} fake={c.fake} />
            <text x={160 + i * 290} y={268} textAnchor="middle" className="vtw-svg-t is-b">
              {c.label}
            </text>
          </g>
        ))}
        <text x={20} y={318} className="vtw-svg-t is-muted">
          MME 总分（满分 2800，LLaVA-1.5-7B）
        </text>
        {(['base', 'a', 'b', 'c'] as Key[]).map((k, i) => {
          const y = 340 + i * 66;
          const v = score(k);
          const w = (W * v) / maxV;
          const shown = k === 'base' || reveal;
          const col = k === 'b' ? C.red : k === 'c' ? C.green : k === 'base' ? C.blue : C.envDark;
          return (
            <g key={k} opacity={sel === k || k === 'base' || !reveal ? 1 : 0.55}>
              <text x={x0 - 16} y={y + 36} textAnchor="end" className="vtw-svg-t">
                {k === 'base' ? '原模型' : `(${k})`}
              </text>
              <rect x={x0} y={y + 8} width={shown ? w * (k === 'base' ? 1 : grow) : 0} height={40} rx={6} fill={col} />
              {!shown && <rect x={x0} y={y + 8} width={W * 0.5} height={40} rx={6} fill="none" stroke={C.line} strokeWidth={3} strokeDasharray="10 8" />}
              {shown && (
                <text x={x0 + w * (k === 'base' ? 1 : grow) + 12} y={y + 38} className="vtw-svg-t is-b">
                  {v.toFixed(2)}
                </text>
              )}
            </g>
          );
        })}
        <line x1={x0} y1={336} x2={x0} y2={604} stroke={C.ink} strokeWidth={2} />
      </svg>
      <div className="vtw-t1-side">
        <Seg<Mode>
          label="模式"
          value={mode}
          onChange={(m) => {
            setMode(m);
            g.restart();
          }}
          options={[
            { value: 'guess', label: '先猜（挑战）' },
            { value: 'look', label: '直接看数' },
          ]}
        />
        {mode === 'guess' && <GuessCard g={g} />}
        {reveal && <Feedback tone={sel === 'b' ? 'bad' : sel === 'c' ? 'ok' : 'info'}>{EXPLAIN[sel]}</Feedback>}
        {mode === 'look' && <p className="vtw-muted">点左边的茶杯，切换要解读的条件。</p>}
      </div>
    </div>
  );
}
