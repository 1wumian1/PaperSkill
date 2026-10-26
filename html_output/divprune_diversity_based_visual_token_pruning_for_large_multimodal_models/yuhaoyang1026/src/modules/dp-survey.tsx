import React, { useMemo, useRef, useState } from 'react';
import { Btn, C, FONT_SANS, Seg, Slider, ease, useStage } from './dp-kit';
import { greedyMaxMin, greedyMaxMinSteps, log10Choose, makeCloud, rng, topK, type DistFn } from './dp-maxmin';
import { computeFlops, getModel, layerFlop, PAPER_OPTS } from './dp-flops';
import { EFFICIENCY } from './dp-data';
import { CODE_ENTRIES, STATUS_LABEL, useCodeSel, type CodeStatus } from './dp-codemap-data';

// ============================================================================
// 统一生活主题：野外测绘队在一张地图上布设观测点（每页一个不同情节）。
// 地图格 = 视觉 token；插旗 = 保留 token；营地 = 解码层；补给 = TFLOP 预算。
// 每个情节都有一个读者操作，改变的是论文相关的变量；画面里的数字来自真实计算或论文表格。
// 配色沿用 contract.md §5：地形 #f5f8f0 / #b8c9a7 / #76906a，路线与支架 #92400e，
// 蓝 = 当前状态，绿 = 本文方法，红 = 旧方法 / 失败，橙 = 读者参数。
// ============================================================================

