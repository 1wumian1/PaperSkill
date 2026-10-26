import { useEffect, useRef, useState, type ReactNode } from 'react';
import { LearningModule } from './LearningModule';
import './S5EvidenceJourney.css';

const PAPER = 'https://openaccess.thecvf.com/content/CVPR2024/papers/Wu_V_Guided_Visual_Search_as_a_Core_Mechanism_in_Multimodal_CVPR_2024_paper.pdf';
// Checked against the official CVPR 2024 paper, §4 and Tables 1–3, on 2026-10-25.
const mainResults = [
  { name: 'Human', value: 98.95 },
  { name: 'SEAL（V*）', value: 75.39 },
  { name: 'GPT-4V', value: 54.97 },
  { name: 'LLaVA-1.5', value: 48.68 },
] as const;
const detectors = [
  { name: 'GroundingDINO', value: 62.30 },
  { name: 'OWL-ViT', value: 62.82 },
  { name: 'V*', value: 75.39 },
] as const;
const lengths = [
  { name: 'Random BFS', value: 7.18 },
  { name: 'Sequential BFS', value: 6.62 },
  { name: 'V*', value: 4.65 },
  { name: 'w/o target cue', value: 5.22 },
  { name: 'w/o contextual cue', value: 5.36 },
] as const;

