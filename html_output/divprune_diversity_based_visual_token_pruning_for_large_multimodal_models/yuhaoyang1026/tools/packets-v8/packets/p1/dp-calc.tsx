import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Btn, C, Seg, Slider, Tag } from './dp-kit';
import { SymbolHint } from '../components/SymbolHint';
import { MODELS, PAPER_ROWS, computeFlops, getModel, keepOf, subsetModel, type FlopOpts, type KeepRule } from './dp-flops';

// 9.1 TFLOPs 复算器（移植自原版 v7，计算全部沿用 dp-flops，与官方 tflops.py 同口径）。
// 左侧分为“常用参数”（论文预设、以预设为起点自定义）与“高级口径”（三个口径开关）；
// 右侧读数、各数据集比例与反馈都来自同一次 computeFlops。
// 颜色：绿 = 复现一致 / 本文方法；红 = 旧方法 FastV；紫 = VTW；橙 = 用户自定义参数；黄 = 复算不一致。

interface Custom {
  src: string;
  mid: string;
  subset?: number[];
  K: number;
  rule: KeepRule;
}

const T3_SUBSET = [3, 5, 8, 9];
const DEFAULT_ROW = 't1-ours-7b';
const DEFAULT_OPTS: FlopOpts = { sign: 1, ffn: 2, prefix: 0 };
const SHORT_MODEL: Record<string, string> = { 'l15-7b': '1.5-7B', 'l15-13b': '1.5-13B', 'l16-7b': '1.6-7B', 'video-7b': '视频 7B' };
const WHERE: Record<string, string> = { 'Table 1': '表 1', 'Table 1 + supp §5': '表 1', 'Table 2': '表 2', 'Table 3': '表 3' };

const fromRow = (id: string): Custom => {
  const pr = PAPER_ROWS.find((x) => x.id === id)!;
  return { src: id, mid: pr.model, subset: pr.subset, K: pr.K, rule: pr.rule };
};
const sameRule = (a: KeepRule, b: KeepRule) =>
  a.kind === 'ratio' && b.kind === 'ratio' ? Math.abs(a.r - b.r) < 1e-9 : a.kind === 'count' && b.kind === 'count' ? a.n === b.n : false;
const sameAsSrc = (c: Custom) => {
  const pr = PAPER_ROWS.find((x) => x.id === c.src)!;
  return pr.model === c.mid && String(pr.subset ?? '') === String(c.subset ?? '') && pr.K === c.K && sameRule(pr.rule, c.rule);
};
const rowLabel = (id: string) => {
  const p = PAPER_ROWS.find((x) => x.id === id)!;
  return `${WHERE[p.where] ?? p.where} · ${SHORT_MODEL[p.model]} · ${p.method.replace('DivPrune · ', '')}`;
};
const methodColor = (method: string) => (method.startsWith('FastV') ? C.red : method.startsWith('VTW') ? C.purple : C.green);

