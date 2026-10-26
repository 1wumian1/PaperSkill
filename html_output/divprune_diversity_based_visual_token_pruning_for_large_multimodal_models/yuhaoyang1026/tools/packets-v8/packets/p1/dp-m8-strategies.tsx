import React, { useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { Btn, C, FONT_SANS, Seg, Tag, approach, useStage } from './dp-kit';
import { GRID, cachedDist, featDist, greedyMaxMin, greedyMinMax, makeScene, minPair, randomSubset, type DistFn } from './dp-maxmin';
import { TABLE4 } from './dp-data';

// 8.1 策略实验室（移植自原版 v7）：示意图块图上比较 余弦/ℓ1/ℓ2 Max-Min、随机、Min-Max；右侧为 Table 4 实测分数。
// 颜色：绿 = Max-Min 系列（本文方法及其度量变体），灰 = 随机，红 = Min-Max（反面对照）。

type Strat = 'cos' | 'l1' | 'l2' | 'random' | 'minmax';
const K = 56;
const REGION = ['天空', '太阳', '屋顶', '墙面', '树冠', '门', '树干', '草地'];
const METRICS = [{ key: 'mmb', label: 'MMB' }, { key: 'mmmu', label: 'MMMU' }, { key: 'pope', label: 'POPE' }, { key: 'sqa', label: 'SQA' }, { key: 'avg', label: '平均' }] as const;
const COL: Record<Strat, string> = { cos: C.green, l1: C.green, l2: C.green, random: '#8a96a8', minmax: C.red };
const W = 760;
const H = 546;

export const DpM8Strategies: React.FC<WidgetProps> = () => {
  const [strat, setStrat] = useState<Strat>('cos');
  const [rseed, setRseed] = useState(3);
  const patches = useMemo(() => makeScene(7), []);
  const n = patches.length;
  const dists = useMemo(() => {
    const out = {} as Record<'cos' | 'l1' | 'l2', DistFn>;
    (['cos', 'l1', 'l2'] as const).forEach((m) => (out[m] = cachedDist(n, featDist(patches, m))));
    return out;
  }, [patches, n]);
  const sel = useMemo(() => {
    if (strat === 'random') return randomSubset(n, K, rseed);
    if (strat === 'minmax') return greedyMinMax(n, K, dists.cos);
    return greedyMaxMin(n, K, dists[strat]);
  }, [strat, rseed, n, dists]);
  const regions = useMemo(() => {
    const cnt = new Array(REGION.length).fill(0);
    sel.forEach((i) => cnt[patches[i].region]++);
    return cnt;
  }, [sel, patches]);
  const covered = regions.filter((c) => c > 0).length;
  const missing = REGION.filter((_, i) => regions[i] === 0).join('、') || '无';
  const mm = minPair(sel, dists.cos).v;
  const row = TABLE4.find((r) => r.id === strat)!;
  const cos = TABLE4[0];

  const ref = useRef<HTMLCanvasElement>(null);
  const anim = useRef({ wt: new Float32Array(patches.length), since: 0, key: '', prev: new Set<number>(), cur: new Set<number>() });
  useStage(ref, W, H, (ctx, t, dt) => {
    const a = anim.current;
    const key = sel.join(',');
    if (a.key !== key) { a.prev = a.key ? a.cur : new Set(sel); a.cur = new Set(sel); a.key = key; a.since = 0; }
    a.since += dt;
    const final = t > 900;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.86)';
    ctx.beginPath(); ctx.roundRect(0, 0, W, H, 18); ctx.fill();
    const cell = 18, g = cell * GRID, gx = (W - g) / 2, gy = 14;
    const front = final ? 99 : a.since / 0.55;
    patches.forEach((p, i) => {
      const cx = i % GRID, cy = Math.floor(i / GRID), pos = (cx + cy) / (2 * GRID - 2);
      const target = (front >= pos ? a.cur : a.prev).has(i) ? 1 : 0;
      a.wt[i] = final ? target : approach(a.wt[i], target, dt, 14);
      ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
      ctx.globalAlpha = 0.16 + 0.84 * a.wt[i];
      ctx.fillRect(gx + cx * cell, gy + cy * cell, cell - 0.8, cell - 0.8);
      ctx.globalAlpha = 1;
    });
    ctx.strokeStyle = COL[strat]; ctx.lineWidth = 2.2;
    patches.forEach((_, i) => {
      if (a.wt[i] < 0.5) return;
      ctx.globalAlpha = Math.min(1, (a.wt[i] - 0.5) * 2);
      ctx.strokeRect(gx + (i % GRID) * cell + 1, gy + Math.floor(i / GRID) * cell + 1, cell - 2.8, cell - 2.8);
    });
    ctx.globalAlpha = 1;
    // 区域计数（两行）
    ctx.font = `700 24px ${FONT_SANS}`;
    const colW = (W - 32) / 4;
    REGION.forEach((r, i) => {
      const x = 16 + (i % 4) * colW, y = gy + g + 38 + Math.floor(i / 4) * 36;
      ctx.fillStyle = regions[i] ? C.ink : C.red;
      ctx.fillText(`${r} ${regions[i]}${regions[i] ? '' : ' ✕'}`, x, y);
    });
  }, [sel, patches, strat, regions]);

  const delta = cos.avg - row.avg;
  const rel = (delta / cos.avg) * 100;
  const fb: Record<Strat, string> = {
    cos: `覆盖 ${covered} / 8 类区域，最近一对余弦距离 ${mm.toFixed(4)}。Table 4 平均 62.34。`,
    l1: `覆盖 ${covered} 类，选法与余弦相近；平均低 ${delta.toFixed(2)} 分——单次运行，在常见波动范围内。`,
    l2: `覆盖 ${covered} 类；平均低 ${delta.toFixed(2)} 分，不足以说明谁更好。`,
    random: `覆盖 ${covered} 类，名额大致按面积分配，漏掉：${missing}。平均低 ${delta.toFixed(2)} 个百分点。`,
    minmax: `故意挑最相似的一团，只覆盖 ${covered} 类。平均低 ${delta.toFixed(2)} 个百分点（相对 −${rel.toFixed(1)}%；正文“低约 15.8%”其实是百分点）。`,
  };

  return (
    <div className="dp-root">
      <div className="dp-split-top">
        <Seg label="选择策略" value={strat} onChange={setStrat}
          options={[{ value: 'cos', label: '余弦 Max-Min' }, { value: 'l1', label: 'ℓ1' }, { value: 'l2', label: 'ℓ2' }, { value: 'random', label: '随机' }, { value: 'minmax', label: 'Min-Max' }]} />
        {strat === 'random' ? <Btn onClick={() => setRseed((s) => s + 1)}>换一组随机</Btn> : null}
        <span className="dp-split-tags"><Tag kind="demo" /><Tag kind="paper" /></span>
      </div>
      <canvas ref={ref} className="dp-canvas dp-split-cv" style={{ width: W, height: H }} role="img"
        aria-label={`示意图块图：${strat} 策略选出的 56 个图块覆盖 ${covered} 类区域`} />
      <div className="dp-glass dp-split-panel">
        <div className="dp-h">Table 4 · {row.label}</div>
        <div className="dp-t4">
          {METRICS.map((m) => (
            <div className="dp-t4-row" key={m.key}>
              <span>{m.label}</span>
              <i><s style={{ transform: `scaleX(${row[m.key] / 100})`, background: COL[strat] }} /><u style={{ left: `${cos[m.key]}%` }} /></i>
              <b>{row[m.key].toFixed(2)}</b>
            </div>
          ))}
          <div className="dp-muted">细竖线 = 余弦基准；同保留 56 个、TFLOP 19.61%</div>
        </div>
        <div className={`dp-fb ${strat === 'cos' ? 'is-good' : strat === 'minmax' ? 'is-bad' : strat === 'random' ? 'is-limit' : ''}`} role="status" aria-live="polite">{fb[strat]}</div>
      </div>
    </div>
  );
};