export const SW = 720;
export const SH = 430;
const T = { bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', route: '#92400e', water: '#cfe3ef' };
type Ctx = CanvasRenderingContext2D;

// ---------- 共用绘图件 ----------
function terrain(ctx: Ctx, w = SW, h = SH) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = T.bg;
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, 18);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, 18);
  ctx.clip();
  // 等高线
  ctx.strokeStyle = T.light;
  ctx.lineWidth = 1.4;
  const hills = [[0.18, 0.3, 0.16], [0.78, 0.25, 0.14], [0.55, 0.78, 0.2]];
  for (const [cx, cy, r] of hills)
    for (let k = 1; k <= 4; k++) {
      ctx.beginPath();
      ctx.ellipse(cx * w, cy * h, r * w * k * 0.32, r * h * k * 0.45, 0.3, 0, Math.PI * 2);
      ctx.stroke();
    }
  ctx.restore();
}
function label(ctx: Ctx, s: string, x: number, y: number, color: string = C.ink, size = 26, weight = 700, align: CanvasTextAlign = 'left') {
  ctx.font = `${weight} ${size}px ${FONT_SANS}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(s, x, y);
  ctx.textAlign = 'left';
}
function flag(ctx: Ctx, x: number, y: number, color: string, s = 1) {
  ctx.strokeStyle = T.route;
  ctx.lineWidth = 2.2 * s;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 22 * s);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - 22 * s);
  ctx.lineTo(x + 14 * s, y - 17 * s);
  ctx.lineTo(x, y - 12 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(33,50,74,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y + 1, 5 * s, 2 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}
/** 测绘员：圆头、宽檐帽、身体，可带三脚架 */
function surveyor(ctx: Ctx, x: number, y: number, s = 1, tripod = true, color: string = C.blue) {
  if (tripod) {
    ctx.strokeStyle = T.route;
    ctx.lineWidth = 2.4 * s;
    ctx.beginPath();
    ctx.moveTo(x + 18 * s, y - 30 * s);
    ctx.lineTo(x + 10 * s, y);
    ctx.moveTo(x + 18 * s, y - 30 * s);
    ctx.lineTo(x + 26 * s, y);
    ctx.moveTo(x + 18 * s, y - 30 * s);
    ctx.lineTo(x + 18 * s, y);
    ctx.stroke();
    ctx.fillStyle = C.ink;
    ctx.fillRect(x + 12 * s, y - 37 * s, 13 * s, 7 * s);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 4 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y - 14 * s);
  ctx.lineTo(x, y - 34 * s);
  ctx.moveTo(x, y - 14 * s);
  ctx.lineTo(x - 6 * s, y);
  ctx.moveTo(x, y - 14 * s);
  ctx.lineTo(x + 6 * s, y);
  ctx.moveTo(x, y - 30 * s);
  ctx.lineTo(x + 11 * s, y - 33 * s);
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.fillStyle = '#f2d2b6';
  ctx.beginPath();
  ctx.arc(x, y - 41 * s, 6.5 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = T.route;
  ctx.beginPath();
  ctx.ellipse(x, y - 46 * s, 11 * s, 3 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 5 * s, y - 52 * s, 10 * s, 6 * s);
}
function bar(ctx: Ctx, x: number, y: number, w: number, h: number, frac: number, color: string) {
  ctx.fillStyle = '#e3e9e0';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, Math.max(h, w * Math.min(1, Math.max(0, frac))), h, h / 2);
  ctx.fill();
}

export interface SceneUI {
  canvas: React.ReactNode;
  controls: React.ReactNode;
}

function useCanvas(draw: (ctx: Ctx, t: number, dt: number) => void, deps: unknown[], aria: string) {
  const ref = useRef<HTMLCanvasElement>(null);
  useStage(ref, SW, SH, draw, deps);
  return <canvas ref={ref} className="dp-canvas" style={{ width: SW, height: SH }} role="img" aria-label={aria} />;
}

// ---------- 01 地图切成格：每格都要勘测 ----------
const GRID_PRESETS = [
  { id: 'l15', label: 'LLaVA 1.5', n: 576, maps: 1 },
  { id: 'video', label: '视频 8 帧', n: 1152, maps: 8 },
  { id: 'l16', label: 'LLaVA 1.6', n: 2096, maps: 1 },
];
export function useScene01(): SceneUI {
  const [p, setP] = useState('l15');
  const pr = GRID_PRESETS.find((x) => x.id === p)!;
  const m = getModel('l15-7b');
  const rel = layerFlop(pr.n + 45, m.d, m.m, PAPER_OPTS) / layerFlop(576 + 45, m.d, m.m, PAPER_OPTS);
  const canvas = useCanvas((ctx, t) => {
    terrain(ctx);
    const final = t > 900;
    const ox = 40, oy = 40, size = 300;
    const sweep = final ? 1 : (t * 0.35) % 1.2;
    const drawGrid = (x: number, y: number, s: number, cols: number, offset: number) => {
      const cell = s / cols;
      for (let i = 0; i < cols; i++)
        for (let j = 0; j < cols; j++) {
          const k = (j * cols + i) / (cols * cols);
          const done = (k + offset) % 1 < sweep;
          ctx.fillStyle = done ? 'rgba(39,68,110,0.55)' : 'rgba(39,68,110,0.12)';
          ctx.fillRect(x + i * cell + 0.5, y + j * cell + 0.5, cell - 1, cell - 1);
        }
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, s, s);
    };
    if (pr.maps === 1) drawGrid(ox, oy, size, Math.round(Math.sqrt(pr.n)), 0);
    else for (let f = 0; f < 8; f++) drawGrid(ox + (f % 4) * 78, oy + Math.floor(f / 4) * 150, 70, 12, f * 0.07);
    surveyor(ctx, 400, 330, 1.6);
    label(ctx, `待勘测 ${pr.n.toLocaleString()} 格`, 400, 90, C.ink, 30, 800);
    label(ctx, '单层工作量（相对 1.5 版）', 400, 140, C.muted, 24, 600);
    bar(ctx, 400, 158, 280, 22, rel / 4, C.blue);
    label(ctx, `×${rel.toFixed(2)}`, 400, 214, C.blue, 34, 800);
  }, [p, rel], `地图切成 ${pr.n} 格，单层工作量约为 LLaVA 1.5 的 ${rel.toFixed(2)} 倍`);
  return {
    canvas,
    controls: <Seg label="输入设置" options={GRID_PRESETS.map((x) => ({ value: x.id, label: x.label }))} value={p} onChange={setP} />,
  };
}

// ---------- 02 手电只照亮一处：按亮度钉图钉 ----------
const SPOTS = [
  { cx: 0.2, cy: 0.35, sx: 0.06, sy: 0.07, n: 14 },
  { cx: 0.5, cy: 0.3, sx: 0.06, sy: 0.06, n: 12 },
  { cx: 0.8, cy: 0.35, sx: 0.06, sy: 0.07, n: 12 },
  { cx: 0.25, cy: 0.75, sx: 0.06, sy: 0.06, n: 10 },
  { cx: 0.55, cy: 0.72, sx: 0.06, sy: 0.06, n: 10 },
  { cx: 0.82, cy: 0.75, sx: 0.05, sy: 0.05, n: 8 },
];
export function useScene02(): SceneUI {
  const [beam, setBeam] = useState(0.2);
  const [rule, setRule] = useState<'light' | 'gap'>('light');
  const pts = useMemo(() => makeCloud(41, SPOTS), []);
  const d: DistFn = useMemo(() => (a, b) => Math.hypot((pts[a].x - pts[b].x) * 1.67, pts[a].y - pts[b].y), [pts]);
  const bright = pts.map((p) => Math.exp(-(((p.x - beam) * 1.67) ** 2 + (p.y - 0.4) ** 2) / 0.05));
  const sel = rule === 'light' ? topK(bright, 10) : greedyMaxMin(pts.length, 10, d);
  const regions = new Set(sel.map((i) => pts[i].c)).size;
  const canvas = useCanvas((ctx) => {
    terrain(ctx);
    // 夜色 + 手电光圈
    ctx.fillStyle = 'rgba(33,50,74,0.32)';
    ctx.fillRect(0, 0, SW, SH);
    const bx = beam * SW, by = 0.4 * SH;
    const g = ctx.createRadialGradient(bx, by, 10, bx, by, 170);
    g.addColorStop(0, 'rgba(255,248,214,0.9)');
    g.addColorStop(1, 'rgba(255,248,214,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(bx, by, 170, 0, Math.PI * 2);
    ctx.fill();
    // 光束从画面下沿射入（不再画持手电的小人：它不承担教学作用）
    ctx.strokeStyle = 'rgba(255,248,214,0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bx - 29, SH);
    ctx.lineTo(bx, by + 40);
    ctx.stroke();
    pts.forEach((p) => {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      ctx.arc(p.x * SW, p.y * SH, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    sel.forEach((i) => flag(ctx, pts[i].x * SW, pts[i].y * SH, rule === 'light' ? C.red : C.green, 1.1));
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.beginPath();
    ctx.roundRect(16, 16, 300, 44, 12);
    ctx.fill();
    label(ctx, `10 面旗覆盖 ${regions} / 6 个片区`, 30, 48, regions >= 6 ? C.green : regions <= 2 ? C.red : C.ink, 26, 800);
  }, [beam, rule, sel.join(',')], `${rule === 'light' ? '按亮度' : '按空白'}插 10 面旗，覆盖 ${regions} 个片区`);
  return {
    canvas,
    controls: (
      <div className="dp-row" style={{ flexWrap: 'nowrap' }}>
        <Seg label="插旗规则" options={[{ value: 'light', label: '按亮度 Top-k' }, { value: 'gap', label: '按空白 Max-Min' }]} value={rule} onChange={setRule} />
        <div style={{ width: 230 }}><Slider label="手电照向" value={Math.round(beam * 100)} min={15} max={85} onChange={(v) => setBeam(v / 100)} display="" /></div>
      </div>
    ),
  };
}

// ---------- 03 布点方案计数器 ----------
export function useScene03(): SceneUI {
  const [k, setK] = useState(56);
  const lg = log10Choose(576, k);
  const digits = Math.floor(lg) + 1;
  const canvas = useCanvas((ctx, t) => {
    terrain(ctx);
    const final = t > 900;
    // 计数器
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(40, 60, 640, 120, 16);
    ctx.fill();
    ctx.stroke();
    const show = Math.min(digits, 18);
    const cw = 600 / 18;
    for (let i = 0; i < show; i++) {
      const x = 60 + (18 - show + i) * cw;
      ctx.fillStyle = '#21324a';
      ctx.beginPath();
      ctx.roundRect(x + 2, 80, cw - 4, 80, 6);
      ctx.fill();
      const spin = final ? 0 : (t * (2 + i * 1.7)) % 10;
      const v = final ? (i === 0 ? 1 : 0) : Math.floor(spin);
      label(ctx, String(v), x + cw / 2, 135, '#fff', 30, 800, 'center');
    }
    label(ctx, digits > 18 ? `…共 ${digits} 位数字，计数器装不下` : `共 ${digits} 位数字`, 40, 220, C.ink, 28, 800);
    label(ctx, `576 格里插 ${k} 面旗的方案数 ≈ 10^${lg.toFixed(1)}`, 40, 262, C.blue, 28, 700);
    const secs = lg - 9;
    label(ctx, secs > 17.64 ? `每秒试 10⁹ 种，也要宇宙年龄的 10^${(secs - 17.64).toFixed(0)} 倍` : `每秒试 10⁹ 种，约需 10^${Math.max(0, secs).toFixed(1)} 秒`, 40, 304, C.muted, 26, 600);
  }, [k], `576 格选 ${k} 格的方案数约 10 的 ${lg.toFixed(1)} 次方`);
  return {
    canvas,
    controls: <div style={{ width: 520 }}><Slider label="要插的旗数 M̃" value={k} min={1} max={120} onChange={setK} display={`${k} 面`} /></div>,
  };
}

// ---------- 04 罗盘只读夹角，卷尺量距离 ----------
export function useScene04(): SceneUI {
  const [deg, setDeg] = useState(60);
  const [len, setLen] = useState(70);
  const th = (deg * Math.PI) / 180;
  const L1 = 0.8, L2 = len / 100;
  const cosd = 1 - Math.cos(th);
  const eu = Math.hypot(L1 - L2 * Math.cos(th), L2 * Math.sin(th));
  const canvas = useCanvas((ctx) => {
    terrain(ctx);
    const ox = 260, oy = 330, R = 260;
    // 营地
    ctx.fillStyle = T.route;
    ctx.beginPath();
    ctx.moveTo(ox - 16, oy + 4);
    ctx.lineTo(ox, oy - 20);
    ctx.lineTo(ox + 16, oy + 4);
    ctx.closePath();
    ctx.fill();
    const ax = ox + R * L1, ay = oy;
    const bx = ox + R * L2 * Math.cos(th), by = oy - R * L2 * Math.sin(th);
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = C.muted;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ax, ay);
    ctx.moveTo(ox, oy);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.setLineDash([]);
    // 卷尺：两人之间的直线（灰，与 4.1 的欧氏距离同色）
    ctx.strokeStyle = C.muted;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    // 罗盘夹角（绿，与 4.1 的余弦距离同色）
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(ox, oy, 60, -th, 0);
    ctx.stroke();
    surveyor(ctx, ax, ay, 1.1, false);
    surveyor(ctx, bx, by, 1.1, false, C.green);
    label(ctx, `罗盘：1 − cos θ = ${cosd.toFixed(3)}`, 370, 60, C.green, 26, 800);
    label(ctx, `卷尺：直线距离 = ${eu.toFixed(3)}`, 370, 100, C.muted, 26, 800);
    label(ctx, `θ = ${deg}°`, ox + 70, oy - 20, C.green, 26, 700);
  }, [deg, len], `夹角 ${deg} 度，罗盘读数 ${cosd.toFixed(3)}，卷尺距离 ${eu.toFixed(3)}`);
  return {
    canvas,
    controls: (
      <div className="dp-row">
        <div style={{ width: 300 }}><Slider label="两队方向夹角" value={deg} min={0} max={180} onChange={setDeg} display={`${deg}°`} /></div>
        <div style={{ width: 300 }}><Slider label="绿队走出的距离" value={len} min={20} max={100} onChange={setLen} display={`${len}%`} /></div>
      </div>
    ),
  };
}

// ---------- 05 在最大的空白处落针 ----------
export function useScene05(): SceneUI {
  const [n, setN] = useState(0);
  const sites = useMemo(() => {
    const r = rng(77);
    return Array.from({ length: 46 }, () => ({ x: 0.06 + r() * 0.88, y: 0.1 + r() * 0.8, c: 0 }));
  }, []);
  const d: DistFn = useMemo(() => (a, b) => Math.hypot((sites[a].x - sites[b].x) * (SW / SH), sites[a].y - sites[b].y), [sites]);
  const steps = useMemo(() => greedyMaxMinSteps(sites.length, 8, d), [d]);
  const pins = steps.slice(0, n).map((s) => s.pick);
  const cur = n > 0 ? steps[n - 1] : null;
  const canvas = useCanvas((ctx, t) => {
    terrain(ctx);
    const final = t > 900;
    sites.forEach((s) => {
      ctx.fillStyle = 'rgba(33,50,74,0.3)';
      ctx.beginPath();
      ctx.arc(s.x * SW, s.y * SH, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
    if (cur && n > 1) {
      const p = sites[cur.pick];
      const r = cur.D[cur.pick] * SH;
      const k2 = final ? 1 : ease((t % 2.4) / 0.8);
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(p.x * SW, p.y * SH, r * k2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    pins.forEach((i, k) => flag(ctx, sites[i].x * SW, sites[i].y * SH, k === n - 1 ? C.green : '#5c9c7c', 1.4));
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.beginPath();
    ctx.roundRect(16, 16, 420, 44, 12);
    ctx.fill();
    label(ctx, n === 0 ? '还没有落针' : n === 1 ? '第 1 针：最孤立的候选点' : `第 ${n} 针 · 空白半径 ${(cur!.D[cur!.pick]).toFixed(3)}`, 30, 48, C.ink, 26, 800);
  }, [n], `已落 ${n} 针`);
  return {
    canvas,
    controls: (
      <div className="dp-row">
        <Btn primary onClick={() => setN((v) => Math.min(8, v + 1))} disabled={n >= 8}>落下一针</Btn>
        <Btn onClick={() => setN(0)} disabled={n === 0}>重来</Btn>
        <span className="dp-muted">{n >= 2 ? '空白半径逐针变小（不增）' : '共 8 针'}</span>
      </div>
    ),
  };
}

// ---------- 06 测绘图压在实地上逐项核对 ----------
// 测绘图 = 论文，实地 = 官方代码。不再用“核对进度”滑块：直接列出 13 处具体对照（数据与 6.1 同源），
// 点任一处在下方看结论；选择与 6.1 对照面板共用（useCodeSel），在这里点过的条目，6.1 里也已选中。
const CHECK_COLOR = { same: C.green, diff: C.yellow, unsaid: C.blue, missing: C.red };
const CHECK_MARK = { same: '✓', diff: '≠', unsaid: '?', missing: '✗' };
const ORDER: CodeStatus[] = ['diff', 'missing', 'unsaid', 'same'];
export function useScene06(): SceneUI {
  const [sel, setSel] = useCodeSel();
  const cur = CODE_ENTRIES.find((e) => e.id === sel) ?? CODE_ENTRIES[0];
  const count = (k: CodeStatus) => CODE_ENTRIES.filter((e) => e.status === k).length;
  // 有差异、缺失排在前面：它们才是需要读者注意的地方
  const items = [...CODE_ENTRIES].sort((x, y) => ORDER.indexOf(x.status) - ORDER.indexOf(y.status));
  const canvas = (
    <div className="dp-check-board" role="group" aria-label="论文与代码的 13 处对照">
      <div className="dp-check-head">
        {ORDER.map((k) => (
          <span key={k}><b style={{ color: CHECK_COLOR[k] }}>{CHECK_MARK[k]}</b> {STATUS_LABEL[k]} {count(k)}</span>
        ))}
      </div>
      <div className="dp-check-grid">
        {items.map((e) => (
          <button key={e.id} type="button" className={e.id === cur.id ? 'is-on' : ''} aria-pressed={e.id === cur.id} onClick={() => setSel(e.id)}>
            <b style={{ color: CHECK_COLOR[e.status] }}>{CHECK_MARK[e.status]}</b>{e.title}
          </button>
        ))}
      </div>
    </div>
  );
  return {
    canvas,
    controls: (
      <div className="dp-check-note">
        <b style={{ color: CHECK_COLOR[cur.status] }}>{STATUS_LABEL[cur.status]}</b>　{cur.note}
        <a href="#m-6.1" onClick={(ev) => { ev.preventDefault(); document.getElementById('m-6.1')?.scrollIntoView({ block: 'start' }); }}>在 6.1 看代码 ↓</a>
      </div>
    ),
  };
}

// ---------- 07 补给固定：越晚精简装备，能布的旗越少 ----------
const KEEP_BY_CAMP = [56, 39, 21, 2]; // 按 Eq. (5) 反推（本页外推），对应 Table 3 的 TFLOP 列
export function useScene07(): SceneUI {
  const [k, setK] = useState(0);
  const canvas = useCanvas((ctx, t) => {
    terrain(ctx);
    const final = t > 900;
    // 路线与营地（32 段 = 32 层；前 K 段背着全部装备）
    const y = 300, x0 = 40, x1 = 680;
    const sx = (i: number) => x0 + ((x1 - x0) * i) / 32;
    ctx.lineWidth = 6;
    for (let i = 0; i < 32; i++) {
      ctx.strokeStyle = i < k ? C.red : C.green;
      ctx.globalAlpha = i < k ? 0.85 : 0.55;
      ctx.beginPath();
      ctx.moveTo(sx(i), y);
      ctx.lineTo(sx(i + 1) - 3, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (let c = 0; c <= 3; c++) {
      ctx.fillStyle = c === k ? C.orange : T.route;
      ctx.beginPath();
      ctx.moveTo(sx(c) - 10, y - 8);
      ctx.lineTo(sx(c), y - 28);
      ctx.lineTo(sx(c) + 10, y - 8);
      ctx.closePath();
      ctx.fill();
    }
    label(ctx, '营地 0–3', sx(0), y + 40, C.muted, 24, 600);
    // 能布的旗
    const keep = KEEP_BY_CAMP[k];
    label(ctx, `第 ${k} 营地精简装备后能布 ${keep} 面旗`, 40, 60, C.ink, 30, 800);
    for (let i = 0; i < 56; i++) {
      const fx = 46 + (i % 28) * 22, fy = 120 + Math.floor(i / 28) * 50;
      if (i < keep) flag(ctx, fx, fy + 30, C.green, 0.9);
      else {
        ctx.fillStyle = 'rgba(33,50,74,0.15)';
        ctx.fillRect(fx - 2, fy + 10, 4, 20);
      }
    }
  }, [k], `第 ${k} 营地精简装备，能布 ${KEEP_BY_CAMP[k]} 面旗`);
  return {
    canvas,
    controls: <div style={{ width: 560 }}><Slider label="精简装备的营地（剪枝层 K）" value={k} min={0} max={3} onChange={setK} display={`K = ${k}`} /></div>,
  };
}

// ---------- 08 三种测距工具 ----------
// 坐标经脚本搜索：在画面像素尺度下，三种工具量出的最远一对各不相同（卷尺 C–G、方格步数 B–C、罗盘 F–G），
// 且每种工具的第一名都比第二名至少大 7%，读者肉眼也能分辨。
const TOOL_PTS = [
  { x: 0.26, y: 0.47 }, { x: 0.27, y: 0.8 }, { x: 0.87, y: 0.12 }, { x: 0.4, y: 0.21 },
  { x: 0.54, y: 0.53 }, { x: 0.73, y: 0.69 }, { x: 0.12, y: 0.19 },
];
const NAMES = 'ABCDEFG';
type Tool = 'l2' | 'l1' | 'cos';
const camp = { x: 0.04, y: 0.98 };
/** 在画面像素尺度（宽 660、高 340）上量距离，画面上的远近与读数一致 */
function toolDist(tool: Tool, a: { x: number; y: number }, b: { x: number; y: number }) {
  const ax = (a.x - camp.x) * 660, ay = (camp.y - a.y) * 340, bx = (b.x - camp.x) * 660, by = (camp.y - b.y) * 340;
  if (tool === 'l2') return Math.hypot(ax - bx, ay - by);
  if (tool === 'l1') return Math.abs(ax - bx) + Math.abs(ay - by);
  return 1 - (ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by));
}
function farPair(tool: Tool) {
  let best = -1, a = 0, b = 1;
  for (let i = 0; i < TOOL_PTS.length; i++)
    for (let j = i + 1; j < TOOL_PTS.length; j++) {
      const v = toolDist(tool, TOOL_PTS[i], TOOL_PTS[j]);
      if (v > best) { best = v; a = i; b = j; }
    }
  return { a, b, v: best };
}
export function useScene08(): SceneUI {
  const [tool, setTool] = useState<Tool>('l2');
  const pairs = { l2: farPair('l2'), l1: farPair('l1'), cos: farPair('cos') };
  const cur = pairs[tool];
  const name = (p: { a: number; b: number }) => `${NAMES[p.a]}–${NAMES[p.b]}`;
  const canvasEl = useCanvas((ctx) => {
    terrain(ctx);
    const X = (p: { x: number }) => 30 + p.x * 660, Y = (p: { y: number }) => 30 + p.y * 340;
    ctx.fillStyle = T.route;
    ctx.beginPath();
    ctx.moveTo(X(camp) - 12, Y(camp) + 2);
    ctx.lineTo(X(camp), Y(camp) - 18);
    ctx.lineTo(X(camp) + 12, Y(camp) + 2);
    ctx.closePath();
    ctx.fill();
    if (tool === 'cos') {
      ctx.strokeStyle = 'rgba(39,68,110,0.25)';
      ctx.setLineDash([5, 6]);
      TOOL_PTS.forEach((p) => {
        ctx.beginPath();
        ctx.moveTo(X(camp), Y(camp));
        ctx.lineTo(X(p), Y(p));
        ctx.stroke();
      });
      ctx.setLineDash([]);
    }
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 4;
    ctx.beginPath();
    const A = TOOL_PTS[cur.a], B = TOOL_PTS[cur.b];
    if (tool === 'l1') {
      ctx.moveTo(X(A), Y(A));
      ctx.lineTo(X(B), Y(A));
      ctx.lineTo(X(B), Y(B));
    } else if (tool === 'l2') {
      ctx.moveTo(X(A), Y(A));
      ctx.lineTo(X(B), Y(B));
    } else {
      ctx.moveTo(X(A), Y(A));
      ctx.lineTo(X(camp), Y(camp));
      ctx.lineTo(X(B), Y(B));
    }
    ctx.stroke();
    TOOL_PTS.forEach((p, i) => {
      flag(ctx, X(p), Y(p), i === cur.a || i === cur.b ? C.blue : '#8a9bb3', 1.2);
      label(ctx, NAMES[i], X(p) + 18, Y(p) - 4, C.ink, 26, 800);
    });
    // 三种工具的结果并排写在右下角，切换前就能看到它们各不相同
    label(ctx, `卷尺 ${name(pairs.l2)} · 步数 ${name(pairs.l1)} · 罗盘 ${name(pairs.cos)}`, SW - 24, SH - 18, C.muted, 24, 700, 'right');
  }, [tool], `当前工具量出的最远一对是 ${name(cur)}`);
  return {
    canvas: canvasEl,
    controls: (
      <div className="dp-row">
        <Seg label="测距工具" options={[{ value: 'l2', label: '卷尺 ℓ2' }, { value: 'l1', label: '步数 ℓ1' }, { value: 'cos', label: '罗盘 余弦' }]} value={tool} onChange={setTool} />
        <span>最远一对：<b style={{ color: C.blue }}>{name(cur)}</b></span>
      </div>
    ),
  };
}

// ---------- 09 背包变轻 vs 全程用时 ----------
export function useScene09(): SceneUI {
  const [cut, setCut] = useState(86);
  const base = EFFICIENCY[0], dp = EFFICIENCY[3];
  const f = Math.min(1, cut / (100 - dp.ratio)); // 0 → 原模型，1 → DivPrune 的 14.1%
  const prefill = base.prefill + (dp.prefill - base.prefill) * f;
  const e2e = base.e2e + (dp.e2e - base.e2e) * f;
  const el = useCanvas((ctx) => {
    terrain(ctx);
    const pack = 1 - cut / 100;
    surveyor(ctx, 110, 330, 2, false);
    ctx.fillStyle = T.route;
    const pw = 28 + 34 * pack, ph = 36 + 50 * pack;
    ctx.beginPath();
    ctx.roundRect(110 - 18 - pw, 330 - 80 - ph * 0.5, pw, ph, 8);
    ctx.fill();
    const row = (y: number, name: string, frac: number, val: string, color: string) => {
      label(ctx, name, 250, y, C.ink, 26, 700);
      bar(ctx, 250, y + 14, 420, 22, frac, color);
      label(ctx, val, 670, y, color, 28, 800, 'right');
    };
    row(80, '秤：理论 TFLOPs', pack, `${(100 - cut).toFixed(0)}%`, C.green);
    row(180, '第一段路：预填充', prefill / base.prefill, `${prefill.toFixed(3)} s`, C.blue);
    row(280, '全程：端到端', e2e / base.e2e, `${e2e.toFixed(2)} s`, C.blue);
    label(ctx, `提速：预填充 ${(base.prefill / prefill).toFixed(2)}×，端到端 ${(base.e2e / e2e).toFixed(2)}×`, 250, 380, C.ink, 26, 800);
  }, [cut], `背包减重 ${cut}%：预填充 ${prefill.toFixed(3)} 秒，端到端 ${e2e.toFixed(2)} 秒`);
  return {
    canvas: el,
    controls: <div style={{ width: 520 }}><Slider label="背包减重（减少的 TFLOPs）" value={cut} min={0} max={86} onChange={setCut} display={`${cut}%`} /></div>,
  };
}

// ---------- 10 两支测绘队的成绩单：先核对比赛条件 ----------
export function useScene10(): SceneUI {
  const [keep, setKeep] = useState(1);
  const m = getModel('l15-7b');
  const fastv = computeFlops(m, { K: 3, kept: () => keep }).ratio;
  const div = computeFlops(m, { K: 0, kept: () => 56 }).ratio;
  const over = fastv > div + 0.07;
  const el = useCanvas((ctx) => {
    terrain(ctx);
    const board = (x: number, title: string, line1: string, line2: string, ratio: number, color: string, bad: boolean) => {
      ctx.fillStyle = '#21324a';
      ctx.beginPath();
      ctx.roundRect(x, 70, 300, 230, 16);
      ctx.fill();
      label(ctx, title, x + 150, 112, color === C.red ? '#ff9aa8' : '#8fe0b8', 30, 800, 'center');
      label(ctx, line1, x + 150, 160, '#fff', 26, 600, 'center');
      label(ctx, line2, x + 150, 200, '#fff', 26, 600, 'center');
      label(ctx, `${ratio.toFixed(2)}%`, x + 150, 262, bad ? '#ffcf8f' : '#fff', 40, 800, 'center');
    };
    board(40, 'FastV 队', '第 3 营地后', `留 ${keep} 面旗`, fastv, C.red, over);
    board(380, 'DivPrune 队', '第 0 营地', '留 56 面旗', div, C.green, false);
    label(ctx, '补给（TFLOP 比例）', 360, 340, C.muted, 24, 600, 'center');
    label(ctx, over ? '超出 DivPrune 的补给：不是同等条件' : '补给大致相同：这才是论文里的比赛条件', 360, 390, over ? C.yellow : C.ink, 28, 800, 'center');
  }, [keep], `FastV 留 ${keep} 个时 TFLOP 比例 ${fastv.toFixed(2)}%，DivPrune 为 ${div.toFixed(2)}%`);
  return {
    canvas: el,
    controls: <div style={{ width: 560 }}><Slider label="FastV 队在第 3 营地后留下的旗数" value={keep} min={1} max={56} onChange={setKeep} display={`${keep} 面`} /></div>,
  };
}

export const SCENES: Record<string, () => SceneUI> = {
  '01': useScene01, '02': useScene02, '03': useScene03, '04': useScene04, '05': useScene05,
  '06': useScene06, '07': useScene07, '08': useScene08, '09': useScene09, '10': useScene10,
};
