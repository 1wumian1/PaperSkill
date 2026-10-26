import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { Btn, C, Seg, Slider, Tag, useReducedMotion } from './dp-kit';
import { EFFICIENCY } from './dp-data';

// 9.2 四种指标（第 9 章的主要动态解释）：理论 TFLOPs / 预填充 / 端到端 / 显存（Table 2 实测）。
// 时间类指标可“开跑”：每条跑道用 Web Animations 播放 transform，跑完所需时间与实测时间成正比；
// 播放期间 React 只在每条跑道到终点时更新一次（显示数值），不逐帧渲染。可选慢 / 中 / 快三档。
// “示意车道”：在原模型与 DivPrune 两个实测端点之间按剪掉的理论算力线性插值，斜纹显示并标“非实测”。
// 颜色：灰 = 原模型，紫 = VTW，红 = FastV（旧方法），绿 = DivPrune，斜纹橙 = 读者设定的示意值。

type Metric = 'e2e' | 'prefill' | 'tflop' | 'mem';
type Speed = 'slow' | 'mid' | 'fast';
const LABEL: Record<Metric, string> = { e2e: '端到端延迟 s', prefill: '预填充 s', tflop: '理论 TFLOPs', mem: '显存峰值 GB' };
const MC: Record<string, string> = { 原模型: '#8a96a8', VTW: C.purple, FastV: C.red, DivPrune: C.green };
/** 最慢一条跑道跑完的时长：教学播放，不按 UI 动效的 300ms 上限压缩 */
const RACE_MS: Record<Speed, number> = { slow: 6000, mid: 3600, fast: 1800 };
const OURS_CUT = 100 - EFFICIENCY[3].ratio; // DivPrune 剪掉的理论算力 85.9%

interface Lane { method: string; v: number; pre: number; ratio: number; demo?: boolean }

