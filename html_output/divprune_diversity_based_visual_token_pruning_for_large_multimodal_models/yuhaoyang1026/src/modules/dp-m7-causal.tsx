import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { Btn, C, FONT_SANS, Seg, Tag, useInView, useStage } from './dp-kit';

// 7.2 因果注意力示意（移植自原版 v7）：位置 = [前缀 2][视觉 8][问题 4]，5 层。
// 第 ℓ 层每个位置只汇聚“自己及之前、且在该层仍存在”的位置的信息；在第 K 层之后剪枝。
// 颜色：绿 = 来自保留 token 的信息，浅蓝 = 来自被剪 token 的信息，橙虚线 = 读者选的剪枝位置。

const P = 2, V = 8, Q = 4, L = 5;
const KEEP = new Set([1, 4, 6]);
const TOK = [...Array(P).fill('p'), ...Array(V).fill('v'), ...Array(Q).fill('q')] as ('p' | 'v' | 'q')[];
const W = 1472;
const H = 370;
const PRUNED_C = '#7f9ccc';

function simulate(K: number) {
  const n = TOK.length;
  const alive = (l: number, pos: number) => TOK[pos] !== 'v' || l === 0 || l <= K || KEEP.has(pos - P);
  const info: number[][] = [TOK.map((t, pos) => (t === 'v' ? 1 << (pos - P) : 0))];
  for (let l = 1; l <= L; l++) {
    const row: number[] = [];
    for (let pos = 0; pos < n; pos++) {
      if (!alive(l, pos)) { row.push(-1); continue; }
      let m = 0;
      for (let q = 0; q <= pos; q++) if (alive(l, q) && info[l - 1][q] >= 0) m |= info[l - 1][q];
      row.push(m);
    }
    info.push(row);
  }
  return { info, alive };
}
const popcount = (m: number) => { let c = 0; for (let i = 0; i < V; i++) if (m & (1 << i)) c++; return c; };

