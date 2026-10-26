import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, FONT_MONO, FONT_SANS, Seg, Slider, Tag, approach, useStage } from './dp-kit';
import { log10Choose, pyRound } from './dp-maxmin';

// 3.1 组合爆炸（移植自原版 v7）：log10 C(M, M̃) 放到对数刻度尺上。数字为本页计算（公式外推）。
// 颜色：红 = 穷举需要的子集数（不可行的旧思路），蓝 = 参照线，橙 = 用户参数。

const MS = [
  { value: 576, label: 'LLaVA 1.5 · 576' },
  { value: 1152, label: '视频 8 帧 · 1152' },
  { value: 2096, label: 'LLaVA 1.6 平均 · 2096' },
];
const UNIVERSE_SEC = 17.64; // 约 138 亿年 ≈ 4.4×10^17 秒
const EVAL_BUDGET = UNIVERSE_SEC + 6; // 每秒评估 10^6 个子集，持续宇宙年龄
const ATOMS = 80;
const W = 1424;
const H = 210;

function sci(lg: number) {
  const e = Math.floor(lg);
  return `${Math.pow(10, lg - e).toFixed(1)} × 10^${e}`;
}

export const DpM3Explosion: React.FC<WidgetProps> = () => {
  const [M, setM] = useState(576);
  const [r, setR] = useState(9.8);
  const Mt = Math.max(1, pyRound((r / 100) * M));
  const lg = log10Choose(M, Mt);
  const maxScale = Math.max(160, Math.ceil(log10Choose(M, Math.floor(M / 2)) / 50) * 50);
  const ref = useRef<HTMLCanvasElement>(null);
  const cur = useRef(lg);
  useStage(ref, W, H, (ctx, t, dt) => {
    cur.current = t > 900 ? lg : approach(cur.current, lg, dt, 8);
    const v = cur.current;
    ctx.clearRect(0, 0, W, H);
    const x0 = 20, x1 = W - 40, y = 120;
    const X = (q: number) => x0 + (Math.min(q, maxScale) / maxScale) * (x1 - x0);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
    ctx.font = `600 24px ${FONT_MONO}`;
    ctx.fillStyle = C.muted;
    const step = maxScale <= 200 ? 20 : maxScale <= 400 ? 50 : 100;
    for (let q = 0; q <= maxScale; q += step) {
      ctx.beginPath(); ctx.moveTo(X(q), y); ctx.lineTo(X(q), y + 10); ctx.stroke();
      ctx.textAlign = q === 0 ? 'left' : q + step > maxScale ? 'right' : 'center';
      ctx.fillText(`10^${q}`, q === 0 ? x0 - 6 : q + step > maxScale ? X(q) + 30 : X(q), y + 42);
    }
    const marks = [{ v: EVAL_BUDGET, name: '宇宙年龄内可试完', side: 1 }, { v: ATOMS, name: '可观测宇宙原子数', side: 1 }];
    marks.forEach((mk, i) => {
      ctx.strokeStyle = C.blue; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
      const ty = 30 + i * 34;
      ctx.beginPath(); ctx.moveTo(X(mk.v), ty); ctx.lineTo(X(mk.v), y); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = C.blue; ctx.font = `700 24px ${FONT_SANS}`; ctx.textAlign = 'left';
      ctx.fillText(mk.name, X(mk.v) + 8, ty + 8);
    });
    const cx = X(v);
    ctx.fillStyle = 'rgba(196,63,82,0.22)';
    ctx.fillRect(x0, y - 14, cx - x0, 14);
    ctx.fillStyle = C.red;
    ctx.beginPath(); ctx.moveTo(cx, y - 4); ctx.lineTo(cx - 12, y - 26); ctx.lineTo(cx + 12, y - 26); ctx.closePath(); ctx.fill();
    ctx.textAlign = 'left';
  }, [lg, maxScale]);
  const gap = lg - EVAL_BUDGET;

  return (
    <div className="dp-root dp-m3">
      <div className="dp-row">
        <Seg label="视觉 token 总数 M" options={MS} value={M} onChange={setM} />
        <div className="dp-m3-slider">
          <Slider label="保留比例 r" value={r} min={1} max={50} step={0.2} onChange={setR} display={`${r.toFixed(1)}% → M̃ = ${Mt}`} />
        </div>
      </div>
      <div className="dp-glass dp-m3-board">
        <div className="dp-m3-num" aria-live="polite">
          <span className="dp-h">候选子集数 C({M}, {Mt}) ≈</span>
          <span className="dp-em dp-m3-big">10<sup>{lg.toFixed(1)}</sup></span>
          <span className="dp-muted">（{sci(lg)}）</span>
        </div>
        <canvas ref={ref} className="dp-canvas" style={{ width: W, height: H }}
          role="img" aria-label={`对数刻度尺：当前约 10 的 ${lg.toFixed(1)} 次方`} />
      </div>
      <div className="dp-fb is-bad" role="status" aria-live="polite">
        每秒评估一百万个子集、从宇宙诞生算到今天，也只能试约 10<sup>{EVAL_BUDGET.toFixed(1)}</sup> 个，
        {gap > 0 ? <>还差约 <b>{gap.toFixed(0)} 个数量级</b>。</> : <>这次刚好试得完——只在保留数极小时才会发生。</>}
        而且评估每个子集都要跑一次模型前向——所以 DivPrune 改用“多样性”代理目标，再用贪心逐个挑选。
      </div>
      <div className="dp-row dp-muted"><Tag kind="extrap" /> 组合数用对数精确计算；宇宙年龄、原子数为常见数量级估计</div>
    </div>
  );
};
