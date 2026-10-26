import { useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { Module } from './Module';

const note = <span className="demo-note">教学示意 · 非论文样本或模型输出</span>;

function CupScene({ detail = false, searching = false }: { detail?: boolean; searching?: boolean }) {
  return <div className={`story-scene ${detail ? 'is-detail' : ''} ${searching ? 'is-searching' : ''}`} role="img" aria-label={detail ? '教学绘制的杯子局部，液体呈绿色' : '教学绘制的室内全局图，杯子很小，难辨液体颜色'}>
    <div className="story-window"/><div className="story-art"/><div className="story-lamp"/><div className="story-table"><div className="story-cup"/></div><div className="story-plant"/>
    {searching && <span className="story-target" aria-hidden="true"/>}
    <span className="scene-label">{detail ? '局部证据 · 绿色' : '全局图 · 细节不明'}</span>
  </div>;
}

export function StoryScene() { return <CupScene/>; }

export function DetailLab() {
  const [detail, setDetail] = useState(false);
  return <Module number="1.1" title="同一张图，两种视觉输入" note={note}>
    <p className="module-description">问题始终是：桌上杯中液体是什么颜色？切换后只改变你能看清的局部证据。</p>
    <div className="detail-lab"><CupScene detail={detail}/><div className="detail-explain" aria-live="polite"><span className="eyebrow">{detail ? 'LOCAL DETAIL · 新证据' : 'GLOBAL VIEW · 当前输入'}</span><h4>{detail ? '现在能检查杯中细节' : '你看见了场景，但杯子太小'}</h4><p>{detail ? '局部图像显示绿色液体。这说明需要取得足够清楚的目标证据；此处颜色仅为教学设定。' : '即使知道问题指向杯子，缩小后的全图也未必给出可辨颜色。不要从模糊视觉输入猜答案。'}</p><button className="button-primary" onClick={() => setDetail(!detail)}>{detail ? '回到全局图' : '查看局部细节'} <ArrowRight size={16}/></button></div></div>
  </Module>;
}

const choices = [
  { title: '直接猜测', result: '现有视觉信息不足，语言推理无法可靠补出图像里没看清的颜色。', kind: 'weak' },
  { title: '随机裁一块', result: '可能碰巧看到杯子，但没有利用问题与场景来安排搜索顺序。', kind: 'weak' },
  { title: '根据问题和上下文寻找杯子', result: '这与论文方向一致：先明确缺失目标，再让搜索机制取得局部视觉证据。', kind: 'strong' },
] as const;
export function DecisionLab() {
  const [selected, setSelected] = useState<number | null>(null);
  return <Module number="2.2" title="如果当前信息不足，你会让模型怎样继续？" note={note}>
    <div className="decision-path"><div><span className="eyebrow">证据足够</span><strong>Show → Answer</strong><p>如果全局输入足以回答，VQA LLM 直接作答。</p></div><div><span className="eyebrow">证据不足</span><strong>Show → 找出缺失目标 → Search</strong><p>杯中颜色不清时，先确定需要寻找杯子。</p></div></div>
    <fieldset className="decision-options"><legend>问题：杯中液体颜色看不清。下一步？</legend>{choices.map((choice, i) => <button key={choice.title} type="button" aria-pressed={selected === i} className={selected === i ? 'selected' : ''} onClick={() => setSelected(i)}><span>0{i+1}</span>{choice.title}</button>)}</fieldset>
    <p className={`decision-feedback ${selected === null ? '' : choices[selected].kind}`} role="status">{selected === null ? '请选择一种行动，观察它能否带来可靠的新视觉证据。' : choices[selected].result}</p>
  </Module>;
}

const pipeline = [
  { title: 'Show · 先看全图', text: '问题与全图先交给 VQA LLM。当前视觉信息足够时，直接回答。' },
  { title: '判断是否足够', text: '若证据不足，VQA LLM 指出需要却看不清的目标。本例缺少杯子的局部信息。' },
  { title: 'sEArch → TelL', text: '只在不足时启动后续搜索，并用补得的证据重新回答。怎样搜、怎样组织证据留到后两章。' },
] as const;
export function SealPipeline() {
  const [step, setStep] = useState(0);
  return <Module number="2.1" title="Show → sEArch → TelL：搜索是条件分支" note={<span className="demo-note">流程依据 §3.1 / Algorithm 1</span>} className="story-pipeline">
    <ol className="seal-track">{pipeline.map((item, i) => <li key={item.title} className={i === step ? 'current' : i < step ? 'seen' : ''}><button onClick={() => setStep(i)} aria-current={i === step ? 'step' : undefined}><span>0{i+1}</span><strong>{item.title}</strong></button></li>)}</ol>
    <div className="seal-detail" aria-live="polite"><span className="eyebrow">步骤 {step + 1} / {pipeline.length}</span><h4>{pipeline[step].title}</h4><p>{pipeline[step].text}</p>{step === 1 && <p className="direct-branch">足够 → 直接回答　｜　不足 → 列出目标并搜索</p>}</div>
    <div className="controls"><button className="button-ghost" onClick={() => setStep(0)}><RotateCcw size={15}/>从头看</button><button className="button-primary" onClick={() => setStep((step + 1) % pipeline.length)}>{step === pipeline.length - 1 ? '再看一遍' : '下一步'} <ArrowRight size={16}/></button></div>
  </Module>;
}

const memorySteps = ['问题与全图', '搜索得到杯子', '保留 crop 与位置', '交给 VQA LLM'] as const;
export function CupMemoryLab() {
  const [step, setStep] = useState(0);
  return <Module number="4.1" title="把刚才找到的杯子交回推理" note={note} className="cup-memory">
    <p className="module-description">沿用上一章的同一问题。VWM 是这道题的工作输入，保留全图、局部证据和空间位置。</p>
    <div className="memory-story"><div><span className="eyebrow">SEARCH HISTORY · 这道题</span><ol className="memory-timeline"><li>全局图：杯子细节不足</li><li className={step >= 1 ? 'seen' : ''}>目标：搜索杯子</li><li className={step >= 2 ? 'seen' : ''}>结果：局部 crop + 原图位置</li></ol><CupScene detail={step >= 2} searching={step === 1}/></div><div className="vwm-sheet" aria-live="polite"><span className="eyebrow">VISUAL WORKING MEMORY</span><dl><div><dt>&lt;question&gt;</dt><dd>桌上杯中液体是什么颜色？</dd></div><div><dt>&lt;global image&gt;</dt><dd>完整室内图像</dd></div><div><dt>&lt;searched targets&gt;</dt><dd>{step >= 2 ? '杯子的局部 crop：绿色液体（教学示意）' : '等待取得目标 crop'}</dd></div><div><dt>&lt;target location&gt;</dt><dd>{step >= 2 ? '杯子在原图中的位置' : '等待定位结果'}</dd></div></dl></div></div>
    <p className={`memory-outcome ${step === 3 ? 'ready' : ''}`} role="status">{step === 3 ? 'VWM 被编码为模型输入，VQA LLM 据此作答：绿色。（教学答案）' : `当前：${memorySteps[step]}。${step < 2 ? '还没有足够的局部证据。' : '局部证据已与全图一起保留，下一步交回回答模型。'}`}</p>
    <div className="controls"><button className="button-ghost" onClick={() => setStep(0)}><RotateCcw size={15}/>重置</button><button className="button-primary" onClick={() => setStep((step + 1) % memorySteps.length)}>{step === 3 ? '重新演示' : memorySteps[step + 1]} <ArrowRight size={16}/></button></div>
    <p className="source-caption">四块字段来自 §3.1 / Algorithm 1；具体问题、颜色与界面是教学示意。论文在目标搜索失败时也会记录缺失状态。</p>
  </Module>;
}
