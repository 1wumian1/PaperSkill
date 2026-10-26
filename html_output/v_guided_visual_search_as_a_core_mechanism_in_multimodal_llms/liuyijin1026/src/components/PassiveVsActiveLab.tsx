import { useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import './PassiveVsActiveLab.css';

const steps = [
  { action: '让两种模型先看同一张图', passive: '等待开始', active: '等待开始' },
  { action: '查看固定全局输入', passive: '同一张高分辨率场景', active: '同一张高分辨率场景' },
  { action: '继续', passive: '全图缩入固定视觉输入', active: '当前证据还不足' },
  { action: '让 V* 主动寻找', passive: '场景可辨，杯中颜色难辨', active: '我要找 glass' },
  { action: '继续缩小范围', passive: '仍只能使用原有输入', active: '杯子常在桌面附近，先看 table' },
  { action: '查看局部证据', passive: '更多推理不能补回细节', active: '缩小范围，找到 glass' },
  { action: '显示两侧结果', passive: '无法可靠判断', active: 'Green · 绿色' },
] as const;

function Scene({ side, step }: { side: 'passive' | 'active'; step: number }) {
  const isPassive = side === 'passive';
  const isCompressed = isPassive && step >= 2;
  return <div className={`s1-scene s1-${side}${isCompressed ? ' is-compressed' : ''}${!isPassive && step >= 6 ? ' has-crop' : ''}`}
    role="img" aria-label={isPassive && step >= 2
      ? '论文 Figure 1 的拥挤餐桌场景缩为固定全局输入，杯中颜色难辨'
      : !isPassive && step >= 6
        ? '论文 Figure 1 的餐桌场景旁展示教学重绘的杯子局部，绿色液体清晰可见'
        : '论文 Figure 1 的拥挤餐桌场景，杯子是图中的小目标'}>
    <div className="s1-scene-image"><img src="./assets/paper/figure-1.png" alt="" draggable={false}/></div>
    {step === 1 && <span className="s1-target-hint" aria-hidden="true"/>}
    {!isPassive && step >= 4 && step < 6 && <span className={`s1-search-focus ${step === 4 ? 'at-table' : 'at-glass'}`} aria-hidden="true"/>}
    {!isPassive && step >= 6 && <div className="s1-crop" aria-hidden="true"><span className="s1-crop-label">高分辨率 crop</span><span className="s1-crop-glass"><i/></span></div>}
    {isCompressed && <span className="s1-fixed-label">fixed visual input</span>}
  </div>;
}

export function PassiveVsActiveLab() {
  const [step, setStep] = useState(0);
  const advance = () => setStep(current => Math.min(current + 1, steps.length - 1));
  return <div className="s1-lab">
    <div className="s1-question"><span>同一道题</span><strong>杯子里的液体是什么颜色？</strong></div>
    <div className="s1-compare">
      <section className="s1-panel" aria-label="Passive MLLM 固定视觉输入">
        <header><span className="s1-panel-index">01</span><div><h4>Passive MLLM</h4><p>固定视觉输入</p></div></header>
        <Scene side="passive" step={step}/>
        <div className="s1-flow" aria-label="固定输入流程"><span>高清全图</span><b>→</b><span>全局 resize / fixed input</span><b>→</b><span>Vision Encoder</span><b>→</b><span>VQA LLM</span></div>
        <p className={`s1-status${step >= 6 ? ' is-final' : ''}`} aria-live="polite"><span>当前</span>{step === 0 ? '等待开始' : steps[step].passive}</p>
      </section>
      <section className="s1-panel" aria-label="V* 任务驱动的主动视觉搜索">
        <header><span className="s1-panel-index">02</span><div><h4>V*</h4><p>任务驱动的主动视觉搜索</p></div></header>
        <Scene side="active" step={step}/>
        <div className="s1-search-path" aria-label="任务引导的搜索线索">
          <span className={step >= 3 ? 'is-on' : ''}>Target: glass</span><b>→</b>
          <span className={step >= 4 ? 'is-on' : ''}>Context: table</span><b>→</b>
          <span className={step >= 5 ? 'is-on' : ''}>Focus: glass</span>
        </div>
        <p className={`s1-status${step >= 6 ? ' is-success' : ''}`} aria-live="polite"><span>当前</span>{step === 0 ? '等待开始' : steps[step].active}</p>
      </section>
    </div>
    <div className="s1-controls">
      <div className="s1-step-label" aria-live="polite"><b>{String(step).padStart(2, '0')} / 06</b><span>{step === 0 ? '从同一张图开始' : step === 6 ? '对照完成' : '两侧同步推进'}</span></div>
      <div className="s1-control-buttons"><button type="button" className="button-ghost" onClick={() => setStep(0)} disabled={step === 0}><RotateCcw size={15}/>重新开始</button>
        {step < 6 && <button type="button" className="button-primary" onClick={advance}>{steps[step].action}<ArrowRight size={16}/></button>}</div>
    </div>
  </div>;
}
