import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';
import { C, Feedback, Range, Seg, clamp } from './vtw-kit';
import { omega } from './vtw-data';
import { easeInOut, easeOut, glow, lerp, rgba, rng, rr, txt, useStage } from '../live/stage';
import { useTimeline } from '../live/timeline';
import { StageCanvas, TimeBar, type Phase } from '../live/TimeBar';
import '../live/live.css';

// 1.1 一张图变成视觉 token（自 v5.1 的切块动画回迁）：
// 一张图 → 切成小块 → 飞进输入序列（35 个系统 token + 视觉 token + 指令 token）→ 整段序列在 32 层里逐层付费。
// 数字口径：576 与 35 来自论文正文；LLaVA-NeXT 约 1990 由表 2 反推（公式外推），画面按 45×44 = 1980 块示意；
// 每层计算量按 Eq. (1) 的 Ω(s) = 2s²h + 12sh² 外推（h = 4096）。图片是本页画的示意图。
const SYS = 35;
const H = 4096;
const LAYERS = 32;
type Model = 'l15' | 'next';
const MODES: Record<Model, { label: string; V: number; cols: number; rows: number }> = {
  l15: { label: 'LLaVA-1.5：576', V: 576, cols: 24, rows: 24 },
  next: { label: 'LLaVA-NeXT：约 1990', V: 1990, cols: 45, rows: 44 },
};
const PHASES: Phase[] = [
  { at: 0, label: '一张图' },
  { at: 0.16, label: '切块' },
  { at: 0.36, label: '排进序列' },
  { at: 0.66, label: '逐层付费' },
];

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
function sci(x: number) {
  const e = Math.floor(Math.log10(x));
  return `${(x / Math.pow(10, e)).toFixed(2)}×10${String(e)
    .split('')
    .map((d) => SUP[Number(d)])
    .join('')}`;
}

