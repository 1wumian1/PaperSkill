import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';
import { Btn, C, Feedback, Range, Seg, clamp, waterTint } from './vtw-kit';
import { computeFlops, omega, type LayerConv } from './vtw-data';
import { Anim, easeOut, glow, pill, rgba, rng, rr, txt, useStage } from '../live/stage';
import { useTimeline } from '../live/timeline';
import { StageCanvas, TimeBar, type Phase } from '../live/TimeBar';
import '../live/live.css';

// 5.1 撤出过程（LLaVA-1.5-7B，32 层；自 v5.1 的“撤出穿越”回迁）。
// 时间轴 = 计算推进到第几层：token 通道逐层上升 → 到撤出边界时视觉通道停下、被撤走 → 文字通道继续上升；
// 右侧两根累计计算量随同一进度增长（Eq. 1 外推，s ≈ 641、V = 576）。
// 层号口径：官方代码 layer_idx == K（0 起）时撤出 → 前 K 层带视觉 token；Eq. (5) 字面 → 前 K−1 层。
// 光柱数量只是示意，不是真实 token 数。
const N = 32;
const S = 641.4;
const V = 576;
const H = 4096;
const LANES: ('sys' | 'vis' | 'txt')[] = ['sys', 'sys', ...Array<'vis'>(12).fill('vis'), 'txt', 'txt', 'txt'];
const VIS0 = 2;
const VIS1 = 14;
const CLIMB = 0.82; // 爬升占进度的前 82%
const BURST = 0.09; // 撤出瞬间的散开持续的进度长度
const SETTLE = 0.9; // 进入“算账”
const PER = omega(S, H);
const PER_TEXT = omega(S - V, H);

