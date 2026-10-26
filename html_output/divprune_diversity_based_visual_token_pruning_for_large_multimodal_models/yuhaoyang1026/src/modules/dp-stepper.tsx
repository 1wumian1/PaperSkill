import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { Btn, C, FONT_MONO, FONT_SANS, Seg, Tag, approach, ease, toCanvas, useInView, useReducedMotion, useStage } from './dp-kit';
import { euclidOf, greedyMaxMinSteps, makeCloud, type Pt } from './dp-maxmin';

// 5.1 Algorithm 1 分步演示（移植自原版 v7）：每轮拆成“计算 D”“取 argmax 并移入 Ẽv”两步。
// 画布（点云 + 最近者连线 + 数组 D）、伪代码行与反馈都由同一个 step 状态驱动。
// 颜色：蓝 = 当前计算（最近者连线、D 柱）；绿 = 被 Algorithm 1 选中（argmax 柱、Ẽv 中的点）；
// 橙 = 读者的预测；红 = 预测错误的反馈。数据为教学示意：二维欧氏距离代替 4096 维余弦距离。

const N = 24;
const K = 6;
const AR = 1.6;
const W = 760;
const H = 546;
const PLOT_H = 380;
const BAR_TOP = 412;
const BAR_BASE = 532;

const CODE: Record<number, { t: string; ind: number }> = {
  1: { t: 'M̃: subset size; Ev: visual tokens; Ẽv: selected subset', ind: 0 },
  2: { t: 'Initialize Ẽv=[] and R = Ev', ind: 0 },
  5: { t: 'for i in R do', ind: 0 },
  7: { t: 'for j in R do', ind: 1 },
  8: { t: 'If (i ≠ j & d(i, j) ≤ dmin) then dmin = d(i, j)', ind: 2 },
  9: { t: 'Add dmin to D', ind: 1 },
  10: { t: 'k = R[arg max (D)]', ind: 0 },
  11: { t: 'move k from R to Ẽv', ind: 0 },
  13: { t: 'while |Ẽv| < M̃ do', ind: 0 },
  15: { t: 'for i in R do', ind: 1 },
  17: { t: 'for j in Ẽv do', ind: 2 },
  18: { t: 'If d(i, j) ≤ dmin then dmin = d(i, j)', ind: 3 },
  19: { t: 'Add dmin to D', ind: 2 },
  20: { t: 'k = R[arg max (D)]', ind: 1 },
  21: { t: 'move k from R to Ẽv', ind: 1 },
  22: { t: 'Return Ẽv', ind: 0 },
};

const SEEDS: { id: string; label: string; pts: () => Pt[] }[] = [
  {
    id: 'a',
    label: '成簇',
    pts: () =>
      makeCloud(11, [
        { cx: 0.25, cy: 0.35, sx: 0.08, sy: 0.08, n: 8 },
        { cx: 0.7, cy: 0.3, sx: 0.07, sy: 0.07, n: 7 },
        { cx: 0.5, cy: 0.75, sx: 0.12, sy: 0.07, n: 7 },
        { cx: 0.92, cy: 0.85, sx: 0.02, sy: 0.02, n: 2 },
      ]),
  },
  { id: 'b', label: '较均匀', pts: () => makeCloud(23, [{ cx: 0.5, cy: 0.5, sx: 0.28, sy: 0.26, n: N }]) },
  {
    id: 'c',
    label: '一大一小',
    pts: () =>
      makeCloud(5, [
        { cx: 0.35, cy: 0.5, sx: 0.12, sy: 0.14, n: 19 },
        { cx: 0.85, cy: 0.25, sx: 0.04, sy: 0.04, n: 5 },
      ]),
  },
];

type Kind = 'init' | 'calc' | 'pick' | 'done';
type Speed = 'slow' | 'mid' | 'fast';
/** 自动播放每一步停留的时间（毫秒）。教学播放要留出读 D 数组与伪代码的时间，“选中”一步再多停 30%。 */
const STEP_MS: Record<Speed, number> = { slow: 2800, mid: 1700, fast: 900 };

