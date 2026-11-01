import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Btn, C, Feedback, Range, clamp, useTween } from './vtw-kit';
import { TABLE5, computeFlops } from './vtw-data';

// 7.1 撤出层 K 的取舍（LLaVA-1.5-7B，SQA_Image）：
// 计算量曲线按 Eq. (1) 外推；准确率只画论文实测点（表 5：K = 12–15；原模型 69.61 来自表 2），
// K 更小时只标注图 8(a) 的定性结论（准确率明显下降），不编造数值。
const KMIN = 5;
const KMAX = 31;
const ratio = (K: number) => computeFlops({ model: 'l15-7b', s: 641.4, V: 576, method: 'vtw', K, R: 0.5, conv: 'code', scope: 'all' }).ratio;
const ACC = new Map(TABLE5.map((r) => [r.K, r.acc] as [number, number]));
const BASE_ACC = 69.61;

export function VtwKTradeoff(_: WidgetProps) {
  const [K, setK] = useState(15);
  const r = ratio(K);
  const aR = useTween(r, 360);
  const x0 = 90;
  const w = 760;
  // 上：计算量面板；下：准确率面板（两种量纲分开画，共用横轴 K）
  const yR = 70;
  const hR = 210;
  const yA = 350;
  const hA = 170;
  const X = (k: number) => x0 + ((k - KMIN) / (KMAX - KMIN)) * w;
  const Yr = (v: number) => yR + hR - ((v - 10) / 90) * hR; // 计算量 10%–100%
  const Ya = (v: number) => yA + hA - ((v - 68.8) / 1.2) * hA; // 准确率 68.8–70.0
  const y0 = yR;
  const h = yA + hA - yR;
  const path = Array.from({ length: KMAX - KMIN + 1 }, (_, i) => `${i ? 'L' : 'M'}${X(KMIN + i).toFixed(1)} ${Yr(ratio(KMIN + i)).toFixed(1)}`).join(' ');
  const zone = K < 12 ? 'early' : K <= 16 ? 'ok' : 'late';
  const acc = ACC.get(K);
  return (
    <div className="vtw vtw-kt">
      <svg viewBox="0 0 900 622" width={900} height={622} className="vtw-stage" role="img" aria-label={`K = ${K}：计算量约为原模型的 ${r.toFixed(1)}%${acc ? `，论文实测准确率 ${acc}` : ''}`}>
        <rect x={X(KMIN)} y={y0} width={X(11.5) - X(KMIN)} height={h} fill={C.red} opacity={0.07} />
        <text x={X(KMIN) + 8} y={yR + 34} className="vtw-svg-t" fill={C.red}>
          图 8(a)：
        </text>
        <text x={X(KMIN) + 8} y={yR + 72} className="vtw-svg-t" fill={C.red}>
          准确率明显下降
        </text>
        <text x={x0} y={yR - 20} className="vtw-svg-t is-muted">
          计算量（Eq. 1 外推，10%–100%）
        </text>
        <text x={x0} y={yA - 16} className="vtw-svg-t is-muted">
          SQA 准确率（○ 表 5 实测点，68.8–70.0）
        </text>
        <line x1={x0} y1={yR + hR} x2={x0 + w} y2={yR + hR} stroke={C.line} strokeWidth={2} />
        <line x1={x0} y1={Ya(BASE_ACC)} x2={x0 + w} y2={Ya(BASE_ACC)} stroke={C.blue} strokeWidth={2} strokeDasharray="8 6" />
        <text x={x0 + w} y={Ya(BASE_ACC) + 34} textAnchor="end" className="vtw-svg-t" fill={C.blue}>
          原模型 69.61
        </text>
        <path d={path} fill="none" stroke={C.envDark} strokeWidth={5} />
        {TABLE5.filter((t, i, a) => a.findIndex((u) => u.K === t.K) === i).map((t) => (
          <g key={t.K}>
            <circle cx={X(t.K)} cy={Ya(t.acc)} r={11} fill="#fff" stroke={C.green} strokeWidth={5} />
          </g>
        ))}

        <line x1={X(K)} y1={y0 - 10} x2={X(K)} y2={y0 + h} stroke={C.orange} strokeWidth={4} />
        <circle cx={X(K)} cy={Yr(r)} r={10} fill={C.orange} />
        <line x1={x0} y1={y0 + h} x2={x0 + w} y2={y0 + h} stroke={C.ink} strokeWidth={2} />
        {[5, 12, 16, 24, 31].map((k) => (
          <text key={k} x={X(k)} y={y0 + h + 34} textAnchor="middle" className="vtw-svg-t is-muted">
            {k}
          </text>
        ))}
        <text x={x0 + w} y={y0 + h + 72} textAnchor="end" className="vtw-svg-t is-muted">
          撤出层 K
        </text>
      </svg>
      <div className="vtw-kt-side">
        <div className="vtw-kt-presets">
          <Btn onClick={() => setK(6)} pressed={K === 6}>
            过早 K=6
          </Btn>
          <Btn onClick={() => setK(15)} pressed={K === 15}>
            合理 K=15
          </Btn>
          <Btn onClick={() => setK(28)} pressed={K === 28}>
            过晚 K=28
          </Btn>
        </div>
        <Range label="撤出层 K" value={K} min={KMIN} max={KMAX} onChange={setK} display={`K = ${K}`} />
        <p>
          计算量 <span className="vtw-em">{aR.toFixed(1)}%</span>
        </p>
        <p>
          准确率 <span className="vtw-em vtw-green">{acc ? acc.toFixed(2) : '—'}</span>
          <span className="vtw-muted">{acc ? '（表 5 实测）' : '（论文未报告该 K）'}</span>
        </p>
        <Feedback tone={zone === 'early' ? 'bad' : zone === 'ok' ? 'ok' : 'warn'}>
          {zone === 'early'
            ? '撤得太早：信息还没迁移完，图 8(a) 中准确率明显下降。'
            : zone === 'ok'
              ? 'KL 收敛附近：准确率与原模型相当，计算量约一半。'
              : '撤得太晚：准确率不再提高，省下的计算越来越少。'}
        </Feedback>
      </div>
    </div>
  );
}
