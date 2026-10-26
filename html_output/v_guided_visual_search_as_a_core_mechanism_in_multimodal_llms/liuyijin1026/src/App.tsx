import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, ExternalLink, RotateCcw } from 'lucide-react';
import { CODE, PAPER, PDF, sections } from './content';
import { S5EvidenceJourney } from './components/S5EvidenceJourney';
import { S3SearchExperiment } from './components/S3SearchExperiment';
import { S4MemoryWorkbench } from './components/S4MemoryWorkbench';
import { S2DecisionExperiment } from './components/S2DecisionExperiment';
import { PassiveVsActiveLab } from './components/PassiveVsActiveLab';
import { SectionHeading } from './components/PaperSkillChapter';
import { LearningModule } from './components/LearningModule';
import { PassiveVsVStarHeroDemo } from './components/PassiveVsVStarHeroDemo';
import { S6Synthesis } from './components/S6Synthesis';
import { TutorialSidebar } from './components/TutorialSidebar';

const STORAGE = 'vstar-progressive-learning-v3';
const PREVIOUS_STORAGE = 'vstar-progressive-learning-v2';
const LEGACY_STORAGE = 'vstar-seven-chapters-v1';
const CHAPTERS = sections.length;
const sidebarChapters = sections.map(([id, title]) => ({ id, title }));
type LearningProgress = { unlockedThrough: number; completedThrough: number; visited: string[]; reviewUnlocked: boolean };
const initialProgress: LearningProgress = { unlockedThrough: 0, completedThrough: 0, visited: [], reviewUnlocked: false };
function savedProgress(): LearningProgress {
  try {
    const current = localStorage.getItem(STORAGE);
    const stored = current ?? localStorage.getItem(PREVIOUS_STORAGE);
    if (!stored) return initialProgress;
    const value: unknown = JSON.parse(stored);
    if (!value || typeof value !== 'object') return initialProgress;
    const progress = value as Partial<LearningProgress>;
    const legacy = current === null;
    const oldMax = legacy ? 7 : CHAPTERS;
    const oldUnlocked = progress.unlockedThrough;
    const oldCompleted = progress.completedThrough;
    if (!Number.isInteger(oldUnlocked) || oldUnlocked! < 0 || oldUnlocked! > oldMax ||
        !Number.isInteger(oldCompleted) || oldCompleted! < 0 || oldCompleted! > oldUnlocked!) return initialProgress;
    // The former §3 Overview now lives inside §2; preserve only milestones the reader reached.
    const unlockedThrough = legacy ? [0, 1, 2, 2, 3, 4, 5, 6][oldUnlocked!] : oldUnlocked!;
    const completedThrough = legacy ? [0, 1, 1, 2, 3, 4, 5, 6][oldCompleted!] : oldCompleted!;
    if (!Number.isInteger(unlockedThrough) || unlockedThrough! < 0 || unlockedThrough! > CHAPTERS ||
        !Number.isInteger(completedThrough) || completedThrough! < 0 || completedThrough! > unlockedThrough!) return initialProgress;
    const allowed = new Set<string>(sections.slice(0, unlockedThrough).map(([id]) => id));
    const visited = Array.isArray(progress.visited) ? progress.visited.filter((id): id is string => typeof id === 'string' && allowed.has(id)) : [];
    const reviewUnlocked = completedThrough === CHAPTERS && progress.reviewUnlocked === true;
    return { unlockedThrough: unlockedThrough!, completedThrough: completedThrough!, visited: [...new Set(visited)], reviewUnlocked };
  } catch { return initialProgress; }
}

