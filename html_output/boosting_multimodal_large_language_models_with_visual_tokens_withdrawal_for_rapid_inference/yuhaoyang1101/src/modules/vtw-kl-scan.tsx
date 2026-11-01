import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';
import { C, Feedback, Seg, useTween } from './vtw-kit';
import { TABLE5 } from './vtw-data';

// 7.2 KL 准则 Eq. (6)：从 K = 5 往后试，选第一个“撤出后第一个输出词的分布”与原模型的 KL 低于 η 的层。
// KL 曲线为教学示意，构造成与表 5 的选层结果一致（η → K）；准确率是表 5 的实测值。
const KL: Record<number, number> = { 5: 0.08, 6: 0.06, 7: 0.045, 8: 0.032, 9: 0.022, 10: 0.015, 11: 0.009, 12: 0.0055, 13: 0.0045, 14: 0.0035, 15: 0.0008, 16: 0.0006, 17: 0.0005, 18: 0.0004, 19: 0.00035, 20: 0.0003, 21: 0.00028, 22: 0.00026, 23: 0.00024, 24: 0.00022 };
const KS = Object.keys(KL).map(Number);
const ETAS = ['0.006', '0.005', '0.004', '0.003', '0.002', '0.001'] as const;
type Eta = (typeof ETAS)[number];

export function VtwKlScan(_: WidgetProps) {
  const [eta, setEta] = useState<Eta>('0.003');
  const e = Number(eta);
  const chosen = KS.find((k) => KL[k] < e)!;
  const acc = TABLE5.find((r) => r.eta === e)!.acc;
  const scan = useTween(chosen, 900);
  const x0 = 110;
  const w = 740;
  const y0 = 60;
  const h = 440;
  const X = (k: number) => x0 + ((k - 5) / 19) * w;
  const lg = (v: number) => Math.log10(v);
  const Y = (v: number) => y0 + ((lg(0.1) - lg(v)) / (lg(0.1) - lg(0.0002))) * h;
  const path = KS.map((k, i) => `${i ? 'L' : 'M'}${X(k).toFixed(1)} ${Y(KL[k]).toFixed(1)}`).join(' ');
  return (
    <div className="vtw vtw-kl">
      <svg viewBox="0 0 900 622" width={900} height={622} className="vtw-stage" role="img" aria-label={`η = ${eta}：从 K = 5 往后试，停在 K = ${chosen}；表 5 实测准确率 ${acc}`}>
        <text x={x0} y={40} className="vtw-svg-t is-muted">
          KL（对数坐标，示意）
        </text>
        {KS.map((k) => (
          <rect key={k} x={X(k) - 12} y={y0} width={24} height={h} fill={k <= scan + 0.01 ? (k < chosen ? '#fbe9ec' : '#e6f4ec') : 'transparent'} />
        ))}
        <path d={path} fill="none" stroke={C.ink} strokeWidth={4} />
        {KS.map((k) => (
          <circle key={k} cx={X(k)} cy={Y(KL[k])} r={k === chosen ? 13 : 7} fill={k === chosen ? C.green : k < scan ? C.red : '#fff'} stroke={C.ink} strokeWidth={2} />
        ))}
        <line x1={x0} y1={Y(e)} x2={x0 + w} y2={Y(e)} stroke={C.orange} strokeWidth={4} strokeDasharray="12 8" />
        <text x={x0 + w} y={Y(e) - 12} textAnchor="end" className="vtw-svg-t is-b" fill={C.orange}>
          η = {eta}
        </text>
        <line x1={x0} y1={y0 + h} x2={x0 + w} y2={y0 + h} stroke={C.ink} strokeWidth={2} />
        {[5, 10, 15, 20, 24].map((k) => (
          <text key={k} x={X(k)} y={y0 + h + 34} textAnchor="middle" className="vtw-svg-t is-muted">
            {k}
          </text>
        ))}
        <text x={x0 + w} y={y0 + h + 70} textAnchor="end" className="vtw-svg-t is-muted">
          候选 K（从 5 往后试）
        </text>
      </svg>
      <div className="vtw-kl-side">
        <p className="vtw-eq">
          KL( <SymbolHint meaning="LLM 的输出投影头：把最后一层表示变成词表上的 logits">lm</SymbolHint>
          <sub>head</sub>(<SymbolHint meaning="原模型（Eq. 4）最后一层的输出">X</SymbolHint>
          <sub>N+1</sub>), lm<sub>head</sub>(<SymbolHint meaning="撤出视觉 token 后（Eq. 5）最后一层的输出">𝒳</SymbolHint>
          <sub>N+1</sub>) ) &lt; <SymbolHint meaning="阈值；论文为 0.003，校准样本 20 个">η</SymbolHint>
        </p>
        <Seg<Eta> label="阈值 η" value={eta} onChange={setEta} tone="orange" options={ETAS.map((x) => ({ value: x, label: x }))} />
        <p>
          选出 <span className="vtw-em vtw-green">K = {chosen}</span>　准确率 <span className="vtw-em">{acc.toFixed(2)}</span>
        </p>
        <Feedback tone="info">
          {e > 0.003
            ? `η 放宽到 ${eta}：更早停下（K = ${chosen}），省得更多，准确率略降（表 5）。`
            : `η ≤ 0.003 时都停在 K = 15：KL 在这里骤降，再收紧阈值也不变（表 5）。`}
        </Feedback>
        <p className="vtw-muted">只比较第一个输出词的分布；论文与代码的阈值、KL 方向与 &lt; / ≤ 见本章“核对”。</p>
      </div>
    </div>
  );
}
