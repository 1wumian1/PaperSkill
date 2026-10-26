import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Seg } from './dp-kit';
import { VERDICT, type VerdictGroup } from './dp-closing-data';

// 收束 · 结论分级（移植自原版 v7）：已证明 / 有解释但未证实 / 仍然未知。左侧论断清单，右侧依据。
// 颜色：绿 = 已证明，黄 = 有解释但未证实（证据边界），灰蓝 = 仍然未知。

const TONE: Record<VerdictGroup['level'], string> = { proven: 'is-good', explained: 'is-limit', unknown: '' };

export const DpEndVerdict: React.FC<WidgetProps> = () => {
  const [lv, setLv] = useState<VerdictGroup['level']>('proven');
  const [i, setI] = useState(0);
  const g = VERDICT.find((x) => x.level === lv)!;
  const it = g.items[Math.min(i, g.items.length - 1)];
  return (
    <div className="dp-root dp-end">
      <div className="dp-row">
        <Seg label="结论等级" options={VERDICT.map((x) => ({ value: x.level, label: `${x.title} ${x.items.length}` }))} value={lv} onChange={(v) => { setLv(v); setI(0); }} />
      </div>
      <div className="dp-end-body">
        <ol className={`dp-glass dp-end-list is-${lv}`} aria-label={g.title}>
          {g.items.map((x, k) => (
            <li key={x.claim}>
              <button type="button" className={k === i ? 'is-on' : ''} aria-pressed={k === i} onClick={() => setI(k)}>
                <span className="dp-end-n">{k + 1}</span><span>{x.claim}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="dp-glass dp-end-panel">
          <div className="dp-muted">{g.desc}</div>
          <div className="dp-h">{it.claim}</div>
          <div className={`dp-fb ${TONE[lv]}`}><b>依据：</b>{it.basis}</div>
        </div>
      </div>
    </div>
  );
};
