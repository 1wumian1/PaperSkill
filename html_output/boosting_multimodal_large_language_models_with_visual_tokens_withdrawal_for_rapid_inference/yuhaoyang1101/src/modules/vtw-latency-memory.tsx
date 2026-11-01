import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Feedback } from './vtw-kit';
import { TABLE4 } from './vtw-data';

// 8.2 表 4（LLaVA-NeXT-7B，SQA_Image，单张 RTX 3090）：同一次实验的五个倍数。
// 点图：横轴 = 相对原模型的倍数（0–1.0，原模型 = 1）；绿 = VTW，紫 = FastV。数值全部为论文原值换算。
type Row = (typeof TABLE4.rows)[number];
const WHY: Record<string, string> = {
  tflops: '理论计算量：深层不再算视觉 token，约降一半。',
  lat: '延迟只降到 0.63×：视觉编码器、浅层、逐词解码与调度开销不会跟着变少。',
  sample: '单样本显存（峰值 − 模型权重）降 35%：深层的缓存与激活不含视觉 token。',
  peak: '峰值显存 0.94×：模型权重 14.1 G 占了大头，省下的 1 G 只占一小部分。',
  model: '模型权重不变：VTW 不改模型，只改推理时带哪些 token。',
};
const ORDER = ['tflops', 'lat', 'sample', 'peak', 'model'];
const NAME: Record<string, string> = { tflops: '理论 TFLOPs', lat: '每样本延迟', sample: '单样本显存', peak: '推理峰值显存', model: '模型权重显存' };

export function VtwLatencyMemory(_: WidgetProps) {
  const [sel, setSel] = useState('lat');
  const rows = ORDER.map((k) => TABLE4.rows.find((r) => r.key === k)!) as Row[];
  const x0 = 330;
  const w = 520;
  const X = (v: number) => x0 + v * w;
  const fmt = (r: Row, v: number) => `${r.key === 'lat' ? v.toFixed(2) : v}${r.unit ? ' ' + r.unit : ''}`;
  return (
    <div className="vtw vtw-lm">
      <svg viewBox="0 0 960 622" width={960} height={622} className="vtw-stage" role="group" aria-label="表 4 五个指标相对原模型的倍数">
        <text x={x0} y={44} className="vtw-svg-t is-muted">
          相对原模型的倍数（原模型 = 1）
        </text>
        <line x1={X(1)} y1={60} x2={X(1)} y2={560} stroke={C.blue} strokeWidth={3} strokeDasharray="8 6" />
        <line x1={X(0)} y1={560} x2={X(1)} y2={560} stroke={C.ink} strokeWidth={2} />
        {[0, 0.5, 1].map((v) => (
          <text key={v} x={X(v)} y={596} textAnchor="middle" className="vtw-svg-t is-muted">
            {v === 1 ? '1.0' : v}
          </text>
        ))}
        {rows.map((r, i) => {
          const y = 100 + i * 96;
          const vtw = r.vtw / r.base;
          const fast = r.fastv / r.base;
          const on = sel === r.key;
          return (
            <g
              key={r.key}
              className="vtw-hit"
              role="button"
              tabIndex={0}
              aria-label={`${NAME[r.key]}：原模型 ${fmt(r, r.base)}，FastV ${fmt(r, r.fastv)}，VTW ${fmt(r, r.vtw)}（${r.ratio}）`}
              onClick={() => setSel(r.key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSel(r.key);
                }
              }}
            >
              <rect x={8} y={y - 34} width={900} height={76} rx={12} fill={on ? '#ffffff' : 'transparent'} stroke={on ? C.blue : 'transparent'} strokeWidth={3} />
              <text x={x0 - 24} y={y + 12} textAnchor="end" className={`vtw-svg-t ${on ? 'is-b' : ''}`}>
                {NAME[r.key]}
              </text>
              <line x1={X(Math.min(vtw, fast))} y1={y + 2} x2={X(1)} y2={y + 2} stroke={C.line} strokeWidth={3} />
              <circle cx={X(fast)} cy={y + 2} r={12} fill={C.purple} />
              <circle cx={X(vtw)} cy={y + 2} r={14} fill={C.green} />
              <text x={X(1) + 20} y={y + 12} className="vtw-svg-t is-b" fill={C.green}>
                {r.ratio}
              </text>
            </g>
          );
        })}
        <circle cx={40} cy={600} r={10} fill={C.green} />
        <text x={58} y={610} className="vtw-svg-t is-muted">VTW</text>
        <circle cx={150} cy={600} r={10} fill={C.purple} />
        <text x={168} y={610} className="vtw-svg-t is-muted">FastV</text>
      </svg>
      <div className="vtw-lm-side">
        {(() => {
          const r = rows.find((x) => x.key === sel)!;
          return (
            <>
              <p className="vtw-h">
                {NAME[r.key]}　<span className="vtw-green">{r.ratio}</span>
              </p>
              <Feedback tone={sel === 'tflops' ? 'ok' : 'info'}>{WHY[sel]}</Feedback>
              <table className="vtw-table vtw-lm-table">
                <caption>表 4 原始数值（点行切换）</caption>
                <thead>
                  <tr>
                    <th>指标</th>
                    <th>原模型</th>
                    <th>FastV</th>
                    <th>VTW</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((x) => (
                    <tr key={x.key} className={x.key === sel ? 'is-sel' : ''} onClick={() => setSel(x.key)}>
                      <th>{NAME[x.key]}</th>
                      <td>{fmt(x, x.base)}</td>
                      <td>{fmt(x, x.fastv)}</td>
                      <td>
                        <b>{fmt(x, x.vtw)}</b>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          );
        })()}
      </div>
    </div>
  );
}