const purposes = [
  '先别急着看搜索算法。第一步先弄清楚：为什么一个已经看过整张图的 MLLM，仍然可能因为关键小目标在全局缩放中丢失，而无法回答问题。',
  '这一节先回答一个条件问题：V* 并不是每次都搜索。VQA LLM 会先尝试利用全局视觉信息回答，只有证据不足时才指出缺失目标并触发 Search。',
  '这一节进入论文最关键的方法：当目标本身不明显时，V* 怎样利用 target cue、contextual cue、heatmap 和 priority search，把视觉搜索集中到最值得看的区域。',
  '找到目标只是第一步。这一节解释 Visual Working Memory 怎样把问题、全局图、局部高分辨率目标和位置重新组织起来，再交给 VQA LLM。',
  '这一节不再讲方法，而是看证据：V*Bench 为什么专门设计来测试视觉搜索，以及主结果和消融实验究竟支持了哪些结论。',
  '最后收束整篇论文：V* 改变了什么、实验支持什么结论，以及作者明确讨论了哪些局限。',
] as const;
const difficulties = ['入门', '入门', '核心', '核心', '进阶', '总结'] as const;
function Chapter({ index, children, takeaway }: { index: number; children: ReactNode; takeaway: string }) {
  const [id, title] = sections[index];
  return <section id={id} className="chapter" aria-labelledby={`${id}-title`}>
    <SectionHeading id={`${id}-title`} number={index + 1} eyebrow={difficulties[index]} title={title} total={CHAPTERS}>{purposes[index]}</SectionHeading>
    <div className="section-one-flow">{children}</div>
    <p className="takeaway"><strong>这一章的答案</strong>{takeaway}</p>
  </section>;
}

const quiz = [
  { question: '当前全局视觉信息足够时，SEAL 会怎样做？', answers: ['直接回答', '必须先搜索', '随机裁图'], correct: 0, why: 'Algorithm 1 中，搜索只在当前信息不足时启动。' },
  { question: 'V* 用什么决定优先检查区域？', answers: ['固定从左上开始', '目标或上下文线索', '只按图块面积'], correct: 1, why: '线索热图用于给子图像安排搜索优先级。' },
  { question: 'VWM 中与新证据一起保留什么？', answers: ['跨任务长期记忆', '网页浏览历史', '问题、全图及目标位置'], correct: 2, why: '论文的四块工作输入是 question、global image、searched targets、target location。' },
] as const;
function FinalQuiz() {
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);
  return <div className="final-quiz"><h3>三个问题，检查是否串起了这条路径</h3>{quiz.map((item, i) => <fieldset key={item.question}><legend>{i + 1}. {item.question}</legend><div className="quiz-options">{item.answers.map((answer, j) => <button key={answer} type="button" aria-pressed={answers[i] === j} className={answers[i] === j ? 'selected' : ''} onClick={() => setAnswers(current => current.map((value, index) => index === i ? j : value))}>{answer}</button>)}</div>{answers[i] !== null && <p role="status" className={answers[i] === item.correct ? 'quiz-correct' : 'quiz-review'}>{answers[i] === item.correct ? '答对了。' : '再想想。'}{item.why}</p>}</fieldset>)}</div>;
}