export const DpM7Causal: React.FC<WidgetProps> = () => {
  const [K, setK] = useState(0);
  const [shown, setShown] = useState(L);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<'slow' | 'mid' | 'fast'>('mid');
  const ref = useRef<HTMLCanvasElement>(null);
  const inView = useInView(ref, '0px');
  const sim = useMemo(() => simulate(K), [K]);
  useEffect(() => {
    if (!playing || !inView) return;
    if (shown >= L) { setPlaying(false); return; }
    // 每层停留时间按所选速度；滚出视口时暂停
    const id = window.setTimeout(() => setShown((s) => s + 1), { slow: 1600, mid: 1000, fast: 500 }[speed]);
    return () => window.clearTimeout(id);
  }, [playing, shown, inView, speed]);

  useStage(ref, W, H, (ctx) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.86)';
    ctx.beginPath(); ctx.roundRect(0, 0, W, H, 18); ctx.fill();
    const left = 120, cell = 44, step = 54;
    const rowY = (l: number) => H - 44 - (l + 1) * cell - l * (step - cell);
    const colX = (pos: number) => left + pos * ((W - left - 20) / TOK.length);
    const cw = (W - left - 20) / TOK.length - 8;
    ctx.font = `700 24px ${FONT_SANS}`; ctx.fillStyle = C.muted;
    for (let l = 0; l <= L; l++) ctx.fillText(l === 0 ? '输入' : `第 ${l} 层`, 16, rowY(l) + cell * 0.62);
    const ky = rowY(K) - (step - cell) / 2 - 1;
    ctx.strokeStyle = C.orange; ctx.setLineDash([8, 6]); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(left - 8, ky); ctx.lineTo(W - 12, ky); ctx.stroke(); ctx.setLineDash([]);
    const cur = Math.min(shown, L);
    if (cur >= 1) {
      const target = TOK.length - 1, tx = colX(target) + cw / 2, ty = rowY(cur) + cell;
      for (let q = 0; q < TOK.length; q++) {
        if (!sim.alive(cur, q) || sim.info[cur - 1][q] < 0) continue;
        const sx = colX(q) + cw / 2, sy = rowY(cur - 1) + cell / 2;
        ctx.strokeStyle = TOK[q] === 'v' ? 'rgba(39,68,110,0.35)' : 'rgba(33,50,74,0.15)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo((sx + tx) / 2, sy - cell * 0.4, tx, ty); ctx.stroke();
      }
    }
    for (let l = 0; l <= cur; l++) {
      for (let pos = 0; pos < TOK.length; pos++) {
        const x = colX(pos), y = rowY(l), m = sim.info[l][pos], t = TOK[pos];
        if (m < 0) { ctx.strokeStyle = C.line; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5; ctx.strokeRect(x + 0.5, y + 0.5, cw, cell); ctx.setLineDash([]); continue; }
        ctx.fillStyle = t === 'p' ? '#e3e7f0' : t === 'v' ? (KEEP.has(pos - P) ? 'rgba(34,141,92,0.16)' : 'rgba(127,156,204,0.2)') : '#f4f6fb';
        ctx.fillRect(x, y, cw, cell);
        ctx.strokeStyle = t === 'q' ? C.ink : C.line; ctx.lineWidth = t === 'q' ? 2 : 1.5;
        ctx.strokeRect(x + 0.5, y + 0.5, cw, cell);
        if (t !== 'p') {
          const dot = 12;
          for (let i = 0; i < V; i++) {
            if (!(m & (1 << i))) continue;
            ctx.fillStyle = KEEP.has(i) ? C.green : PRUNED_C;
            ctx.fillRect(x + 8 + (i % 4) * (dot + 4), y + 7 + Math.floor(i / 4) * (dot + 6), dot, dot);
          }
        }
      }
    }
    ctx.font = `700 24px ${FONT_SANS}`; ctx.fillStyle = C.ink;
    ctx.fillText('前缀', colX(0) + 4, H - 12);
    ctx.fillText('视觉 token（绿底 = 保留）', colX(P) + 4, H - 12);
    ctx.fillText('问题', colX(P + V) + 4, H - 12);
  }, [sim, shown, K]);

  const q = sim.info[L][TOK.length - 1];
  const got = popcount(q);
  const fromPruned = popcount(q & ~[...KEEP].reduce((a, i) => a | (1 << i), 0));

  return (
    <div className="dp-root dp-m7c">
      <div className="dp-row">
        <Seg label="剪枝位置" options={[{ value: 0, label: 'Layer 0（进入前）' }, { value: 2, label: '第 2 层之后' }, { value: 4, label: '第 4 层之后' }]} value={K}
          onChange={(v) => { setK(v); setShown(L); setPlaying(false); }} />
        <Btn primary onClick={() => { setShown(0); setPlaying(true); }}>逐层播放</Btn>
        <Seg label="播放速度" options={[{ value: 'slow', label: '慢' }, { value: 'mid', label: '中' }, { value: 'fast', label: '快' }]} value={speed} onChange={setSpeed} />
        <span className="dp-m7c-legend"><i style={{ background: C.green }} />来自保留 token <i style={{ background: PRUNED_C }} />来自被剪 token <i className="is-line" />剪枝位置</span>
        <span className="dp-split-tags"><Tag kind="demo" /></span>
      </div>
      <canvas ref={ref} className="dp-canvas" style={{ width: W, height: H }} role="img"
        aria-label={`因果注意力示意：剪枝在第 ${K} 层，最后一个问题 token 含 ${got}/8 个视觉 token 的信息`} />
      <div className={`dp-fb ${K === 0 ? '' : 'is-limit'}`} role="status" aria-live="polite">
        {K === 0
          ? `K = 0：被剪的 5 个 token 从未进入 LLM，最后一个问题 token 只含 ${got} / 8 个视觉 token 的信息。`
          : `K = ${K}：前 ${K} 层里问题 token 已从全部视觉 token 读到信息，被剪 token 的 ${fromPruned} 份信息已经混在里面（共 ${got} / 8）。`}
        {' '}信息只能从前往后流：视觉 token 排在问题之前，看不到问题。
      </div>
    </div>
  );
};
