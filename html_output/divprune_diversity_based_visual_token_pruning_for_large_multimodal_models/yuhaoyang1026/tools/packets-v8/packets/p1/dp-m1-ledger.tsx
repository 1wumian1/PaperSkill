import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Seg, Tag } from './dp-kit';
import { MODELS, PAPER_OPTS, keepByRatio, layerFlop } from './dp-flops';

// 1.2 token 账本（移植自原版 v7）：序列构成 + 单层计算量三项占比（Eq. (5) 单层项，按代码的 + 号）。
// 文本 / 视觉 token 数来自 tflops.py 的硬编码值（代码事实）；占比为本页计算（公式外推）。
// 三项用同一色相的深浅区分（不承担状态含义）；视觉 token = 蓝，文本 = 灰。

const TERM = ['#27446e', '#5d7fb3', '#a9bddb'];

function Stack({ parts, label }: { parts: { v: number; color: string }[]; label: string }) {
  return (
    <div className="dp-stack" role="img" aria-label={label}>
      {parts.map((p, i) => <span key={i} style={{ flexGrow: p.v, background: p.color }} />)}
    </div>
  );
}

export const DpM1Ledger: React.FC<WidgetProps> = () => {
  const [mid, setMid] = useState(MODELS[0].id);
  const model = MODELS.find((m) => m.id === mid)!;
  const [di, setDi] = useState(0);
  const i = Math.min(di, model.datasets.length - 1);
  const N = model.text[i];
  const M = model.visual[i];
  const kept = keepByRatio(model.r)(M);
  const n = N + M;
  const nn = N + kept;
  const { d, m } = model;
  const parts = (len: number) => {
    const a = 4 * len * d * d, b = 2 * len * len * d, c = 2 * len * d * m;
    const tot = a + b + c;
    return [a / tot, b / tot, c / tot].map((x) => x * 100);
  };
  const full = parts(n);
  const pr = parts(nn);
  const visShare = (M / n) * 100;
  const layerRatio = (layerFlop(nn, d, m, PAPER_OPTS) / layerFlop(n, d, m, PAPER_OPTS)) * 100;
  const rows = [
    { k: '单层计算量 · 不剪枝', len: n, p: full },
    { k: `单层计算量 · 保留 ${kept} 个视觉 token`, len: nn, p: pr },
  ];

  return (
    <div className="dp-root dp-m1l">
      <div className="dp-row">
        <Seg label="模型" options={MODELS.map((x) => ({ value: x.id, label: x.label }))} value={mid} onChange={(v) => { setMid(v); setDi(0); }} />
        <label className="dp-row">
          <span className="dp-muted">数据集</span>
          <select className="dp-select" value={i} onChange={(e) => setDi(Number(e.target.value))}>
            {model.datasets.map((x, k) => <option key={x} value={k}>{x}</option>)}
          </select>
        </label>
      </div>
      <div className="dp-glass dp-m1l-board">
        <div className="dp-m1l-row">
          <div className="dp-m1l-k"><b>序列构成</b><span className="dp-muted">μ = N + M = {n}</span></div>
          <Stack label={`文本 ${N} 个，视觉 ${M} 个`} parts={[{ v: N, color: '#9aa7bb' }, { v: M, color: 'var(--blue)' }]} />
          <div className="dp-m1l-legend">
            <span><i style={{ background: '#9aa7bb' }} />文本 N = {N}</span>
            <span><i style={{ background: 'var(--blue)' }} />视觉 M = {M}</span>
            <b>视觉占 {visShare.toFixed(1)}%</b>
          </div>
        </div>
        {rows.map((row) => (
          <div className="dp-m1l-row" key={row.k}>
            <div className="dp-m1l-k"><b>{row.k}</b><span className="dp-muted">μ = {row.len}</span></div>
            <Stack label={`投影 ${row.p[0].toFixed(1)}%，注意力二次项 ${row.p[1].toFixed(1)}%，前馈 ${row.p[2].toFixed(1)}%`}
              parts={row.p.map((v, j) => ({ v, color: TERM[j] }))} />
            <div className="dp-m1l-legend">
              <span><i style={{ background: TERM[0] }} />4μd² {row.p[0].toFixed(1)}%</span>
              <span><i style={{ background: TERM[1] }} />2μ²d（二次项）{row.p[1].toFixed(1)}%</span>
              <span><i style={{ background: TERM[2] }} />2μdm {row.p[2].toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
      <div className={`dp-fb ${full[1] > 10 ? 'is-limit' : ''}`} role="status" aria-live="polite">
        视觉 token 占序列 <b>{visShare.toFixed(1)}%</b>；保留 {kept} 个后，单层计算量降到 <b>{layerRatio.toFixed(1)}%</b>，
        与 token 数之比 {((nn / n) * 100).toFixed(1)}% 很接近——这个尺度上计算量近似线性于 token 数。
        {full[1] > 10 ? ' 序列更长时二次项占比变大，剪枝收益会略高于线性。' : ''}
      </div>
      <div className="dp-row dp-muted"><Tag kind="code" /> token 数取自 tflops.py <Tag kind="extrap" /> 三项占比为本页计算</div>
    </div>
  );
};
