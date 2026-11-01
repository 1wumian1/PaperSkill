import React, { useEffect, useRef, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';
import { Btn, C, Feedback, Range, TeaCup, clamp, waterTint } from './vtw-kit';
import { Anim, arrowLine, glow, pill, rgba, rr, txt, useStage } from '../live/stage';
import { useTimeline } from '../live/timeline';
import { StageCanvas, TimeBar, type Phase } from '../live/TimeBar';
import '../live/live.css';

// 4.1 信息迁移（8 层小模型，教学示意；自 v5.1 的信息流动画回迁）。
// 时间轴 = 计算进行到第几层。因果掩码只允许排在后面的 token 读前面的 token：
// 每层问题 token 从左边的视觉 token 吸收一部分图像信息（示意规则：每层吸收剩余部分的 42%），
// 系统 token 排在图像之前，永远读不到；第 K+1 层入口撤出视觉 token 后，已吸收的信息保留、不再增加。
// “吸收量”只是示意量，模型里没有这样一个可以直接读出的数，所以画面不标百分比。
// 茶杯与画布由同一进度驱动：茶汤颜色 = 问题 token 已吸收的信息，越过 K 后茶包连续提起。
const N = 8;
const TOK: ('sys' | 'vis' | 'ins')[] = ['sys', 'sys', 'vis', 'vis', 'vis', 'vis', 'vis', 'ins', 'ins', 'ins'];
const NAME = { sys: '系统', vis: '视觉', ins: '问题' } as const;
const RATE = 0.42;
const absorbed = (layers: number, K: number) => 1 - Math.pow(1 - RATE, clamp(Math.min(layers, K), 0, N));

export function VtwInfoMigration(_: WidgetProps) {
  const [K, setK] = useState(4);
  const [reverse, setReverse] = useState(false);
  const tl = useTimeline(7);
  const anim = useRef(new Anim()).current;
  const phases: Phase[] = [
    { at: 0, label: '开始计算' },
    { at: 0.5 / N, label: '问题 token 吸收中' },
    ...(K < N ? [{ at: K / N, label: `第 ${K + 1} 层入口撤出` }] : []),
  ];

  const s = useStage(
    {
      heightOf: (w) => (w < 520 ? clamp(w * 0.95, 320, 420) : clamp(w * 0.74, 360, 480)),
      // 正在吸收的层（播放或暂停在那里）需要持续流动的光点；其余时间不跑循环
      live: tl.playing || (!reverse && tl.p > 0 && tl.p * N < K),
      draw: ({ ctx, w, h, t, dt, final }) => {
        if (!final) tl.tick(dt);
        anim.begin();
        const L = tl.pRef.current * N; // 已计算的层数（连续）
        ctx.clearRect(0, 0, w, h);
        const narrow = w < 520;
        const meterW = narrow ? 0 : 96;
        const left = 52;
        const right = w - meterW - 14;
        const top = 34;
        const bottom = h - (narrow ? 64 : 34);
        const cw = (right - left) / TOK.length;
        const rh = (bottom - top) / N;
        const X = (j: number) => left + cw * (j + 0.5);
        const Y = (l: number) => bottom - rh * (l + 0.5);
        const sz = Math.min(cw, rh) * 0.62;
        // 列名
        TOK.forEach((ty, j) => {
          if (j > 0 && TOK[j - 1] === ty) return;
          const n = TOK.filter((x) => x === ty).length;
          txt(ctx, `${NAME[ty]} token`, X(j) - cw / 2 + (n * cw) / 2, 16, { size: 12, color: ty === 'vis' ? C.leaf : ty === 'sys' ? C.muted : C.blue, align: 'center', weight: 700 });
        });
        for (let l = 0; l < N; l++) txt(ctx, `第 ${l + 1} 层`, left - 8, Y(l), { size: 11, color: l < L ? C.ink : C.muted, align: 'right' });
        const kA = anim.to('K', K, dt, final, 10, 1.01);
        // 格子
        for (let l = 0; l < N; l++) {
          const reached = clamp(L - l, 0, 1);
          TOK.forEach((ty, j) => {
            const x = X(j) - sz / 2;
            const y = Y(l) - sz / 2;
            if (ty === 'vis') {
              const gone = l >= kA;
              const k = gone ? 0.4 : 1;
              ctx.fillStyle = rgba(C.leaf, gone ? 0.08 : 0.18 + 0.77 * reached);
              rr(ctx, X(j) - (sz * k) / 2, Y(l) - (sz * k) / 2, sz * k, sz * k, 4);
              ctx.fill();
            } else if (ty === 'sys') {
              ctx.fillStyle = rgba(C.sys, 0.25 + 0.65 * reached);
              rr(ctx, x, y, sz, sz, 4);
              ctx.fill();
            } else {
              // 问题 token：底色清水，图像信息从下往上“涨”起茶色（这一层算完时已吸收的量）
              ctx.fillStyle = rgba('#e6eff8', 0.5 + 0.5 * reached);
              rr(ctx, x, y, sz, sz, 4);
              ctx.fill();
              const fill = reached > 0 ? absorbed(l + reached, kA) : 0;
              if (fill > 0.01) {
                ctx.save();
                rr(ctx, x, y, sz, sz, 4);
                ctx.clip();
                ctx.fillStyle = waterTint(0.35 + 0.6 * fill);
                ctx.fillRect(x, y + sz * (1 - fill), sz, sz * fill);
                ctx.restore();
              }
              ctx.strokeStyle = rgba(C.waterLine, 0.4 + 0.5 * reached);
              ctx.lineWidth = 1.5;
              rr(ctx, x + 0.75, y + 0.75, sz - 1.5, sz - 1.5, 4);
              ctx.stroke();
            }
          });
        }
        // 撤出边界
        if (kA < N) {
          const yK = bottom - rh * kA;
          ctx.strokeStyle = C.orange;
          ctx.lineWidth = 2.5;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.moveTo(X(2) - cw / 2 - 4, yK);
          ctx.lineTo(X(6) + cw / 2 + 4, yK);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        // 当前层的信息流：视觉 → 问题（只沿因果允许的方向）
        const cl = Math.min(Math.floor(L), N - 1);
        if (!reverse && L > 0 && cl < K) {
          [7, 9].forEach((j) => [2, 4, 6].forEach((vj) => arrowLine(ctx, X(vj), Y(cl) - sz / 2 - 2, X(j), Y(cl) - sz / 2 - 2, 1, rgba(C.blue, 0.65), 2, 7, -(j - vj) * 7)));
          if (!final)
            for (let k = 0; k < 9; k++) {
              const q = (t * 0.8 + k / 9) % 1;
              const vj = [2, 4, 6][k % 3];
              const j = k % 2 ? 7 : 9;
              const x = X(vj) + (X(j) - X(vj)) * q;
              glow(ctx, x, Y(cl) - sz / 2 - 2 - 2 * q * (1 - q) * (j - vj) * 7 * 0.4, 7, C.tea, 0.95);
            }
        }
        // 反向尝试：视觉 token 想读后面的问题 token，被因果掩码挡住
        if (reverse) {
          const l = clamp(Math.min(Math.floor(L), K) - 1, 0, N - 1);
          [3, 5].forEach((vj) => {
            arrowLine(ctx, X(8), Y(l) + sz / 2 + 4, X(vj), Y(l) + sz / 2 + 4, 0.8, rgba(C.red, 0.9), 2, 0, 10);
            txt(ctx, '✕', (X(vj) + X(8)) / 2, Y(l) + sz / 2 + 10, { size: 16, color: C.red, align: 'center', weight: 800 });
          });
        }
        // 右侧：问题 token 携带的图像信息（示意，不标数）
        const val = reverse ? 0 : absorbed(L, kA) / absorbed(N, N);
        const mx = narrow ? left : w - meterW + 22;
        const my = narrow ? h - 34 : top;
        const mw = narrow ? w - left - 14 : 28;
        const mh = narrow ? 14 : bottom - top;
        txt(ctx, narrow ? '问题 token 携带的图像信息（示意）' : '携带的图像信息', narrow ? mx : mx + mw / 2, narrow ? my - 12 : my - 18, { size: 11, color: C.muted, align: narrow ? 'left' : 'center' });
        ctx.fillStyle = '#e9edf3';
        rr(ctx, mx, my, mw, mh, 7);
        ctx.fill();
        ctx.fillStyle = waterTint(0.35 + 0.6 * val);
        if (narrow) rr(ctx, mx, my, mw * val, mh, 7);
        else rr(ctx, mx, my + mh * (1 - val), mw, mh * val, 7);
        ctx.fill();
        if (!narrow) {
          txt(ctx, '多', mx + mw + 6, my + 8, { size: 11, color: C.muted });
          txt(ctx, '少', mx + mw + 6, my + mh - 8, { size: 11, color: C.muted });
          txt(ctx, '（示意）', mx + mw / 2, my + mh + 16, { size: 11, color: C.muted, align: 'center' });
        }
        // 标签最后画
        if (kA < N) pill(ctx, `第 ${K + 1} 层入口撤出`, X(2) - cw / 2, bottom - rh * kA - 14, { size: 12, color: C.orange, minX: 4 });
        if (reverse) {
          const l = clamp(Math.min(Math.floor(L), K) - 1, 0, N - 1);
          pill(ctx, 'Λ = −∞：不能读排在后面的 token', X(6), Math.min(bottom - 10, Y(l) + sz / 2 + 32), { size: 12, color: C.red, align: 'center', minX: 4, maxX: right });
        }
        return anim.moving || tl.playing;
      },
    },
    [K, reverse, tl.playing ? -1 : tl.p, tl.playing]
  );

  useEffect(() => tl.onVisible(s.animate), [s.animate, tl]);

  const L = tl.p * N;
  const info = absorbed(L, K);
  const lift = clamp((L - K) / 0.6, 0, 1);
  const layer = Math.max(0, Math.ceil(L - 1e-6));
  return (
    <div className="vtw vtw-live">
      <div className="lv-split">
        <StageCanvas s={s} label={`8 层小模型（示意）：已算到第 ${layer} 层，前 ${K} 层带视觉 token；问题 token 逐层吸收图像信息，系统 token 始终读不到图像`} />
        <div className="lv-side">
          <TimeBar tl={tl} phases={phases} label="计算进行到第几层" valueText={`第 ${layer} 层`} />
          <Range label="撤出前完整处理的层数 K" value={K} min={1} max={N} onChange={(v) => setK(clamp(v, 1, N))} display={K === N ? `K = ${N}（不撤出）` : `K = ${K}`} />
          <Btn onClick={() => setReverse((r) => !r)} pressed={reverse}>
            {reverse ? '收起反向尝试' : '让视觉 token 读问题？'}
          </Btn>
          <div className="lv-cup">
            <svg viewBox="0 0 300 190" width="100%" role="img" aria-label={`茶包（视觉 token）${lift >= 1 ? '已拿出' : lift > 0 ? '正在拿出' : '泡在水里'}，茶汤（问题 token）颜色${info > 0.85 ? '很深' : info > 0.5 ? '过半' : '还浅'}`}>
              <TeaCup x={130} y={146} w={130} tint={0.08 + 0.85 * info} bag="in" lift={lift} steam={L} />
              <text x={150} y={184} textAnchor="middle" className="lv-cup-t">
                茶包 = 视觉 token；茶汤 = 问题 token
              </text>
            </svg>
          </div>
          {reverse ? (
            <Feedback tone="bad">
              <span className="vtw-eq">
                <SymbolHint meaning="因果掩码：加在 QKᵀ 上再做 softmax">Λ</SymbolHint>
                <sub>
                  <SymbolHint meaning="正在计算的 token 的位置">i</SymbolHint>
                  <SymbolHint meaning="被读取的 token 的位置">j</SymbolHint>
                </sub>{' '}
                = −∞（j &gt; i）
              </span>
              ：视觉 token 排在问题前面，读不到后面的问题；信息只能从图像流向文字。
            </Feedback>
          ) : (
            <Feedback tone={L < 0.5 ? 'info' : L <= K ? 'info' : info > 0.85 ? 'ok' : 'warn'}>
              {L < 0.5
                ? '还没开始计算。按播放，或拖动进度条一层层看。'
                : L <= K
                  ? `第 ${layer} 层：问题 token 正从左边的视觉 token 里读取图像信息，茶色在上涨；系统 token 排在图像前面，一直读不到。`
                  : info > 0.85
                    ? `第 ${K + 1} 层入口撤出视觉 token：问题 token 已带走大部分图像信息，之后不再增加。`
                    : `只算了 ${K} 层就撤出：问题 token 带走的图像信息还少，后面的层补不回来。`}
            </Feedback>
          )}
        </div>
      </div>
    </div>
  );
}
