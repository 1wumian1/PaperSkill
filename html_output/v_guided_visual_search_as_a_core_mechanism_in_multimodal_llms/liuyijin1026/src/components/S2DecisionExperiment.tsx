import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import './S2DecisionExperiment.css';

type Case = 'A' | 'B';
type Playback = { mode: 'sequence' | Case; run: number };
type Frame = { example: Case; phase: number };

const questions = { A: '这是室内还是室外？', B: '杯中的液体是什么颜色？' } as const;
const caseA: Array<[number, Frame]> = [0, 1, 2, 3, 4, 5].map(phase => [phase * 1000, { example: 'A', phase }]);
const caseB: Array<[number, Frame]> = [0, 1, 2, 3, 4, 5, 6, 7].map(phase => [phase * 1000, { example: 'B', phase }]);

export function S2DecisionExperiment() {
  const root = useRef<HTMLDivElement>(null);
  const [playback, setPlayback] = useState<Playback | null>(null);
  const [frame, setFrame] = useState<Frame>({ example: 'A', phase: 0 });
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setPlayback({ mode: 'sequence', run: 0 });
        observer.disconnect();
      }
    }, { threshold: 0.12 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playback) return;
    setComplete(false);
    const events = playback.mode === 'sequence'
      ? [...caseA, ...caseB.map(([time, next]) => [time + 7000, next] as [number, Frame])]
      : playback.mode === 'A' ? caseA : caseB;
    setFrame(events[0][1]);
    const timers = events.slice(1).map(([time, next]) => window.setTimeout(() => setFrame(next), time));
    timers.push(window.setTimeout(() => setComplete(true), playback.mode === 'sequence' ? 15000 : playback.mode === 'A' ? 7000 : 8000));
    return () => timers.forEach(window.clearTimeout);
  }, [playback]);

  function replay(example: Case) {
    setPlayback(previous => ({ mode: example, run: (previous?.run ?? 0) + 1 }));
  }

  const isA = frame.example === 'A';
  const phase = frame.phase;
  const verdict = phase >= 4;
  const showDone = phase >= 3;
  const answerShown = isA && phase >= 5;
  const targetShown = !isA && phase >= 5;
  const searchShown = !isA && phase >= 6;
  const liveMessage = !playback ? '即将自动演示两个案例。'
    : isA ? answerShown ? '案例 A：当前证据足够，直接回答室内，跳过搜索。' : '案例 A：判断全局视觉证据是否足够。'
      : searchShown ? '案例 B：当前证据不足，缺失视觉目标是杯子，已启动视觉搜索，进入 V*。' : '案例 B：当前证据不足，正在识别缺失的视觉目标。';

  return <div ref={root} className="s2-experiment">
    <div className="s2-intro"><div><span>条件分支 · 教学示意</span><strong>同一张图，何时直接回答，何时启动搜索？</strong></div><span className="s2-case-counter">{playback ? `案例 ${frame.example} / ${playback.mode === 'sequence' ? '共 2 例' : '重播'}` : '自动演示'}</span></div>

    <div className={`s2-stage ${isA ? 'is-case-a' : 'is-case-b'} phase-${phase}`} aria-label={`案例 ${frame.example} 的证据判断流程`}>
      <div key={frame.example} className={`s2-question ${playback ? 'is-visible' : ''}`}><span>问题 <b>{frame.example}</b></span><strong>{questions[frame.example]}</strong>{!isA && phase >= 4 && phase < 6 && <em className="s2-question-cue" aria-hidden="true">杯子</em>}</div>

      <div className="s2-observe">
        <div className={`s2-image ${phase >= 1 ? 'is-observed' : ''} ${!isA && phase === 3 ? 'is-detail' : ''}`} role="img" aria-label="论文图 1 的室内餐桌场景；全局图中杯子细节难以辨认">
          <img src="./assets/paper/figure-1.png" alt="" draggable={false}/>
          <span className="s2-image-label">图像 · 论文图 1</span>
          <span className="s2-detail-halo" aria-hidden="true"/>
        </div>
        <div className={`s2-link s2-link-image ${phase >= 2 ? 'is-flowing' : ''}`} aria-hidden="true"><i/></div>
        <div className={`s2-process-node s2-show ${phase === 1 || phase === 2 ? 'is-current' : showDone ? 'is-done' : ''}`}><span className="s2-node-dot"/><strong>全局观察</strong></div>
        <div className={`s2-link s2-link-llm ${phase >= 2 ? 'is-flowing' : ''}`} aria-hidden="true"><i/></div>
        <div className={`s2-process-node s2-llm ${phase === 3 ? 'is-current' : phase > 3 ? 'is-done' : ''}`}><span className="s2-node-dot"/><strong>VQA LLM</strong></div>
      </div>

      <div className={`s2-evidence ${verdict ? 'is-active' : ''}`}>
        <div className="s2-evidence-line" aria-hidden="true"/>
        <div className="s2-evidence-node"><span className="s2-node-dot"/><strong>当前视觉证据足够吗？</strong></div>
        {phase >= 3 && <p>{isA ? '当前全局信息足够' : '当前全图无法可靠提供杯中细节'}</p>}
      </div>

      <div className={`s2-fork ${verdict ? 'has-verdict' : ''}`} aria-hidden="true"><span/><span/></div>
      <div className="s2-branches">
        <div className={`s2-branch s2-yes ${verdict && isA ? 'is-selected' : verdict ? 'is-muted' : ''}`}>
          <div className="s2-branch-label"><span className="s2-node-dot"/><strong>足够</strong></div>
          <div className={`s2-branch-result ${answerShown ? 'is-revealed' : ''}`} aria-hidden={!answerShown}><span>直接回答</span><strong>室内</strong><small>无需搜索</small></div>
        </div>
        <div className={`s2-branch s2-no ${verdict && !isA ? 'is-selected' : verdict ? 'is-muted' : ''}`}>
          <div className="s2-branch-label"><span className="s2-node-dot"/><strong>不足</strong></div>
          <div className={`s2-branch-result ${targetShown ? 'is-revealed' : ''}`} aria-hidden={!targetShown}><span>缺失视觉目标</span><strong className="s2-target-word">杯子</strong><div className={`s2-search-result ${searchShown ? 'is-revealed' : ''}`} aria-hidden={!searchShown}><span>启动视觉搜索</span><strong>V*</strong></div></div>
        </div>
      </div>

      <div className={`s2-seal-track ${answerShown ? 'is-direct' : ''} ${searchShown ? 'is-search' : ''}`} aria-label="SEAL 状态轨道：全局观察、主动搜索、回答">
        <div className={`s2-seal-step ${phase >= 1 ? 'is-done' : ''}`}><i/>全局观察</div><span className="s2-seal-line" aria-hidden="true"/><div className={`s2-seal-step ${searchShown ? 'is-current' : answerShown ? 'is-skipped' : ''}`}><i/>主动搜索{answerShown && <small>跳过</small>}</div><span className="s2-seal-line" aria-hidden="true"/><div className={`s2-seal-step ${answerShown ? 'is-done' : ''}`}><i/>回答</div>
      </div>
    </div>

    <div className="s2-stage-footer"><p className="s2-live-status" role="status" aria-live="polite">{liveMessage}</p>{complete && <div className="s2-replay-controls"><button type="button" onClick={() => replay('A')}><Play size={14} fill="currentColor"/>重播：直接回答</button><button type="button" onClick={() => replay('B')}><Play size={14} fill="currentColor"/>重播：触发搜索</button></div>}</div>
    {!isA && phase >= 7 && <p className="s2-next-question">知道要找杯子了，但整张高分辨率图这么大——V* 怎么知道先去哪里找？</p>}
    <div className="s2-insights"><div><strong>先回答，不急着搜。</strong><p>全局视觉信息足够时，VQA LLM 可以直接完成任务。</p></div><div><strong>缺什么，才搜什么。</strong><p>问题依赖看不清的局部目标时，系统识别缺失目标并启动 V*。</p></div></div>
  </div>;
}
