import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Feedback, Range } from './vtw-kit';
import { COLS, ROWS, OBJ_CELLS, TeaTable, cellKey } from './vtw-art';

// 2.2 VTW 作者概括的旧方法四个短板（AAAI 引言），以及 VTW 如何绕开。
// 第 3 条可拖动解码步：按重要性每步换一批 token 时，上一步的 KV 缓存无法原样复用。
type H = 1 | 2 | 3 | 4;
const NAMES: Record<H, string> = {
  1: '缺乏灵活性',
  2: '重要性指标不完整',
  3: '与 KV Cache 不兼容',
  4: '与 FlashAttention 不一致',
};
const FIX: Record<H, string> = {
  1: 'VTW 不在输入端压缩：前 K 层带着全部视觉 token，任何问题都能先读到完整图像。',
  2: 'VTW 不给 token 打分，只回答一个问题：到第几层为止还需要视觉 token。',
  3: 'VTW 只在预填充时撤出一次，之后每个解码步的缓存结构都不变，可以直接复用。',
  4: 'VTW 不读取注意力分数，可以照常使用 FlashAttention 这类不输出注意力矩阵的实现。',
};
const FIXED = new Set(
  [...OBJ_CELLS.cake, [0, 0], [1, 0], [2, 0], [1, 1], [2, 1], [3, 1], [4, 2], [5, 2], [0, 3], [0, 4], [5, 3], [5, 4], [7, 0], [7, 1]].map(([c, r]) => cellKey(c, r))
);

function Thumb({ x, y, q, ok }: { x: number; y: number; q: string; ok: boolean }) {
  const w = 288;
  const h = 180;
  return (
    <g transform={`translate(${x} ${y})`}>
      <svg x={0} y={0} width={w} height={h} viewBox="0 0 800 500">
        <TeaTable w={800} h={500} />
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          const c = i % COLS;
          const r = Math.floor(i / COLS);
          return FIXED.has(cellKey(c, r)) ? null : <rect key={i} x={c * 100} y={r * 100} width={100} height={100} fill="#f4f6f9" opacity={0.88} />;
        })}
      </svg>
      <rect x={0} y={0} width={w} height={h} fill="none" stroke={ok ? C.green : C.red} strokeWidth={5} rx={6} />
      <text x={w / 2} y={h + 40} textAnchor="middle" className="vtw-svg-t">
        {q}
      </text>
      <text x={w / 2} y={h + 80} textAnchor="middle" className="vtw-svg-t is-b" fill={ok ? C.green : C.red}>
        {ok ? '答得出' : '需要的图块已丢'}
      </text>
    </g>
  );
}

