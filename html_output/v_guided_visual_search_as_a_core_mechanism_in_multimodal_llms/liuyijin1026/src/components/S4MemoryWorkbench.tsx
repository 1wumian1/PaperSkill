import { useEffect, useState, type DragEvent } from 'react';
import './S4MemoryWorkbench.css';

type Evidence = 'question' | 'global' | 'crop' | 'position';
type AnswerStage = 'waiting' | 'sending' | 'reading' | 'answered';

const evidence: { id: Evidence; title: string; slot: string; empty: string }[] = [
  { id: 'question', title: '问题', slot: '任务', empty: '等待加入任务' },
  { id: 'global', title: '全局图像', slot: '全局上下文', empty: '等待加入全局图像' },
  { id: 'crop', title: '杯子局部', slot: '局部细节', empty: '等待加入局部细节' },
  { id: 'position', title: '目标位置', slot: '目标位置', empty: '等待加入目标位置' },
];

function GlobalView({ located = false }: { located?: boolean }) {
  return <div className={`s4-global-view ${located ? 'is-located' : ''}`} role="img" aria-label={located ? '原始场景中用方框标出杯子所在区域' : '与上一章相同的原始室内场景全图'}>
    <img src="./assets/paper/figure-1.png" alt="" draggable={false}/>
    {located && <span className="s4-global-box" aria-hidden="true"/>}
  </div>;
}

function CropView() {
  return <div className="s4-crop-view" role="img" aria-label="上一章找到的杯子局部图像"/>;
}

function EvidenceVisual({ id }: { id: Evidence }) {
  if (id === 'global') return <GlobalView/>;
  if (id === 'crop') return <CropView/>;
  return <GlobalView located/>;
}

function feedbackFor(items: Evidence[]): string {
  const has = (id: Evidence) => items.includes(id);
  if (items.length === 0) return '从左侧选择证据，补齐回答这道题所需的信息。';
  if (items.length === 4) return '任务、全局、局部和位置已连成完整证据。';
  if (!has('question')) return '已有视觉信息，但缺少当前任务目标。';
  if (items.length === 1) return '任务明确了，但还没有视觉证据。';
  if (has('global') && has('crop') && !has('position')) return '已经有全局和细节，但还缺少它在原图中的位置。';
  if (has('global') && !has('crop')) return '场景有了，但缺少局部细节。';
  if (has('crop') && !has('global')) return '看到了局部，但还缺少全局场景。';
  return '继续补齐缺少的证据。';
}