/** 示意图：湖边小船（只用于本页演示） */
function paintPicture(size: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d')!;
  const sky = g.createLinearGradient(0, 0, 0, size * 0.6);
  sky.addColorStop(0, '#8fc3ea');
  sky.addColorStop(1, '#e8f3fb');
  g.fillStyle = sky;
  g.fillRect(0, 0, size, size);
  g.fillStyle = '#ffd36e';
  g.beginPath();
  g.arc(size * 0.74, size * 0.2, size * 0.08, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#7fa38a';
  g.beginPath();
  g.moveTo(0, size * 0.6);
  g.lineTo(size * 0.2, size * 0.4);
  g.lineTo(size * 0.38, size * 0.55);
  g.lineTo(size * 0.56, size * 0.36);
  g.lineTo(size * 0.78, size * 0.56);
  g.lineTo(size, size * 0.46);
  g.lineTo(size, size * 0.61);
  g.lineTo(0, size * 0.61);
  g.fill();
  const lake = g.createLinearGradient(0, size * 0.6, 0, size);
  lake.addColorStop(0, '#5a9bc7');
  lake.addColorStop(1, '#2f6f9c');
  g.fillStyle = lake;
  g.fillRect(0, size * 0.6, size, size * 0.4);
  for (let i = 0; i < 7; i++) {
    g.fillStyle = `rgba(255,236,190,${0.55 - i * 0.07})`;
    g.fillRect(size * 0.68 - i * 2, size * (0.64 + i * 0.04), size * 0.12 + i * 4, size * 0.012);
  }
  g.fillStyle = '#b5652e';
  g.beginPath();
  g.moveTo(size * 0.18, size * 0.78);
  g.lineTo(size * 0.42, size * 0.78);
  g.lineTo(size * 0.38, size * 0.84);
  g.lineTo(size * 0.22, size * 0.84);
  g.fill();
  g.fillStyle = '#fbf6ec';
  g.beginPath();
  g.moveTo(size * 0.3, size * 0.77);
  g.lineTo(size * 0.3, size * 0.56);
  g.lineTo(size * 0.41, size * 0.76);
  g.fill();
  return c;
}

export function VtwTokenBill(_: WidgetProps) {
  const [model, setModel] = useState<Model>('l15');
  const [I, setI] = useState(30);
  const M = MODES[model];
  const tl = useTimeline(11);
  const pic = useRef<HTMLCanvasElement | null>(null);
  const cells = M.cols * M.rows; // 画面上的图块数（NeXT 示意为 1980）
  const s = SYS + M.V + I;
  const full = omega(s, H);
  const save = 1 - omega(s - M.V, H) / full; // 撤掉视觉 token 后每层能省下的比例
  const tokShare = M.V / s;
  const quad = 2 * s * s * H;
  const lin = 12 * s * H * H;
  const jitter = useMemo(() => {
    const r = rng(7);
    return Array.from({ length: 2000 }, () => r());
  }, []);
  // 每个图块的颜色：渲染时同步取样，首帧就能画出完整画面
  const colors = useMemo(() => {
    if (!pic.current) pic.current = paintPicture(240);
    const g = pic.current.getContext('2d')!;
    const out: string[] = [];
    for (let r = 0; r < M.rows; r++)
      for (let c = 0; c < M.cols; c++) {
        const d = g.getImageData(Math.floor(((c + 0.5) / M.cols) * 240), Math.floor(((r + 0.5) / M.rows) * 240), 1, 1).data;
        out.push(`rgb(${d[0]},${d[1]},${d[2]})`);
      }
    return out;
  }, [M.cols, M.rows]);

  const stage = useStage(
    {
      heightOf: (w) => (w < 560 ? clamp((w - 42) * 0.47 + 170, 280, 400) : clamp(w * 0.78, 380, 500)),
      live: tl.playing,
      draw: ({ ctx, w, h, dt, final }) => {
        if (!final) tl.tick(dt);
        const p = tl.pRef.current;
        if (!pic.current) return tl.playing;
        ctx.clearRect(0, 0, w, h);
        const narrow = w < 560;
        const pad = 16;
        const imgY = pad + 18;
        const S = narrow ? Math.min((w - pad * 2 - 14) * 0.47, h - imgY - 110) : Math.min(h * 0.58, w * 0.36);
        const imgX = pad;
        const seqX = imgX + S + (narrow ? 14 : 28);
        const seqY = imgY;
        const seqW = w - seqX - pad;
        const seqH = S;
        const stripH = Math.max(narrow ? 62 : 76, h - imgY - S - 44);
        const stripY = h - stripH - 12;
        const total = SYS + cells + I;
        const cell = Math.max(2, Math.floor(Math.sqrt((seqW * seqH) / total) * 10) / 10);
        const scols = Math.max(8, Math.floor(seqW / cell));
        const seqPos = (i: number) => ({ x: seqX + (i % scols) * cell, y: seqY + Math.floor(i / scols) * cell });
        const pCut = clamp((p - 0.16) / 0.18, 0, 1);
        const pFly = clamp((p - 0.36) / 0.28, 0, 1);
        const pPay = clamp((p - 0.66) / 0.3, 0, 1);
        txt(ctx, '一张图（示意图）', imgX, imgY - 10, { size: 12, color: C.muted, weight: 600 });
        txt(ctx, narrow ? '输入序列（1 格 = 1 token）' : '输入序列：每个小方块 = 1 个 token', seqX, seqY - 10, { size: 12, color: C.muted, weight: 600 });
        // 原图（切块前完整可见，切块后淡出）
        if (pFly < 1) {
          ctx.save();
          ctx.globalAlpha = 1 - pCut * 0.85;
          ctx.drawImage(pic.current, imgX, imgY, S, S);
          ctx.restore();
        }
        // 切块网格线（扫描式出现）
        if (pCut > 0 && pFly < 1) {
          ctx.strokeStyle = rgba('#ffffff', 0.85 * (1 - pFly));
          ctx.lineWidth = 0.7;
          const lines = Math.floor(pCut * (M.cols + 1));
          ctx.beginPath();
          for (let k = 0; k <= lines && k <= M.cols; k++) {
            const x = imgX + (k / M.cols) * S;
            ctx.moveTo(x, imgY);
            ctx.lineTo(x, imgY + S);
            const y = imgY + (k / M.rows) * S;
            ctx.moveTo(imgX, y);
            ctx.lineTo(imgX + S, y);
          }
          ctx.stroke();
        }
        // 序列：系统 token 先到，指令 token 最后到
        const sysIn = clamp(pFly / 0.12, 0, 1);
        for (let i = 0; i < SYS; i++) {
          const q = clamp(sysIn * 1.4 - (i / SYS) * 0.4, 0, 1);
          if (q <= 0) continue;
          const { x, y } = seqPos(i);
          ctx.fillStyle = rgba(C.sys, q);
          ctx.fillRect(x, y, cell - 0.6, cell - 0.6);
        }
        const insIn = clamp((pFly - 0.85) / 0.15, 0, 1);
        for (let i = 0; i < I; i++) {
          const q = clamp(insIn * 1.4 - (i / I) * 0.4, 0, 1);
          if (q <= 0) continue;
          const { x, y } = seqPos(SYS + cells + i);
          ctx.fillStyle = rgba(C.waterLine, q);
          ctx.fillRect(x, y, cell - 0.6, cell - 0.6);
        }
        // 视觉 token：从图中的位置飞进序列
        const tw = S / M.cols;
        const th = S / M.rows;
        let arrived = 0;
        for (let i = 0; i < cells; i++) {
          const c = i % M.cols;
          const r = Math.floor(i / M.cols);
          const gap = pCut * Math.min(1.6, tw * 0.25);
          const q = easeInOut(clamp((pFly - 0.08 - (i / cells) * 0.62) / 0.22, 0, 1));
          if (q >= 1) arrived++;
          if (pCut <= 0 && q <= 0) continue;
          const { x: tx, y: ty } = seqPos(SYS + i);
          const arc = Math.sin(q * Math.PI) * (narrow ? 20 : 40) * (jitter[i % jitter.length] - 0.5);
          const x = lerp(imgX + c * tw + gap / 2, tx, q);
          const y = lerp(imgY + r * th + gap / 2, ty, q) + arc;
          const sz = lerp(Math.max(1, tw - gap), cell - 0.6, q);
          ctx.fillStyle = q > 0.98 ? C.leaf : colors[i] ?? C.leaf;
          ctx.fillRect(x, y, sz, sz);
        }
        // 逐层付费：序列扫过每一层，柱子依次亮起（每层都一样贵；棕色部分是视觉 token 带来的）
        const lw = (w - pad * 2) / LAYERS;
        const paid = pPay * LAYERS;
        txt(ctx, narrow ? `${LAYERS} 层，每层都算一遍` : `${LAYERS} 层：整段序列每层都要算一遍（棕色 = 视觉 token 带来的计算）`, pad, stripY - 10, { size: 12, color: C.muted, weight: 600 });
        const bh = stripH - 14;
        for (let l = 0; l < LAYERS; l++) {
          const x = pad + l * lw + 1;
          const k = clamp(paid - l, 0, 1);
          ctx.fillStyle = '#ebe5d8';
          rr(ctx, x, stripY, lw - 2, bh, 2);
          ctx.fill();
          if (k > 0) {
            const hh = bh * easeOut(k);
            ctx.fillStyle = C.waterLine;
            rr(ctx, x, stripY + bh - hh, lw - 2, hh, 2);
            ctx.fill();
            ctx.fillStyle = C.leaf;
            rr(ctx, x, stripY + bh - hh * save, lw - 2, hh * save, 2);
            ctx.fill();
          }
        }
        if (pPay > 0 && pPay < 1 && !final) {
          glow(ctx, pad + paid * lw, stripY + bh / 2, 22, C.blue, 0.5);
          ctx.fillStyle = rgba(C.blue, 0.12);
          ctx.fillRect(seqX, seqY + (paid % 1) * seqH - 3, seqW, 6);
        }
        // 关键时刻：原图位置只剩残影，写上结论
        if (pFly >= 1) {
          ctx.save();
          ctx.globalAlpha = 0.14;
          ctx.drawImage(pic.current, imgX, imgY, S, S);
          ctx.restore();
          ctx.strokeStyle = rgba(C.leaf, 0.4);
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(imgX + 0.5, imgY + 0.5, S - 1, S - 1);
          ctx.setLineDash([]);
          const a1 = final ? 1 : clamp((p - 0.62) / 0.05, 0, 1);
          const a2 = final ? (p >= 0.95 ? 1 : 0) : clamp((p - 0.95) / 0.04, 0, 1);
          const cx = imgX + S / 2;
          txt(ctx, `${M.V}`, cx, imgY + S * 0.3, { size: Math.min(44, S * 0.2), color: C.leaf, align: 'center', weight: 800, alpha: a1 });
          txt(ctx, `个视觉 token / 共 ${s} 个`, cx, imgY + S * 0.3 + Math.min(32, S * 0.14), { size: narrow ? 11 : 13, color: C.ink, align: 'center', weight: 700, alpha: a1 });
          txt(ctx, `约占每层计算的 ${Math.round(save * 100)}%`, cx, imgY + S * 0.68, { size: narrow ? 13 : 16, color: C.ink, align: 'center', weight: 800, alpha: a2 });
          txt(ctx, '（Eq. 1 外推）', cx, imgY + S * 0.68 + 20, { size: 11, color: C.muted, align: 'center', alpha: a2 });
        }
        const inSeq = (sysIn > 0 ? SYS : 0) + Math.round((arrived / cells) * M.V) + (insIn >= 1 ? I : 0);
        txt(ctx, `${narrow ? '序列' : '序列长度'} ${inSeq} / ${s}`, narrow ? w - pad : seqX + seqW, narrow ? stripY - 10 : seqY - 10, { size: 12, color: C.ink, align: 'right', weight: 700 });
        return tl.playing;
      },
    },
    [model, I, s, save, colors, tl.playing ? -1 : tl.p, tl.playing]
  );

  useEffect(() => tl.onVisible(stage.animate), [stage.animate, tl]);

  const phase = [...PHASES].reverse().find((ph) => tl.p >= ph.at)?.label ?? '一张图';
  const lead: Record<string, string> = {
    一张图: '这是一张普通的图。大模型看不懂像素，要先把它变成一个个 token。',
    切块: `图被切成 ${M.cols}×${M.rows} 个小块，每块经过视觉编码器和投影，变成一个视觉 token。`,
    排进序列: `视觉 token 排进输入序列，夹在 ${SYS} 个系统 token 和 ${I} 个指令 token 中间，占了 ${(tokShare * 100).toFixed(0)}%。`,
    逐层付费: `整段序列要在 ${LAYERS} 层里各算一遍；按 Eq. (1) 外推，每层计算有 ${(save * 100).toFixed(0)}% 是视觉 token 带来的。`,
  };
  return (
    <div className="vtw vtw-live">
      <div className="lv-split">
        <StageCanvas s={stage} label={`示意：一张图被切成 ${M.V} 个视觉 token，排进共 ${s} 个 token 的输入序列；按 Eq. (1) 外推，视觉 token 约占每层计算的 ${Math.round(save * 100)}%`} />
        <div className="lv-side">
          <TimeBar tl={tl} phases={PHASES} label="从图片到每层计算量的进度" />
          <Seg<Model>
            label="模型的视觉 token 数"
            value={model}
            onChange={(m) => {
              setModel(m);
              tl.replay();
            }}
            options={(Object.keys(MODES) as Model[]).map((k) => ({ value: k, label: MODES[k].label }))}
          />
          <Range label="指令 token 数（用户的问题）" value={I} min={10} max={300} step={5} onChange={(v) => setI(clamp(v, 10, 300))} tone="blue" />
          <Feedback tone="info">{lead[phase]}</Feedback>
          <p className="vtw-eq">
            <SymbolHint meaning="第 t 次推理时第 1 层的输入序列">X</SymbolHint>
            <sub>1</sub>
            <sup>t</sup> = [ <SymbolHint meaning="系统 token：固定的系统提示，LLaVA-1.5 为 35 个">S</SymbolHint>
            <sub>1</sub>, <SymbolHint meaning="视觉 token：图像经视觉编码器和投影得到">𝒱</SymbolHint>
            <sub>1</sub>, <SymbolHint meaning="指令 token：用户的问题，长度随问题变化">I</SymbolHint>
            <sub>1</sub>, <SymbolHint meaning="输出 token：已经生成的回答；首轮为空">O</SymbolHint>
            <sub>1</sub>
            <sup>t</sup> ]
          </p>
          <p className="vtw-eq">
            <SymbolHint meaning="一个解码层的计算复杂度（MHA + FFN）">Ω</SymbolHint> = 2<SymbolHint meaning="输入序列长度（token 数），含视觉 token">s</SymbolHint>
            <sup>2</sup>
            <SymbolHint meaning="隐藏维度；Vicuna-7B 为 4096">h</SymbolHint> + 12<i>s</i>
            <i>h</i>
            <sup>2</sup>
          </p>
          <p className="lv-read">
            <span>s = {s}</span>
            <span>视觉占输入 <b>{(tokShare * 100).toFixed(0)}%</b></span>
            <span>
              占每层计算 <b className="vtw-green">{(save * 100).toFixed(0)}%</b>
            </span>
          </p>
          <p className="lv-note">
            2s²h = {sci(quad)}，12sh² = {sci(lin)}：线性项占 {((lin / (lin + quad)) * 100).toFixed(0)}%。单张图、首轮推理，输出 token 暂为 0；{model === 'next' ? '约 1990 由表 2 反推（公式外推），画面按 45×44 = 1980 块示意。' : '576 与 35 来自论文正文。'}
          </p>
        </div>
      </div>
    </div>
  );
}
