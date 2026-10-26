import React, { useState } from 'react';

const INK = '#21324a';
const MUTED = '#68778f';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const ORANGE = '#f07e47';
const RED = '#c43f52';
const LINE = '#d7deea';

type Voice = { name: string; role: string; q: number[]; k: number[] };
const VOICES: Voice[] = [
  { name: '钢琴', role: '和声铺底', q: [2, 1, 0], k: [2, 0, 1] },
  { name: '吉他', role: '分解节奏', q: [0, 3, 0], k: [0, 2, 1] },
  { name: '鼓', role: '节拍骨架', q: [1, 0, 2], k: [3, 0, 0] },
  { name: '人声', role: '主旋律', q: [0, 1, 3], k: [1, 1, 2] },
];

const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);

/** 查询—键打分：先算兼容性分数，此时还不是注意力权重。 */
export const QkvScore = () => {
  const [qi, setQi] = useState(0);
  const q = VOICES[qi];
  const scores = VOICES.map((v) => dot(q.q, v.k));
  const best = scores.indexOf(Math.max(...scores));
  const cv = VOICES[best];

  return (
    <div style={{ height: '100%', display: 'flex', gap: 24, color: INK }}>
      <div style={{ flex: '1 1 46%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 'var(--ppt-body-heading)', color: MUTED }}>谁来提问</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {VOICES.map((v, i) => (
            <button
              key={v.name}
              onClick={() => setQi(i)}
              aria-pressed={qi === i}
              style={{
                cursor: 'pointer',
                textAlign: 'left',
                padding: '12px 16px',
                borderRadius: 16,
                fontSize: 'var(--ppt-body-text)',
                background: qi === i ? '#eef3fb' : '#ffffff',
                border: `2px solid ${qi === i ? BLUE : LINE}`,
                color: qi === i ? BLUE : INK,
              }}
            >
              <strong>{v.name}</strong>
              <div style={{ fontSize: 24, color: MUTED }}>{v.role}</div>
            </button>
          ))}
        </div>

        <div style={{ background: '#f7f9fc', border: `1px solid ${LINE}`, borderRadius: 16, padding: '12px 18px' }}>
          <div style={{ fontSize: 'var(--ppt-body-text)' }}>
            q<sub>{q.name}</sub> = [{q.q.join(', ')}]
          </div>
          <div style={{ fontSize: 24, color: MUTED, marginTop: 6 }}>这一位此刻「需要什么」的向量</div>
        </div>

        <div style={{ background: '#fffaf6', border: `1px solid #f3ddc9`, borderRadius: 16, padding: '12px 18px', flex: 1 }}>
          <div style={{ fontSize: 'var(--ppt-body-text)', color: INK }}>
            最高分：<strong style={{ color: GREEN }}>{VOICES[best].name}</strong> {scores[best]} 分
          </div>
          <div style={{ fontSize: 'var(--ppt-body-text)', marginTop: 10 }}>
            k<sub>{cv.name}</sub> = [{cv.k.join(', ')}]
          </div>
          <div style={{ fontSize: 24, color: MUTED, marginTop: 6 }}>
            点积 = {q.q.map((v, i) => `${v}×${cv.k[i]}`).join(' + ')} = {dot(q.q, cv.k)}
          </div>
        </div>
      </div>

      <div style={{ flex: '1 1 54%', minWidth: 0, background: '#ffffff', border: `1px solid ${LINE}`, borderRadius: 18, padding: '20px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 'var(--ppt-body-heading)', color: INK }}>匹配分数 q·k</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16, flex: 1, justifyContent: 'center' }}>
          {VOICES.map((v, i) => {
            const s = scores[i];
            const w = Math.max(4, (Math.max(0, s) / 7) * 100);
            return (
              <div key={v.name} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ width: 96, fontSize: 'var(--ppt-body-text)', color: i === best ? GREEN : MUTED }}>{v.name}</span>
                <div style={{ flex: 1, height: 34, background: '#f1f5fa', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${w}%`, height: '100%', background: i === best ? GREEN : BLUE, opacity: i === best ? 1 : 0.55, transition: 'width .18s' }} />
                </div>
                <span style={{ width: 60, textAlign: 'right', fontSize: 'var(--ppt-body-text)', color: i === best ? GREEN : INK }}>{s}</span>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 'var(--ppt-body-text)', color: MUTED }}>
          分数可正可负、也不求和为 1；要变成音量配比，还需要 softmax。
        </div>
        <div style={{ fontSize: 22, color: RED, marginTop: 8 }}>向量为 3 维教学示意，不是论文中的真实权重。</div>
      </div>
    </div>
  );
};
