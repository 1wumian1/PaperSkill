import React, { useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, FONT_SANS, Seg, Tag, approach, useStage } from './dp-kit';
import { computeFlops, getModel, subsetModel } from './dp-flops';
import { TABLE3 } from './dp-data';

// 7.1 Table 3 层位置消融（移植自原版 v7）：固定预算下，第 K 层剪枝能保留的 token 数（按 Eq. (5) 反推，本页外推）。
// 颜色：浅蓝 = 剪枝前的 576 个视觉 token，绿 = 剪枝后保留的视觉 token，灰 = 文本，橙虚线 = 读者选的剪枝层。

const KEPT_BUDGET = [56, 39, 21, 2];
const SUB = [3, 5, 8, 9]; // MMB、MMMU、POPE、SQA
const W = 1472;
const H = 220;

export const DpM7Budget: React.FC<WidgetProps> = () => {
  const [K, setK] = useState(0);
  const [equal, setEqual] = useState(false);
  const model = useMemo(() => subsetModel(getModel('l15-7b'), SUB), []);
  const kept = equal ? 56 : KEPT_BUDGET[K];
  const res = useMemo(() => computeFlops(model, { K, kept: () => kept }), [model, K, kept]);
  const row = TABLE3[K];
  const N = Math.round(model.text.reduce((a, b) => a + b, 0) / model.text.length);
  const T = model.T;
  const ref = useRef<HTMLCanvasElement>(null);
  const anim = useRef({ hv: new Float32Array(T), px: 0, since: 0, key: '', init: false });
  useStage(ref, W, H, (ctx, t, dt) => {
    const a = anim.current;
    const key = K + ':' + kept;
    if (a.key !== key) { a.key = key; a.since = 0; }
    a.since += dt;
    const final = t > 900 || !a.init;
    ctx.clearRect(0, 0, W, H);
    const top = 44, base = H - 36, unit = (base - top) / (N + 576), colW = (W - 8) / T;
    for (let l = 0; l < T; l++) {
      const x = 4 + l * colW, vis = l < K ? 576 : kept, target = vis * unit;
      a.hv[l] = final ? target : a.since > l * 0.012 ? approach(a.hv[l], target, dt, 11) : a.hv[l];
      const ht = N * unit;
      ctx.fillStyle = '#b5bfcd'; ctx.fillRect(x + 2, base - ht, colW - 5, ht);
      if (l >= K && vis < 576) {
        ctx.strokeStyle = 'rgba(39,68,110,0.35)'; ctx.lineWidth = 1.2; ctx.setLineDash([4, 3]);
        ctx.strokeRect(x + 2.5, base - ht - 576 * unit, colW - 6, 576 * unit - a.hv[l]); ctx.setLineDash([]);
      }
      ctx.fillStyle = l < K ? '#9db3d6' : C.green;
      ctx.fillRect(x + 2, base - ht - a.hv[l], colW - 5, Math.max(a.hv[l], vis > 0 ? 2 : 0));
    }
    const pxT = 4 + K * colW;
    a.px = final ? pxT : approach(a.px, pxT, dt, 10);
    a.init = true;
    ctx.strokeStyle = C.orange; ctx.lineWidth = 3; ctx.setLineDash([7, 5]);
    ctx.beginPath(); ctx.moveTo(a.px, 6); ctx.lineTo(a.px, base + 4); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = `700 24px ${FONT_SANS}`; ctx.fillStyle = '#b85620';
    ctx.fillText(K === 0 ? '剪枝：第 1 层之前' : `剪枝：第 ${K} 层之后`, a.px + 10, 30);
    ctx.fillStyle = C.muted; ctx.font = `600 22px ${FONT_SANS}`;
    ctx.fillText('解码层 1 → 32 · 柱高 = 该层处理的 token 数 · 虚框 = 剪掉的部分', 4, H - 6);
    const lg = [{ c: '#9db3d6', s: '剪枝前 576 个' }, { c: C.green, s: '保留的视觉 token' }, { c: '#b5bfcd', s: `文本约 ${N} 个` }];
    let lx = W - 4;
    ctx.textAlign = 'right';
    for (const g of [...lg].reverse()) { ctx.fillStyle = C.ink; ctx.fillText(g.s, lx, H - 6); lx -= ctx.measureText(g.s).width + 10; ctx.fillStyle = g.c; ctx.fillRect(lx - 18, H - 24, 18, 18); lx -= 44; }
    ctx.textAlign = 'left';
  }, [K, kept, N, T]);

  const fb = equal
    ? `每层都留 56 个时复算为 ${res.ratio.toFixed(2)}%。论文没测过这种设置，无法从 Table 3 判断“越早剪越好”。`
    : K === 0
      ? `Layer 0：32 层都只处理 56 个视觉 token，复算 ${res.ratio.toFixed(2)}%，与 Table 3 的 19.61% 一致。`
      : `Layer ${K}：前 ${K} 层处理全部 576 个，之后只能留 ${kept} 个；平均分低 ${(62.34 - row.avg).toFixed(2)}，层位置与保留数混在一起。`;

  return (
    <div className="dp-root dp-m7b">
      <div className="dp-row">
        <Seg label="剪枝层" options={[0, 1, 2, 3].map((k) => ({ value: k, label: `Layer ${k}` }))} value={K} onChange={setK} />
        <label className="dp-check">
          <input type="checkbox" checked={equal} onChange={(e) => setEqual(e.target.checked)} />
          <span>假设保留数相同（都留 56 个）</span>
        </label>
        <span className="dp-split-tags"><Tag kind="paper" /><Tag kind="extrap" /></span>
      </div>
      <canvas ref={ref} className="dp-canvas" style={{ width: W, height: H }} role="img"
        aria-label={`第 ${K} 层剪枝，之后保留 ${kept} 个视觉 token，TFLOP 比例 ${res.ratio.toFixed(2)}%`} />
      <div className="dp-m7b-bottom">
        <div className="dp-glass dp-m7b-table">
          <table className="dp-table">
            <thead><tr><th>Table 3</th><th>TFLOP %</th><th>反推保留</th><th>MMB</th><th>MMMU</th><th>POPE</th><th>SQA</th><th>Avg</th></tr></thead>
            <tbody>
              {TABLE3.map((r) => (
                <tr key={r.layer} className={r.layer === K && !equal ? 'is-on' : ''}>
                  <th>Layer {r.layer}</th><td>{r.ratio.toFixed(2)}</td><td>{KEPT_BUDGET[r.layer]}</td>
                  <td>{r.mmb}</td><td>{r.mmmu}</td><td>{r.pope}</td><td>{r.sqa}</td><td><b>{r.avg}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="dp-m7b-side">
          <div className="dp-readouts2">
            <div className={equal ? 'is-cur' : 'is-good'}><span>之后保留</span><b className="dp-em">{kept}</b></div>
            <div className="is-cur"><span>复算 TFLOP</span><b className="dp-em">{res.ratio.toFixed(2)}%</b></div>
          </div>
          <div className={`dp-fb ${!equal && K === 0 ? 'is-good' : 'is-limit'}`} role="status" aria-live="polite">{fb}</div>
        </div>
      </div>
    </div>
  );
};