function Art({ h, step }: { h: H; step: number }) {
  if (h === 1)
    return (
      <g>
        <Thumb x={10} y={20} q="有蛋糕吗？" ok />
        <Thumb x={346} y={20} q="瓶子什么颜色？" ok={false} />
        <Thumb x={682} y={20} q="叉子在哪侧？" ok={false} />
      </g>
    );
  if (h === 2) {
    const bars = [
      { n: '蛋糕', a: 0.9, need: false },
      { n: '窗户', a: 0.62, need: false },
      { n: '桌面', a: 0.48, need: false },
      { n: '瓶子', a: 0.16, need: true },
      { n: '叉子', a: 0.12, need: false },
    ];
    const cut = 0.4;
    return (
      <g>
        <text x={20} y={34} className="vtw-svg-t is-muted">问“瓶子是什么颜色？”时各区域得到的注意力分数（示意）</text>
        {bars.map((b, i) => {
          const y = 66 + i * 58;
          const kept = b.a >= cut;
          return (
            <g key={b.n}>
              <text x={130} y={y + 32} textAnchor="end" className={`vtw-svg-t ${b.need ? 'is-b' : ''}`}>
                {b.n}
              </text>
              <rect x={150} y={y + 6} width={780 * b.a} height={36} rx={6} fill={kept ? C.leaf : '#cfd6e1'} />
              {b.need && (
                <text x={150 + 780 * b.a + 14} y={y + 34} className="vtw-svg-t is-b" fill={C.red}>
                  答题要用，却被剪掉
                </text>
              )}
            </g>
          );
        })}
        <line x1={150 + 780 * cut} y1={56} x2={150 + 780 * cut} y2={360} stroke={C.orange} strokeWidth={4} strokeDasharray="10 8" />
        <text x={150 + 780 * cut + 10} y={366} className="vtw-svg-t" fill={C.orange}>保留线</text>
      </g>
    );
  }
  if (h === 3) {
    // 每个解码步（行）保留哪些视觉 token（列）
    const cols = 12;
    const fast = [
      [0, 1, 2, 4, 5, 7],
      [0, 2, 3, 5, 8, 9],
      [1, 2, 6, 7, 9, 11],
    ];
    return (
      <g>
        {(['按重要性（每步重选）', 'VTW（前 K 层全部保留）'] as const).map((t, side) => (
          <g key={t} transform={`translate(${side * 500} 0)`}>
            <text x={10} y={34} className="vtw-svg-t is-b" fill={side ? C.green : C.purple}>
              {t}
            </text>
            {[0, 1, 2].map((r) => {
              const keep = side ? Array.from({ length: cols }, (_, i) => i) : fast[r];
              const active = r < step;
              return (
                <g key={r} opacity={active ? 1 : 0.25}>
                  <text x={10} y={96 + r * 92} className="vtw-svg-t is-muted">
                    第 {r + 1} 步
                  </text>
                  {Array.from({ length: cols }, (_, c) => {
                    const on = keep.includes(c);
                    const changed = !side && r > 0 && on !== fast[r - 1].includes(c);
                    return <rect key={c} x={130 + c * 28} y={66 + r * 92} width={22} height={44} rx={4} fill={on ? C.leaf : '#e3e8f0'} stroke={changed && active ? C.red : 'none'} strokeWidth={4} />;
                  })}
                </g>
              );
            })}
          </g>
        ))}
        <text x={10} y={356} className="vtw-svg-t" fill={step > 1 ? C.red : C.muted}>
          {step > 1 ? '红框：这一步换了 token，上一步缓存的 K/V 对不上' : '拖动解码步，比较两边的缓存能否复用'}
        </text>
      </g>
    );
  }
  return (
    <g>
      <text x={10} y={34} className="vtw-svg-t is-b" fill={C.purple}>
        FastV：要读出注意力矩阵再打分
      </text>
      {Array.from({ length: 64 }, (_, i) => {
        const r = Math.floor(i / 8);
        const c = i % 8;
        return c <= r ? <rect key={i} x={20 + c * 34} y={56 + r * 34} width={30} height={30} fill={C.purple} opacity={0.2 + 0.08 * ((r * 3 + c) % 7)} /> : null;
      })}
      <text x={20} y={356} className="vtw-svg-t is-muted">s × s 的分数要写回显存</text>
      <text x={520} y={34} className="vtw-svg-t is-b" fill={C.green}>
        VTW：不需要注意力分数
      </text>
      <g className="vtw-svg-t">
        <text x={520} y={110} className="vtw-svg-t">表 4　　　KV Cache　FlashAttention</text>
        <text x={520} y={170} className="vtw-svg-t">原模型　　　✓　　　　✓</text>
        <text x={520} y={230} className="vtw-svg-t" fill={C.purple}>FastV　　　 ✓　　　　✗</text>
        <text x={520} y={290} className="vtw-svg-t" fill={C.green}>VTW　　　　✓　　　　✓</text>
      </g>
    </g>
  );
}

export function VtwOldHurdles(_: WidgetProps) {
  const [h, setH] = useState<H>(3);
  const [step, setStep] = useState(1);
  return (
    <div className="vtw vtw-hd">
      <div className="vtw-hd-list" role="radiogroup" aria-label="旧方法的四个短板">
        {([1, 2, 3, 4] as H[]).map((k) => (
          <button key={k} type="button" role="radio" aria-checked={k === h} className="vtw-hd-item" onClick={() => setH(k)}>
            <span>{'①②③④'[k - 1]}</span>
            {NAMES[k]}
          </button>
        ))}
      </div>
      <div className="vtw-hd-main">
        <svg viewBox="0 0 1000 380" width={1000} height={380} className="vtw-stage" role="img" aria-label={`短板 ${h}：${NAMES[h]}`}>
          <g transform="translate(20 6)">
            <Art h={h} step={step} />
          </g>
        </svg>
        {h === 3 ? (
          <Range label="解码步" value={step} min={1} max={3} onChange={setStep} tone="blue" display={`第 ${step} 步`} />
        ) : (
          <p className="vtw-muted vtw-hd-src">{h === 1 ? '引言：PruMerge 对不同问题使用同一组视觉 token，MME 下降 160.4（引述）' : h === 2 ? '图 1(b)：FastV 剪掉了瓶子，却保留了蛋糕（论文挑出的单个示例）' : '表 4：三者都支持 KV Cache；FastV 与 FlashAttention 不兼容'}</p>
        )}
        <Feedback tone="ok">{FIX[h]}</Feedback>
      </div>
    </div>
  );
}
