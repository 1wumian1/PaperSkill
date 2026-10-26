import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Seg, Tag } from './dp-kit';
import { RESULT_TABLES } from './dp-data';
import { methodColor } from './dp-method-colors';

// 10.1 结果浏览器（移植自原版 v7）：只报告论文表格中的数值与差值。
// 论文为单次运行，没有逐样本结果或置信区间，本页不估算误差带、不做显著性判断。

const SHORT: Record<string, string> = { 'l15-7b': '1.5-7B', 'l15-13b': '1.5-13B', 'l16-7b': '1.6-7B', video: '视频 7B', supp: '补充材料' };

export const DpM10Results: React.FC<WidgetProps> = () => {
  const [tid, setTid] = useState('l15-7b');
  const [col, setCol] = useState(8);
  const [mode, setMode] = useState<'pp' | 'rel'>('pp');
  const [showAll, setShowAll] = useState(false);
  const tbl = RESULT_TABLES.find((t) => t.id === tid)!;
  const c = Math.min(col, tbl.cols.length - 1);
  const rows = tbl.rows.filter((r) => showAll || r.group === 'orig' || r.group === 'pnp');
  const max = Math.max(...rows.map((r) => r.values[c] ?? 0)) * 1.05 || 1;
  const orig = tbl.rows[0].values[c] ?? 0;
  const ours = tbl.rows.find((r) => r.method === 'DivPrune')!.values[c] ?? 0;
  const bestBase = tbl.rows.filter((r) => r.group === 'pnp' && !r.ours).reduce((a, r) => Math.max(a, r.values[c] ?? -Infinity), -Infinity);
  const metric = tbl.metrics[c];
  const isFrac = !['CIDEr', 'P-score', 'GPT 分', 'WUPS'].includes(metric);
  const diff = (a: number, b: number) => (mode === 'pp' ? a - b : ((a - b) / b) * 100);
  const unit = mode === 'pp' ? (isFrac ? ' 个百分点' : '（原单位）') : '%';
  const sgn = (x: number) => `${x >= 0 ? '+' : ''}${x.toFixed(2)}`;
  const small = isFrac && Math.abs(ours - orig) < 1;

  return (
    <div className="dp-root dp-m10">
      <div className="dp-row">
        <Seg label="结果表" options={RESULT_TABLES.map((t) => ({ value: t.id, label: SHORT[t.id] ?? t.label }))} value={tid} onChange={(v) => { setTid(v); setCol(0); }} />
        <span className="dp-split-tags"><Tag kind="paper" /></span>
      </div>
      <div className="dp-row">
        <label className="dp-row"><span className="dp-muted">数据集</span>
          <select className="dp-select" value={c} onChange={(e) => setCol(Number(e.target.value))}>
            {tbl.cols.map((x, i) => <option key={x} value={i}>{x}（{tbl.metrics[i]}）</option>)}
          </select>
        </label>
        <Seg label="差值口径" options={[{ value: 'pp', label: '差值' }, { value: 'rel', label: '相对 %' }]} value={mode} onChange={setMode} />
        <label className="dp-check">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
          <span>显示校准 / 微调 / 可变比例方法</span>
        </label>
      </div>
      <div className="dp-m10-body">
        <div className="dp-glass dp-bars" role="img" aria-label={`${tbl.label} ${tbl.cols[c]}：${rows.map((r) => `${r.method} ${r.values[c]}`).join('，')}`}>
          {rows.map((r) => (
            <div className={`dp-bar ${r.ours ? 'is-ours' : ''}`} key={r.method}>
              <span className="dp-bar-k"><i style={{ background: methodColor(r.method) }} />{r.method}</span>
              <span className="dp-bar-t">{r.tflop}</span>
              <i className="dp-bar-track"><s style={{ transform: `scaleX(${Math.max(0, (r.values[c] ?? 0) / max)})`, background: methodColor(r.method) }} /></i>
              <b>{r.values[c] ?? '—'}</b>
            </div>
          ))}
        </div>
        <div className="dp-m10-side">
          <div className="dp-readouts2">
            {/* 对原模型的差值不着成败色（剪枝后略降是预期）；对基线按正负着绿 / 红 */}
            <div className="is-cur"><span>DivPrune 对原模型</span><b className="dp-em">{sgn(diff(ours, orig))}</b></div>
            <div className={diff(ours, bestBase) >= 0 ? 'is-good' : 'is-bad'}><span>对最好的基线</span><b className="dp-em">{sgn(diff(ours, bestBase))}</b></div>
          </div>
          <div className="dp-muted">单位：{unit.trim()}；TFLOP 列括号内为比例，Variable = 保留数随样本变化</div>
          <div className={`dp-fb ${small ? 'is-limit' : ''}`} role="status" aria-live="polite">
            {small
              ? `与原模型只差 ${(ours - orig).toFixed(2)} 分：论文为单次运行、没有置信区间，不宜解读为提升或下降。`
              : '论文为单次运行，未提供不确定性信息；这里只报告表中差值，不判断显著性。'}
          </div>
        </div>
      </div>
    </div>
  );
};