export function VtwWithdrawTower(_: WidgetProps) {
  const [K, setK] = useState(16);
  const [conv, setConv] = useState<LayerConv>('code');
  const full = conv === 'code' ? K : K - 1; // 带视觉 token 的层数
  const tl = useTimeline(9);
  const anim = useRef(new Anim()).current;
  const r = computeFlops({ model: 'l15-7b', s: S, V, method: 'vtw', K, R: 0.5, conv, scope: 'all' });
  const pK = (full / N) * CLIMB; // 光波到达撤出边界的进度
  const parts = useMemo(() => {
    const g = rng(11);
    return Array.from({ length: 64 }, () => ({ lane: Math.floor(g() * (VIS1 - VIS0)), vx: (g() - 0.5) * 2, vy: -0.4 - g() * 1.1, life: 0.55 + g() * 0.45, size: 2 + g() * 2.5 }));
  }, []);

  const phases: Phase[] = [
    { at: 0, label: `前 ${full} 层：全部 token` },
    { at: pK, label: `第 ${full + 1} 层入口：撤出` },
    { at: Math.min(SETTLE - 0.03, pK + BURST + 0.02), label: '只剩文字继续' },
    { at: SETTLE, label: '算账' },
  ];

  const s = useStage(
    {
      heightOf: (w) => (w < 560 ? clamp(w * 1.05, 360, 470) : clamp(w * 0.64, 400, 500)),
      live: tl.playing,
      draw: ({ ctx, w, h, t, dt, final }) => {
        if (!final) tl.tick(dt);
        anim.begin();
        const p = tl.pRef.current;
        ctx.clearRect(0, 0, w, h);
        const narrow = w < 560;
        const meterW = narrow ? w - 28 : Math.min(200, w * 0.28);
        const meterH = narrow ? 92 : h - 36;
        const towerX = 44;
        const towerY = 18;
        const towerW = narrow ? w - towerX - 14 : w - meterW - towerX - 34;
        const towerH = narrow ? h - meterH - 48 : h - 40;
        const rh = towerH / N;
        const lw = towerW / LANES.length;
        const Y = (l: number) => towerY + towerH - rh * (l + 1); // 第 l 层（0 起）的顶部
        const front = clamp(p / CLIMB, 0, 1) * N; // 已经算到的层数（连续）
        const fullA = anim.to('full', full, dt, final, 12, 1.01); // 拖动 K 时边界跟手，点按钮时平滑移动
        const crossed = front >= full;
        const q = clamp((p - pK) / BURST, 0, 1); // 撤出瞬间的进度
        const visL = towerX + lw * VIS0;
        const visR = towerX + lw * VIS1;
        const yK = towerY + towerH - rh * fullA; // 撤出边界
        // 层号
        for (let l = 0; l < N; l++) {
          const mark = l === 0 || l === N - 1 || l === full - 1 || l === full || (l + 1) % 8 === 0;
          const crowded = Math.abs(l - (full - 1)) === 1 || Math.abs(l - full) === 1;
          if (mark && !(crowded && l !== full - 1 && l !== full)) txt(ctx, `${l + 1}`, towerX - 8, Y(l) + rh / 2, { size: 11, color: l < full ? C.ink : C.muted, align: 'right', weight: l === full - 1 || l === full ? 700 : 500 });
        }
        txt(ctx, '层', towerX - 8, towerY - 6, { size: 11, color: C.muted, align: 'right' });
        // 撤出后空出来的区域：省下的计算
        if (crossed && fullA < N) {
          const a = clamp(q * 2, 0, 1);
          ctx.fillStyle = rgba(C.leaf, 0.06 * a);
          ctx.fillRect(visL, towerY, visR - visL, yK - towerY);
          ctx.strokeStyle = rgba(C.leaf, 0.35 * a);
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = 1.5;
          ctx.strokeRect(visL + 1, towerY + 1, visR - visL - 2, yK - towerY - 2);
          ctx.setLineDash([]);
        }
        // token 通道
        LANES.forEach((ty, j) => {
          const x = towerX + lw * j + lw * 0.16;
          const ww = lw * 0.68;
          const top = ty === 'vis' ? Math.min(front, fullA) : front;
          for (let l = 0; l < N; l++) {
            if (ty === 'vis' && l >= fullA) continue;
            const lit = clamp(top - l, 0, 1);
            const y = Y(l) + 1;
            if (ty === 'txt') {
              // 文字 token 在带视觉 token 的层里逐层“染色”（吸收图像信息，教学示意），撤出后保持
              ctx.fillStyle = waterTint((Math.min(l + 1, fullA) / Math.max(fullA, 1)) * 0.85);
              ctx.globalAlpha = 0.25 + 0.75 * lit;
              ctx.fillRect(x, y, ww, rh - 2);
              ctx.globalAlpha = 1;
              ctx.strokeStyle = rgba(C.waterLine, 0.3 + 0.5 * lit);
              ctx.lineWidth = 1;
              ctx.strokeRect(x + 0.5, y + 0.5, ww - 1, rh - 3);
            } else {
              ctx.fillStyle = rgba(ty === 'sys' ? C.sys : C.leaf, 0.12 + 0.83 * lit);
              ctx.fillRect(x, y, ww, rh - 2);
            }
          }
          // 通道头部：正在计算的这一层
          if (top > 0 && top < N && !(ty === 'vis' && crossed)) glow(ctx, x + ww / 2, Y(Math.floor(top)) + rh * (1 - (top % 1)), lw * 0.8, ty === 'vis' ? C.leaf : C.blue, 0.4);
        });
        // 撤出边界
        if (fullA < N) {
          ctx.strokeStyle = rgba(C.orange, crossed ? 1 : 0.6);
          ctx.lineWidth = crossed ? 3 : 2;
          ctx.setLineDash(crossed ? [] : [7, 6]);
          ctx.beginPath();
          ctx.moveTo(towerX - 2, yK);
          ctx.lineTo(towerX + towerW + 2, yK);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        // 撤出瞬间：边界处闪一下，视觉 token 向外散开、淡出
        if (crossed && q < 1 && !final) {
          const flash = 1 - q;
          const g = ctx.createLinearGradient(0, yK - 34, 0, yK + 34);
          g.addColorStop(0, rgba(C.orange, 0));
          g.addColorStop(0.5, rgba(C.orange, 0.28 * flash));
          g.addColorStop(1, rgba(C.orange, 0));
          ctx.fillStyle = g;
          ctx.fillRect(visL - 16, yK - 34, visR - visL + 32, 68);
          for (const pt of parts) {
            if (q > pt.life) continue;
            const k = q / pt.life;
            const x = visL + lw * (pt.lane + 0.5) + pt.vx * 80 * easeOut(k);
            const y = yK + pt.vy * 90 * easeOut(k) + 50 * k * k;
            ctx.fillStyle = rgba(C.leaf, (1 - k) * 0.85);
            rr(ctx, x - pt.size, y - pt.size, pt.size * 2, pt.size * 2, 1.5);
            ctx.fill();
          }
        }
        // 累计计算量（Eq. 1 外推）：同一进度驱动
        const mx = narrow ? 14 : towerX + towerW + 30;
        const my = narrow ? h - meterH - 6 : towerY;
        const spentBase = front / N;
        const spentVtw = (Math.min(front, full) * PER + Math.max(0, front - full) * PER_TEXT) / (N * PER);
        const bars = [
          { label: '原模型', v: spentBase, col: C.blue },
          { label: 'VTW', v: spentVtw, col: C.green },
        ];
        txt(ctx, '累计计算量（Eq. 1 外推）', mx, my + 6, { size: 12, color: C.muted, weight: 600 });
        bars.forEach((b, i) => {
          if (narrow) {
            const y = my + 26 + i * 30;
            const bw = meterW - 116;
            txt(ctx, b.label, mx, y + 8, { size: 12, color: C.ink });
            ctx.fillStyle = '#e9edf3';
            rr(ctx, mx + 56, y, bw, 16, 8);
            ctx.fill();
            ctx.fillStyle = b.col;
            rr(ctx, mx + 56, y, bw * b.v, 16, 8);
            ctx.fill();
            txt(ctx, `${(b.v * 100).toFixed(0)}%`, mx + 64 + bw, y + 8, { size: 13, color: C.ink, weight: 700 });
          } else {
            const bw = (meterW - 24) / 2;
            const x = mx + i * (bw + 24);
            const top = my + 46;
            const Hh = meterH - 96;
            ctx.fillStyle = '#e9edf3';
            rr(ctx, x, top, bw, Hh, 10);
            ctx.fill();
            const hh = Hh * b.v;
            ctx.fillStyle = b.col;
            rr(ctx, x, top + Hh - hh, bw, hh, 10);
            ctx.fill();
            txt(ctx, `${(b.v * 100).toFixed(0)}%`, x + bw / 2, top - 14, { size: 15, color: b.col, align: 'center', weight: 800 });
            txt(ctx, b.label, x + bw / 2, top + Hh + 16, { size: 12, color: C.ink, align: 'center', weight: 600 });
          }
        });
        // 标签最后画，不被通道或光点挡住
        if (fullA < N) pill(ctx, `第 ${full + 1} 层入口：撤走视觉 token`, towerX + towerW, yK + 14, { size: 12, color: C.orange, align: 'right' });
        const roomAbove = yK - towerY;
        if (crossed && front >= Math.min(full + 3, N) && roomAbove > 60) pill(ctx, '撤走后：这一片不再计算', (visL + visR) / 2, towerY + roomAbove / 2, { size: 12, color: C.leaf, align: 'center' });
        if (p >= SETTLE) {
          const k = final ? 1 : clamp((p - SETTLE) / 0.04, 0, 1);
          ctx.globalAlpha = 0.6 + 0.4 * k;
          pill(ctx, `总计算量约为原模型的 ${r.ratio.toFixed(1)}%（外推）`, towerX + towerW / 2, towerY + 16 + 6 * (1 - k), { size: narrow ? 13 : 14, color: C.green, align: 'center', minX: 4, maxX: w - 4 });
          ctx.globalAlpha = 1;
        }
        return anim.moving || tl.playing;
      },
    },
    [full, r.ratio, tl.playing ? -1 : tl.p, tl.playing]
  );

  useEffect(() => tl.onVisible(s.animate), [s.animate, tl]);

  const p = tl.p;
  const front = clamp(p / CLIMB, 0, 1) * N;
  const layer = Math.max(1, Math.ceil(front - 1e-6));
  const crossed = front >= full;
  const settled = p >= SETTLE;
  return (
    <div className="vtw vtw-live">
      <div className="lv-split">
        <StageCanvas s={s} label={`LLaVA-1.5-7B 共 32 层：前 ${full} 层计算全部 token，第 ${full + 1} 层入口撤走视觉 token，之后只剩系统与文字 token；当前算到第 ${layer} 层；按 Eq. (1) 外推，总计算量约为原模型的 ${r.ratio.toFixed(1)}%`} />
        <div className="lv-side">
          <TimeBar tl={tl} phases={phases} label="token 穿过 32 层的进度" valueText={`算到第 ${layer} 层`} />
          <Range label="撤出层 K" value={K} min={2} max={31} onChange={(v) => setK(clamp(v, 2, 31))} display={`K = ${K}`} />
          <Seg<LayerConv>
            label="层号口径"
            value={conv}
            onChange={setConv}
            options={[
              { value: 'code', label: '代码：前 K 层' },
              { value: 'eq5', label: 'Eq. (5)：前 K−1 层' },
            ]}
          />
          <Btn onClick={() => setK(16)} disabled={K === 16}>
            恢复表 2 的 K = 16
          </Btn>
          <p className="vtw-eq">
            <SymbolHint meaning="撤出视觉 token 后只剩文字 token 的序列">𝒳</SymbolHint>
            <sub>K</sub> = <SymbolHint meaning="经过前面各层后的完整序列">X</SymbolHint>
            <sub>K</sub> − <SymbolHint meaning="序列中的视觉 token 部分">𝒱</SymbolHint>
            <sub>K</sub>，<SymbolHint meaning="从第 i 层到第 j 层的解码层">D</SymbolHint>
            <sub>K:N</sub>(<i>𝒳</i>
            <sub>K</sub>)
          </p>
          <p className="lv-read">
            <span>总计算量</span>
            <span className="vtw-em vtw-green">{r.ratio.toFixed(1)}%</span>
            <span className="lv-note">表 2 · K = 16：55.19%</span>
          </p>
          <Feedback tone={settled ? 'ok' : 'info'}>
            {!crossed
              ? `算到第 ${layer} 层：前 ${full} 层照常计算，视觉、系统、文字 token 一起往上走。`
              : !settled
                ? `第 ${full + 1} 层入口：视觉 token 被一次性撤走；文字 token 带着前 ${full} 层吸收的图像信息继续往上，每层只花原来约 ${((PER_TEXT / PER) * 100).toFixed(0)}%。`
                : `K = ${K}（${conv === 'code' ? '代码口径' : 'Eq. (5) 口径'}）时，总计算量约为原模型的 ${r.ratio.toFixed(1)}%（Eq. 1 外推）。`}
          </Feedback>
        </div>
      </div>
    </div>
  );
}