export default function App() {
  const [progress, setProgress] = useState(savedProgress);
  const [active, setActive] = useState('top');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [destination, setDestination] = useState('');
  const visibleCount = progress.unlockedThrough;
  const finalVisible = progress.reviewUnlocked;
  function navigate(id: string) {
    if (id !== 'top' && id !== 'final' && !sections.slice(0, visibleCount).some(([sectionId]) => sectionId === id)) return;
    if (id === 'final' && !finalVisible) return;
    setMobileOpen(false);
    setActive(id);
    if (id !== 'top' && id !== 'final') setProgress(current => current.visited.includes(id) ? current : { ...current, visited: [...current.visited, id] });
    setDestination(id);
  }
  function start() {
    setProgress(current => ({ ...current, unlockedThrough: Math.max(current.unlockedThrough, 1), visited: current.visited.includes(sections[0][0]) ? current.visited : [...current.visited, sections[0][0]] }));
    setActive(sections[0][0]);
    setDestination(sections[0][0]);
  }
  function startReview() { if (finalVisible) navigate(sections[0][0]); }
  function navigateChapter(id: string) {
    const index = sections.findIndex(([sectionId]) => sectionId === id);
    if (index < 0) return;
    // Match PptBars: dim future chapters, and reveal through a clicked chapter.
    setProgress(current => ({ ...current, unlockedThrough: Math.max(current.unlockedThrough, index + 1), visited: current.visited.includes(id) ? current.visited : [...current.visited, id] }));
    setMobileOpen(false);
    setActive(id);
    setDestination(id);
  }
  function reset() {
    try { localStorage.removeItem(STORAGE); localStorage.removeItem(LEGACY_STORAGE); localStorage.removeItem(PREVIOUS_STORAGE); } catch { /* Reset still works in memory. */ }
    if (window.location.hash) window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    setProgress(initialProgress);
    setEpoch(e => e + 1);
    navigate('top');
  }
  function advance(index: number) {
    const next = index === CHAPTERS - 1 ? 'final' : sections[index + 1][0];
    setProgress(current => {
      if (index >= current.unlockedThrough) return current;
      const unlockedThrough = Math.max(current.unlockedThrough, Math.min(CHAPTERS, index + 2));
      return { ...current, unlockedThrough, completedThrough: Math.max(current.completedThrough, index + 1),
        reviewUnlocked: current.reviewUnlocked || index === CHAPTERS - 1,
        visited: next === 'final' || current.visited.includes(next) ? current.visited : [...current.visited, next] };
    });
    setMobileOpen(false);
    setActive(next);
    setDestination(next);
  }
  useEffect(() => {
    try {
      if (progress.unlockedThrough === 0) localStorage.removeItem(STORAGE);
      else localStorage.setItem(STORAGE, JSON.stringify(progress));
    } catch { /* Reading stays usable without storage. */ }
  }, [progress]);
  useEffect(() => {
    if (window.location.hash) window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  }, []);
  useEffect(() => {
    if (!destination) return;
    const frame = requestAnimationFrame(() => {
      const el = document.getElementById(destination);
      if (el) { el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); el.querySelector<HTMLElement>('h1, h2')?.focus({ preventScroll: true }); }
      setDestination('');
    });
    return () => cancelAnimationFrame(frame);
  }, [destination, visibleCount, finalVisible]);
  useEffect(() => {
    // Use the same viewport reference line as PptBars, including tall chapters.
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * .3;
      const scrollPadding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      let current = 'top';
      document.querySelectorAll<HTMLElement>('.chapter, .final').forEach(section => {
        const scrollMargin = parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
        // Keep the selected chapter correct in short viewports with scroll insets.
        if (section.getBoundingClientRect().top <= Math.max(line, scrollPadding + scrollMargin + 1)) current = section.id;
      });
      setActive(current);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [visibleCount, finalVisible]);
  const activeChapterIndex = sections.findIndex(([id]) => id === active);
  return <div className={`app-shell learning-mode ${mobileOpen ? 'sidebar-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
    <a className="skip-link" href="#top">跳到正文</a>
    <div className="reading-progress" role="progressbar" aria-label="章节解锁进度" aria-valuemin={0} aria-valuemax={CHAPTERS} aria-valuenow={visibleCount} aria-valuetext={`${visibleCount} / ${CHAPTERS} 章已解锁`} style={{width:`${visibleCount / CHAPTERS * 100}%`}}/>
    <TutorialSidebar chapters={sidebarChapters} activeId={active} revealed={visibleCount} drawerOpen={mobileOpen} collapsed={sidebarCollapsed} onDrawerChange={setMobileOpen} onCollapsedChange={setSidebarCollapsed} onNavigate={navigateChapter}/>
    <main className="tutorial-main" inert={mobileOpen}>
      <section className="hero hero-section" id="top"><div className="hero-inner"><div className="hero-venue">INTERACTIVE TUTORIAL</div><h1 tabIndex={-1}>V*: Guided Visual Search as a Core Mechanism in Multimodal LLMs</h1><div className="hero-sub"><span>中文教学译名</span>V*：以引导式视觉搜索作为多模态大语言模型的核心机制</div><p className="hero-abs">答案就在图里，但模型真的看见了吗？</p><div className="hero-meta" aria-label="论文关键词">{['Multimodal LLM','Guided Visual Search','Visual Working Memory','High-resolution Vision','V*Bench'].map(keyword => <span className="tag" key={keyword}>{keyword}</span>)}</div><div className="hero-links"><a href={PAPER} target="_blank" rel="noreferrer">Paper <ExternalLink size={15}/></a><a href={PDF} target="_blank" rel="noreferrer">PDF <ExternalLink size={15}/></a><a href={CODE} target="_blank" rel="noreferrer">Code <ExternalLink size={15}/></a></div><PassiveVsVStarHeroDemo/>{visibleCount === 0 && <div className="chap-loader"><div className="chap-loader-hint">从一个杯子的问题开始</div><button className="chap-loader-btn" onClick={start}>开始学习 §1 <span className="chap-loader-arrow">→</span></button></div>}</div></section>
      <div key={epoch}>
        {visibleCount >= 1 && <Chapter index={0} takeaway="关键区别不是 V* 看得更多，而是它根据任务主动决定下一步看哪里。"><LearningModule number="1.1" title="Passive MLLM vs V*" className="section-one-subsection"><PassiveVsActiveLab/></LearningModule></Chapter>}
        {visibleCount >= 2 && <Chapter index={1} takeaway="搜索不是默认动作，而是当前视觉证据不足时触发的补充感知。"><LearningModule number="2.1" title="什么时候启动 Search？" className="section-one-subsection"><S2DecisionExperiment/></LearningModule></Chapter>}
        {visibleCount >= 3 && <Chapter index={2} takeaway="V* 不是暴力遍历整张图，而是利用语言和视觉线索给候选区域排序，优先搜索最值得看的地方。"><LearningModule number="3.1" title="V* 怎样决定先看哪里" className="section-one-subsection"><S3SearchExperiment/></LearningModule></Chapter>}
        {visibleCount >= 4 && <Chapter index={3} takeaway="VWM 保留任务、全局上下文、局部细节与目标位置，再交给 VQA LLM 作答。"><LearningModule number="4.1" title="Visual Working Memory" className="section-one-subsection"><S4MemoryWorkbench/></LearningModule></Chapter>}
        {visibleCount >= 5 && <Chapter index={4} takeaway="V*Bench 测试能否找到关键细节再回答；论文实验支持显式视觉搜索在这类场景中的价值。"><S5EvidenceJourney/></Chapter>}
        {visibleCount >= 6 && <Chapter index={5} takeaway="V* 将固定视觉输入推进到任务驱动的主动视觉搜索。"><LearningModule number="6.1" title="V* 的贡献与边界" className="section-one-subsection"><S6Synthesis/></LearningModule></Chapter>}
        {finalVisible && <section id="final" className="final" aria-labelledby="final-title"><span className="section-kicker">FINAL · 回顾</span><h2 id="final-title" tabIndex={-1}>从看图，到主动寻找证据</h2><ol className="takeaways"><li>视觉信息不足时，先指出缺失目标。</li><li>V* 用任务和上下文线索引导搜索。</li><li>VWM 把局部证据与全图一起交回回答模型。</li></ol><FinalQuiz/><div className="final-actions"><button className="button-primary" onClick={startReview}>复习全部章节 <ArrowRight size={17}/></button><button className="button-outline" onClick={reset}><RotateCcw size={16}/>重新开始</button></div></section>}
      </div>
    </main>
    {activeChapterIndex >= 0 && <div className="slide-nav">
      <button className="slide-nav-btn" onClick={() => navigate(sections[activeChapterIndex - 1]?.[0] ?? 'top')} disabled={activeChapterIndex === 0}>← 上一章</button>
      <span className="slide-nav-counter">{activeChapterIndex + 1} / {CHAPTERS}</span>
      <button className="slide-nav-btn slide-nav-btn-primary" onClick={() => advance(activeChapterIndex)}>下一章 →</button>
    </div>}
  </div>;
}
