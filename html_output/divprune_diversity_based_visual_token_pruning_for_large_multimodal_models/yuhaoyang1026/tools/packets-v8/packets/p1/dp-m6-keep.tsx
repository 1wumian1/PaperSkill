import React, { useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, FONT_MONO, FONT_SANS, Seg, Slider, Tag, useStage } from './dp-kit';
import { GRID, cachedDist, featDist, greedyMaxMin, makeScene, pyRound } from './dp-maxmin';

// 6.2 保留个数 M̃ = int(round(r·M))（代码事实）+ 选择顺序 vs 送入 LLM 的顺序（教学示意图块图）（移植自原版 v7）。
// 颜色：橙 = 用户参数；绿框 = 被保留的图块；黄 = 补充材料 91.2% 对应的个数（与代码不一致）。

const MS = [{ value: 576, label: '576' }, { value: 1152, label: '1152' }, { value: 2225, label: '2225' }];
const MNOTE: Record<number, string> = { 576: 'LLaVA 1.5', 1152: '视频 8 帧', 2225: 'LLaVA 1.6 · COCO 平均' };
const REGION = ['天空', '太阳', '屋顶', '墙面', '树冠', '门', '树干', '草地'];
const W = 760;
const H = 546;

export const DpM6Keep: React.FC<WidgetProps> = () => {
  const [r, setR] = useState(0.098);
  const [M, setM] = useState(576);
  const [view, setView] = useState<'sel' | 'seq'>('sel');
  const kept = pyRound(r * M);
  const patches = useMemo(() => makeScene(7), []);
  const d = useMemo(() => cachedDist(patches.length, featDist(patches, 'cos')), [patches]);
  const k576 = pyRound(r * 576);
  const order = useMemo(() => greedyMaxMin(patches.length, k576, d), [d, k576]);
  const sorted = useMemo(() => [...order].sort((a, b) => a - b), [order]);
  const ref = useRef<HTMLCanvasElement>(null);
  useStage(ref, W, H, (ctx) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.86)';
    ctx.beginPath(); ctx.roundRect(0, 0, W, H, 18); ctx.fill();
    const cell = 16, g = cell * GRID, gx = (W - g) / 2, gy = 16;
    const rank = new Map<number, number>();
    (view === 'sel' ? order : sorted).forEach((idx, i) => rank.set(idx, i + 1));
    for (let i = 0; i < patches.length; i++) {
      const p = patches[i];
      ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
      ctx.globalAlpha = rank.has(i) ? 1 : 0.25;
      ctx.fillRect(gx + (i % GRID) * cell, gy + Math.floor(i / GRID) * cell, cell - 0.8, cell - 0.8);
      ctx.globalAlpha = 1;
    }
    ctx.font = `800 11px ${FONT_MONO}`; ctx.textAlign = 'center';
    for (const [idx, rk] of rank) {
      const x = gx + (idx % GRID) * cell, y = gy + Math.floor(idx / GRID) * cell;
      ctx.strokeStyle = C.green; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, cell - 2.8, cell - 2.8);
      if (rk <= 99) { ctx.fillStyle = '#fff'; ctx.fillRect(x + 2, y + 3, cell - 5, 10); ctx.fillStyle = C.ink; ctx.fillText(String(rk), x + cell / 2 - 1, y + 12); }
    }
    ctx.textAlign = 'left';
    const sy = gy + g + 52;
    ctx.font = `700 24px ${FONT_SANS}`; ctx.fillStyle = C.ink;
    ctx.fillText(view === 'sel' ? '① DivPrune 返回的 s（选择顺序）' : '② keep_indexs.sort() 后送入 LLM', 16, sy - 14);
    const seq = view === 'sel' ? order : sorted;
    const per = Math.min(seq.length, 40), sz = Math.floor((W - 32) / per);
    seq.forEach((idx, i) => {
      const x = 16 + (i % per) * sz, y = sy + Math.floor(i / per) * (sz + 2);
      const p = patches[idx];
      ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`; ctx.fillRect(x, y, sz - 2, sz - 2);
    });
  }, [patches, order, sorted, view]);

  const pruneRate = (1 - kept / M) * 100;
  const supp51 = 576 - pyRound(0.912 * 576);
  const first = order.slice(0, 3).map((i) => REGION[patches[i].region]).join('、');
  const covered = new Set(order.map((i) => patches[i].region)).size;
  const isPaper = Math.abs(r - 0.098) < 0.0011;

  return (
    <div className="dp-root">
      <div className="dp-split-top">
        <Seg label="查看顺序" options={[{ value: 'sel', label: '① 选择顺序' }, { value: 'seq', label: '② 送入 LLM 的顺序' }]} value={view} onChange={setView} />
        <span className="dp-split-tags"><Tag kind="code" /><Tag kind="demo" /></span>
      </div>
      <canvas ref={ref} className="dp-canvas dp-split-cv" style={{ width: W, height: H }} role="img"
        aria-label={`示意图块图：保留 ${k576} 个图块，当前显示${view === 'sel' ? '选择顺序' : '位置顺序'}`} />
      <div className="dp-glass dp-split-panel">
        <Slider label="SUBSET_RATIO（保留比例 r）" value={r} min={0.02} max={0.25} step={0.002} onChange={setR} display={r.toFixed(3)} />
        <div className="dp-row"><span className="dp-muted">M</span><Seg label="视觉 token 总数 M" options={MS} value={M} onChange={setM} /><span className="dp-muted">{MNOTE[M]}</span></div>
        <div className="dp-readouts2 is-3">
          <div className={isPaper ? 'is-good' : 'is-cur'}><span>保留 M̃</span><b className="dp-em">{kept}</b></div>
          <div><span>剪枝率</span><b className="dp-em">{pruneRate.toFixed(1)}%</b></div>
          <div className="is-limit"><span>按 91.2%</span><b className="dp-em">{supp51}</b></div>
        </div>
        <div className={`dp-fb ${isPaper && M === 576 ? 'is-good' : ''}`} role="status" aria-live="polite">
          {view === 'sel'
            ? `编号 = 选择顺序：前三个落在${first}；${k576} 个图块覆盖了 8 类区域中的 ${covered} 类。`
            : '送入 LLM 前位置被从小到大排序：编号变成空间顺序，选择顺序被丢弃。'}
          {isPaper && M === 576 ? ' r = 0.098 正是论文配置（保留 56 个）。' : ''}
        </div>
      </div>
    </div>
  );
};
