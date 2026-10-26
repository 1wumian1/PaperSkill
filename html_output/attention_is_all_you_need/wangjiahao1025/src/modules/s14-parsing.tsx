import React, { useState } from 'react';

const INK = '#21324a';
const MUTED = '#68778f';
const GREEN = '#228d5c';
const BLUE = '#27446e';
const ORANGE = '#f07e47';
const LINE = '#d7deea';

type Row = { name: string; f1: number; ours?: boolean; ref?: boolean };

/** Table 4（page 10）：WSJ Section 23 上的句法分析 F1。 */
const DATA: Record<'wsj' | 'semi', Row[]> = {
  wsj: [
    { name: 'Vinyals 2014', f1: 88.3 },
    { name: 'Petrov 2006 · BerkeleyParser', f1: 90.4 },
    { name: 'Zhu 2013', f1: 90.4 },
    { name: 'Dyer 2016 · RNN Grammar', f1: 91.7 },
    { name: 'Transformer（4 层）', f1: 91.3, ours: true },
  ],
  semi: [
    { name: 'Zhu 2013', f1: 91.3 },
    { name: 'Huang & Harper 2009', f1: 91.3 },
    { name: 'McClosky 2006', f1: 92.1 },
    { name: 'Vinyals 2014', f1: 92.1 },
    { name: 'Luong 2015 · multi-task', f1: 93.0 },
    { name: 'Dyer 2016 · RNN Grammar', f1: 93.3, ref: true },
    { name: 'Transformer（4 层）', f1: 92.7, ours: true },
  ],
};

const F1MIN = 86;
const F1MAX = 94;

/** 泛化能力：同一套结构换到句法分析，Table 4。 */
export const Parsing = () => {
  const [mode, setMode] = useState<'wsj' | 'semi'>('wsj');
  const rows = DATA[mode];
  const W = 900;
  const H = 470;
  const LABEL_W = 262;
  const BAR_W = 512;
  const rowH = (H - 44) / rows.length;
  const bx = (v: number) => LABEL_W + ((v - F1MIN) / (F1MAX - F1MIN)) * BAR_W;

  const refVal = mode === 'wsj' ? 90.4 : 93.3;
  const refText = mode === 'wsj' ? 'BerkeleyParser 90.4' : 'RNN Grammar 93.3';

  const btn = (active: boolean): React.CSSProperties => ({
    cursor: 'pointer',
    fontSize: 24,
    padding: '8px 20px',
    borderRadius: 999,
    border: `2px solid ${active ? BLUE : LINE}`,
    background: active ? '#ffffff' : '#f7f9fc',
    color: active ? BLUE : MUTED,
  });

  return (
    <div style={{ height: '100%', display: 'flex', gap: 24, color: INK }}>
      <div style={{ flex: '1 1 60%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => setMode('wsj')} aria-pressed={mode === 'wsj'} style={btn(mode === 'wsj')}>
            只用 WSJ
          </button>
          <button onClick={() => setMode('semi')} aria-pressed={mode === 'semi'} style={btn(mode === 'semi')}>
            半监督
          </button>
          <span style={{ marginLeft: 'auto', fontSize: 22, color: MUTED }}>WSJ Section 23 · F1 越高越好</span>
        </div>

        <div style={{ flex: 1, minHeight: 0, background: '#ffffff', border: `1px solid ${LINE}`, borderRadius: 18, padding: '12px 18px' }}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label="各句法分析器在 WSJ Section 23 上的 F1 对比">
            <line x1={LABEL_W} y1="10" x2={LABEL_W} y2={H - 34} stroke="#c3cddd" strokeWidth="1.5" />
            {[86, 88, 90, 92, 94].map((v) => (
              <g key={v}>
                <line x1={bx(v)} y1="10" x2={bx(v)} y2={H - 34} stroke="#eef2f7" strokeWidth="1.5" />
                <text x={bx(v)} y={H - 12} textAnchor="middle" fontSize="20" fill={MUTED}>{v}</text>
              </g>
            ))}

            <line x1={bx(refVal)} y1="10" x2={bx(refVal)} y2={H - 34} stroke={mode === 'wsj' ? BLUE : ORANGE} strokeWidth="2" strokeDasharray="6 5" opacity="0.75" />
            <text x={bx(refVal)} y="24" textAnchor="middle" fontSize="19" fill={mode === 'wsj' ? BLUE : ORANGE}>{refText}</text>

            {rows.map((r, i) => {
              const y = 40 + i * ((H - 60) / rows.length);
              const h = Math.min(34, ((H - 60) / rows.length) * 0.52);
              const fill = r.ours ? GREEN : r.ref ? ORANGE : '#9fb0c8';
              return (
                <g key={r.name}>
                  <text x={LABEL_W - 14} y={y + h * 0.72} textAnchor="end" fontSize="21" fill={r.ours ? GREEN : MUTED} fontWeight={r.ours ? 700 : 400}>
                    {r.name}
                  </text>
                  <rect x={LABEL_W} y={y} width={bx(r.f1) - LABEL_W} height={h} rx="4" fill={fill} opacity={r.ours ? 1 : 0.72} />
                  <text x={bx(r.f1) + 10} y={y + h * 0.72} fontSize="21" fill={r.ours ? GREEN : INK} fontWeight={r.ours ? 700 : 400}>
                    {r.f1.toFixed(1)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div style={{ flex: '1 1 40%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: '#ffffff', border: `1px solid ${LINE}`, borderRadius: 16, padding: '14px 20px' }}>
          <div style={{ fontSize: 'var(--ppt-body-heading)', color: BLUE }}>配置</div>
          <div style={{ fontSize: 24, color: MUTED, marginTop: 6 }}>4 层 · d_model = 1024 · 其余沿用 EN-DE base</div>
          <div style={{ fontSize: 24, color: MUTED, marginTop: 4 }}>
            {mode === 'wsj' ? 'WSJ 约 4 万句 · 词表 16K' : '半监督：高置信度 + BerkeleyParser 语料约 1700 万句 · 词表 32K'}
          </div>
          <div style={{ fontSize: 24, color: MUTED, marginTop: 4 }}>beam = 21 · α = 0.3 · 输出上限 = 输入 + 300</div>
        </div>

        <div style={{ flex: 1, background: '#f4faf6', border: `1px solid ${mode === 'wsj' ? '#cce5d8' : '#cce5d8'}`, borderRadius: 16, padding: '14px 20px' }}>
          <div style={{ fontSize: 'var(--ppt-body-heading)', color: GREEN }}>这一栏说明了什么</div>
          <div style={{ fontSize: 'var(--ppt-body-text)', marginTop: 6 }}>
            {mode === 'wsj'
              ? '只用 4 万句 WSJ，91.3 已经高过 BerkeleyParser 的 90.4——而论文只调了 dropout、学习率和 beam，没做任务特定设计。'
              : '半监督下 92.7 超过表中其余全部系统，只低于 RNN Grammar 的 93.3。原文同时点明：小数据场景下 RNN 序列模型此前拿不到 SOTA。'}
          </div>
        </div>

        <div style={{ background: '#f7f9fc', border: `1px solid ${LINE}`, borderRadius: 16, padding: '12px 20px', fontSize: 22, color: MUTED }}>
          F1 取 WSJ Section 23。表中基线来自不同论文、训练设置各异，只看同一训练设置内的相对位置。
        </div>
      </div>
    </div>
  );
};
