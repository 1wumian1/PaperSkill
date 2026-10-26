import React, { useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { Btn, C, FONT_MONO, FONT_SANS, Seg, ease, useStage } from './dp-kit';
import { pyRound } from './dp-maxmin';

// 1.1 一张图片在 LLaVA 里走过的路（移植自原版 v7）：图像 → 视觉编码器 → 投影层 →（DivPrune）→ 拼接 → 预填充 → 逐词解码。
// 视觉 token 数来自论文 §4.1 / 代码 tflops.py；问题长度取代码中各数据集平均文本长度的均值（图像 45、视频 69），仅作示意。
// 颜色：蓝 = 当前步骤 / 视觉 token；绿 = DivPrune 选出的保留 token；灰 = 被剪掉的位置。

interface Preset { id: string; label: string; M: number; Mnote: string; d: number; T: number; N: number; r: number; prefix: number | null; input: string; enc: string }
const PRESETS: Preset[] = [
  { id: 'a', label: 'LLaVA 1.5-7B', M: 576, Mnote: '24×24 = 576', d: 4096, T: 32, N: 45, r: 0.098, prefix: 35, input: '一张图片（缩放到 336×336）', enc: 'CLIP 把图切成 24×24 个图块并编码，得到 576 个特征' },
  { id: 'b', label: 'LLaVA 1.5-13B', M: 576, Mnote: '24×24 = 576', d: 5120, T: 40, N: 45, r: 0.098, prefix: 35, input: '一张图片（缩放到 336×336）', enc: 'CLIP 把图切成 24×24 个图块并编码，得到 576 个特征' },
  { id: 'c', label: 'LLaVA 1.6-7B', M: 2096, Mnote: '平均约 2096（1598–2292）', d: 4096, T: 32, N: 45, r: 0.098, prefix: 35, input: '一张高分辨率图片，按分辨率切成多块', enc: '每一块分别编码后拼接；各数据集平均约 1598–2292 个特征' },
  { id: 'd', label: 'NeXT-Video-7B', M: 1152, Mnote: '8 帧 × 144 = 1152', d: 4096, T: 32, N: 69, r: 0.1, prefix: null, input: '一段视频，均匀抽取 8 帧', enc: '每帧编码为 144 个特征，8 帧共 1152 个' },
];
const STAGES = ['输入', '视觉编码器', '投影层', 'DivPrune', '拼接', '预填充', '逐词解码'];
const W = 1472;
const H = 320;

export const DpM1Pipeline: React.FC<WidgetProps> = () => {
  const [pid, setPid] = useState('a');
  const [step, setStep] = useState(0);
  const [on, setOn] = useState(true);
  const p = PRESETS.find((x) => x.id === pid)!;
  const kept = p.M - pyRound((1 - p.r) * p.M);
  const vis = on ? kept : p.M;
  const pre = p.prefix ?? 0;
  const L = pre + vis + p.N;
  const Lfull = pre + p.M + p.N;
  const steps = useMemo(() => STAGES.map((_, i) => i).filter((i) => on || i !== 3), [on]);
  const si = Math.min(step, steps.length - 1);
  const stage = steps[si];

  const ref = useRef<HTMLCanvasElement>(null);
  const anim = useRef({ since: 0, key: '' });
  useStage(ref, W, H, (ctx, t, dt) => {
    const a = anim.current;
    const key = `${pid}:${on}:${stage}`;
    if (a.key !== key) { a.key = key; a.since = 0; }
    a.since += dt;
    const final = t > 900;
    const since = final ? 99 : a.since;
    ctx.clearRect(0, 0, W, H);
    // 流水线方框
    const bw = 196, gap = 16;
    STAGES.forEach((name, i) => {
      const x = i * (bw + gap), y = 6;
      const isDiv = i === 3;
      const disabled = isDiv && !on;
      const active = i === stage;
      const passed = steps.indexOf(i) >= 0 && steps.indexOf(i) < si;
      ctx.save();
      if (active && !final) { ctx.shadowColor = C.blue; ctx.shadowBlur = 10 + 6 * Math.sin(t * 3); }
      ctx.fillStyle = active ? (isDiv ? 'rgba(34,141,92,0.14)' : 'rgba(39,68,110,0.12)') : passed ? '#eef2fb' : '#fff';
      ctx.strokeStyle = disabled ? C.line : active ? (isDiv ? C.green : C.blue) : isDiv ? C.green : C.line;
      ctx.lineWidth = active ? 3 : 1.5;
      ctx.setLineDash(isDiv ? [7, 5] : []);
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, bw - 2, 92, 14);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.font = `800 28px ${FONT_SANS}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = disabled ? C.muted : active ? (isDiv ? C.green : C.blue) : C.ink;
      ctx.fillText(name, x + bw / 2, y + 44);
      ctx.font = `600 22px ${FONT_MONO}`;
      ctx.fillStyle = C.muted;
      ctx.fillText(disabled ? '已关闭' : `${i + 1}`, x + bw / 2, y + 78);
      ctx.textAlign = 'left';
    });
    // 下方：视觉 token 格子或拼接后的序列
    const top = 150;
    ctx.font = `700 28px ${FONT_SANS}`;
    ctx.fillStyle = C.ink;
    const showSeq = stage >= 4;
    ctx.fillText(showSeq ? `送入 LLM 的序列：长度 μ = ${L}${on ? `（不剪枝时为 ${Lfull}）` : ''}` : stage >= 1 ? `视觉 token：${stage >= 3 && on ? `${p.M} → ${kept}` : p.M}` : '等待编码…', 0, top - 14);
    if (showSeq) {
      const scale = W / Lfull;
      const grow = stage === 4 ? ease(since / 0.8) : 1;
      const segs = [
        { n: pre, color: '#9aa7bb', name: p.prefix === null ? '前缀（未公开）' : `前缀 ${pre}` },
        { n: vis, color: on ? C.green : C.blue, name: `视觉 ${vis}` },
        { n: p.N, color: C.ink, name: `问题 ≈${p.N}` },
      ];
      let x = 0;
      for (const sg of segs) {
        const ww = Math.max(sg.n > 0 ? 4 : 0, sg.n * scale);
        ctx.fillStyle = sg.color;
        ctx.fillRect(x, top, Math.max(0, Math.min(ww, grow * W - x)), 40);
        x += ww;
      }
      if (on) {
        ctx.setLineDash([6, 5]);
        ctx.strokeStyle = C.muted;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, top + 1, (Lfull - L) * scale - 2, 38);
        ctx.setLineDash([]);
      }
      let lx = 0;
      ctx.font = `600 28px ${FONT_SANS}`;
      for (const sg of segs) {
        ctx.fillStyle = sg.color;
        ctx.fillRect(lx, top + 70, 22, 22);
        ctx.fillStyle = C.ink;
        ctx.fillText(sg.name, lx + 32, top + 90);
        lx += ctx.measureText(sg.name).width + 80;
      }
      if (on) { ctx.fillStyle = C.muted; ctx.fillText('虚框：被剪掉的视觉 token', lx, top + 90); }
    } else if (stage >= 1) {
      const cols = 64, cell = 14;
      const pruned = stage >= 3 && on;
      const shown = Math.min(p.M, 576);
      const keepCells = Math.round((kept * shown) / p.M);
      for (let i = 0; i < shown; i++) {
        const r = Math.floor(i / cols), c2 = i % cols;
        const keep = !pruned || i < keepCells;
        const appear = stage === 1 ? ease((since - (i / shown) * 0.7) / 0.25) : 1;
        const fadeK = stage === 3 && on ? ease((since - ((shown - i) / shown) * 0.7) / 0.3) : 1;
        ctx.globalAlpha = appear;
        ctx.fillStyle = !pruned ? C.blue : keep ? C.green : fadeK < 1 ? C.blue : '#dfe5f1';
        ctx.fillRect(c2 * cell, top + r * cell, cell - 2, cell - 2);
        ctx.globalAlpha = 1;
      }
      ctx.font = `600 28px ${FONT_SANS}`;
      ctx.fillStyle = C.muted;
      const note = pruned ? `格子只表示数量（${kept} / ${p.M}），哪些位置被选中见第 5、6 章` : p.M > 576 ? `每格约代表 ${(p.M / 576).toFixed(1)} 个 token（共约 ${p.M} 个）` : '';
      if (note) ctx.fillText(note, 0, H - 8);
    }
  }, [pid, on, stage, si, steps, kept, vis, L, Lfull]);

  const text: Record<number, string> = {
    0: `${p.input}。`,
    1: `${p.enc}（${p.Mnote}）。`,
    2: `投影层把每个特征映射成 ${p.d} 维向量——这就是送入 LLM 的视觉 token。DivPrune 就在这些向量上计算余弦距离。`,
    3: `DivPrune 从 ${p.M} 个视觉 token 中选出 ${kept} 个（保留比例 r = ${p.r}）。只用视觉特征，不看问题文本。`,
    4: p.prefix === null
      ? `拼接：前缀 + ${vis} 个视觉 token + 约 ${p.N} 个问题 token。视频模型的 DivPrune 实现不在公开代码中，前缀长度未知。`
      : `拼接：35 个前缀 token（代码中硬编码）+ ${vis} 个视觉 token + 约 ${p.N} 个问题 token，共 ${L} 个。`,
    5: `预填充：${p.T} 层解码器一次处理全部 ${L} 个 token 并写入 KV cache。${on ? `不剪枝时是 ${Lfull} 个，每层少处理 ${Lfull - L} 个。` : '打开 DivPrune 看看能省多少。'}`,
    6: `逐词解码：每步生成 1 个 token，并读取 KV cache 中全部 ${L} 个 token。剪枝只在预填充时做一次，解码阶段沿用剪枝后的缓存。`,
  };

  return (
    <div className="dp-root dp-m1p">
      <div className="dp-row">
        <Seg label="模型" options={PRESETS.map((x) => ({ value: x.id, label: x.label }))} value={pid} onChange={setPid} />
        <label className="dp-check">
          <input type="checkbox" checked={on} onChange={(e) => { setOn(e.target.checked); setStep(0); }} />
          <span>启用 DivPrune</span>
        </label>
      </div>
      <canvas ref={ref} className="dp-canvas" style={{ width: W, height: H }} role="img" aria-label={`流水线第 ${si + 1} 步：${STAGES[stage]}`} />
      <div className="dp-row">
        <Btn onClick={() => setStep(0)}>重置</Btn>
        <Btn onClick={() => setStep(Math.max(0, si - 1))} disabled={si === 0}>上一步</Btn>
        <Btn primary onClick={() => setStep(Math.min(steps.length - 1, si + 1))} disabled={si === steps.length - 1}>下一步</Btn>
        <span className="dp-muted">第 {si + 1} / {steps.length} 步 · {STAGES[stage]}</span>
      </div>
      <div className={`dp-fb ${stage === 3 ? 'is-good' : ''}`} role="status" aria-live="polite">{text[stage]}</div>
    </div>
  );
};
