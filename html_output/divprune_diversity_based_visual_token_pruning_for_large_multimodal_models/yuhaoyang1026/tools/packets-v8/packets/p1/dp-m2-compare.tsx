import React, { useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, FONT_SANS, Seg, Slider, Tag, approach, useStage } from './dp-kit';
import { coverError, euclidOf, greedyMaxMin, makeCloud, minPair, randomSubset, rng, topK } from './dp-maxmin';

// 2.1 同一预算下比较 Top-k / 随机 / Max-Min（移植自原版 v7，教学示意）。
// 分数 = 场景设定的“任务相关性”，不是模型输出。三个场景：高分集中 / 高分分散 / 远处有无关离群点。
// 颜色：红 = 重要性 Top-k（旧方法），灰 = 随机，绿 = Max-Min（DivPrune），蓝 = 选中点中最近的一对（短板）。

type Method = 'topk' | 'random' | 'maxmin';
type Scene = 'cluster' | 'spread' | 'outlier';
const SCENES: { value: Scene; label: string }[] = [
  { value: 'cluster', label: 'A · 高分集中' },
  { value: 'spread', label: 'B · 高分分散' },
  { value: 'outlier', label: 'C · 远处有无关离群点' },
];
const OUT = 99;
const OUTLIERS = [{ x: 0.03, y: 0.05 }, { x: 0.97, y: 0.04 }, { x: 0.98, y: 0.96 }, { x: 0.03, y: 0.95 }, { x: 0.5, y: 0.02 }];
const NAMES: Record<Method, string> = { topk: '重要性 Top-k', random: '随机', maxmin: 'Max-Min' };
const COLORS: Record<Method, string> = { topk: C.red, random: '#8a96a8', maxmin: C.green };
const SPECS = [
  { cx: 0.22, cy: 0.7, sx: 0.06, sy: 0.06, n: 55 },
  { cx: 0.5, cy: 0.5, sx: 0.07, sy: 0.06, n: 40 },
  { cx: 0.8, cy: 0.66, sx: 0.06, sy: 0.07, n: 35 },
  { cx: 0.72, cy: 0.22, sx: 0.05, sy: 0.04, n: 20 },
  { cx: 0.25, cy: 0.18, sx: 0.03, sy: 0.03, n: 10 },
];
const W = 760;
const H = 546;
const AR = 1.6;

