import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Btn, C, Feedback } from './vtw-kit';

// 10.3 结论分级：把每条说法放进“已证明 / 有解释但未证实 / 仍然未知”，揭晓依据。
// 分级与依据沿用旧版核对结果（单次运行，结论只在论文测试的条件内成立）。
type Lv = 'proven' | 'explained' | 'unknown';
const LV: Record<Lv, { name: string; color: string }> = {
  proven: { name: '已证明', color: C.green },
  explained: { name: '有解释，未证实', color: C.orange },
  unknown: { name: '仍然未知', color: C.muted },
};
const ITEMS: { claim: string; lv: Lv; basis: string }[] = [
  { claim: '在 LLaVA-1.5 与 NeXT 上，VTW 把 TFLOPs 降到约 52%–55%，六个基准分数与原模型相近。', lv: 'proven', basis: '表 2 实测；差值是否超出评测波动无法判断，只在报告的模型与基准上成立。' },
  { claim: '撤哪些 token、在哪一层撤都很关键。', lv: 'proven', basis: '表 2 的 Rand 几乎全面崩溃，VTW† 在 MMB、POPE 明显下降；图 8(a) K 小时准确率下降。' },
  { claim: '在 NeXT-7B、SQA、单张 3090 上，每样本延迟降到 0.63×，单样本显存降到 0.65×。', lv: 'proven', basis: '表 4 实测；只有这一个模型、数据集与硬件组合。' },
  { claim: '撤出只在预填充做一次，解码时缓存可以直接复用。', lv: 'proven', basis: '官方代码的撤出条件 seq_length > 1；代码事实，不依赖实验。' },
  { claim: '视觉信息在前几层就迁移进了文字 token。', lv: 'explained', basis: '表 1 只有 1 个模型、1 个基准、1 个层号；白图同时引入“错误信息”和“分布外输入”。' },
  { claim: '深层注意力集中在系统 token，是 attention sink 所致。', lv: 'explained', basis: '借用 StreamingLLM 的解释；图 4 是平均注意力比例，没有因果干预。' },
  { claim: 'KL 收敛时准确率也收敛，所以 KL 是好的选层准则。', lv: 'explained', basis: '只在 LLaVA-1.5-7B、SQA 上做了表 5 与图 8。' },
  { claim: 'VTW 比原模型高零点几分，是因为避免了关注噪声。', lv: 'explained', basis: '差值很小、单次运行；FastV 与 VTW 多个因素同时不同。' },
  { claim: '长回答、多轮对话的后段 token 不再需要深层视觉信息。', lv: 'unknown', basis: 'KL 校准只比较第一个输出词；长文本只有定性对话示例。' },
  { claim: '13B 和 NeXT 用论文的 η 会选出哪个 K。', lv: 'unknown', basis: '表 2 的 K 为手动设定；代码中这两个模型的 η 与论文不同。' },
  { claim: '预填充延迟与逐词解码延迟各自降了多少。', lv: 'unknown', basis: '表 4 只报告每样本总延迟。' },
];

export function VtwVerdictSort(_: WidgetProps) {
  const [i, setI] = useState(0);
  const [picks, setPicks] = useState<(Lv | null)[]>(() => ITEMS.map(() => null));
  const it = ITEMS[i];
  const pick = picks[i];
  const right = picks.filter((p, k) => p === ITEMS[k].lv).length;
  const done = picks.filter(Boolean).length;
  const choose = (lv: Lv) => {
    if (pick) return;
    const next = [...picks];
    next[i] = lv;
    setPicks(next);
  };
  return (
    <div className="vtw vtw-vd">
      <div className="vtw-vd-card">
        <p className="vtw-muted">
          第 {i + 1} / {ITEMS.length} 条说法
        </p>
        <p className="vtw-h">{it.claim}</p>
        <div className="vtw-vd-bins" role="group" aria-label="放进哪一级">
          {(Object.keys(LV) as Lv[]).map((lv) => (
            <button key={lv} type="button" className={`vtw-vd-bin ${pick === lv ? 'is-picked' : ''} ${pick && it.lv === lv ? 'is-answer' : ''}`} style={{ ['--c' as string]: LV[lv].color } as React.CSSProperties} disabled={!!pick} onClick={() => choose(lv)}>
              {LV[lv].name}
            </button>
          ))}
        </div>
        {pick ? (
          <Feedback tone={pick === it.lv ? 'ok' : 'warn'}>
            <b>{pick === it.lv ? '分对了。' : `应归入“${LV[it.lv].name}”。`}</b>
            {it.basis}
          </Feedback>
        ) : (
          <Feedback tone="info">先判断：这条说法有直接实测支撑吗？还是只是解释，或者论文根本没测？</Feedback>
        )}
        <div className="vtw-vd-nav">
          <Btn onClick={() => setI((k) => Math.max(0, k - 1))} disabled={i === 0}>
            上一条
          </Btn>
          <Btn primary onClick={() => setI((k) => Math.min(ITEMS.length - 1, k + 1))} disabled={i === ITEMS.length - 1}>
            下一条
          </Btn>
          <Btn
            onClick={() => {
              setPicks(ITEMS.map(() => null));
              setI(0);
            }}
          >
            重新分
          </Btn>
        </div>
      </div>
      <div className="vtw-vd-side">
        <svg viewBox="0 0 440 420" width={440} height={420} role="img" aria-label={`已分 ${done} 条，分对 ${right} 条`}>
          {(Object.keys(LV) as Lv[]).map((lv, b) => {
            const mine = ITEMS.map((x, k) => ({ x, k })).filter(({ k }) => picks[k] === lv);
            return (
              <g key={lv}>
                <rect x={20 + b * 140} y={60} width={100} height={290} rx={12} fill="#f6f8fc" stroke={LV[lv].color} strokeWidth={2} />
                {mine.map(({ k }, j) => (
                  <rect key={k} x={36 + b * 140} y={322 - j * 24} width={68} height={18} rx={4} fill={picks[k] === ITEMS[k].lv ? LV[lv].color : C.red} />
                ))}
                <text x={70 + b * 140} y={400} textAnchor="middle" className="vtw-svg-t is-b" fill={LV[lv].color}>
                  {lv === 'proven' ? '已证明' : lv === 'explained' ? '有解释' : '未知'}
                </text>
              </g>
            );
          })}
        </svg>
        <p>
          已分 {done} / {ITEMS.length}，分对 <b>{right}</b>
        </p>
        <p className="vtw-muted">红色小条 = 放错的说法。</p>
      </div>
    </div>
  );
}