export const DpCalc: React.FC<WidgetProps> = () => {
  const [tab, setTab] = useState<'basic' | 'adv'>('basic');
  const [rowId, setRowId] = useState(DEFAULT_ROW);
  const [custom, setCustom] = useState<Custom | null>(null);
  const [opts, setOpts] = useState<FlopOpts>(DEFAULT_OPTS);

  const row = PAPER_ROWS.find((x) => x.id === rowId)!;
  const model = custom ? subsetModel(getModel(custom.mid), custom.subset) : subsetModel(getModel(row.model), row.subset);
  const res = computeFlops(model, custom ? { K: custom.K, kept: keepOf(custom.rule) } : { K: row.K, kept: row.kept }, opts);
  const defaults = opts.sign === 1 && opts.ffn === 2 && opts.prefix === 0;
  const unchanged = custom ? sameAsSrc(custom) : false;
  const srcRow = custom ? PAPER_ROWS.find((x) => x.id === custom.src)! : row;
  const comparable = defaults && (!custom || unchanged);
  const okRatio = Math.abs(res.ratio - srcRow.paperRatio) < 0.01;
  const okT = Number.isNaN(srcRow.paperTflop) || Math.abs(res.pruned - srcRow.paperTflop) < 0.0015;
  const status: 'ok' | 'mismatch' | 'extrap' = comparable ? (okRatio && okT ? 'ok' : 'mismatch') : 'extrap';
  const isDefault = !custom && rowId === DEFAULT_ROW && defaults;

  const upd = (patch: Partial<Custom>) => setCustom((c) => (c ? { ...c, ...patch } : c));
  // 切换模型：同一次状态更新里把 K 约束到新模型的层数；视频模型的数据集不同，不沿用图像数据集子集
  const setModel = (mid: string) =>
    setCustom((c) => {
      if (!c) return c;
      const m = getModel(mid);
      return { ...c, mid, K: Math.min(c.K, m.T), subset: m.datasets === getModel(c.mid).datasets ? c.subset : undefined };
    });
  const onSelect = (v: string) => {
    if (v === 'custom') setCustom(fromRow(rowId));
    else {
      setRowId(v);
      setCustom(null);
    }
  };
  const restore = () => {
    setRowId(DEFAULT_ROW);
    setCustom(null);
    setOpts(DEFAULT_OPTS);
  };

  const cm = custom ? getModel(custom.mid) : null;
  const imageModel = cm ? cm.datasets === getModel('l15-7b').datasets : false;
  const barColor = custom && !unchanged ? C.orange : methodColor(srcRow.method);
  const maxRatio = Math.max(...res.perDataset.map((p) => p.ratio), 30);
  const lo = Math.min(...res.perDataset.map((p) => p.ratio));
  const hi = Math.max(...res.perDataset.map((p) => p.ratio));
  const half = Math.ceil(res.perDataset.length / 2);
  const ruleText = (rule: KeepRule) => (rule.kind === 'ratio' ? `r = ${rule.r.toFixed(3)}（1.5 保留 ${keepOf(rule)(576)}）` : `${rule.n} 个`);

  let fb: React.ReactNode;
  let tone = '';
  if (status === 'ok') {
    tone = 'is-good';
    fb = <><b className="is-good">✓ 与论文{WHERE[srcRow.where] ?? srcRow.where}一致</b> <Tag kind="paper" />：复算 {res.pruned.toFixed(3)} TFLOPs / {res.ratio.toFixed(2)}%。{srcRow.subset ? '只对 Table 3 的四个数据集取平均。' : `单个数据集在 ${lo.toFixed(2)}%–${hi.toFixed(2)}% 之间。`}</>;
  } else if (status === 'mismatch') {
    tone = 'is-limit';
    fb = <>与本页复算不一致，原因未知：复算 {res.ratio.toFixed(2)}%，论文 {srcRow.paperRatio.toFixed(2)}% <Tag kind="paper" />。视频模型 FastV 的超参数论文未单独给出，保留 2 或 3 个分别得 14.15% / 14.22%。</>;
  } else if (custom && unchanged) {
    fb = <>自定义起点与「{rowLabel(custom.src)}」完全相同；改任一参数即为论文未报告的配置 <Tag kind="extrap" /></>;
  } else {
    fb = <>{custom ? '当前自定义配置论文未报告。' : '口径开关已改动，结果不再是论文口径。'} <Tag kind="extrap" /></>;
  }

  return (
    <div className="dp-root dp-calc">
      <div className="dp-calc-left dp-glass">
        <Seg label="参数分组" options={[{ value: 'basic', label: '常用参数' }, { value: 'adv', label: '高级口径' }]} value={tab} onChange={setTab} />
        {tab === 'basic' ? (
          <>
            <select className="dp-select dp-calc-select" aria-label="论文配置" value={custom ? 'custom' : rowId} onChange={(e) => onSelect(e.target.value)}>
              {PAPER_ROWS.map((p) => (
                <option key={p.id} value={p.id}>{rowLabel(p.id)}</option>
              ))}
              <option value="custom">{custom ? `自定义（起点：${rowLabel(custom.src)}）` : '以此为起点自定义…'}</option>
            </select>
            {!custom ? (
              <>
                <p className="dp-muted dp-calc-desc">{row.keptDesc}{row.subset ? '；只对 MMB、MMMU、POPE、SQA 取平均（Table 3 口径）' : ''}。</p>
                <div className="dp-calc-formula" aria-label="Eq. (5) TFLOP 比例（按代码口径）">
                  <div>
                    比例 = [<SymbolHint meaning="剪枝所在层：DivPrune 为 0（进入第 1 层之前），本文实验中 FastV 为 3">K</SymbolHint>·f(<SymbolHint meaning="剪枝前序列长度 μ = N + M（文本 + 视觉 token）">μ</SymbolHint>) + (<SymbolHint meaning="解码层数：7B 为 32，13B 为 40">T</SymbolHint>−K)·f(<SymbolHint meaning="剪枝后序列长度 μ̃ = N + M̃">μ̃</SymbolHint>)] / [T·f(μ)]
                  </div>
                  <div>
                    f(n) = 4n<SymbolHint meaning="隐藏维度：7B 为 4096，13B 为 5120">d</SymbolHint>² + 2n²d + 2nd<SymbolHint meaning="FFN 中间维度：7B 为 11008，13B 为 13824">m</SymbolHint>
                  </div>
                  <div className="dp-muted">Eq. (5) 印刷为 −2n²d，代码为 +（见“高级口径”）。</div>
                </div>
                <div className="dp-row dp-calc-btns">
                  <Btn primary onClick={() => setCustom(fromRow(rowId))}>以此为起点自定义</Btn>
                  <Btn onClick={restore} disabled={isDefault}>恢复论文默认</Btn>
                </div>
              </>
            ) : cm ? (
              <>
                <select className="dp-select" aria-label="模型" value={custom.mid} onChange={(e) => setModel(e.target.value)}>
                  {MODELS.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}（{m.T} 层）</option>
                  ))}
                </select>
                <Seg
                  label="保留规则"
                  options={[{ value: 'ratio', label: '按比例 r' }, { value: 'count', label: '固定个数' }]}
                  value={custom.rule.kind}
                  onChange={(k) =>
                    upd({
                      rule: k === 'ratio'
                        ? { kind: 'ratio', r: custom.rule.kind === 'ratio' ? custom.rule.r : Math.min(0.5, keepOf(custom.rule)(576) / 576) }
                        : { kind: 'count', n: keepOf(custom.rule)(576) },
                    })
                  }
                />
                {imageModel ? (
                  <label className="dp-check">
                    <input type="checkbox" checked={!!custom.subset} onChange={(e) => upd({ subset: e.target.checked ? T3_SUBSET : undefined })} />
                    <span>只用 Table 3 的四个数据集</span>
                  </label>
                ) : null}
                <Slider label="剪枝层 K" value={custom.K} min={0} max={cm.T} onChange={(K) => upd({ K: Math.min(K, cm.T) })} display={`K = ${custom.K} / ${cm.T}`} />
                {custom.rule.kind === 'ratio' ? (
                  <Slider label="保留比例" value={custom.rule.r} min={0} max={0.5} step={0.001} onChange={(r) => upd({ rule: { kind: 'ratio', r } })} display={ruleText(custom.rule)} />
                ) : (
                  <Slider label="每样本保留" value={custom.rule.n} min={0} max={Math.max(...cm.visual)} onChange={(n) => upd({ rule: { kind: 'count', n } })} display={ruleText(custom.rule)} />
                )}
                <div className="dp-row dp-calc-btns">
                  <Btn onClick={() => setCustom(fromRow(custom.src))}>回到起点</Btn>
                  <Btn onClick={restore}>恢复论文默认</Btn>
                </div>
              </>
            ) : null}
          </>
        ) : (
          <div className="dp-calc-adv">
            <label className="dp-check">
              <input type="checkbox" checked={opts.sign === -1} onChange={(e) => setOpts({ ...opts, sign: e.target.checked ? -1 : 1 })} />
              <span>二次项用论文印刷的 −2μ²d</span>
            </label>
            <p className="dp-muted">代码为 +2n²d；按印刷的负号复算与表格对不上，本页据此判断负号为排版错误。</p>
            <label className="dp-check">
              <input type="checkbox" checked={opts.ffn === 3} onChange={(e) => setOpts({ ...opts, ffn: e.target.checked ? 3 : 2 })} />
              <span>前馈网络按 SwiGLU 计 3μdm</span>
            </label>
            <p className="dp-muted">论文沿用 2μdm；三矩阵计数让比例略变，方法排序不变。</p>
            <label className="dp-check">
              <input type="checkbox" checked={opts.prefix === 35} onChange={(e) => setOpts({ ...opts, prefix: e.target.checked ? 35 : 0 })} />
              <span>文本额外计入 35 个前缀 token</span>
            </label>
            <p className="dp-muted">剪不掉的部分变多，比例上升（本页外推）。</p>
          </div>
        )}
      </div>

      <div className="dp-calc-right">
        <div className="dp-calc-readouts">
          <div><span className="dp-muted">TFLOPs（剪枝后 / 原模型）</span><b className="dp-em"><span style={{ color: barColor }}>{res.pruned.toFixed(3)}</span> / {res.full.toFixed(3)}</b></div>
          <div><span className="dp-muted">TFLOP 比例</span><b className="dp-em" style={{ color: barColor }}>{res.ratio.toFixed(2)}%</b></div>
          <div>
            <span className="dp-muted">论文报告</span>
            <b className="dp-em">{comparable ? `${srcRow.paperRatio.toFixed(2)}%` : '—'}</b>
          </div>
        </div>
        <div className={`dp-fb ${tone}`} role="status" aria-live="polite">{fb}</div>
        <div className="dp-calc-chart" aria-label={`各数据集 TFLOP 比例：${res.perDataset.map((p) => `${p.name} ${p.ratio.toFixed(2)}%`).join('，')}`}>
          {[res.perDataset.slice(0, half), res.perDataset.slice(half)].map((col, ci) => (
            <div className="dp-calc-col" key={ci}>
              {col.map((p) => (
                <div className="dp-calc-bar" key={p.name} title={`μ = ${p.n}，保留视觉 token ${p.kept}`}>
                  <span>{p.name}</span>
                  <i><s style={{ transform: `scaleX(${Math.min(1, p.ratio / maxRatio)})`, background: barColor }} /></i>
                  <b>{p.ratio.toFixed(2)}%</b>
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="dp-muted dp-calc-foot">理论 TFLOPs 只计 LLM 预填充，不等于实测速度。</p>
      </div>
    </div>
  );
};
