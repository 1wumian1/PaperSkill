import React, { useEffect, useState } from 'react';
import { tutorial } from './data/tutorial';
import { CHAPTERS } from './v9/chapters';
import { ChapterView } from './v9/Chapter';
import { Closing, Hero, Videos } from './v9/Parts';
import { useReducedMotion } from './modules/dp-kit';

// v9 长滚动版：参照 PaperSkill 长滚动模板——左侧固定章节栏，主区一列卡片；
// 章节按“开始学习 / 继续下一章”逐章展开，侧栏可直接跳到任一章（会展开到该章为止）。
// ?all=1 一次展开全部（便于检查）；#chap-N / #closing / #videos 打开时直接定位。

const N = CHAPTERS.length;

function initialShown(): number {
  if (new URLSearchParams(location.search).get('all') === '1') return N + 1;
  const h = location.hash.replace('#', '');
  const m = /^chap-(\d+)$/.exec(h);
  if (m) return Math.min(N, Number(m[1]));
  if (h === 'closing' || h === 'videos' || h === 'verdict' || h === 'glossary' || h === 'sources') return N + 1;
  return 0;
}

export default function App() {
  // shown = 已展开的章数；N + 1 表示收束与视频也已展开
  const [shown, setShown] = useState(initialShown);
  const [target, setTarget] = useState<string | null>(() => (location.hash ? location.hash.slice(1) : null));
  const [active, setActive] = useState('top');
  const [drawer, setDrawer] = useState(false);
  const reduced = useReducedMotion();

  // 减少动态效果（系统设置或 ?motion=reduce）时，跳转不做平滑滚动
  useEffect(() => { document.documentElement.style.scrollBehavior = reduced ? 'auto' : ''; }, [reduced]);

  // 章节抽屉（窗口不足 1280px 时）：Esc 关闭；窗口拉宽到侧栏常驻时也收起
  useEffect(() => {
    if (!drawer) return;
    const mq = window.matchMedia('(min-width: 1280px)');
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawer(false); };
    const onWide = () => { if (mq.matches) setDrawer(false); };
    window.addEventListener('keydown', onKey);
    mq.addEventListener('change', onWide);
    return () => { window.removeEventListener('keydown', onKey); mq.removeEventListener('change', onWide); };
  }, [drawer]);

  const go = (id: string, need: number) => {
    setShown((s) => Math.max(s, need));
    setTarget(id);
    setDrawer(false);
  };
  const jumpChapter = (n: number) => go(`chap-${n}`, n);

  // 展开后再滚动到目标
  useEffect(() => {
    if (!target) return;
    const el = document.getElementById(target);
    if (!el) return;
    el.scrollIntoView({ block: 'start' });
    history.replaceState(null, '', `${location.search}#${target}`);
    setTarget(null);
  }, [target, shown]);

  // 侧栏高亮当前所在的章
  useEffect(() => {
    const els = ['top', ...CHAPTERS.slice(0, shown).map((c) => c.id), ...(shown > N ? ['closing', 'videos'] : [])]
      .map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (vis[0]) setActive(vis[0].target.id);
    }, { rootMargin: '-20% 0px -70% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [shown]);

  const items = [
    ...CHAPTERS.map((c) => ({ id: c.id, num: `§${c.num}`, title: c.title, need: c.num })),
    { id: 'closing', num: '✦', title: '收束：结论分级 · 术语 · 来源', need: N + 1 },
    { id: 'videos', num: '▶', title: '延伸学习 · B 站视频', need: N + 1 },
  ];

  return (
    <>
      <header className="v9-topbar">
        <button type="button" className="v9-menu" aria-expanded={drawer} aria-controls="v9-side" onClick={() => setDrawer((d) => !d)}>章节</button>
        <span>DivPrune 精读</span>
      </header>
      <aside className={`slide-sidebar ${drawer ? 'is-open' : ''}`} id="v9-side" aria-label="章节目录">
        <a className="side-brand" href="#top" onClick={(e) => { e.preventDefault(); go('top', 0); }}>
          <span className="side-kicker">INTERACTIVE TUTORIAL</span>
          <span className="side-title">{tutorial.meta.titleZh}</span>
        </a>
        <nav className="side-list">
          {items.map((it) => (
            <button key={it.id} type="button" className={`side-item ${active === it.id ? 'is-on' : ''} ${shown >= it.need ? 'is-open' : ''}`}
              aria-current={active === it.id ? 'location' : undefined} onClick={() => go(it.id, it.need)}>
              <span className="side-num">{it.num}</span><span className="side-name">{it.title}</span>
            </button>
          ))}
        </nav>
        <div className="side-foot">CVPR 2025 · 代码固定到 commit 799e2d9</div>
      </aside>
      {drawer ? <div className="v9-scrim" onClick={() => setDrawer(false)} /> : null}

      <main className="v9-main">
        <Hero onStart={() => jumpChapter(1)} onRoute={jumpChapter} />
        {CHAPTERS.slice(0, Math.min(shown, N)).map((c) => (
          <ChapterView key={c.id} ch={c} all={CHAPTERS} onJump={jumpChapter}
            next={c.num < N
              ? { label: `继续 §${c.num + 1}：${CHAPTERS[c.num].title}`, go: () => jumpChapter(c.num + 1) }
              : { label: '看结论分级与延伸视频', go: () => go('closing', N + 1) }} />
        ))}
        {shown > N ? <><Closing /><Videos /></> : null}
      </main>
    </>
  );
}
