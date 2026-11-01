import React, { useRef, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';
import { C, Feedback, Range, clamp } from './vtw-kit';
import { Anim, pill, rgba, rr, txt, useStage } from '../live/stage';
import { StageCanvas } from '../live/TimeBar';
import '../live/live.css';

// 6.1 撤出后每层 KV Cache 的长度（LLaVA-1.5-7B 口径，本页外推）：
// L_ℓ = s + t（ℓ ≤ K），s − V + t（ℓ > K）；M_KV = 2·b·h·Σ L_ℓ（fp16，b = 2 字节，h = 4096）。
// 论文没有给出这个公式；表 4 的显存实测（NeXT-7B，含激活值）不能与它直接比较。
// 更新策略：拖动 K 或 t 时柱子与读数同时到位；一次跳过多层（键盘 Home/End）时，撤出线与柱子一起短暂过渡，读数直接取终值。
const N = 32;
const S = 641;
const V = 576;
const H = 4096;
const B = 2;
const GB = 1024 ** 3;

export function VtwKvCache(_: WidgetProps) {
  const [K, setK] = useState(16);
  const [t, setT] = useState(128);
  const anim = useRef(new Anim()).current;
  const len = (l: number) => (l <= K ? S + t : S - V + t);
  const total = Array.from({ length: N }, (_, i) => len(i + 1)).reduce((a, b) => a + b, 0);
  const totalBase = N * (S + t);
  const mem = (2 * B * H * total) / GB;
  const memBase = (2 * B * H * totalBase) / GB;

  const s = useStage(
    {
      heightOf: (w) => (w < 520 ? clamp(w * 0.8, 260, 340) : clamp(w * 0.5, 300, 360)),
      draw: ({ ctx, w, h, dt, final }) => {
        anim.begin();
        ctx.clearRect(0, 0, w, h);
        const kA = anim.to('K', K, dt, final, 12, 1.01);
        const tA = anim.to('t', t, dt, final, 12, 16.01);
        const left = 16;
        const right = w - 16;
        const top = 44;
        const base = h - 58;
        const bw = (right - left) / N;
        const maxLen = S + 512;
        const Y = (v: number) => (v / maxLen) * (base - top);
        txt(ctx, '每根柱子 = 一层缓存的 token 数', left, 16, { size: 12, color: C.muted, weight: 600 });
        for (let i = 0; i < N; i++) {
          const x = left + i * bw + 1;
          const ww = bw - 3;
          const visK = clamp(kA - i, 0, 1); // 撤出线经过这一层时，视觉部分连续收起
          const hText = Y(S - V + tA);
          const hVis = Y(V) * visK;
          ctx.strokeStyle = '#c9d1dd';
          ctx.setLineDash([4, 3]);
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 0.5, base - Y(S + tA) + 0.5, ww - 1, Y(S + tA) - 1);
          ctx.setLineDash([]);
          ctx.fillStyle = '#e6eff8';
          rr(ctx, x, base - hText, ww, hText, 2);
          ctx.fill();
          ctx.strokeStyle = C.waterLine;
          ctx.lineWidth = 1;
          rr(ctx, x + 0.5, base - hText + 0.5, ww - 1, hText - 1, 2);
          ctx.stroke();
          if (hVis > 0.5) {
            ctx.fillStyle = C.leaf;
            rr(ctx, x, base - hText - hVis, ww, hVis, 2);
            ctx.fill();
          }
        }
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(left - 4, base);
        ctx.lineTo(right, base);
        ctx.stroke();
        txt(ctx, '第 1 层', left, base + 16, { size: 12, color: C.muted });
        txt(ctx, '第 32 层', right, base + 16, { size: 12, color: C.muted, align: 'right' });
        // 图例
        const ly = base + 40;
        const items: [string, (x: number) => void][] = [
          ['视觉 token 的缓存', (x) => ((ctx.fillStyle = C.leaf), ctx.fillRect(x, ly - 6, 12, 12))],
          ['文字 token', (x) => ((ctx.fillStyle = '#e6eff8'), ctx.fillRect(x, ly - 6, 12, 12), (ctx.strokeStyle = C.waterLine), ctx.strokeRect(x + 0.5, ly - 5.5, 11, 11))],
          ['原模型', (x) => ((ctx.strokeStyle = '#9aa7b8'), ctx.setLineDash([3, 2]), ctx.strokeRect(x + 0.5, ly - 5.5, 11, 11), ctx.setLineDash([]))],
        ];
        let lx = left;
        ctx.font = `500 12px system-ui, sans-serif`;
        items.forEach(([label, sw]) => {
          sw(lx);
          txt(ctx, label, lx + 18, ly, { size: 12, color: C.muted });
          lx += 18 + ctx.measureText(label).width + 22;
        });
        // 撤出线与标签最后画
        if (kA < N) {
          const xk = left + kA * bw - 1;
          ctx.strokeStyle = C.orange;
          ctx.lineWidth = 2.5;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.moveTo(xk, top - 10);
          ctx.lineTo(xk, base + 6);
          ctx.stroke();
          ctx.setLineDash([]);
          pill(ctx, `第 ${K + 1} 层起不存视觉 token`, kA > N * 0.6 ? xk - 6 : xk + 6, top - 12, { size: 12, color: C.orange, align: kA > N * 0.6 ? 'right' : 'left', minX: 4, maxX: w - 4 });
        }
        return anim.moving;
      },
    },
    [K, t]
  );

  return (
    <div className="vtw vtw-live">
      <div className="lv-split">
        <StageCanvas s={s} label={`K = ${K}，已生成 ${t} 个词：32 层里前 ${K} 层缓存 ${S + t} 个 token，之后每层 ${S - V + t} 个；VTW 的 KV 缓存约 ${mem.toFixed(2)} GB，原模型约 ${memBase.toFixed(2)} GB`} />
        <div className="lv-side">
          <p className="vtw-eq">
            <SymbolHint meaning="KV Cache 占用的字节数（单个样本）">M</SymbolHint>
            <sub>KV</sub> = 2 · <SymbolHint meaning="每个数值的字节数；fp16 为 2">b</SymbolHint> · <SymbolHint meaning="隐藏维度；LLaVA-1.5-7B 为 4096">h</SymbolHint> · Σ <SymbolHint meaning="第 ℓ 层缓存的 token 数：前 K 层为 s + t，之后为 s − V + t">L</SymbolHint>
            <sub>ℓ</sub>
          </p>
          <Range label="撤出层 K（前 K 层带视觉）" value={K} min={1} max={32} onChange={(v) => setK(clamp(v, 1, 32))} display={`K = ${K}`} />
          <Range label="已经生成的词数 t" value={t} min={0} max={512} step={16} onChange={setT} tone="blue" display={`t = ${t}`} />
          <p className="lv-read">
            <span>缓存</span>
            <span className="vtw-em vtw-green">{mem.toFixed(2)} GB</span>
            <span className="lv-note">原模型 {memBase.toFixed(2)} GB</span>
          </p>
          <Feedback tone={K < N ? 'ok' : 'info'}>
            {K < N
              ? `深层缓存只剩 ${S - V + t} 个 token，总缓存降到原模型的 ${((total / totalBase) * 100).toFixed(0)}%；回答越长，节省的比例越小。`
              : 'K = 32 等于不撤出：每层都存着全部视觉 token。'}
          </Feedback>
          <p className="lv-note">按本页公式估算（fp16、单样本），不是显存实测；表 4 的显存含激活值，不能直接比较。</p>
        </div>
      </div>
    </div>
  );
}