export const DpM2Compare: React.FC<WidgetProps> = () => {
  const [method, setMethod] = useState<Method>('topk');
  const [scene, setScene] = useState<Scene>('cluster');
  const [pct, setPct] = useState(10);
  const pts = useMemo(() => {
    const base = makeCloud(31, SPECS);
    return scene === 'outlier' ? [...base, ...OUTLIERS.map((o) => ({ ...o, c: OUT }))] : base;
  }, [scene]);
  const n = pts.length;
  const d = useMemo(() => euclidOf(pts.map((p) => ({ ...p, x: p.x * AR }))), [pts]);
  const scores = useMemo(() => {
    const r = rng(77);
    if (scene === 'spread') return pts.map(() => (r() < 0.22 ? 0.7 + 0.3 * r() : 0.3 * r()));
    if (scene === 'outlier') return pts.map((p) => (p.c === OUT ? 0 : 0.3 + 0.55 * r()));
    return pts.map((p) => (p.c === 0 ? 0.65 + 0.35 * r() : p.c === 1 ? 0.25 + 0.3 * r() : 0.35 * r()));
  }, [pts, scene]);
  const k = Math.max(2, Math.round((pct / 100) * n));
  const sel = useMemo<Record<Method, number[]>>(() => ({
    topk: topK(scores, k),
    random: randomSubset(n, k, 5),
    maxmin: greedyMaxMin(n, k, d),
  }), [scores, k, n, d]);
  const stats = useMemo(() => {
    const res = {} as Record<Method, { clusters: number; mm: number; cover: number; rel: number; out: number }>;
    (Object.keys(sel) as Method[]).forEach((m) => {
      const s = sel[m];
      res[m] = {
        clusters: new Set(s.map((i) => pts[i].c).filter((c) => c !== OUT)).size,
        mm: minPair(s, d).v,
        cover: coverError(n, s, d),
        rel: s.reduce((a, i) => a + scores[i], 0) / s.length,
        out: s.filter((i) => pts[i].c === OUT).length,
      };
    });
    return res;
  }, [sel, pts, d, n, scores]);

  const ref = useRef<HTMLCanvasElement>(null);
  const anim = useRef({ wt: new Float32Array(0), heat: 1, since: 0, key: '' });
  useStage(ref, W, H, (ctx, t, dt) => {
    const a = anim.current;
    if (a.wt.length !== n) a.wt = new Float32Array(n);
    const s = sel[method];
    const chosen = new Set(s);
    const key = scene + ':' + method + ':' + s.join(',');
    if (a.key !== key) { a.key = key; a.since = 0; }
    a.since += dt;
    const final = t > 900;
    for (let i = 0; i < n; i++) a.wt[i] = final ? (chosen.has(i) ? 1 : 0) : approach(a.wt[i], chosen.has(i) ? 1 : 0, dt, 10);
    a.heat = final ? (method === 'topk' ? 1 : 0) : approach(a.heat, method === 'topk' ? 1 : 0, dt, 8);
    const lineA = final ? 1 : Math.min(1, Math.max(0, (a.since - 0.12) / 0.45));
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.86)';
    ctx.beginPath(); ctx.roundRect(0, 0, W, H, 18); ctx.fill();
    const top = 56;
    const sc = Math.min((W - 40) / AR, H - top - 20);
    const ox = (W - sc * AR) / 2, oy = top;
    const X = (x: number) => ox + x * AR * sc;
    const Y = (y: number) => oy + y * sc;
    SPECS.forEach((sp) => {
      ctx.beginPath();
      ctx.ellipse(X(sp.cx), Y(sp.cy), sp.sx * 2.6 * AR * sc, sp.sy * 2.6 * sc, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(39,68,110,0.05)';
      ctx.fill();
    });
    pts.forEach((p, i) => {
      const off = 1 - a.wt[i];
      if (off < 0.02) return;
      const r = 3 + a.heat * (scores[i] * 3.2 - 0.4);
      ctx.beginPath();
      ctx.arc(X(p.x), Y(p.y), Math.max(0.8, r), 0, Math.PI * 2);
      // Top-k 模式下未选点按分数加深红色——这是 Top-k “看到”的东西
      const alpha = (0.4 * (1 - a.heat) + (0.12 + scores[i] * 0.5) * a.heat) * off;
      ctx.fillStyle = a.heat > 0.5 ? `rgba(196,63,82,${alpha})` : `rgba(104,119,143,${alpha})`;
      ctx.fill();
    });
    if (scene === 'outlier') {
      ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(33,50,74,0.5)'; ctx.lineWidth = 1.4;
      pts.forEach((p) => { if (p.c === OUT) { ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), 13, 0, Math.PI * 2); ctx.stroke(); } });
      ctx.restore();
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(39,68,110,${0.18 * lineA})`;
    ctx.beginPath();
    pts.forEach((p, i) => {
      if (chosen.has(i)) return;
      let best = -1, bv = Infinity;
      for (const j of s) { const v = d(i, j); if (v < bv) { bv = v; best = j; } }
      if (best >= 0) { ctx.moveTo(X(p.x), Y(p.y)); ctx.lineTo(X(pts[best].x), Y(pts[best].y)); }
    });
    ctx.stroke();
    const mp = minPair(s, d);
    if (mp.a >= 0) {
      const x1 = X(pts[mp.a].x), y1 = Y(pts[mp.a].y), x2 = X(pts[mp.b].x), y2 = Y(pts[mp.b].y);
      ctx.save(); ctx.shadowColor = C.blue; ctx.shadowBlur = 10; ctx.strokeStyle = C.blue; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + (x2 - x1) * lineA, y1 + (y2 - y1) * lineA); ctx.stroke();
      ctx.restore();
    }
    const col = COLORS[method];
    for (let i = 0; i < n; i++) {
      const w = a.wt[i];
      if (w < 0.03) continue;
      const x = X(pts[i].x), y = Y(pts[i].y);
      ctx.globalAlpha = Math.min(1, w * 1.4);
      ctx.fillStyle = col; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath();
      const r = 8 * (0.4 + 0.6 * w);
      if (method === 'topk') { ctx.moveTo(x, y - r * 1.2); ctx.lineTo(x + r * 1.1, y + r * 0.8); ctx.lineTo(x - r * 1.1, y + r * 0.8); ctx.closePath(); }
      else ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // 图例（画布内顶部）
    ctx.font = `600 24px ${FONT_SANS}`;
    ctx.textBaseline = 'middle';
    let lx = 20;
    const item = (draw: () => void, txt: string) => { draw(); ctx.fillStyle = C.ink; ctx.fillText(txt, lx + 30, 30); lx += 30 + ctx.measureText(txt).width + 28; };
    item(() => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(lx + 10, 30, 9, 0, Math.PI * 2); ctx.fill(); }, '选中点');
    item(() => { ctx.strokeStyle = C.blue; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(lx, 30); ctx.lineTo(lx + 22, 30); ctx.stroke(); }, '最近的一对');
    item(() => { ctx.strokeStyle = 'rgba(39,68,110,0.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(lx, 30); ctx.lineTo(lx + 22, 30); ctx.stroke(); }, '点 → 最近选中点');
    ctx.textBaseline = 'alphabetic';
  }, [sel, method, scene, n]);

  const st = stats[method];
  const rel = (m: Method) => stats[m].rel.toFixed(2);
  const best = (Object.keys(stats) as Method[]).reduce((a, b) => (stats[a].mm >= stats[b].mm ? a : b));
  const note: Record<Scene, Record<Method, string>> = {
    cluster: {
      topk: `${k} 个名额里 ${sel.topk.filter((i) => pts[i].c === 0).length} 个挤在左下的高分簇，最近一对只隔 ${st.mm.toFixed(3)}。`,
      random: '小簇常被漏掉，最近一对的距离也没有保证。',
      maxmin: `最近一对的距离 ${st.mm.toFixed(3)}，三者中${best === 'maxmin' ? '最大' : '并非最大'}。`,
    },
    spread: {
      topk: '高分点本来就散在各簇，按分数挑也能兼顾覆盖，相关性最高——此时 Top-k 合理。',
      random: '随机不看分数，相关性明显低于 Top-k。',
      maxmin: `覆盖更均匀，但不看相关性（${rel('maxmin')} vs Top-k ${rel('topk')}）：多样 ≠ 有用。`,
    },
    outlier: {
      topk: '离群点被设定为与任务无关（分数 0），Top-k 不会选它们。',
      random: `随机选中了 ${stats.random.out} 个离群点。`,
      maxmin: `${st.out} 个名额花在了远处的无关离群点上——只看多样性的代价。`,
    },
  };
  const tone = scene === 'cluster' ? (method === 'maxmin' ? 'is-good' : method === 'topk' ? 'is-bad' : '')
    : scene === 'spread' ? (method === 'topk' ? 'is-good' : '') : method === 'maxmin' ? 'is-limit' : '';

  return (
    <div className="dp-root">
      <div className="dp-split-top">
        <Seg label="场景" options={SCENES} value={scene} onChange={setScene} />
        <span className="dp-split-tags"><Tag kind="demo" /></span>
      </div>
      <canvas ref={ref} className="dp-canvas dp-split-cv" style={{ width: W, height: H }} role="img"
        aria-label={`${NAMES[method]}：选中 ${k} 个点，覆盖 ${st.clusters} 个簇`} />
      <div className="dp-glass dp-split-panel">
        <Seg label="选择方法" options={(Object.keys(NAMES) as Method[]).map((m) => ({ value: m, label: NAMES[m] }))} value={method} onChange={setMethod} />
        <Slider label="保留比例" value={pct} min={4} max={40} onChange={setPct} display={`${pct}%（${k} / ${n} 个点）`} />
        <table className="dp-table">
          <thead><tr><th>方法</th><th>覆盖簇</th><th>最近对 ↑</th><th>相关性 ↑</th></tr></thead>
          <tbody>
            {(Object.keys(NAMES) as Method[]).map((m) => (
              <tr key={m} className={m === method ? 'is-on' : ''}>
                <th><i style={{ background: COLORS[m] }} />{NAMES[m]}</th>
                <td>{stats[m].clusters}/5</td>
                <td>{stats[m].mm.toFixed(3)}</td>
                <td>{stats[m].rel.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={`dp-fb ${tone}`} role="status" aria-live="polite">{note[scene][method]}</div>
      </div>
    </div>
  );
};