export const DpM9Race: React.FC<WidgetProps> = () => {
  const [metric, setMetric] = useState<Metric>('e2e');
  const [speed, setSpeed] = useState<Speed>('mid');
  const [demo, setDemo] = useState(false);
  const [cut, setCut] = useState(50);
  const [running, setRunning] = useState(false);
  const [arrived, setArrived] = useState<Record<string, boolean>>({});
  const reduced = useReducedMotion();
  const fills = useRef<Record<string, HTMLDivElement | null>>({});
  const pres = useRef<Record<string, HTMLDivElement | null>>({});
  const timers = useRef<number[]>([]);
  const anims = useRef<Animation[]>([]);
  const timed = metric === 'e2e' || metric === 'prefill';

  const orig = EFFICIENCY[0], ours = EFFICIENCY[3];
  const lerp = (a: number, b: number) => a + (b - a) * (cut / OURS_CUT);
  const lanes: Lane[] = EFFICIENCY.map((e) => ({ method: e.method, v: e[metric], pre: e.prefill, ratio: e.ratio }));
  if (demo) lanes.push({ method: '示意', v: lerp(orig[metric], ours[metric]), pre: lerp(orig.prefill, ours.prefill), ratio: 100 - cut, demo: true });
  const max = Math.max(...lanes.map((l) => l.v));

  const cancel = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    anims.current.forEach((a) => a.cancel());
    anims.current = [];
    setRunning(false);
    setArrived({});
  };
  useEffect(() => cancel, []);
  useEffect(() => { cancel(); }, [metric, demo]);

  const run = () => {
    cancel();
    if (reduced) return;
    const total = RACE_MS[speed];
    setRunning(true);
    let longest = 0;
    for (const l of lanes) {
      const frac = l.v / max, dur = Math.max(1, frac * total);
      longest = Math.max(longest, dur);
      const fill = fills.current[l.method];
      if (fill?.animate) anims.current.push(fill.animate([{ transform: 'scaleX(0)' }, { transform: `scaleX(${frac})` }], { duration: dur, easing: 'linear' }));
      const pre = pres.current[l.method];
      if (pre?.animate && metric === 'e2e') {
        const pf = l.pre / max;
        anims.current.push(pre.animate([{ transform: 'scaleX(0)' }, { transform: `scaleX(${pf})` }], { duration: Math.max(1, pf * total), easing: 'linear' }));
      }
      timers.current.push(window.setTimeout(() => setArrived((a) => ({ ...a, [l.method]: true })), dur));
    }
    timers.current.push(window.setTimeout(() => setRunning(false), longest + 20));
  };

  const dg = metric === 'tflop' || metric === 'prefill' ? 3 : 2;
  const fb: Record<Metric, string> = {
    e2e: `DivPrune ${ours.e2e} s，比原模型快 ${(orig.e2e / ours.e2e).toFixed(2)}×——理论 TFLOPs 只剩 14.10%，端到端却只省 ${((1 - ours.e2e / orig.e2e) * 100).toFixed(1)}%：还有视觉编码、逐词解码与调度开销，且受答案长度影响（论文未报告输出长度）。`,
    prefill: `预填充 ${orig.prefill} → ${ours.prefill} s，约 ${(orig.prefill / ours.prefill).toFixed(2)}×（少 ${((1 - ours.prefill / orig.prefill) * 100).toFixed(1)}%；正文“约 55%”与表不符）。FastV、VTW 都是 0.150 s，比 DivPrune 快约 11 ms——这是距离计算与串行贪心的开销。`,
    tflop: '理论 TFLOPs：0.937，只有原模型 6.539 的 14.10%（约 7.0×）。这是 Eq. (5) 的估算，只覆盖 LLM 解码层的预填充，不能直接当速度。',
    mem: '显存峰值 14.06 → 13.51 GB，只少 0.55 GB（约 3.9%；正文“约 400MB”与表不符）。batch = 1 时 7B 权重本身就占 13–14 GB（本页估算）。',
  };

  return (
    <div className="dp-root dp-m9r">
      <div className="dp-row">
        <Seg label="指标" options={(Object.keys(LABEL) as Metric[]).map((m) => ({ value: m, label: LABEL[m] }))} value={metric} onChange={setMetric} />
        {timed ? (
          <>
            <Seg label="播放速度" options={[{ value: 'slow', label: '慢' }, { value: 'mid', label: '中' }, { value: 'fast', label: '快' }]} value={speed} onChange={setSpeed} />
            <Btn primary onClick={run}>{running ? '重新开跑' : '开跑'}</Btn>
          </>
        ) : null}
        <span className="dp-split-tags"><Tag kind="paper" />{demo ? <Tag kind="demo" /> : null}</span>
      </div>
      <div className="dp-glass dp-race" role="img" aria-label={`${LABEL[metric]}：${lanes.map((l) => `${l.method} ${l.v.toFixed(dg)}`).join('，')}`}>
        {lanes.map((l) => {
          const frac = l.v / max;
          const done = !running || arrived[l.method];
          return (
            <div className={`dp-lane ${l.method === 'DivPrune' ? 'is-ours' : ''} ${l.demo ? 'is-demo' : ''}`} key={l.method}>
              <span className="dp-lane-k"><i style={{ background: l.demo ? C.orange : MC[l.method] }} />{l.demo ? `示意 · 剪 ${cut}%` : l.method}</span>
              <div className="dp-lane-track">
                <div className="dp-lane-fill" ref={(el) => { fills.current[l.method] = el; }} style={{ transform: `scaleX(${frac})`, background: l.demo ? undefined : MC[l.method] }} />
                {metric === 'e2e' ? <div className="dp-lane-pre" ref={(el) => { pres.current[l.method] = el; }} style={{ transform: `scaleX(${l.pre / max})` }} /> : null}
                {timed ? <div className="dp-lane-goal" style={{ left: `${frac * 100}%` }} aria-hidden="true" /> : null}
              </div>
              <span className="dp-lane-v">
                {done ? l.v.toFixed(dg) : '…'}
                {done && l.method !== '原模型' ? <em>{timed ? ` ${(orig[metric] / l.v).toFixed(2)}×` : metric === 'tflop' ? ` ${l.ratio.toFixed(1)}%` : ` −${(orig[metric] - l.v).toFixed(2)}`}</em> : null}
              </span>
            </div>
          );
        })}
        <div className="dp-muted">{metric === 'e2e' ? '深色段 = 预填充。' : ''}Table 2：LLaVA-NeXT-Video-7B，VideoChatGPT 499 个样本平均，8 × V100，batch = 1</div>
      </div>
      <div className="dp-race-demo">
        <label className="dp-check">
          <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} />
          <span>加一条示意车道（介于两个实测端点之间）</span>
        </label>
        {demo ? (
          <div className="dp-race-demo-slider">
            <Slider label="剪掉的理论算力" value={cut} min={0} max={86} onChange={setCut} display={`${cut}%`} />
          </div>
        ) : null}
      </div>
      {demo ? (
        <div className="dp-fb is-limit">示意车道不是实测：只有原模型（剪 0%）与 DivPrune（剪 {OURS_CUT.toFixed(1)}%）两个端点来自 Table 2，中间按剪掉的理论算力线性插值。真实曲线未知，可能不是直线。</div>
      ) : (
        <div className={`dp-fb ${metric === 'tflop' ? 'is-limit' : ''}`} role="status" aria-live="polite">{fb[metric]}</div>
      )}
    </div>
  );
};
