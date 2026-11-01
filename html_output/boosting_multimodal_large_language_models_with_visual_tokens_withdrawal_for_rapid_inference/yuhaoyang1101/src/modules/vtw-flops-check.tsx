import React, { useMemo, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';
import { C, Feedback, Range, useTween } from './vtw-kit';
import { PRESETS, checkAgainst, computeFlops, modelOf, presetOf, type FlopsConfig } from './vtw-data';

// 8.1 TFLOPs 复算：选一个论文配置，按 Eq. (1) 与代码口径复算比例，并与论文数字比较。
// 改动 K 后即为自定义配置，结果属于公式外推，不与论文比较。
const IDS = ['t2-7b-vtw', 't2-7b-fastv', 't2-13b-vtw', 't2-13b-fastv', 't2-next-vtw', 't2-next-fastv', 't3-video-vtw', 't3-video-fastv', 'ax8-qwen', 'ax8-intern', 'dp-vtw-7b'];
const SHORT: Record<string, string> = {
  't2-7b-vtw': '表 2 · 7B VTW',
  't2-7b-fastv': '表 2 · 7B FastV',
  't2-13b-vtw': '表 2 · 13B VTW',
  't2-13b-fastv': '表 2 · 13B FastV',
  't2-next-vtw': '表 2 · NeXT VTW',
  't2-next-fastv': '表 2 · NeXT FastV',
  't3-video-vtw': '表 3 · 视频 VTW',
  't3-video-fastv': '表 3 · 视频 FastV',
  'ax8-qwen': '附录表 8 · Qwen2-VL',
  'ax8-intern': '附录表 8 · InternVL2',
  'dp-vtw-7b': 'DivPrune 里的 VTW',
};
const TONE = { match: 'ok', mismatch: 'warn', anchor: 'info', other: 'info', none: 'info' } as const;
const LABEL = { match: '与论文一致', mismatch: '对不上，原因未知', anchor: '反推锚点，不算核对', other: '口径不同，不比较', none: '公式外推' } as const;

export function VtwFlopsCheck(_: WidgetProps) {
  const [id, setId] = useState('t2-7b-vtw');
  const [cfg, setCfg] = useState<FlopsConfig>(presetOf('t2-7b-vtw')!.cfg);
  const preset = presetOf(id);
  const r = useMemo(() => computeFlops(cfg), [cfg]);
  const chk = checkAgainst(preset, r, cfg);
  const aMine = useTween(r.ratio, 380);
  const paper = preset && JSON.stringify(preset.cfg) === JSON.stringify(cfg) ? preset.paperRatio : undefined;
  const m = modelOf(cfg.model);
  const pick = (pid: string) => {
    setId(pid);
    setCfg(presetOf(pid)!.cfg);
  };
  const bar = (v: number) => (v / 100) * 560;
  return (
    <div className="vtw vtw-fc">
      <div className="vtw-fc-left">
        <div className="vtw-fc-grid" role="radiogroup" aria-label="论文配置">
          {IDS.map((pid) => (
            <button key={pid} type="button" role="radio" aria-checked={pid === id && JSON.stringify(presetOf(pid)!.cfg) === JSON.stringify(cfg)} onClick={() => pick(pid)}>
              {SHORT[pid]}
            </button>
          ))}
        </div>
        <Range label={cfg.method === 'fastv' ? '剪枝层 K（FastV 剪掉一半视觉 token）' : '带视觉 token 的层数 K'} value={cfg.K} min={1} max={m.N - 1} onChange={(K) => setCfg({ ...cfg, K })} display={`K = ${cfg.K}`} />
        <p className="vtw-muted">
          {m.label} · {cfg.scope === 'vision' ? '只计视觉 token' : `s ≈ ${cfg.s}，V ≈ ${cfg.V}`}
        </p>
      </div>
      <div className="vtw-fc-right">
        <p className="vtw-eq">
          <SymbolHint meaning="VTW 相对原模型的计算量比例（预填充、单个样本）">r</SymbolHint>(K) = [K·<SymbolHint meaning="Eq. (1) 的每层复杂度 2s²h + 12sh²">Ω</SymbolHint>(s) + (N−K)·Ω(s−V)] / [N·Ω(s)]
        </p>
        <svg viewBox="0 0 700 220" width={700} height={220} role="img" aria-label={`本页复算 ${r.ratio.toFixed(2)}%${paper !== undefined ? `，论文 ${paper}%` : ''}`}>
          <text x={0} y={52} className="vtw-svg-t">本页复算</text>
          <rect x={130} y={24} width={bar(aMine)} height={40} rx={6} fill={C.blue} />
          <text x={140 + bar(aMine)} y={54} className="vtw-svg-t is-b">
            {r.ratio.toFixed(2)}%
          </text>
          <text x={0} y={132} className="vtw-svg-t">论文</text>
          {paper !== undefined ? (
            <>
              <rect x={130} y={104} width={bar(paper)} height={40} rx={6} fill={C.green} />
              <text x={140 + bar(paper)} y={134} className="vtw-svg-t is-b">
                {paper}%
              </text>
            </>
          ) : (
            <text x={130} y={132} className="vtw-svg-t is-muted">
              {preset?.foreign ? '口径不同，不比较' : '未报告这个配置'}
            </text>
          )}
          <line x1={130} y1={14} x2={130} y2={160} stroke={C.ink} strokeWidth={2} />
          <line x1={130 + bar(100)} y1={14} x2={130 + bar(100)} y2={160} stroke={C.line} strokeWidth={2} strokeDasharray="6 5" />
          <text x={130} y={200} className="vtw-svg-t is-muted">
            横轴满格 = 原模型 100%
          </text>
        </svg>
        <p className="vtw-h">{LABEL[chk.kind]}</p>
        <Feedback tone={TONE[chk.kind]}>{chk.text}</Feedback>
      </div>
    </div>
  );
}
