import React, { useEffect, useMemo, useRef } from 'react';
import type { WidgetProps } from './registry';
import { useCoverPlayback } from '../components/CoverPlayback';
import { C, FONT_SANS, prep } from './dp-kit';
import { euclidOf, greedyMaxMin, makeCloud, minPair, rng, topK } from './dp-maxmin';

// 封面对比（移植自原版 Hero 对决）：同一片示意点云、同样 16 个名额，
// 左边按“重要性”Top-k（旧方法，红），右边按 Max-Min（DivPrune，绿）。
// 两侧都读取 useCoverPlayback() 的同一个进度，不自带计时器。教学示意，非真实数据。

const K = 16;
const W = 664;
const H = 324;
const PLOT_H = 256;
const AR = 1.75;
const SPECS = [
  { cx: 0.24, cy: 0.66, sx: 0.07, sy: 0.07, n: 46 },
  { cx: 0.52, cy: 0.42, sx: 0.07, sy: 0.06, n: 34 },
  { cx: 0.8, cy: 0.66, sx: 0.06, sy: 0.07, n: 30 },
  { cx: 0.74, cy: 0.18, sx: 0.05, sy: 0.04, n: 16 },
  { cx: 0.24, cy: 0.2, sx: 0.035, sy: 0.035, n: 10 },
];

export const DpCover: React.FC<WidgetProps> = ({ moduleId }) => {
  const side = moduleId === 'oldMethod' ? 'old' : 'new';
  const { progress, playing } = useCoverPlayback();
  const ref = useRef<HTMLCanvasElement>(null);
  const pts = useMemo(() => makeCloud(97, SPECS), []);
  const d = useMemo(() => euclidOf(pts.map((p) => ({ ...p, x: p.x * AR }))), [pts]);
  const scores = useMemo(() => {
    const r = rng(5);
    return pts.map((p) => (p.c === 0 ? 0.7 + 0.3 * r() : 0.4 * r()));
  }, [pts]);
  const sel = useMemo(() => (side === 'old' ? topK(scores, K) : greedyMaxMin(pts.length, K, d)), [side, scores, pts, d]);

  // 时间轴：0–0.08 静止，0.08–0.72 逐个点亮 16 个名额，之后停在结果上。
  // 减少动态效果时时钟不走（progress 停在 0），直接显示最终结果。
  const p = playing || progress > 0 ? progress : 1;
  const exact = Math.max(0, Math.min(K, ((p - 0.08) / 0.64) * K));
  const shown = Math.floor(exact);
  const frac = exact - shown;
  const cur = sel.slice(0, shown);
  const mm = cur.length >= 2 ? minPair(cur, d) : null;
  const clusters = new Set(cur.map((i) => pts[i].c)).size;
  const color = side === 'old' ? C.red : C.green;

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = prep(c, W, H);
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    const pad = 14;
    const X = (x: number) => pad + x * (W - 2 * pad);
    const Y = (y: number) => pad + y * (PLOT_H - 2 * pad);
    const on = new Set(cur);
    // 候选点：旧方法按“重要性分数”着色（它看到的东西），新方法只看位置
    pts.forEach((pt, i) => {
      if (on.has(i)) return;
      ctx.beginPath();
      ctx.arc(X(pt.x), Y(pt.y), side === 'old' ? 2 + scores[i] * 2.4 : 2.6, 0, Math.PI * 2);
      ctx.fillStyle = side === 'old' ? `rgba(196, 63, 82, ${0.1 + scores[i] * 0.3})` : 'rgba(33, 50, 74, 0.28)';
      ctx.fill();
    });
    // 已选点中最近的一对（短板）：蓝色
    if (mm && mm.a >= 0) {
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(X(pts[mm.a].x), Y(pts[mm.a].y));
      ctx.lineTo(X(pts[mm.b].x), Y(pts[mm.b].y));
      ctx.stroke();
    }
    // 已选点（最新一个带扩散光晕）
    const next = shown < K ? sel[shown] : -1;
    if (next >= 0 && frac > 0) {
      const x = X(pts[next].x);
      const y = Y(pts[next].y);
      ctx.strokeStyle = side === 'old' ? `rgba(196,63,82,${1 - frac})` : `rgba(34,141,92,${1 - frac})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y, 6 + frac * 22, 0, Math.PI * 2);
      ctx.stroke();
    }
    cur.forEach((i) => {
      const x = X(pts[i].x);
      const y = Y(pts[i].y);
      ctx.beginPath();
      if (side === 'old') {
        ctx.moveTo(x, y - 8);
        ctx.lineTo(x + 7.5, y + 5.5);
        ctx.lineTo(x - 7.5, y + 5.5);
        ctx.closePath();
      } else {
        ctx.arc(x, y, 6.5, 0, Math.PI * 2);
      }
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    // 读数带
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(0, PLOT_H, W, H - PLOT_H);
    ctx.font = `600 26px ${FONT_SANS}`;
    ctx.textBaseline = 'middle';
    const ym = PLOT_H + (H - PLOT_H) / 2;
    ctx.fillStyle = C.muted;
    ctx.fillText('已选', 14, ym);
    ctx.fillText('覆盖簇', 200, ym);
    ctx.fillText('最近一对', 400, ym);
    ctx.fillStyle = C.ink;
    ctx.font = `800 28px ${FONT_SANS}`;
    ctx.fillText(`${shown}/${K}`, 72, ym);
    ctx.fillStyle = clusters >= 5 ? C.green : clusters <= 1 && shown > 3 ? C.red : C.ink;
    ctx.fillText(`${clusters}/5`, 290, ym);
    ctx.fillStyle = C.blue;
    ctx.fillText(mm ? mm.v.toFixed(3) : '—', 530, ym);
    ctx.textBaseline = 'alphabetic';
  }, [cur.join(','), frac, pts, sel, scores, side, color, shown, clusters, mm?.v]);

  return (
    <canvas ref={ref} className="dp-canvas" style={{ width: W, height: H }} role="img"
      aria-label={`${side === 'old' ? '重要性 Top-k' : 'Max-Min'}：已选 ${shown} 个，覆盖 ${clusters} / 5 个簇（教学示意）`} />
  );
};
