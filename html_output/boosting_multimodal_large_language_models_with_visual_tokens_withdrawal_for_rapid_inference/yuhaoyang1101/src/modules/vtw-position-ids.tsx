import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Feedback, Seg } from './vtw-kit';
import { TABLE6 } from './vtw-data';

// 6.2 撤出后剩余 token 的位置编号（LLaVA-1.5-7B）：系统 0–34，视觉 35–610，问题 611–640。
// Keep（论文与代码默认）：深层沿用原编号；Rearrange：深层把问题 token 重新编成 35–64。
// 以“问题里的一个词（原编号 620）”与“最后一个系统 token（34）”为例比较浅层与深层的相对距离。
type PE = 'keep' | 'rearrange';
const SYS_LAST = 34;
const Q_POS = 620;

function Strip({ y, label, vis, qStart, pe }: { y: number; label: string; vis: boolean; qStart: number; pe: PE }) {
  const x0 = 190;
  const sysW = 90;
  const visW = vis ? 380 : 0;
  const qW = 210;
  const qx = x0 + sysW + visW + (vis ? 0 : 30);
  const qTok = qStart + (Q_POS - 611);
  const dist = qTok - SYS_LAST;
  return (
    <g>
      <text x={x0 - 20} y={y + 38} textAnchor="end" className="vtw-svg-t is-b">
        {label}
      </text>
      <rect x={x0} y={y} width={sysW} height={56} rx={8} fill={C.sys} />
      <text x={x0 + sysW / 2} y={y + 92} textAnchor="middle" className="vtw-svg-t is-muted">
        0–34
      </text>
      {vis ? (
        <>
          <rect x={x0 + sysW} y={y} width={visW} height={56} fill={C.leaf} />
          <text x={x0 + sysW + visW / 2} y={y + 38} textAnchor="middle" className="vtw-svg-t" fill="#fff">
            视觉 35–610
          </text>
        </>
      ) : (
        <text x={x0 + sysW + 15} y={y + 38} className="vtw-svg-t is-muted">
          ✂
        </text>
      )}
      <rect x={qx} y={y} width={qW} height={56} rx={8} fill={C.water} stroke={pe === 'rearrange' && !vis ? C.red : C.waterLine} strokeWidth={pe === 'rearrange' && !vis ? 4 : 2} />
      <text x={qx + qW / 2} y={y + 38} textAnchor="middle" className="vtw-svg-t">
        问题 {qStart}–{qStart + 29}
      </text>
      <path d={`M${x0 + sysW - 10} ${y - 6} Q ${(x0 + qx) / 2 + 60} ${y - 70} ${qx + 60} ${y - 6}`} fill="none" stroke={C.blue} strokeWidth={4} />
      <text x={(x0 + qx) / 2 + 60} y={y - 56} textAnchor="middle" className="vtw-svg-t is-b" fill={pe === 'rearrange' && !vis ? C.red : C.blue}>
        距离 {dist}
      </text>
    </g>
  );
}

export function VtwPositionIds(_: WidgetProps) {
  const [pe, setPe] = useState<PE>('keep');
  const deepStart = pe === 'keep' ? 611 : 35;
  const rows = TABLE6;
  return (
    <div className="vtw vtw-pe">
      <svg viewBox="0 0 900 470" width={900} height={470} className="vtw-stage" role="img" aria-label={`${pe === 'keep' ? 'Keep' : 'Rearrange'}：问题 token 到系统 token 的距离在浅层为 ${Q_POS - SYS_LAST}，在深层为 ${deepStart + (Q_POS - 611) - SYS_LAST}`}>
        <Strip y={110} label="浅层" vis qStart={611} pe={pe} />
        <line x1={20} y1={222} x2={880} y2={222} stroke={C.orange} strokeWidth={3} strokeDasharray="10 8" />
        <text x={190} y={258} className="vtw-svg-t" fill={C.orange}>
          第 K+1 层入口：撤走视觉 token
        </text>
        <Strip y={350} label="深层" vis={false} qStart={deepStart} pe={pe} />
      </svg>
      <div className="vtw-pe-side">
        <Seg<PE>
          label="撤出后的位置编号"
          value={pe}
          onChange={setPe}
          options={[
            { value: 'keep', label: 'Keep 保留原编号' },
            { value: 'rearrange', label: 'Rearrange 重排' },
          ]}
        />
        <Feedback tone={pe === 'keep' ? 'ok' : 'warn'}>
          {pe === 'keep'
            ? '深层沿用原编号：问题词到系统 token 的距离仍是 586，和浅层一致。'
            : '深层重新编号：同一对 token 的距离从 586 变成 10，旋转位置编码给出的相对位置和浅层对不上。'}
        </Feedback>
        <table className="vtw-table">
          <caption>表 6（LLaVA-1.5-7B，单次运行）</caption>
          <thead>
            <tr>
              <th />
              <th>SQA</th>
              <th>MMMU</th>
              <th>POPE</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.label} className={(i === 1 && pe === 'rearrange') || (i === 2 && pe === 'keep') ? 'is-sel' : ''}>
                <th>{i === 0 ? '原模型' : i === 1 ? 'Rearrange' : 'Keep'}</th>
                <td>{r.sqa.toFixed(2)}</td>
                <td>{r.mmmu.toFixed(2)}</td>
                <td>{r.pope.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="vtw-pe-note">
        <p className="vtw-muted">表中差距只有 0.05–0.55，单次运行无法判断是否超出评测波动；“距离一致”是对 Keep 更好的解释，不是论文的证明。</p>
      </div>
    </div>
  );
}
