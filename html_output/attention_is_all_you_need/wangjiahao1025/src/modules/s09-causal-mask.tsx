import React, { useState } from 'react';

const INK = '#21324a';
const MUTED = '#68778f';
const RED = '#c43f52';
const GREEN = '#228d5c';
const BLUE = '#27446e';
const ORANGE = '#f07e47';
const LINE = '#d7deea';

const SCORES = [
  [3.0, 1.2, 0.4, 0.8],
  [0.6, 2.4, 1.8, 0.2],
  [1.1, 0.3, 2.9, 1.4],
  [0.5, 1.6, 0.9, 3.2],
];

function rowWeights(row: number, masked: boolean) {
  const s = SCORES[row].map((v, j) => (masked && j > row ? -Infinity : v));
  const m = Math.max(...s.filter((v) => Number.isFinite(v)));
  const ex = s.map((v) => (Number.isFinite(v) ? Math.exp(v - m) : 0));
  const total = ex.reduce((a, b) => a + b, 0);
  return ex.map((v) => v / total);
}

/** 因果掩码：把未来位置设为 −∞，softmax 后权重为 0。 */
export const CausalMask = () => {
  const [masked, setMasked] = useState(true);
  const [row, setRow] = useState(1);
  const [cell, setCell] = useState<{ r: number; c: number } | null>({ r: 1, c: 2 });
  const weights = Array.from({ length: 4 }).map((_, r) => rowWeights(r, masked));
  const leak = !masked && weights.some((w, r) => w.some((v, c) => c > r && v > 0.001));
  const cur = cell ? { ...cell, w: weights[cell.r][cell.c] } : null;

  return (
    <div style={{ height: '100%', display: 'flex', gap: 26, color: INK }}>
      <div style={{ flex: '1 1 58%', minWidth: 0, background: '#fbf7f2', borderRadius: 18, border: `1px solid ${LINE}`, padding: '16px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <span style={{ fontSize: 'var(--ppt-body-text)' }}>因果掩码</span>
          <button
            onClick={() => setMasked((v) => !v)}
            aria-pressed={masked}
            style={{
              cursor: 'pointer',
              fontSize: 'var(--ppt-body-text)',
              padding: '8px 24px',
              borderRadius: 999,
              border: `2px solid ${masked ? GREEN : RED}`,
              background: masked ? '#f4faf6' : '#fdf2f4',
              color: masked ? GREEN : RED,
            }}
          >
            {masked ? '已开启' : '已关闭'}
          </button>
          <span style={{ fontSize: 22, color: MUTED }}>行 = 正在生成的位置，列 = 被看的位置</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(4, 1fr)', gap: 8 }}>
          <div />
          {[0, 1, 2, 3].map((c) => (
            <div key={c} style={{ textAlign: 'center', fontSize: 22, color: MUTED }}>第 {c + 1} 拍</div>
          ))}
          {[0, 1, 2, 3].map((r) => (
            <React.Fragment key={r}>
              <button
                onClick={() => setRow(r)}
                style={{
                  cursor: 'pointer',
                  fontSize: 22,
                  border: 'none',
                  background: 'transparent',
                  color: row === r ? BLUE : MUTED,
                  fontWeight: row === r ? 700 : 400,
                  textAlign: 'right',
                  paddingRight: 8,
                }}
              >
                第 {r + 1} 拍
              </button>
              {[0, 1, 2, 3].map((c) => {
                const blocked = masked && c > r;
                const w = weights[r][c];
                const bg = blocked ? '#eef2f7' : c > r ? '#fdf2f4' : `rgba(39,68,110,${0.12 + w * 0.7})`;
                const isSel = cell?.r === r && cell?.c === c;
                return (
                  <button
                    key={c}
                    onClick={() => setCell({ r, c })}
                    aria-label={`第 ${r + 1} 拍看第 ${c + 1} 拍`}
                    style={{
                      cursor: 'pointer',
                      height: 78,
                      borderRadius: 12,
                      border: `3px solid ${isSel ? ORANGE : blocked ? '#dde4ee' : '#cbd4e1'}`,
                      background: bg,
                      color: blocked ? MUTED : c > r ? RED : '#ffffff',
                      fontSize: 'var(--ppt-body-text)',
                      fontWeight: 600,
                    }}
                  >
                    {blocked ? '−∞' : `${(w * 100).toFixed(0)}%`}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        <div style={{ marginTop: 14, fontSize: 'var(--ppt-body-text)', color: leak ? RED : GREEN }}>
          {masked ? '第 2 拍只看得到第 1、2 拍：自回归性质成立。' : '第 2 拍已经在看第 4 拍——未来的答案被提前泄漏。'}
        </div>
      </div>

      <div style={{ flex: '1 1 42%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: '#ffffff', border: `1px solid ${LINE}`, borderRadius: 16, padding: '16px 20px' }}>
          <div style={{ fontSize: 'var(--ppt-body-heading)', color: INK }}>选中格子</div>
          <div style={{ fontSize: 'var(--ppt-body-text)', marginTop: 8 }}>
            {cur ? (
              <>
                第 {cur.r + 1} 拍 → 第 {cur.c + 1} 拍：权重 <strong style={{ color: cur.c > cur.r ? RED : BLUE }}>{(cur.w * 100).toFixed(0)}%</strong>
              </>
            ) : (
              '点击矩阵中的任意格子'
            )}
          </div>
          <div style={{ fontSize: 24, color: MUTED, marginTop: 8 }}>
            掩码把非法连接设为 −∞，经 softmax 后恰好为 0；权重仍在每行内归一化。
          </div>
        </div>

        <div style={{ flex: 1, background: '#f7f9fc', border: `1px solid ${LINE}`, borderRadius: 16, padding: '16px 20px', fontSize: 'var(--ppt-body-text)' }}>
          解码器自注意力：每个位置只能看自己和更早的位置。
          <div style={{ fontSize: 24, color: MUTED, marginTop: 10 }}>
            配合输出嵌入右移一位，位置 i 的预测只依赖小于 i 的已知输出（page 5 §3.2.3）。
          </div>
          <div style={{ fontSize: 24, color: MUTED, marginTop: 10 }}>
            矩阵为 4×4 示意，分数固定、权重为实时 softmax 结果。
          </div>
        </div>
      </div>
    </div>
  );
};
