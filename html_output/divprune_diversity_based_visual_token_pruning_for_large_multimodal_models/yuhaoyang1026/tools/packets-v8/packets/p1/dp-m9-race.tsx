import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { Btn, C, Seg, Tag, useReducedMotion } from './dp-kit';
import { EFFICIENCY } from './dp-data';

// 9.2 四种指标（移植自原版 v7）：理论 TFLOPs / 预填充 / 端到端 / 显存（Table 2 实测）。
// 时间类指标可“开跑”：跑道进度与实测时间成正比；深色段为预填充。
// 颜色：灰 = 原模型，紫 = VTW，红 = FastV（旧方法），绿 = DivPrune。

type Metric = 'e2e' | 'prefill' | 'tflop' | 'mem';
const LABEL: Record<Metric, string> = { e2e: '端到端延迟 s', prefill: '预填充 s', tflop: '理论 TFLOPs', mem: '显存峰值 GB' };
const MC: Record<string, string> = { 原模型: '#8a96a8', VTW: C.purple, FastV: C.red, DivPrune: C.green };
const RACE_MS = 3200;

export const DpM9Race: React.FC<WidgetProps> = () => {
  const [metric, setMetric] = useState<Metric>('e2e');
  const [t, setT] = useState(1);
  const [running, setRunning] = useState(false);
  const reduced = useReducedMotion();
  const raf = useRef(0);
  const timed = metric === 'e2e' || metric === 'prefill';
  const max = Math.max(...EFFICIENCY.map((e) => e[metric]));
  const orig = EFFICIENCY[0][metric];
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  useEffect(() => { cancelAnimationFrame(raf.current); setRunning(false); setT(1); }, [metric]);
  const run = () => {
    if (reduced) { setT(1); return; }
    cancelAnimationFrame(raf.current);
    setRunning(true);
    const t0 = performance.now();
    const loop = (now: number) => {
      const k = Math.min(1, (now - t0) / RACE_MS);
      setT(k);
      if (k < 1) raf.current = requestAnimationFrame(loop); else setRunning(false);
    };
    raf.current = requestAnimationFrame(loop);
  };
  const dg = metric === 'tflop' || metric === 'prefill' ? 3 : 2;
  const ours = EFFICIENCY[3];
  const fb: Record<Metric, string> = {
    e2e: `DivPrune ${ours.e2e} s，比原模型快 ${(orig / ours.e2e).toFixed(2)}×——理论 TFLOPs 只剩 14.10%，端到端却只省 ${((1 - ours.e2e / orig) * 100).toFixed(1)}%：还有视觉编码、逐词解码与调度开销，且受答案长度影响（论文未报告输出长度）。`,
    prefill: `预填充 ${orig} → ${ours.prefill} s，约 ${(orig / ours.prefill).toFixed(2)}×（少 ${((1 - ours.prefill / orig) * 100).toFixed(1)}%；正文“约 55%”与表不符）。FastV、VTW 都是 0.150 s，比 DivPrune 快约 11 ms——这是距离计算与串行贪心的开销。`,
    tflop: '理论 TFLOPs：0.937，只有原模型 6.539 的 14.10%（约 7.0×）。这是 Eq. (5) 的估算，只覆盖 LLM 解码层的预填充，不能直接当速度。',
    mem: '显存峰值 14.06 → 13.51 GB，只少 0.55 GB（约 3.9%；正文“约 400MB”与表不符）。batch = 1 时 7B 权重本身就占 13–14 GB（本页估算）。',
  };

  return (
    <div className="dp-root dp-m9r">
      <div className="dp-row">
        <Seg label="指标" options={(Object.keys(LABEL) as Metric[]).map((m) => ({ value: m, label: LABEL[m] }))} value={metric} onChange={setMetric} />
        {timed ? <Btn primary onClick={run} disabled={running}>{running ? '比赛中…' : '开跑'}</Btn> : null}
        <span className="dp-split-tags"><Tag kind="paper" /></span>
      </div>
      <div className="dp-glass dp-race" role="img" aria-label={`${LABEL[metric]}：${EFFICIENCY.map((e) => `${e.method} ${e[metric]}`).join('，')}`}>
        {EFFICIENCY.map((e) => {
          const v = e[metric], frac = v / max;
          const fill = timed ? Math.min(frac, t) : frac;
          const done = timed ? t >= frac - 1e-6 : true;
          const pre = metric === 'e2e' ? e.prefill / max : 0;
          return (
            <div className={`dp-lane ${e.method === 'DivPrune' ? 'is-ours' : ''}`} key={e.method}>
              <span className="dp-lane-k"><i style={{ background: MC[e.method] }} />{e.method}</span>
              <div className="dp-lane-track">
                <div className="dp-lane-fill" style={{ transform: `scaleX(${fill})`, background: MC[e.method] }} />
                {metric === 'e2e' ? <div className="dp-lane-pre" style={{ transform: `scaleX(${Math.min(pre, fill)})` }} /> : null}
                {timed ? <div className="dp-lane-goal" style={{ left: `${frac * 100}%` }} aria-hidden="true" /> : null}
              </div>
              <span className="dp-lane-v">
                {done ? v.toFixed(dg) : '…'}
                {done && e.method !== '原模型' ? <em>{timed ? ` ${(orig / v).toFixed(2)}×` : metric === 'tflop' ? ` ${e.ratio}%` : ` −${(orig - v).toFixed(2)}`}</em> : null}
              </span>
            </div>
          );
        })}
        <div className="dp-muted">{metric === 'e2e' ? '深色段 = 预填充。' : ''}Table 2：LLaVA-NeXT-Video-7B，VideoChatGPT 499 个样本平均，8 × V100，batch = 1</div>
      </div>
      <div className={`dp-fb ${metric === 'tflop' ? 'is-limit' : ''}`} role="status" aria-live="polite">{fb[metric]}</div>
    </div>
  );
};