export function S4MemoryWorkbench() {
  const [items, setItems] = useState<Evidence[]>([]);
  const [dragging, setDragging] = useState<Evidence | null>(null);
  const [answerStage, setAnswerStage] = useState<AnswerStage>('waiting');
  const complete = items.length === evidence.length;
  const has = (id: Evidence) => items.includes(id);
  const missing = evidence.filter(item => !has(item.id)).map(item => item.slot);

  useEffect(() => {
    if (!complete) { setAnswerStage('waiting'); return; }
    setAnswerStage('sending');
    const reading = window.setTimeout(() => setAnswerStage('reading'), 650);
    const answered = window.setTimeout(() => setAnswerStage('answered'), 1550);
    return () => { window.clearTimeout(reading); window.clearTimeout(answered); };
  }, [complete]);

  function add(id: Evidence) { setItems(current => current.includes(id) ? current : [...current, id]); }
  function remove(id: Evidence) { setItems(current => current.filter(item => item !== id)); }
  function startDrag(event: DragEvent<HTMLButtonElement>, id: Evidence) {
    event.dataTransfer.setData('text/plain', id);
    event.dataTransfer.effectAllowed = 'copy';
    setDragging(id);
  }
  function drop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/plain');
    if (evidence.some(item => item.id === id)) add(id as Evidence);
    setDragging(null);
  }

  return <section className="s4-workbench" aria-label="视觉工作记忆证据组装流程">
    <div className="s4-brief">
      <div className="s4-brief-copy"><span>当前问题</span><strong>杯子里的液体是什么颜色？</strong><small>已找到杯子，并获得局部视觉证据</small></div>
      <div className="s4-brief-visuals" aria-label="搜索前后图像"><div><GlobalView/><small>原始全图</small></div><span aria-hidden="true">→</span><div><CropView/><small>搜索后局部</small></div></div>
    </div>

    <div className="s4-layout">
      <div className="s4-source" aria-label="可选择的证据">
        <div className="s4-panel-heading"><span className="s4-step">01</span><div><strong>选择证据</strong><small>点击卡片，把它加入中间的视觉工作记忆。</small></div></div>
        <div className="s4-source-grid">{evidence.map(item => <button
          className={`s4-evidence-card ${has(item.id) ? 'is-added' : ''}`}
          key={item.id} type="button" draggable={!has(item.id)}
          onDragStart={event => startDrag(event, item.id)} onDragEnd={() => setDragging(null)}
          onClick={() => add(item.id)} aria-pressed={has(item.id)}
          aria-label={`${item.title}，${has(item.id) ? '已加入' : '点击加入视觉工作记忆'}`}>
          <span className="s4-card-copy"><strong>{item.title}</strong>{item.id === 'question' && <small>“杯子里的液体是什么颜色？”</small>}</span>
          {item.id !== 'question' && <span className="s4-source-visual"><EvidenceVisual id={item.id}/></span>}
          <span className="s4-card-action" aria-hidden="true">{has(item.id) ? '✓' : '+'}</span>
        </button>)}</div>
      </div>

      <div className={`s4-memory ${complete ? 'is-complete' : ''} ${dragging ? 'is-dragging' : ''}`}
        onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; }} onDrop={drop}
        aria-label="视觉工作记忆，组织四类信息">
        <div className="s4-panel-heading s4-memory-heading"><span className="s4-step">02</span><div><strong>视觉工作记忆</strong><small>Visual Working Memory / VWM</small></div></div>
        <p className="s4-memory-intro">把任务、全局、局部和位置组织在一起</p>
        <div className={`s4-completeness ${complete ? 'is-ready' : ''}`} role="status" aria-live="polite">
          <strong>{complete ? '视觉工作记忆已完整，可以重新回答' : `已加入 ${items.length} / 4 项关键信息`}</strong>
          {!complete && <small>{missing.length === 4 ? '请选择左侧的四项证据' : `还缺：${missing.join('、')}`}</small>}
          <progress value={items.length} max={4} aria-label="视觉工作记忆完整度"/>
        </div>
        <div className="s4-slot-list">{evidence.map(item => <div key={item.id}
          className={`s4-slot s4-slot-${item.id} ${has(item.id) ? 'is-filled' : ''} ${dragging === item.id ? 'is-target' : ''}`}
          onDragOver={event => event.preventDefault()} onDrop={event => { event.stopPropagation(); drop(event); }}>
          <div className="s4-slot-heading"><span className="s4-slot-mark" aria-hidden="true">{has(item.id) ? '✓' : '+'}</span><strong>{item.slot}</strong>
            {has(item.id) && <button type="button" className="s4-remove" onClick={() => remove(item.id)} aria-label={`移除${item.title}`} title={`移除${item.title}`}>×</button>}
          </div>
          {has(item.id) ? <div className="s4-slot-content">
            {item.id === 'question' && <p>杯子里的液体是什么颜色？</p>}
            {item.id === 'global' && <GlobalView/>}
            {item.id === 'crop' && <CropView/>}
            {item.id === 'position' && <GlobalView located/>}
          </div> : <span className="s4-slot-empty">{item.empty}</span>}
        </div>)}</div>
        <p className="s4-memory-feedback" aria-live="polite">{feedbackFor(items)}</p>
      </div>

      <div className={`s4-vqa ${complete ? 'is-ready' : ''}`} aria-label="VQA LLM 回答状态">
        <div className="s4-panel-heading"><span className="s4-step">03</span><div><strong>回答</strong><small>VQA LLM</small></div></div>
        <div className="s4-answer" role="status" aria-live="polite">
          {!complete && <><span className="s4-answer-symbol" aria-hidden="true">…</span><strong>证据还不完整</strong><p>请先补齐视觉工作记忆</p></>}
          {complete && (answerStage === 'waiting' || answerStage === 'sending') && <><span className="s4-answer-symbol" aria-hidden="true">→</span><strong>正在把 VWM 送入 VQA LLM…</strong></>}
          {complete && answerStage === 'reading' && <><span className="s4-answer-symbol" aria-hidden="true">→</span><strong>重新读取问题与视觉证据</strong></>}
          {complete && answerStage === 'answered' && <><span className="s4-answer-symbol is-done" aria-hidden="true">✓</span><small>重新回答</small><strong className="s4-answer-result">绿色</strong><p>现在模型同时拥有任务、全局、局部细节和位置关系，因此可以重新回答。</p><small className="s4-try-removing">试着拿掉一项，看看为什么回答会失效。</small></>}
        </div>
      </div>
    </div>
  </section>;
}
