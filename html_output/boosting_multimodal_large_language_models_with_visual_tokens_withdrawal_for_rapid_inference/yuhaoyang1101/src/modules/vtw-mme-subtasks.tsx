import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Feedback, Seg } from './vtw-kit';
import { MME_SUB, TABLE9 } from './vtw-data';

// 10.2 arXiv 附录表 9：MME 14 个子任务，VTW 与原模型的分差（分），同一刻度 ±25 分。
// 下方顺带核对子项之和是否等于表中总分（7B VTW 一行对不上）。
type M = '7b' | '13b' | 'next';
const LIMITS = '论文承认：更复杂的任务可能需要更多层完成信息迁移，FLOPs 节省会相对有限；长回答没有定量评测。';

export function VtwMmeSubtasks(_: WidgetProps) {
  const [model, setModel] = useState<M>('7b');
  const base = TABLE9.find((r) => r.model === model && r.method === 'base')!;
  const vtw = TABLE9.find((r) => r.model === model && r.method === 'vtw')!;
  const diff = vtw.v.map((v, i) => v - base.v[i]);
  const sum = vtw.v.reduce((a, b) => a + b, 0);
  const gap = vtw.total - sum;
  const top = diff
    .map((d, i) => ({ d, i }))
    .filter((x) => x.d !== 0)
    .sort((a, b) => Math.abs(b.d) - Math.abs(a.d))
    .slice(0, 3);
  const zero = 420;
  const sc = 11; // 每分像素
  return (
    <div className="vtw vtw-mme">
      <svg viewBox="0 0 760 622" width={760} height={622} className="vtw-stage" role="img" aria-label={`${base.label}：VTW 与原模型在 14 个 MME 子任务上的分差`}>
        <text x={40} y={34} className="vtw-svg-t is-muted">
          VTW − 原模型（分），{base.label}
        </text>
        {[-20, 0, 20].map((p) => (
          <g key={p}>
            <line x1={zero + p * sc} y1={46} x2={zero + p * sc} y2={578} stroke={p === 0 ? C.ink : C.line} strokeWidth={p === 0 ? 3 : 2} />
            <text x={zero + p * sc} y={610} textAnchor="middle" className="vtw-svg-t is-muted">
              {p > 0 ? `+${p}` : p}
            </text>
          </g>
        ))}
        {MME_SUB.map((name, i) => {
          const y = 52 + i * 37.5;
          const d = diff[i];
          const x = Math.min(zero, zero + d * sc);
          return (
            <g key={name}>
              <text x={zero - 260} y={y + 26} textAnchor="end" className="vtw-svg-t">
                {name}
              </text>
              <rect x={x} y={y + 6} width={Math.max(2, Math.abs(d) * sc)} height={24} rx={4} fill={d < 0 ? C.red : d > 0 ? C.green : C.line} />
              <text x={d < 0 ? zero + 12 : zero - 12} y={y + 27} textAnchor={d < 0 ? 'start' : 'end'} className="vtw-svg-t" fill={C.muted}>
                {d > 0 ? '+' : ''}
                {Number(d.toFixed(2))}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="vtw-mme-side">
        <Seg<M>
          label="模型"
          value={model}
          onChange={setModel}
          options={[
            { value: '7b', label: '7B' },
            { value: '13b', label: '13B' },
            { value: 'next', label: 'NeXT' },
          ]}
        />
        <p>
          子项之和 <b>{sum.toFixed(2)}</b>，表中总分 <b>{vtw.total.toFixed(2)}</b>
        </p>
        <p className={`vtw-em ${Math.abs(gap) > 0.05 ? 'vtw-orange' : 'vtw-green'}`}>{Math.abs(gap) > 0.05 ? `差 ${gap.toFixed(2)}` : '对得上'}</p>
        <Feedback tone={Math.abs(gap) > 0.05 ? 'warn' : 'info'}>
          {Math.abs(gap) > 0.05
            ? '7B 这一行的“名人”和“场景”都是 135.59，疑为误抄；子项之和与总分对不上，原因未知。'
            : model === '13b'
              ? '这一行标为 K = 16，但 TFLOPs 与总分和表 2 的 K = 20 相同，疑为标注笔误。'
              : 'NeXT 这一行只有位置下降（−10）；附录所说的海报、OCR 下降见于 7B 一行。子任务题量小，单次涨跌分不清是方法效应还是波动。'}
        </Feedback>
        <div className="vtw-mme-top">
          <p className="vtw-muted">变化最大的三项（原模型 → VTW）</p>
          {top.map(({ d, i }) => (
            <p key={MME_SUB[i]}>
              {MME_SUB[i]}　{base.v[i]} → {vtw.v[i]}
              <b className={d < 0 ? 'vtw-red' : 'vtw-green'}>
                （{d > 0 ? '+' : ''}
                {Number(d.toFixed(2))}）
              </b>
              {model === '7b' && (MME_SUB[i] === '场景' || MME_SUB[i] === '名人') ? <span className="vtw-orange">疑为误抄</span> : null}
            </p>
          ))}
        </div>
        <p className="vtw-muted">{LIMITS}</p>
      </div>
    </div>
  );
}
