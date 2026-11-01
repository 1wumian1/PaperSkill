import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Btn, C, Feedback, Range, Seg } from './vtw-kit';

// 10.1 适用边界：格子 = 第几个输出词（列）× 第几层（行，32 层）。
// 涂色的格子表示这个词在这一层还需要直接读取视觉 token（本页设定的教学场景）；
// K 以上视觉 token 已撤出，需要它的格子变红 = 失败。KL 校准只检查第 1 列。
const N = 32;
const T = 12;
type Sid = 'yes' | 'early' | 'random' | 'long' | 'fine';
const SCENES: Record<Sid, { name: string; need: number[]; K?: number; random?: boolean; paper: string }> = {
  yes: { name: '是非题', need: [12, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], paper: '论文实测：POPE 上 VTW 85.96，原模型 85.83（7B，K = 16）。' },
  early: { name: 'K 太早', need: [12, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], K: 4, paper: 'DivPrune 关闭校准、用 K = 4：7B 的 MME 感知分 681（原模型 1506）；VTW 图 8(a) 也显示 K 小时准确率下降。' },
  random: { name: '随机层', need: [12, 10, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0], random: true, paper: '表 2：7B 的 VTW†（K ∈ [8, 24]）MMB 55.61（原模型 64.09），POPE 76.05（85.83）。' },
  long: { name: '长回答', need: [10, 8, 6, 4, 0, 0, 22, 24, 22, 0, 0, 0], paper: '本页设定的场景，论文没有测：长回答后段若要回看图像细节，第一个词的 KL 检查覆盖不到。' },
  fine: { name: '细粒度', need: [18, 14, 17, 8, 0, 0, 0, 0, 0, 0, 0, 0], paper: '附录表 9：NeXT 位置 143.33 → 133.33，7B OCR 140.00 → 137.50；子任务题量小，无法区分方法效应与波动。' },
};
const RANDOM_KS = [9, 21, 13, 8, 17, 24, 11, 15, 19, 10];

export function VtwBoundaryCases(_: WidgetProps) {
  const [sid, setSid] = useState<Sid>('long');
  const [K, setK] = useState(16);
  const [sample, setSample] = useState(0);
  const sc = SCENES[sid];
  const effK = sc.K ?? (sc.random ? RANDOM_KS[sample % RANDOM_KS.length] : K);
  const fails = sc.need.map((d) => d > effK);
  const nFail = fails.filter(Boolean).length;
  const firstOk = !fails[0];
  const x0 = 150;
  const cw = 54;
  const y0 = 54;
  const rh = 15;
  const rowY = (l: number) => y0 + (N - l) * rh;
  return (
    <div className="vtw vtw-bd">
      <svg viewBox="0 0 900 622" width={900} height={622} className="vtw-stage" role="img" aria-label={`场景“${sc.name}”，K = ${effK}：12 个输出词中 ${nFail} 个需要的视觉信息已被撤走${firstOk ? '，第 1 个词没有问题' : ''}`}>
        <rect x={x0 - 6} y={y0 - 8} width={cw + 2} height={N * rh + 14} rx={8} fill="none" stroke={C.blue} strokeWidth={4} />
        <text x={x0 - 6} y={y0 - 20} className="vtw-svg-t is-b" fill={C.blue}>
          KL 校准只看第 1 个词
        </text>
        {sc.need.map((d, c) =>
          Array.from({ length: N }, (_, i) => {
            const l = i + 1;
            const needed = l <= d;
            const withdrawn = l > effK;
            const fill = needed ? (withdrawn ? C.red : C.leaf) : withdrawn ? '#f1f3f6' : '#e9e3d6';
            return <rect key={`${c}-${l}`} x={x0 + c * cw} y={rowY(l)} width={cw - 8} height={rh - 3} rx={2} fill={fill} />;
          })
        )}
        <line x1={x0 - 14} y1={rowY(effK) - 2} x2={x0 + T * cw} y2={rowY(effK) - 2} stroke={C.orange} strokeWidth={4} />
        <text x={x0 - 18} y={rowY(effK) + 8} textAnchor="end" className="vtw-svg-t is-b" fill={C.orange}>
          K={effK}
        </text>
        <text x={x0 - 18} y={rowY(1) + 10} textAnchor="end" className="vtw-svg-t is-muted">
          第1层
        </text>
        <text x={x0 - 18} y={rowY(32) + 10} textAnchor="end" className="vtw-svg-t is-muted">
          32
        </text>
        {fails.map((f, c) => (
          <text key={c} x={x0 + c * cw + (cw - 8) / 2} y={rowY(1) + 48} textAnchor="middle" className="vtw-svg-t is-b" fill={f ? C.red : sc.need[c] ? C.green : C.muted}>
            {f ? '✗' : sc.need[c] ? '✓' : '·'}
          </text>
        ))}
        <text x={x0} y={rowY(1) + 86} className="vtw-svg-t is-muted">
          第 1 → 12 个输出词
        </text>
      </svg>
      <div className="vtw-bd-side">
        <Seg<Sid> label="场景" value={sid} onChange={setSid} options={(Object.keys(SCENES) as Sid[]).map((k) => ({ value: k, label: SCENES[k].name }))} />
        {sc.K === undefined && !sc.random ? (
          <Range label="撤出层 K" value={K} min={1} max={N - 1} onChange={setK} display={`K = ${K}`} />
        ) : sc.random ? (
          <div className="vtw-bd-row">
            <span>每个样本的 K 在 [8, 24] 里随机：K = {effK}</span>
            <Btn onClick={() => setSample((s) => s + 1)}>换一个样本</Btn>
          </div>
        ) : (
          <p>这个场景固定 K = {sc.K}（基线论文的设置）。</p>
        )}
        <p>
          失败的词 <span className={`vtw-em ${nFail ? 'vtw-red' : 'vtw-green'}`}>{nFail} / {T}</span>
        </p>
        <Feedback tone={nFail === 0 ? 'ok' : firstOk ? 'warn' : 'bad'}>
          {nFail === 0
            ? `K = ${effK} 时，每个词需要的视觉信息都还在。`
            : firstOk
              ? `第 1 个词没问题，后面 ${nFail} 个词失败——只看第 1 个词的 KL 校准发现不了。`
              : `连第 1 个词都受影响：KL 校准能发现这种情况，前提是 K 真由校准选出。`}
        </Feedback>
        <p className="vtw-muted">{sc.paper}</p>
      </div>
    </div>
  );
}