export const DpStepper: React.FC<WidgetProps> = () => {
  const [seed, setSeed] = useState('a');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>('mid');
  const [mode, setMode] = useState<'demo' | 'guess'>('demo');
  const [guesses, setGuesses] = useState<Record<number, number>>({});
  const reduced = useReducedMotion();
  const pts = useMemo(() => SEEDS.find((s) => s.id === seed)!.pts(), [seed]);
  const d = useMemo(() => euclidOf(pts.map((p) => ({ ...p, x: p.x * AR }))), [pts]);
  const steps = useMemo(() => greedyMaxMinSteps(N, K, d), [d]);
  const total = 1 + 2 * K + 1;
  const kind: Kind = step === 0 ? 'init' : step === total - 1 ? 'done' : (step - 1) % 2 === 0 ? 'calc' : 'pick';
  const round = kind === 'init' ? 0 : kind === 'done' ? K - 1 : Math.floor((step - 1) / 2);
  const st = kind === 'calc' || kind === 'pick' ? steps[round] : null;

  useEffect(() => {
    setStep(0);
    setPlaying(false);
    setGuesses({});
  }, [seed, mode]);

  // 自动播放：按所选速度推进；画布滚出视口时暂停计时（停在当前步，回来后继续）
  const ref = useRef<HTMLCanvasElement>(null);
  const inView = useInView(ref, '0px');
  useEffect(() => {
    if (!playing || !inView) return;
    if (step >= total - 1) {
      setPlaying(false);
      return;
    }
    const hold = STEP_MS[speed] * (kind === 'pick' ? 1.3 : 1);
    const id = window.setTimeout(() => setStep((s) => Math.min(total - 1, s + 1)), hold);
    return () => window.clearTimeout(id);
  }, [playing, inView, step, total, speed, kind]);

  const selectedNow = useMemo(() => {
    if (kind === 'init') return [] as number[];
    if (kind === 'done') return steps.map((s) => s.pick);
    return kind === 'pick' ? [...steps[round].selectedBefore, steps[round].pick] : steps[round].selectedBefore;
  }, [kind, round, steps]);

  const guess = st ? guesses[round] : undefined;
  const awaiting = mode === 'guess' && kind === 'calc' && guess === undefined;
  const candidates = kind === 'calc' && st ? st.D.map((v, i) => (Number.isNaN(v) || st.selectedBefore.includes(i) ? -1 : i)).filter((i) => i >= 0) : [];

  // 按点集的包围盒等比放大到绘图区（等比缩放不改变任何距离的大小关系，选择结果不变）
  const box = useMemo(() => {
    const xs = pts.map((p) => p.x * AR);
    const ys = pts.map((p) => p.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const s = Math.min((W - 120) / Math.max(1e-6, x1 - x0), (PLOT_H - 70) / Math.max(1e-6, y1 - y0));
    return { x0, y0, s, ox: (W - (x1 - x0) * s) / 2, oy: 28 + (PLOT_H - 70 - (y1 - y0) * s) / 2 };
  }, [pts]);
  const P = (i: number) => ({ x: box.ox + (pts[i].x * AR - box.x0) * box.s, y: box.oy + (pts[i].y - box.y0) * box.s });

  const makeGuess = (i: number) => {
    if (!awaiting || !candidates.includes(i)) return;
    setGuesses((g) => ({ ...g, [round]: i }));
  };
  const onCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!awaiting) return;
    const q = toCanvas(e, W, H);
    let best = -1;
    let bd = 24;
    for (const i of candidates) {
      const p = P(i);
      const dd = Math.hypot(p.x - q.x, p.y - q.y);
      if (dd < bd) {
        bd = dd;
        best = i;
      }
    }
    if (best >= 0) makeGuess(best);
  };

  const anim = useRef({ wt: new Float32Array(N), since: 0, key: '' });
  useStage(ref, W, H, (ctx, t, dt) => {
    const a = anim.current;
    const key = `${seed}:${step}:${guess ?? ''}`;
    if (a.key !== key) {
      a.key = key;
      a.since = 0;
    }
    a.since += dt;
    const final = t > 900;
    const since = final ? 99 : a.since;
    const sel = new Set(selectedNow);
    const before = st ? new Set(st.selectedBefore) : sel;
    for (let i = 0; i < N; i++) a.wt[i] = final ? (sel.has(i) ? 1 : 0) : approach(a.wt[i], sel.has(i) ? 1 : 0, dt, 9);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 18);
    ctx.fill();

    // 最近者连线：计算步从各候选“长出来”（第一阶段连向最近邻，第二阶段连向最近的已选点）
    if (st) {
      const grow = kind === 'calc' ? ease(since / 0.7) : 1;
      for (let i = 0; i < N; i++) {
        const j = st.nearest[i];
        if (j < 0 || before.has(i)) continue;
        const p1 = P(i);
        const p2 = P(j);
        const isPick = kind === 'pick' && i === st.pick;
        ctx.strokeStyle = isPick ? C.green : 'rgba(39, 68, 110, 0.42)';
        ctx.lineWidth = isPick ? 4 : 1.6;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p1.x + (p2.x - p1.x) * grow, p1.y + (p2.y - p1.y) * grow);
        ctx.stroke();
      }
    }
    // 读者的预测：橙色虚线圈；等待作答时候选点外有轻微的呼吸环
    if (guess !== undefined && st) {
      const p = P(guess);
      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 21, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (awaiting) {
      const k2 = final ? 0.5 : 0.5 + 0.5 * Math.sin(t * 3);
      ctx.strokeStyle = `rgba(240,126,71,${0.2 + 0.35 * k2})`;
      ctx.lineWidth = 2;
      for (const i of candidates) {
        const p = P(i);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 15 + 3 * k2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    // 被选中点的涟漪
    if (st && kind === 'pick' && since < 1.6) {
      const p = P(st.pick);
      for (let r = 0; r < 2; r++) {
        const k2 = (since - r * 0.25) / 1.1;
        if (k2 <= 0 || k2 >= 1) continue;
        ctx.strokeStyle = `rgba(34,141,92,${0.8 * (1 - k2)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 14 + ease(k2) * 40, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    // 点：已选为绿色实心（圆内为选择顺序），候选为白底灰边；旁边是原始编号
    for (let i = 0; i < N; i++) {
      const p = P(i);
      const on = a.wt[i];
      const isPick = !!st && kind === 'pick' && i === st.pick;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 9 + 6 * on, 0, Math.PI * 2);
      ctx.fillStyle = on > 0.5 ? C.green : '#fff';
      ctx.strokeStyle = on > 0.5 ? '#fff' : 'rgba(33,50,74,0.7)';
      ctx.lineWidth = isPick ? 3.5 : 2;
      ctx.fill();
      ctx.stroke();
      if (on > 0.5) {
        ctx.fillStyle = '#fff';
        ctx.font = `800 18px ${FONT_SANS}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(selectedNow.indexOf(i) + 1), p.x, p.y + 1);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
      ctx.fillStyle = isPick ? C.green : guess === i ? C.orange : C.muted;
      ctx.font = `${isPick || guess === i ? 800 : 600} 22px ${FONT_MONO}`;
      ctx.fillText(String(i + 1), p.x + 15, p.y - 10);
    }

    // 数组 D：计算步里依次升起；argmax 柱为绿色并标出数值
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(20, BAR_BASE + 0.5);
    ctx.lineTo(W - 20, BAR_BASE + 0.5);
    ctx.stroke();
    ctx.font = `700 28px ${FONT_SANS}`;
    ctx.fillStyle = C.ink;
    const label = st ? (round === 0 ? 'D：到最近邻的距离' : 'D：到已选集合的最近距离') : 'D：尚未计算';
    ctx.fillText(label, 20, BAR_TOP - 12);
    if (st && awaiting) {
      ctx.fillStyle = C.orange;
      ctx.font = `700 28px ${FONT_SANS}`;
      ctx.fillText('作答后揭晓：哪条细线最长？', 20, BAR_BASE - 40);
    } else if (st) {
      const vals = st.D.filter((v) => !Number.isNaN(v));
      const mx = Math.max(...vals);
      const bw = (W - 40) / N;
      for (let i = 0; i < N; i++) {
        const v = st.D[i];
        const x = 20 + i * bw;
        if (Number.isNaN(v) || before.has(i)) {
          ctx.fillStyle = '#dfe5ef';
          ctx.fillRect(x + 2, BAR_BASE - 4, bw - 4, 4);
          continue;
        }
        const rise = kind === 'calc' ? ease((since - i * 0.025) / 0.45) : 1;
        const hh = (v / mx) * (BAR_BASE - BAR_TOP - 34) * rise;
        const isPick = kind === 'pick' && i === st.pick;
        ctx.fillStyle = isPick ? C.green : guess === i ? C.orange : C.blueLight;
        ctx.globalAlpha = isPick || guess === i ? 1 : 0.7;
        ctx.fillRect(x + 2, BAR_BASE - hh, bw - 4, hh);
        ctx.globalAlpha = 1;
      }
      if (kind === 'pick') {
        const x = 20 + st.pick * bw + bw / 2;
        ctx.globalAlpha = ease(since / 0.4);
        ctx.fillStyle = C.green;
        ctx.font = `800 28px ${FONT_MONO}`;
        ctx.textAlign = x > W - 150 ? 'right' : x < 150 ? 'left' : 'center';
        ctx.fillText(`max ${st.D[st.pick].toFixed(3)}`, x, BAR_TOP + 8);
        ctx.textAlign = 'left';
        ctx.globalAlpha = 1;
      }
    }
  }, [seed, step, pts, steps, selectedNow, guess, awaiting]);

  // ---------- 右侧：当前步骤、对应伪代码行与反馈 ----------
  const lines =
    kind === 'init' ? [1, 2] : kind === 'done' ? [13, 22] : round === 0 ? (kind === 'calc' ? [5, 7, 8, 9] : [10, 11]) : kind === 'calc' ? [15, 17, 18, 19] : [20, 21];
  const heading =
    kind === 'init' ? '初始化' : kind === 'done' ? '完成：返回 Ẽv' : `${round === 0 ? '第一阶段' : `第二阶段 · 第 ${round} 轮`} · ${kind === 'calc' ? '计算 D' : '取 argmax'}`;

  let tone: '' | 'is-good' | 'is-bad' | 'is-limit' = '';
  let fb: React.ReactNode = '已选集合 Ẽv 为空，候选 R 为全部 24 个点；目标选出 M̃ = 6 个。';
  if (kind === 'calc' && st) {
    fb = round === 0
      ? '每个候选找最近的邻居（i ≠ j），把距离记进 D。细线连向各自的最近邻。'
      : `每个剩余候选到已选集合（${st.selectedBefore.length} 个）的最近距离记进 D，细线连向最近的已选点。`;
    if (awaiting) fb = <>先猜：在图上点出本轮会被选中的点（或用右下角的列表）。提示：{round === 0 ? '最孤立的点，最近邻细线最长' : '离已选集合最远，细线最长'}。</>;
    else if (guess !== undefined) fb = <>你预测第 <b>{guess + 1}</b> 号点，按“下一步”揭晓。</>;
  } else if (kind === 'pick' && st) {
    const v = st.D[st.pick].toFixed(3);
    fb = round === 0
      ? <>第 <b>{st.pick + 1}</b> 号点的最近邻距离最大（{v}），是最孤立的点，移入 Ẽv。</>
      : <>第 <b>{st.pick + 1}</b> 号点离已选集合最远（{v}），填补最大的空洞，移入 Ẽv（{round + 1} / {K}）。</>;
    tone = 'is-good';
    if (mode === 'guess' && guess !== undefined) {
      if (guess === st.pick) fb = <><b className="is-good">✓ 猜对了。</b>第 {st.pick + 1} 号点 D = {v}，是本轮最大值，移入 Ẽv。</>;
      else {
        fb = (
          <>
            <b className="is-bad">✗ 第 {guess + 1} 号 D = {st.D[guess].toFixed(3)}</b>，小于第 {st.pick + 1} 号的 {v}：{guess + 1} 号
            {round === 0 ? '附近还有更近的邻居，不够孤立。' : '靠近某个已选点，这片区域已部分覆盖。'}
          </>
        );
        tone = 'is-bad';
      }
    }
  } else if (kind === 'done') {
    const nG = Object.keys(guesses).length;
    const nOk = Object.entries(guesses).filter(([r, g]) => steps[+r]?.pick === g).length;
    fb = (
      <>
        {mode === 'guess' && nG ? <b>挑战：猜对 {nOk} / {nG} 轮。</b> : null}
        两阶段的 D 定义不同；第二阶段每轮选中的 D 不增（可能相等）。贪心从不回头，不保证 Eq. (3) 的全局最优。
      </>
    );
    tone = 'is-limit';
  }

  return (
    <div className="dp-root dp-stepper">
      <div className="dp-stepper-top">
        <Seg label="点集" options={SEEDS.map((s) => ({ value: s.id, label: s.label }))} value={seed} onChange={setSeed} />
        <Seg
          label="演示方式"
          options={[
            { value: 'demo', label: '直接演示' },
            { value: 'guess', label: '先猜下一点' },
          ]}
          value={mode}
          onChange={(v) => {
            setPlaying(false);
            setMode(v);
          }}
        />
        <span className="dp-stepper-count">
          <Tag kind="demo" /> 第 {step + 1} / {total} 步
        </span>
      </div>
      <canvas ref={ref} className={`dp-canvas dp-stepper-cv ${awaiting ? 'is-awaiting' : ''}`} style={{ width: W, height: H }}
        role="img" aria-label={`Algorithm 1 第 ${step + 1} / ${total} 步：${heading}${awaiting ? '，请选择你预测的点' : ''}`}
        onPointerUp={onCanvas} />
      <div className="dp-stepper-panel dp-glass">
        <h3 className="dp-h">{heading}</h3>
        <ol className="dp-code" aria-label="Algorithm 1 当前步骤对应的伪代码行（论文原文）">
          {lines.map((n) => (
            <li key={n}>
              <span className="dp-code-n">{n}</span>
              <span className="dp-code-t" style={{ paddingLeft: `${CODE[n].ind}em` }}>{CODE[n].t}</span>
            </li>
          ))}
        </ol>
        <div className={`dp-fb ${tone}`} role="status" aria-live="polite">{fb}</div>
        <div className="dp-row dp-stepper-ctl">
          <Btn onClick={() => { setStep(0); setPlaying(false); setGuesses({}); }}>重置</Btn>
          <Btn onClick={() => { setPlaying(false); setStep((s) => Math.max(0, s - 1)); }} disabled={step === 0}>上一步</Btn>
          <Btn primary onClick={() => { setPlaying(false); setStep((s) => Math.min(total - 1, s + 1)); }} disabled={step === total - 1 || awaiting}>
            {awaiting ? '先选一个点' : '下一步'}
          </Btn>
          {mode === 'demo' ? (
            <>
              <Btn onClick={() => { if (step >= total - 1) setStep(0); setPlaying((p) => !p); }}>{playing ? '暂停' : '自动播放'}</Btn>
              <Seg label="播放速度" options={[{ value: 'slow', label: '慢' }, { value: 'mid', label: '中' }, { value: 'fast', label: '快' }]} value={speed} onChange={setSpeed} />
            </>
          ) : awaiting ? (
            <select className="dp-select" aria-label="或从列表选择预测的点" value="" onChange={(e) => makeGuess(Number(e.target.value))}>
              <option value="" disabled>选编号</option>
              {candidates.map((i) => (
                <option key={i} value={i}>第 {i + 1} 号</option>
              ))}
            </select>
          ) : null}
        </div>
      </div>
    </div>
  );
};
