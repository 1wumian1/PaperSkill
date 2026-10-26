import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Seg, Tag } from './dp-kit';
import { FIG1_COLS, RESULT_TABLES, TABLE4 } from './dp-data';
import { methodColor } from './dp-method-colors';

// 10.2 公平性检查（移植自原版 v7）：
//  A. MMB/MMMU/POPE/SQA 上把 Table 1 的 FastV（K=3，之后约保留 1 个）、Table 4 的随机（Layer 0 保留 56 个）和 DivPrune 放在一起。
//  B. Fig. 1 纵轴的平均方式：直接平均（论文口径）vs CIDEr 先除以原模型值（本页外推）。

const T1 = RESULT_TABLES[0];
const COLS4 = [
  { name: 'MMB', t1: 3, t4: 'mmb' as const },
  { name: 'MMMU', t1: 5, t4: 'mmmu' as const },
  { name: 'POPE', t1: 8, t4: 'pope' as const },
  { name: 'SQA', t1: 9, t4: 'sqa' as const },
];
type Col = (typeof COLS4)[number];

export const DpM10Fairness: React.FC<WidgetProps> = () => {
  const [part, setPart] = useState<'a' | 'b'>('a');
  const [norm, setNorm] = useState(false);
  const orig = T1.rows[0];
  const fastv = T1.rows.find((r) => r.method === 'FastV')!;
  const ours = T1.rows.find((r) => r.method === 'DivPrune')!;
  const rand = TABLE4.find((r) => r.id === 'random')!;
  const series = [
    { name: '原模型', desc: 'Table 1 · 100%', get: (c: Col) => orig.values[c.t1]! },
    { name: 'FastV', desc: 'Table 1 · K = 3 后约留 1 个', get: (c: Col) => fastv.values[c.t1]! },
    { name: '随机', desc: 'Table 4 · Layer 0 留 56 个', get: (c: Col) => rand[c.t4] },
    { name: 'DivPrune', desc: 'Table 1 / 4 · 留 56 个', get: (c: Col) => ours.values[c.t1]! },
  ];
  const avg = (f: (c: Col) => number) => COLS4.reduce((a, c) => a + f(c), 0) / COLS4.length;
  const [aO, aF, aR, aD] = series.map((s) => avg(s.get));
  const methods = T1.rows.filter((r) => ['原模型', 'M³•', 'DivPrune', 'FitPrune△', 'FastV', 'VTW'].includes(r.method));
  const cocoOrig = orig.values[0]!;
  const fig1 = methods.map((r) => {
    const [coco, okvqa, pope, mmb] = FIG1_COLS.map((i) => r.values[i]!);
    const c = norm ? coco / cocoOrig : coco;
    return { method: r.method, tflop: r.tflop, v: (c + okvqa / 100 + pope / 100 + mmb / 100) / 4 };
  }).sort((a, b) => b.v - a.v);

  return (
    <div className="dp-root dp-m10">
      <div className="dp-row">
        <Seg label="检查项" options={[{ value: 'a', label: 'A · FastV 输在哪里' }, { value: 'b', label: 'B · Fig. 1 的平均方式' }]} value={part} onChange={setPart} />
        {part === 'b' ? <Seg label="平均方式" options={[{ value: 0, label: '直接平均（论文）' }, { value: 1, label: 'CIDEr ÷ 原模型值' }]} value={norm ? 1 : 0} onChange={(v) => setNorm(v === 1)} /> : null}
        <span className="dp-split-tags"><Tag kind="paper" />{part === 'b' && norm ? <Tag kind="extrap" /> : null}</span>
      </div>
      {part === 'a' ? (
        <div className="dp-m10-body">
          <div className="dp-glass dp-gbars" role="img" aria-label="四个数据集上原模型、FastV、随机、DivPrune 的分数">
            {COLS4.map((c) => (
              <div className="dp-gbars-group" key={c.name}>
                <div className="dp-gbars-bars">
                  {series.map((s) => (
                    <div className="dp-gb" key={s.name}>
                      <span>{s.get(c).toFixed(1)}</span>
                      <i style={{ height: `${s.get(c) * 2.6}px`, background: methodColor(s.name) }} />
                    </div>
                  ))}
                </div>
                <b>{c.name}</b>
              </div>
            ))}
          </div>
          <div className="dp-m10-side">
            <ul className="dp-legend">
              {series.map((s) => <li key={s.name}><i style={{ background: methodColor(s.name) }} /><b>{s.name}</b> {s.desc}</li>)}
            </ul>
            <div className="dp-fb is-limit">
              四项平均：FastV {aF.toFixed(1)}，随机 {aR.toFixed(1)}，DivPrune {aD.toFixed(1)}（原模型 {aO.toFixed(1)}）。随机挑 56 个已比 FastV 高 {(aR - aF).toFixed(1)} 分，DivPrune 只再高 {(aD - aR).toFixed(1)}——极端配置放大了 FastV 的差距；跨表比较只能作提示。
            </div>
          </div>
        </div>
      ) : (
        <div className="dp-m10-body">
          <div className="dp-glass dp-bars">
            {fig1.map((r, i) => (
              <div className={`dp-bar is-rank ${r.method === 'DivPrune' ? 'is-ours' : ''}`} key={r.method}>
                <span className="dp-bar-i">{i + 1}</span>
                <span className="dp-bar-k"><i style={{ background: methodColor(r.method) }} />{r.method}</span>
                <span className="dp-bar-t">{r.tflop}</span>
                <i className="dp-bar-track"><s style={{ transform: `scaleX(${r.v / 0.85})`, background: methodColor(r.method) }} /></i>
                <b>{r.v.toFixed(3)}</b>
              </div>
            ))}
          </div>
          <div className="dp-m10-side">
            <div className="dp-muted">纵轴 = COCO CIDEr、OKVQA、POPE、MMB 的平均（后三项 ÷ 100），数值按 Table 1 复算</div>
            <div className="dp-fb">
              {norm
                ? 'CIDEr 先除以原模型值（1.10）再平均：所有方法略下移，排序不变——结论对平均方式不敏感。'
                : 'CIDEr 可超过 1，与三个 0–1 分数直接平均，权重偏大。复算原模型 0.783、DivPrune 0.721，与 Fig. 1 读图一致（目测）。'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
