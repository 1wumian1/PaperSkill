import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { Seg, Tag, codeUrl } from './dp-kit';
import { CODE_ENTRIES, STATUS_LABEL, type CodeStatus } from './dp-codemap-data';

// 6.1 论文 ↔ 代码对照（移植自原版 v7）。左侧条目清单，右侧“论文怎么说 / 代码怎么做 / 结论”。
// 颜色：绿 = 一致，黄 = 有差异（证据边界），蓝 = 论文未说明，红 = 公开代码缺失（无法复现）。

const TONE: Record<CodeStatus, string> = { same: 'is-good', diff: 'is-limit', unsaid: '', missing: 'is-bad' };

export const DpM6Codemap: React.FC<WidgetProps> = () => {
  const [filter, setFilter] = useState<'all' | CodeStatus>('all');
  const list = useMemo(() => CODE_ENTRIES.filter((e) => filter === 'all' || e.status === filter), [filter]);
  const [id, setId] = useState(CODE_ENTRIES[0].id);
  const cur = list.find((e) => e.id === id) ?? list[0];
  const count = (s: CodeStatus) => CODE_ENTRIES.filter((e) => e.status === s).length;

  return (
    <div className="dp-root dp-cm">
      <div className="dp-row">
        <Seg label="按状态筛选" value={filter} onChange={(v) => setFilter(v as 'all' | CodeStatus)}
          options={[{ value: 'all', label: `全部 ${CODE_ENTRIES.length}` }, ...(Object.keys(STATUS_LABEL) as CodeStatus[]).map((s) => ({ value: s, label: `${STATUS_LABEL[s]} ${count(s)}` }))]} />
      </div>
      <div className="dp-cm-body">
        <ul className="dp-glass dp-cm-list" aria-label="对照条目">
          {list.map((e) => (
            <li key={e.id}>
              <button type="button" className={e.id === cur?.id ? 'is-on' : ''} aria-pressed={e.id === cur?.id} onClick={() => setId(e.id)}>
                <i className={`dp-st dp-st-${e.status}`} aria-label={STATUS_LABEL[e.status]} />{e.title}
              </button>
            </li>
          ))}
        </ul>
        {cur ? (
          <div className="dp-glass dp-cm-panel" key={cur.id}>
            <div className="dp-row"><span className={`dp-st-pill dp-st-${cur.status}`}>{STATUS_LABEL[cur.status]}</span><b className="dp-h">{cur.title}</b></div>
            <div className="dp-cm-k"><Tag kind="paper" /> {cur.paper}</div>
            <div className="dp-cm-k">
              <Tag kind="code" /> <code>{cur.file}</code> {cur.lines} ·{' '}
              <a href={codeUrl(cur.file, cur.anchor)} target="_blank" rel="noopener noreferrer">在 GitHub 查看 ↗</a>
            </div>
            <pre className="dp-cm-code"><code>{cur.code}</code></pre>
            <div className={`dp-fb ${TONE[cur.status]}`}>{cur.note}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