function Source({ label, page }: { label: string; page: number }) {
  return <a className="s5-source" href={`${PAPER}#page=${page}`} target="_blank" rel="noreferrer">论文 · {label} ↗</a>;
}
function OnceVisible({ className = '', children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!('IntersectionObserver' in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.25 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`${className} s5-once${visible ? ' is-visible' : ''}`}>{children}</div>;
}
function Cup({ x = 0, y = 0, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><path d="M17 5h4c7 0 7 12 0 12h-3" fill="none" stroke="#41665f" strokeWidth="2"/><path d="M1 1h17l-2 22H3Z" fill="#f5fffa" stroke="#41665f" strokeWidth="1.6"/><path d="M3 9h13l-1 12H4Z" fill="#78b293"/><ellipse cx="9.5" cy="9" rx="6.5" ry="1.8" fill="#a6cdb7"/></g>;
}
function CupDetail() {
  return <svg viewBox="0 0 90 74" aria-hidden="true"><ellipse cx="44" cy="65" rx="29" ry="5" fill="#dce5de"/><Cup x={23} y={8} scale={2.3}/></svg>;
}
function Room({ simple = false, markers = 'none' }: { simple?: boolean; markers?: 'none' | 'cup' | 'pair' }) {
  return <svg className="s5-room" viewBox="0 0 640 360" aria-hidden="true">
    <rect width="640" height="360" fill="#eee8dc"/><path d="M0 262H640V360H0Z" fill="#d9c6ae"/><path d="M0 262H640M0 308H640M130 262 90 360M510 262 560 360" stroke="#c1ac93"/>
    {simple ? <>
      <rect x="65" y="43" width="134" height="125" rx="3" fill="#bacbd0"/><path d="M132 43V168M65 105H199" stroke="#fffaf0" strokeWidth="8"/>
      <ellipse cx="334" cy="310" rx="200" ry="22" fill="#b8aa95" opacity=".4"/>
      <path d="M161 206 141 315M465 206 485 315" stroke="#7a5d48" strokeWidth="17"/><path d="M130 179H500L522 211H108Z" fill="#b68960"/><path d="M108 211H522V223H108Z" fill="#856347"/>
      <rect className="s5-table-focus" x="91" y="166" width="449" height="163" rx="10" fill="none" stroke="#f07e47" strokeWidth="4" strokeDasharray="10 7"/>
    </> : <>
      <rect x="25" y="29" width="122" height="164" fill="#b2c5c8"/><path d="M86 29V193M25 105H147" stroke="#faf6ed" strokeWidth="7"/><path d="M35 173 65 130 101 158 138 118V185H35Z" fill="#8fa89b"/>
      <rect x="171" y="24" width="260" height="139" fill="#cebaa0"/>
      {[0, 1, 2].map(row => <g key={row} transform={`translate(181 ${35 + row * 44})`}>
        {Array.from({ length: 14 }, (_, i) => <rect key={i} x={i * 17} y={i % 3 * 3} width={11 + i % 3} height={30 - i % 3 * 3} rx="1" fill={['#687e78', '#bb8b6a', '#e5d5b7', '#7b8d9c', '#a59687'][i % 5]}/>)}
        <path d="M-10 34H250" stroke="#937a5c" strokeWidth="6"/>
      </g>)}
      <rect x="471" y="27" width="70" height="54" fill="#a6886b"/><rect x="478" y="34" width="56" height="40" fill="#eee2ca"/><path d="M485 66 505 43 528 66" fill="#9dab91"/>
      <path d="M574 5V64" stroke="#7d796e" strokeWidth="4"/><path d="M551 89Q574 39 597 89Z" fill="#ad8b5b"/>
      <path d="M25 231H147V290H25Z" fill="#88948b"/><path d="M35 205H137V246H35Z" fill="#a2aca0"/><rect x="44" y="215" width="33" height="28" rx="6" fill="#d4bd94"/>
      <path d="M532 215V289M509 243H566" stroke="#72644e" strokeWidth="6"/><path d="M515 194H555V242H515Z" fill="#b3a082"/>
      <path d="M592 207V290" stroke="#698273" strokeWidth="5"/>
      {[0, 1, 2, 3].map(i => <ellipse key={i} cx={580 + i % 2 * 25} cy={169 + i * 22} rx="15" ry="29" transform={`rotate(${i % 2 ? 40 : -35} ${580 + i % 2 * 25} ${169 + i * 22})`} fill={i % 2 ? '#899d7b' : '#647f6b'}/>)}
      <path d="M575 265H611L606 309H580Z" fill="#b27b5d"/><path d="M169 302 454 302 507 351H114Z" fill="#c2ad8a"/><path d="M183 311H444M169 324H459M153 337H476" stroke="#e4d8bd" strokeWidth="3"/>
      <path d="M217 239 207 316M447 239 458 316" stroke="#816149" strokeWidth="11"/><path d="M205 216H453L475 242H185Z" fill="#b68a64"/><path d="M185 242H475V250H185Z" fill="#8b674c"/>
      <ellipse cx="329" cy="230" rx="32" ry="9" fill="#e4d3b3"/><ellipse cx="329" cy="226" rx="24" ry="5" fill="#c5b58f"/>
      <rect x="258" y="205" width="27" height="13" rx="2" fill="#7d8c9b"/><path d="M259 208H282" stroke="#d6dfdf" strokeWidth="2"/>
      <path d="M304 214 301 191H313L310 214Z" fill="#829a90"/><path d="M306 193V177M306 188 295 180M307 184 316 175" stroke="#647b5d" strokeWidth="2"/>
      <ellipse cx="418" cy="228" rx="15" ry="5" fill="#e6d7bd"/><Cup x={376} y={204} scale={0.64}/>
      <path d="M152 254H188V305H152Z" fill="#9b8063"/><path d="M463 274H503V323H463Z" fill="#a98c6c"/>
      {markers !== 'none' && <g className={markers === 'cup' ? 's5-cup-focus' : ''}><rect x="367" y="196" width="32" height="33" rx="3" fill="none" stroke="#e5753f" strokeWidth="3"/>
        {markers === 'pair' && <><rect x="251" y="198" width="40" height="28" rx="3" fill="none" stroke="#27446e" strokeWidth="3"/><text x="263" y="190" fill="#27446e" fontSize="22" fontWeight="700">A</text><text x="377" y="187" fill="#b85d2b" fontSize="22" fontWeight="700">B</text></>}
      </g>}
    </>}
  </svg>;
}
function ComparisonCard({ search = false }: { search?: boolean }) {
  return <OnceVisible className={`s5-comparison-card ${search ? 's5-search-card' : 's5-direct-card'}`}>
    <div className="s5-card-label"><h5>{search ? 'V*Bench 式问题' : '普通视觉问答'}</h5><span className="s5-teaching">教学示意</span></div>
    <p className="s5-scene-question">{search ? '桌上那个很小的杯子里，液体是什么颜色？' : '图中有没有桌子？'}</p>
    <div className="s5-scene"><Room simple={!search} markers={search ? 'cup' : 'none'}/><span className="s5-scene-caption">{search ? '复杂全景 · 小目标藏在细节里' : '全图 · 桌子清晰可见'}</span></div>
    <div className="s5-observation">{search ? <><span className="s5-search-locate">定位小杯子 <b aria-hidden="true">→</b></span><div className="s5-crop-result"><CupDetail/><span>看清局部<strong>液体是绿色</strong></span></div></> : <><span>目标明显 <b aria-hidden="true">→</b></span><div className="s5-direct-answer"><span aria-hidden="true">✓</span><strong>有桌子</strong></div></>}</div>
    <p className="s5-card-conclusion">{search ? <>真正的难点不是认颜色，而是<strong>先找到那个关键小目标。</strong></> : <>目标已经很明显，<strong>不需要先搜索关键细节。</strong></>}</p>
  </OnceVisible>;
}
function TaskVisual({ spatial = false }: { spatial?: boolean }) {
  return <div className="s5-task-visual" aria-hidden="true"><div className="s5-task-scene"><Room markers={spatial ? 'pair' : 'cup'}/></div><span className="s5-visual-arrow">→</span><div className="s5-task-detail">{spatial ? <><div className="s5-relative"><span>A</span><i/><span>B</span></div><strong>A 在 B 左侧</strong></> : <><CupDetail/><strong>绿色</strong></>}</div></div>;
}
function SearchPath({ withoutCue = false }: { withoutCue?: boolean }) {
  const nodes = withoutCue ? ['全图', '无关区域', '另一候选区域', '相关区域', '目标'] : ['全图', '上下文相关区域', '目标'];
  return <div className={`s5-path-card${withoutCue ? ' s5-path-long' : ''}`}><h5>{withoutCue ? '去掉 contextual cue' : '完整 V*'}</h5>
    <ol className="s5-route">{nodes.map((label, index) => <li key={label} className={index === nodes.length - 1 ? 'is-target' : ''}><div className="s5-route-picture">{index === 0 ? <Room/> : index === nodes.length - 1 ? <CupDetail/> : <svg viewBox="0 0 90 60" aria-hidden="true">{label.includes('无关') ? <><rect x="10" y="7" width="70" height="45" fill="#b8cbc9"/><path d="M45 7V52M10 29H80" stroke="#fff" strokeWidth="4"/></> : label.includes('另一') ? <><rect x="12" y="7" width="66" height="46" fill="#cbb99f"/><path d="M17 21H73M17 38H73" stroke="#94785c" strokeWidth="4"/></> : <><path d="M12 33H78M19 35V55M71 35V55" stroke="#a27a53" strokeWidth="6"/><Cup x={48} y={18} scale={.6}/></>}</svg>}</div><span>{label}</span></li>)}</ol>
    <span className="s5-route-note">{withoutCue ? '多经过几个候选区域' : '直接把注意力引向桌面'}</span></div>;
}

export function S5EvidenceJourney() {
  const [detector, setDetector] = useState<string>('V*');
  return <div className="s5-journey">
    <LearningModule number="5.1" title="普通题 vs V*Bench 式题" className="section-one-subsection">
      <div className="s5-comparison"><ComparisonCard/><ComparisonCard search/></div>
    </LearningModule>
    <LearningModule number="5.2" title="V*Bench 测什么？" className="section-one-subsection">
      <div className="s5-bench-line"><strong>V*Bench</strong><span><b>191</b> 样本</span><span>平均图像分辨率 <b>约 2246 × 1582</b></span><Source label="§4" page={6}/></div>
      <div className="s5-task-grid"><article className="s5-task-card"><div className="s5-task-title"><h5>属性识别</h5><span><b>115</b> 样本</span></div><TaskVisual/><p className="s5-task-flow">找到小目标 <span>→</span> 看清局部 <span>→</span> 判断属性</p><p className="s5-task-summary">先找到，再认属性。</p></article>
        <article className="s5-task-card"><div className="s5-task-title"><h5>空间关系推理</h5><span><b>76</b> 样本</span></div><TaskVisual spatial/><p className="s5-task-flow">找到 A + B <span>→</span> 定位 <span>→</span> 比较空间关系</p><p className="s5-task-summary">先找到两个目标，再判断它们的位置关系。</p></article></div>
    </LearningModule>
    <LearningModule number="5.3" title="V* / SEAL 表现" className="section-one-subsection">
      <OnceVisible className="s5-chart"><div className="s5-chart-heading"><strong>V*Bench 总体准确率</strong><span>越高越好 · %</span></div>
        {mainResults.map(item => <div className={`s5-bar-row${item.name === 'SEAL（V*）' ? ' is-seal' : ''}`} key={item.name}><span>{item.name}</span><div className="s5-bar-track"><i style={{ width: `${item.value}%` }}/></div><strong>{item.value.toFixed(2)}</strong></div>)}
        <div className="s5-chart-foot"><span>论文当时的比较</span><Source label="表 1" page={6}/></div></OnceVisible>
      <div className="s5-boundaries"><p><strong>能说明</strong>SEAL 在这里比较的 MLLM 中领先。</p><p><strong>不能说明</strong>它在所有多模态任务中都领先。</p></div>
    </LearningModule>
    <LearningModule number="5.4" title="Detector 能替代 V* 吗？" className="section-one-subsection">
      <div className="s5-detector-chart" role="group" aria-label="VWM 搜索方法对照，总体准确率，越高越好"><div className="s5-chart-heading"><strong>准确率（%）↑</strong><Source label="表 2" page={7}/></div>
        {detectors.map(item => <div className={`s5-detector-row${detector === item.name ? ' is-selected' : ''}`} key={item.name}><button type="button" aria-pressed={detector === item.name} onClick={() => setDetector(item.name)}>VWM + {item.name}</button><div className="s5-bar-track"><i style={{ width: `${item.value}%` }}/></div><strong>{item.value.toFixed(2)}</strong></div>)}</div>
    </LearningModule>
    <LearningModule number="5.5" title="Contextual Cue 与搜索效率" className="section-one-subsection">
      <div className="s5-path-header"><span className="s5-teaching">教学示意 · 非论文实测轨迹；节点数不代表平均搜索长度</span></div>
      <div className="s5-path-grid"><SearchPath/><SearchPath withoutCue/></div>
      <p className="s5-takeaway">Contextual Cue 帮助少搜无关区域。</p>
      <div className="s5-length-chart"><div className="s5-chart-heading"><strong>论文实测 · 平均搜索长度</strong><span>越短越好 · 步</span></div>
        {lengths.map(item => <div className={`s5-length-row${item.name === 'V*' ? ' is-full' : ''}`} key={item.name}><span>{item.name}</span><div className="s5-bar-track"><i style={{ width: `${item.value / 8 * 100}%` }}/></div><strong>{item.value.toFixed(2)}</strong></div>)}
        <div className="s5-chart-foot"><span>只统计成功定位的样本；不等于成功率或实际耗时。</span><Source label="表 3 / §5.3" page={7}/></div></div>
    </LearningModule>
    <LearningModule number="5.6" title="实验的证据链" className="section-one-subsection">
      <ol className="s5-evidence-chain"><li><strong>V*Bench</strong><span>专门测视觉搜索</span></li><li><strong>主结果</strong><span>系统整体明显提升</span></li><li><strong>Detector 对照</strong><span>这两种 detector 提供的 crop，未达到 V* 的结果</span></li><li><strong>Ablation</strong><span>移除搜索线索后，平均搜索长度增加</span></li></ol>
      <p className="s5-final-conclusion">这些证据共同支持显式 <strong>Guided Visual Search</strong> 在该类任务中的价值。</p>
    </LearningModule>
  </div>;
}
