import React, { useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { Btn, C, FONT_MONO, FONT_SANS, Tag, useStage } from './dp-kit';
import { bruteBest, euclidOf, greedyMaxMin, makeUniform, minPair } from './dp-maxmin';

// 5.2 贪心（Algorithm 1）vs 穷举（移植自原版 v7）：12 个随机点选 4 个。
// 颜色：绿 = 贪心选中（DivPrune 的算法）；蓝虚线 = 穷举最优（参照）；黄 = 贪心不是最优（证据边界）。

const N = 12;
const K = 4;
const AR = 1.6;
const W = 760;
const H = 546;

function solve(seed: number) {
  const pts = makeUniform(seed, N, 0.06);
  const d = euclidOf(pts.map((p) => ({ ...p, x: p.x * AR })));
  const g = greedyMaxMin(N, K, d);
  const gv = minPair(g, d);
  const b = bruteBest(N, K, d);
  const bv = minPair(b.set, d);
  return { pts, g, gv, b: b.set, bv, ratio: gv.v / b.v };
}
const BINS = [{ lo: 0, hi: 0.7, l: '<70%' }, { lo: 0.7, hi: 0.8, l: '70–80' }, { lo: 0.8, hi: 0.9, l: '80–90' }, { lo: 0.9, hi: 0.999, l: '90–99' }, { lo: 0.999, hi: 9, l: '最优' }];

export const DpM5Exact: React.FC<WidgetProps> = () => {
  const [seed, setSeed] = useState(1);
  const [searchMsg, setSearchMsg] = useState<string | null>(null);
  const res = useMemo(() => solve(seed), [seed]);
  const batch = useMemo(() => {
    const ratios: number[] = [];
    for (let s = 1000; s < 1200; s++) ratios.push(solve(s).ratio);
    return {
      optimal: ratios.filter((r) => r > 0.999).length,
      worst: Math.min(...ratios),
      mean: ratios.reduce((a, b) => a + b, 0) / ratios.length,
      bins: BINS.map((b) => ({ ...b, n: ratios.filter((r) => r >= b.lo && r < b.hi).length })),
    };
  }, []);
  const ref = useRef<HTMLCanvasElement>(null);
  useStage(ref, W, H, (ctx) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.86)';
    ctx.beginPath(); ctx.roundRect(0, 0, W, H, 18); ctx.fill();
    const top = 60;
    const sc = Math.min((W - 60) / AR, H - top - 30);
    const ox = (W - sc * AR) / 2, oy = top;
    const P = (i: number) => ({ x: ox + res.pts[i].x * AR * sc, y: oy + res.pts[i].y * sc });
    const line = (a: number, b: number, color: string, dash: number[], wd: number) => {
      const p = P(a), q = P(b);
      ctx.strokeStyle = color; ctx.lineWidth = wd; ctx.setLineDash(dash);
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); ctx.setLineDash([]);
    };
    line(res.bv.a, res.bv.b, C.blue, [9, 6], 3.5);
    line(res.gv.a, res.gv.b, C.green, [], 5);
    for (let i = 0; i < N; i++) {
      const p = P(i), inG = res.g.includes(i), inB = res.b.includes(i);
      if (inB) { ctx.strokeStyle = C.blue; ctx.lineWidth = 3; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.arc(p.x, p.y, 26, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
      ctx.beginPath(); ctx.arc(p.x, p.y, inG ? 16 : 8, 0, Math.PI * 2);
      ctx.fillStyle = inG ? C.green : '#fff'; ctx.strokeStyle = inG ? '#17663f' : C.muted; ctx.lineWidth = 2;
      ctx.fill(); ctx.stroke();
      if (inG) { ctx.fillStyle = '#fff'; ctx.font = `800 20px ${FONT_SANS}`; ctx.textAlign = 'center'; ctx.fillText(String(res.g.indexOf(i) + 1), p.x, p.y + 7); ctx.textAlign = 'left'; }
    }
    ctx.font = `600 24px ${FONT_SANS}`; ctx.textBaseline = 'middle';
    ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(30, 30, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.ink; ctx.fillText('贪心选中（编号 = 顺序）', 50, 30);
    ctx.strokeStyle = C.blue; ctx.lineWidth = 3; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.arc(358, 30, 13, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillText('穷举最优', 382, 30);
    ctx.font = `600 22px ${FONT_MONO}`; ctx.fillStyle = C.muted; ctx.textAlign = 'right'; ctx.fillText(`seed ${seed}`, W - 20, 30);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }, [res, seed]);

  const findCounter = () => {
    for (let s = seed + 1; s < seed + 400; s++) {
      if (solve(s).ratio < 0.999) { setSeed(s); setSearchMsg(`seed ${s} 是往后第一个反例：`); return; }
    }
    setSearchMsg('往后 400 组都恰好最优，换个起点再试。');
  };
  const opt = res.ratio > 0.999;
  const maxBin = Math.max(...batch.bins.map((b) => b.n));

  return (
    <div className="dp-root">
      <div className="dp-split-top">
        <span className="dp-h">贪心一定能找到 Eq. (3) 的最优解吗？</span>
        <span className="dp-split-tags"><Tag kind="demo" /><Tag kind="extrap" /></span>
      </div>
      <canvas ref={ref} className="dp-canvas dp-split-cv" style={{ width: W, height: H }} role="img"
        aria-label={`贪心得分 ${res.gv.v.toFixed(3)}，穷举最优 ${res.bv.v.toFixed(3)}`} />
      <div className="dp-glass dp-split-panel">
        <div className="dp-readouts2 is-3">
          <div className="is-good"><span>贪心</span><b className="dp-em">{res.gv.v.toFixed(3)}</b></div>
          <div className="is-cur"><span>穷举最优</span><b className="dp-em">{res.bv.v.toFixed(3)}</b></div>
          <div className={opt ? 'is-good' : 'is-limit'}><span>贪心 / 最优</span><b className="dp-em">{(res.ratio * 100).toFixed(1)}%</b></div>
        </div>
        <div className="dp-row">
          <Btn onClick={() => { setSearchMsg(null); setSeed((s) => s + 1); }}>换一组点</Btn>
          <Btn primary onClick={findCounter}>找一个反例</Btn>
        </div>
        <div className="dp-hist" role="img" aria-label={`200 组随机点中贪心恰好最优 ${batch.optimal} 组`}>
          <div>200 组：平均 <b>{(batch.mean * 100).toFixed(1)}%</b> · 最差 <b>{(batch.worst * 100).toFixed(1)}%</b></div>
          <div className="dp-hist-bars">
            {batch.bins.map((b) => (
              <div key={b.l} className={b.lo === 0.999 ? 'is-good' : ''}>
                <span className="dp-hist-n">{b.n}</span>
                <i style={{ height: `${(b.n / maxBin) * 40 + 4}px` }} />
                <span>{b.l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={`dp-fb ${opt ? 'is-good' : 'is-limit'}`} role="status" aria-live="polite">
          {searchMsg
            ? `${searchMsg}贪心只达到最优的 ${(res.ratio * 100).toFixed(1)}%。`
            : opt ? '这一组贪心恰好最优——但这不是必然的。' : `这一组只达到最优的 ${(res.ratio * 100).toFixed(1)}%：每步只看眼前，没有回头调整。`}
        </div>
      </div>
    </div>
  );
};
