import { useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import './S3SearchExperiment.css';

type Phase = 'ready' | 'target-ready' | 'target-weak' | 'context' | 'context-heat' | 'coarse' | 'fine' | 'found';
type Region = { id: string; priority: '高' | '中' | '低' };

const coarseRegions: Region[] = [
  { id: 'A', priority: '中' }, { id: 'B', priority: '高' },
  { id: 'C', priority: '低' }, { id: 'D', priority: '低' },
];
const fineRegions: Region[] = [
  { id: 'B1', priority: '中' }, { id: 'B2', priority: '低' },
  { id: 'B3', priority: '高' }, { id: 'B4', priority: '低' },
];

const next: Partial<Record<Phase, { label: string; phase: Phase }>> = {
  ready: { label: '开始搜索杯子', phase: 'target-ready' },
  'target-ready': { label: '尝试直接定位杯子', phase: 'target-weak' },
  'target-weak': { label: '借助场景常识', phase: 'context' },
  context: { label: '用上下文线索重新搜索', phase: 'context-heat' },
  'context-heat': { label: '划分候选区域', phase: 'coarse' },
};

const action: Record<Phase, string> = {
  ready: '等待开始',
  'target-ready': '尝试直接定位',
  'target-weak': '目标线索不足',
  context: '生成搜索提示',
  'context-heat': '桌面区域响应增强',
  coarse: '计算优先级 · 选择区域',
  fine: '继续细分 · 选择区域',
  found: '找到目标 · 取得局部证据',
};

const visualMessage: Record<Phase, string> = {
  ready: '全图等待搜索',
  'target-ready': '先检查杯子本身的线索',
  'target-weak': '目标响应弱，分散在多处',
  context: '场景常识提示：先找桌面',
  'context-heat': '桌面附近成为新的搜索重点',
  coarse: '第 1 层 · 请选择优先区域',
  fine: '第 2 层 · 继续缩小范围',
  found: '第 3 层 · 杯子已定位',
};

export function S3SearchExperiment() {
  const [phase, setPhase] = useState<Phase>('ready');
  const [feedback, setFeedback] = useState('');
  const isChoosing = phase === 'coarse' || phase === 'fine';
  const regions = phase === 'coarse' ? coarseRegions : fineRegions;
  const primary = next[phase];

  function chooseRegion(region: Region) {
    const best = phase === 'coarse' ? 'B' : 'B3';
    if (region.id !== best) {
      setFeedback(`${region.id} 区也可以搜索，但当前线索提示它不是最值得优先检查的区域。请再选一次。`);
      return;
    }
    setFeedback(phase === 'coarse' ? '✓ 优先检查 B 区。范围缩小了；下一步先看哪一块？' : '✓ 优先检查 B3 区。');
    setPhase(phase === 'coarse' ? 'fine' : 'found');
  }

  function restart() {
    setPhase('ready');
    setFeedback('');
  }

  return <section className="s3-experiment" aria-label="引导式视觉搜索实验台">
    <p className="s3-opening">我们已经知道需要寻找<strong>杯子</strong>。但整张高分辨率图这么大，V* 怎么知道先去哪找？</p>
    <div className="s3-intro"><div><span>GUIDED VISUAL SEARCH · 搜索实验台</span><strong>亲手完成一次从全图到局部的搜索</strong></div><span className="s3-example">问题：杯子里的液体是什么颜色？</span></div>

    <div className="s3-workbench">
      <div className="s3-visual">
        <div className={`s3-scene is-${phase}`}>
          <div className="s3-image-plane"><img src="./assets/paper/figure-1.png" alt="论文 Figure 1 的室内餐桌场景；需要找到桌面附近的小杯子" draggable={false}/></div>
          {(phase === 'target-weak' || phase === 'context') && <div className="s3-weak-heat" aria-hidden="true"/>}
          {(phase === 'context-heat' || phase === 'coarse' || phase === 'fine') && <div className="s3-context-heat" aria-hidden="true"/>}
          {(phase === 'context-heat' || phase === 'coarse') && <span className="s3-table-outline" aria-hidden="true"/>}
          {isChoosing && <div className="s3-patch-grid" role="group" aria-label={phase === 'coarse' ? '第 1 层候选区域' : '第 2 层候选区域'}>
            {regions.map(region => <button key={region.id} type="button" className={`s3-patch is-${region.priority === '高' ? 'high' : region.priority === '中' ? 'medium' : 'low'}`} onClick={() => chooseRegion(region)} aria-label={`${region.id} 区，教学示意搜索优先级${region.priority}`}>
              <span className="s3-patch-label">{region.id}</span><span className="s3-patch-priority">优先级 {region.priority}</span>
            </button>)}
          </div>}
          {phase === 'found' && <div className="s3-found-locator" aria-label="杯子已定位"><span>✓ 找到杯子</span></div>}
          {phase === 'found' && <div className="s3-found-crop-preview" role="img" aria-label="从同一场景放大的杯子局部"><span>局部证据</span></div>}
          <span className="s3-image-credit">论文 Figure 1 · 同一场景</span>
          <span className="s3-scene-status">{visualMessage[phase]}</span>
        </div>
        {isChoosing && feedback && <p className="s3-choice-feedback">{feedback}</p>}
      </div>

      <aside className="s3-state" aria-label="当前搜索状态">
        <dl>
          <div><dt>当前目标</dt><dd className="s3-target">杯子</dd></div>
          <div><dt>当前线索</dt><dd>{phase === 'ready' ? '等待生成' : phase === 'target-ready' ? '目标线索 · 待检查' : phase === 'target-weak' ? '目标线索 · 弱' : phase === 'context' ? '上下文线索 · 桌面' : '上下文线索 · 桌面'}</dd></div>
          <div><dt>当前动作</dt><dd>{action[phase]}</dd></div>
        </dl>
        {(phase === 'target-ready' || phase === 'target-weak') && <div className="s3-cue-card">
          <strong>目标线索 <small>Target-specific Cue</small></strong>
          <p>{phase === 'target-ready' ? '先看图像本身能否直接指出杯子的位置。' : '如果目标响应足够明显，就能直接指导搜索；这张图中的杯子太小，响应弱且不集中。'}</p>
        </div>}
        {phase === 'context' && <div className="s3-cue-card is-context"><strong>杯子 <span>↓ 常见于 ↓</span> 桌面 / 餐桌</strong><p>杯子通常出现在桌面、吧台或人的手附近。当前场景优先用<strong>桌面</strong>作为上下文线索。</p></div>}
        {['context-heat', 'coarse', 'fine', 'found'].includes(phase) && <div className="s3-cue-card is-context"><strong>上下文线索：桌面 <small>Contextual Cue</small></strong><p>场景常识改变了图像上的搜索重点。</p></div>}
        <div className="s3-history"><strong>搜索历史</strong><ol>
          <li className={phase === 'fine' || phase === 'found' ? 'is-done' : 'is-current'}><span>第 1 层</span><b>{phase === 'fine' || phase === 'found' ? '全图 → B 区' : phase === 'ready' ? '全图 · 等待开始' : phase === 'target-ready' || phase === 'target-weak' ? '全图 · 目标线索' : '全图 · 桌面线索'}</b></li>
          <li className={phase === 'found' ? 'is-done' : phase === 'fine' ? 'is-current' : ''}><span>第 2 层</span><b>{phase === 'found' ? 'B 区 → B3 区' : phase === 'fine' ? 'B 区 · 继续细分' : '等待检查'}</b></li>
          <li className={phase === 'found' ? 'is-current' : ''}><span>第 3 层</span><b>{phase === 'found' ? 'B3 区 · 找到杯子' : '等待检查'}</b></li>
        </ol></div>
      </aside>
    </div>

    <div className="s3-controls">
      <p role="status" aria-live="polite">{phase === 'found' ? '找到目标：杯子。已获得新的高分辨率局部视觉证据。' : feedback || (phase === 'coarse' ? '你觉得应该先搜哪一区域？点击图中的一个候选区域。' : phase === 'fine' ? '下一步先看哪一块？点击放大画面中的区域。' : phase === 'target-weak' ? '杯子的直接视觉线索不够明显。' : phase === 'context-heat' ? '看图：热区已从弱而分散，变成桌面附近集中。' : '每一步由你推进。') }</p>
      {primary && <button type="button" className="button-primary s3-primary" onClick={() => { setPhase(primary.phase); setFeedback(''); }}>{primary.label}<ArrowRight size={16}/></button>}
      {phase === 'found' && <button type="button" className="button-ghost s3-restart" onClick={restart}><RotateCcw size={15}/>重做搜索</button>}
    </div>

    {phase === 'found' && <div className="s3-completion">
      <div className="s3-evidence"><div><span>原始全图</span><div className="s3-evidence-original"><img src="./assets/paper/figure-1.png" alt="原始全图中杯子很小"/></div><small>目标细节难以辨认</small></div><span className="s3-evidence-arrow" aria-hidden="true">→</span><div><span>搜索后局部 crop</span><div className="s3-evidence-crop" role="img" aria-label="从同一场景取得的杯子局部视觉证据"/><small>杯子占据更大的观察范围</small></div></div>
      <div className="s3-next"><strong>现在杯子看清了。那是不是只把这个 crop 丢给 MLLM 就够了？</strong><p>不一定。局部细节有了，但全局上下文和目标位置怎么办？</p><span>继续学习：找到以后，怎样重新回答？ ↓</span></div>
    </div>}

  </section>;
}
