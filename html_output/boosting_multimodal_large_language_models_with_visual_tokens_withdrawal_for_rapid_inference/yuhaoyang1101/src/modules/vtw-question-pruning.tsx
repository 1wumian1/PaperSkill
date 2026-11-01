import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Feedback, Seg } from './vtw-kit';
import { COLS, ROWS, OBJ_CELLS, OBJ_NAME, TeaTable, cellKey, type Obj } from './vtw-art';

// 2.1 问题相关的重要性：同一张茶桌照片，换一个问题，答题需要的图块就变了。
// 三种规则（教学示意）：与问题无关的固定压缩（PruMerge 类）、按注意力 Top-50%（FastV 类，
// 按图 1(b) 的失败模式：保留蛋糕、剪掉瓶子）、VTW（前 K 层全部保留）。
type Rule = 'fixed' | 'attn' | 'vtw';
const QUESTIONS: Record<Obj, string> = {
  cake: '桌上有蛋糕吗？',
  bottle: '瓶子是什么颜色？',
  fork: '叉子在盘子的哪一侧？',
};
const ALL = Array.from({ length: COLS * ROWS }, (_, i) => cellKey(i % COLS, Math.floor(i / COLS)));
const FIXED = new Set(
  [
    ...OBJ_CELLS.cake,
    [0, 0], [1, 0], [2, 0], [1, 1], [2, 1], [3, 1], [4, 2], [5, 2], [0, 3], [0, 4], [5, 3], [5, 4], [7, 0], [7, 1],
  ].map(([c, r]) => cellKey(c, r))
);
function attnKeep(q: Obj) {
  // 与问题有关，但打分不完整：瓶子、叉子的大部分图块分数低而被剪掉（图 1(b) 的模式）
  const base = [...OBJ_CELLS.cake, [0, 1], [1, 1], [2, 1], [3, 1], [0, 2], [4, 2], [5, 2], [0, 3], [5, 3], [7, 3], [7, 4], [3, 4], [2, 4], [1, 4]] as [number, number][];
  const extra: [number, number][] = q === 'bottle' ? [[6, 0]] : q === 'fork' ? [[4, 3]] : [[3, 0]];
  return new Set([...base, ...extra].map(([c, r]) => cellKey(c, r)));
}

export function VtwQuestionPruning(_: WidgetProps) {
  const [q, setQ] = useState<Obj>('bottle');
  const [rule, setRule] = useState<Rule>('fixed');
  const keep = useMemo(() => (rule === 'vtw' ? new Set(ALL) : rule === 'fixed' ? FIXED : attnKeep(q)), [rule, q]);
  const need = OBJ_CELLS[q].map(([c, r]) => cellKey(c, r));
  const kept = need.filter((k) => keep.has(k)).length;
  const ok = kept === need.length;
  const W = 800;
  const Hh = 500;
  const cw = W / COLS;
  const ch = Hh / ROWS;
  const objBox = (o: Obj) => {
    const cells = OBJ_CELLS[o];
    const cs = cells.map((x) => x[0]);
    const rs = cells.map((x) => x[1]);
    return { x: Math.min(...cs) * cw, y: Math.min(...rs) * ch, w: (Math.max(...cs) - Math.min(...cs) + 1) * cw, h: (Math.max(...rs) - Math.min(...rs) + 1) * ch };
  };
  const box = objBox(q);
  return (
    <div className="vtw vtw-qp">
      <svg viewBox={`0 0 ${W} ${Hh}`} width={W} height={Hh} className="vtw-qp-img" role="group" aria-label={`茶桌照片被切成 ${COLS * ROWS} 个图块；当前问题“${QUESTIONS[q]}”需要的 ${need.length} 个图块中保留了 ${kept} 个`}>
        <TeaTable w={W} h={Hh} />
        {ALL.map((k) => {
          const [c, r] = k.split(',').map(Number);
          const on = keep.has(k);
          return (
            <g key={k}>
              {!on && <rect x={c * cw} y={r * ch} width={cw} height={ch} fill="#f4f6f9" opacity={0.86} />}
              {!on && <path d={`M${c * cw + 18} ${r * ch + 18} l${cw - 36} ${ch - 36} M${c * cw + cw - 18} ${r * ch + 18} l-${cw - 36} ${ch - 36}`} stroke="#b6c0cf" strokeWidth={3} />}
              <rect x={c * cw} y={r * ch} width={cw} height={ch} fill="none" stroke="#ffffff" strokeWidth={2} />
            </g>
          );
        })}
        <rect x={box.x + 3} y={box.y + 3} width={box.w - 6} height={box.h - 6} rx={10} fill="none" stroke={ok ? C.green : C.red} strokeWidth={6} strokeDasharray="16 10" />
        {(Object.keys(OBJ_CELLS) as Obj[]).map((o) => {
          const b = objBox(o);
          return (
            <rect
              key={o}
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              fill="transparent"
              className="vtw-hit"
              role="button"
              tabIndex={0}
              aria-label={`提问：${QUESTIONS[o]}`}
              onClick={() => setQ(o)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setQ(o);
                }
              }}
            />
          );
        })}
      </svg>
      <div className="vtw-qp-side">
        <p className="vtw-muted">点照片里的物体换一个问题：</p>
        <p className="vtw-h">“{QUESTIONS[q]}”</p>
        <Seg<Rule>
          label="视觉 token 保留规则"
          value={rule}
          onChange={setRule}
          tone="orange"
          options={[
            { value: 'fixed', label: '固定压缩' },
            { value: 'attn', label: '注意力 Top-50%' },
            { value: 'vtw', label: 'VTW 前 K 层' },
          ]}
        />
        <p>
          保留 <b>{keep.size}</b> / {COLS * ROWS} 个图块；答题需要的{OBJ_NAME[q]}图块留下
        </p>
        <p className={`vtw-em ${ok ? 'vtw-green' : 'vtw-red'}`}>
          {kept} / {need.length}
        </p>
        <Feedback tone={ok ? 'ok' : 'bad'}>
          {rule === 'vtw'
            ? '前 K 层一个图块都不剪，信息先流进文字 token，第 K+1 层入口才整体撤出。'
            : ok
              ? `这条规则恰好留下了${OBJ_NAME[q]}；换成问瓶子或叉子试试。`
              : rule === 'fixed'
                ? `固定压缩不看问题，${OBJ_NAME[q]}的图块被提前丢掉了。`
                : `按注意力打分，${OBJ_NAME[q]}的分数偏低，被当成“不重要”剪掉了。`}
        </Feedback>
      </div>
    </div>
  );
}
