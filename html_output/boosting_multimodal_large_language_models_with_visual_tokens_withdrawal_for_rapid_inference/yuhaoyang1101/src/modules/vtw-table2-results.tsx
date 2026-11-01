import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Feedback, GuessCard, Seg, useGuess, useTween } from './vtw-kit';
import { BENCH, TABLE2, type T2Block } from './vtw-data';

// 9.1 表 2：相对原模型的变化（%）。所有方法、模型共用同一把 −100% 到 +10% 的刻度，
// 小差值靠数值标签读出；数值全部由论文原值现场计算，不随教学控件改变。
type M = T2Block['id'];
type Meth = 'fastv' | 'rand' | 'vtwr' | 'vtw';
const MLABEL: Record<Meth, string> = { fastv: 'FastV', rand: 'Rand', vtwr: 'VTW†', vtw: 'VTW' };
const MCOL: Record<Meth, string> = { fastv: C.purple, rand: C.red, vtwr: C.orange, vtw: C.green };
const BNAME = ['AI2D', 'SQA', 'MMMU', 'MMB', 'POPE', 'MME'];
type Mode = 'look' | 'guess';

export function VtwTable2Results(_: WidgetProps) {
  const [model, setModel] = useState<M>('7b');
  const [meth, setMeth] = useState<Meth>('vtwr');
  const [mode, setMode] = useState<Mode>('look');
  const g = useGuess([
    { q: '7B 的 VTW†（随机层撤出）掉得最多的是哪一项？', answer: 'MMB', explain: 'MMB 从 64.09 降到 55.61（−13.2%），POPE −11.4%。', options: BNAME.map((b) => ({ value: b, label: b })) },
    { q: 'Rand 随机丢 token，哪一项保住了大部分分数？', answer: 'POPE', explain: 'POPE 82.22 对 85.83（−4.2%）；AI2D、MMB、MME 几乎归零。', options: BNAME.map((b) => ({ value: b, label: b })) },
  ]);
  const curMeth: Meth = mode === 'guess' ? (g.i === 0 ? 'vtwr' : 'rand') : meth;
  const curModel: M = mode === 'guess' ? '7b' : model;
  const hidden = mode === 'guess' && g.picked === null;
  const block = TABLE2.find((b) => b.id === curModel)!;
  const base = block.rows.find((r) => r.key === 'base')!.values;
  const row = block.rows.find((r) => r.key === curMeth)!;
  const rel = row.values.map((v, i) => ((v - base[i]) / base[i]) * 100);
  const worst = rel.indexOf(Math.min(...rel));
  const t0 = useTween(rel[0]);
  const t1 = useTween(rel[1]);
  const t2 = useTween(rel[2]);
  const t3 = useTween(rel[3]);
  const t4 = useTween(rel[4]);
  const t5 = useTween(rel[5]);
  const tw = [t0, t1, t2, t3, t4, t5];
  const zeroX = 680;
  const scale = 5.2; // 每 1% 的像素
  const X = (p: number) => zeroX + p * scale;
  return (
    <div className="vtw vtw-t2">
      <svg viewBox="0 0 820 622" width={820} height={622} className="vtw-stage" role="img" aria-label={`${block.model} 的 ${MLABEL[curMeth]} 相对原模型的变化`}>
        <text x={40} y={44} className="vtw-svg-t is-muted">
          {block.model} · {row.label} · 相对原模型的变化
        </text>
        {[-100, -50, 0].map((p) => (
          <g key={p}>
            <line x1={X(p)} y1={64} x2={X(p)} y2={540} stroke={p === 0 ? C.ink : C.line} strokeWidth={p === 0 ? 3 : 2} />
            <text x={X(p)} y={574} textAnchor="middle" className="vtw-svg-t is-muted">
              {p}%
            </text>
          </g>
        ))}
        {BENCH.map((b, i) => {
          const y = 84 + i * 76;
          const v = hidden ? 0 : tw[i];
          const x = Math.min(X(0), X(v));
          const wd = Math.abs(X(v) - X(0));
          return (
            <g key={b}>
              <text x={40} y={y + 34} className={`vtw-svg-t ${i === worst && !hidden ? 'is-b' : ''}`}>
                {BNAME[i]}
              </text>
              <rect x={x} y={y + 6} width={Math.max(wd, 2)} height={40} rx={5} fill={MCOL[curMeth]} opacity={i === worst || hidden ? 1 : 0.7} />
              {!hidden && (
                <text x={v < -20 ? X(v) + 12 : X(0) + 12} y={y + 36} className="vtw-svg-t is-b" fill={v < -20 ? '#fff' : C.ink}>
                  {rel[i] > 0 ? '+' : ''}
                  {rel[i].toFixed(1)}%
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="vtw-t2-side">
        <Seg<Mode>
          label="模式"
          value={mode}
          onChange={(m) => {
            setMode(m);
            g.restart();
          }}
          options={[
            { value: 'look', label: '自己切换' },
            { value: 'guess', label: '先猜（挑战）' },
          ]}
        />
        {mode === 'look' ? (
          <>
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
            <Seg<Meth> label="方法" value={meth} onChange={setMeth} tone="orange" options={(['vtw', 'vtwr', 'rand', 'fastv'] as Meth[]).map((m) => ({ value: m, label: MLABEL[m] }))} />
            <p className="vtw-muted">{row.label} · TFLOPs {row.tflops}</p>
            <Feedback tone={meth === 'vtw' ? 'ok' : meth === 'rand' ? 'bad' : meth === 'vtwr' ? 'warn' : 'info'}>
              {meth === 'vtw'
                ? '六项差值都很小；单次运行、没有置信区间，无法判断零点几分是否超出评测波动。'
                : meth === 'rand'
                  ? '同样的计算量，不分类型地随机丢 token：几乎全面崩溃。'
                  : meth === 'vtwr'
                    ? '随机层撤出：MMB、POPE 明显下降——在哪一层撤也要对。'
                    : 'FastV 第 2 层后剪掉一半视觉 token：POPE 略降，论文认为过早移除加剧幻觉（多个因素同时不同，无法单独归因）。'}
            </Feedback>
            <table className="vtw-table vtw-t2-table">
              <caption>表 2 原始分数</caption>
              <thead>
                <tr>
                  <th />
                  {BNAME.map((b, i) => (
                    <th key={b} className={i === worst && rel[i] < -1 ? 'is-worst' : ''}>
                      {b}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>原模型</th>
                  {base.map((v, i) => (
                    <td key={i}>{v}</td>
                  ))}
                </tr>
                <tr className="is-sel">
                  <th>{MLABEL[meth]}</th>
                  {row.values.map((v, i) => (
                    <td key={i} className={i === worst && rel[i] < -1 ? 'is-worst' : ''}>
                      {v}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </>
        ) : (
          <GuessCard g={g} />
        )}
      </div>
    </div>
  );
}
