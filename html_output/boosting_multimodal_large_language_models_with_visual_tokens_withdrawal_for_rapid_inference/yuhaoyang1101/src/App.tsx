import React, { useEffect, useRef, useState } from 'react';
import { tutorial } from './data/tutorial';
import { CHAPTERS } from './vtw9/chapters';
import { ChapterView } from './vtw9/Chapter';
import { Closing, Hero } from './vtw9/Parts';
import { Videos } from './vtw9/Videos';
import { useReducedMotion } from './modules/vtw-kit';

// 长滚动版（参照 PaperSkill 长滚动模板 / DivPrune v9）：左侧固定章节栏，主区一列卡片；
// 章节按“开始学习 / 继续下一章”逐章展开，侧栏可直接跳到任一章（会展开到该章为止）。
// ?all=1 一次展开全部（便于检查）；#chap-N / #closing / #glossary / #sources / #videos 打开时直接定位。

const N = CHAPTERS.length;
const CLOSING_IDS = ['closing', 'glossary', 'sources', 'videos'];
// 读者主动操作（滚轮、触摸、按键、点击）时停止跳转后的自动对齐
const USER_EVENTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;

function initialShown(): number {
  if (new URLSearchParams(location.search).get('all') === '1') return N + 1;
  const h = location.hash.replace('#', '');
  const m = /^chap-(\d+)$/.exec(h);
  if (m) return Math.min(N, Number(m[1]));
  if (CLOSING_IDS.includes(h)) return N + 1;
  return 0;
}

export default function App() {
  // shown = 已展开的章数；N + 1 表示收束也已展开
  const [shown, setShown] = useState(initialShown);
  const [target, setTarget] = useState<string | null>(() => (location.hash ? location.hash.slice(1) : null));
  const [active, setActive] = useState('top');
  const [drawer, setDrawer] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    document.title = `${tutorial.meta.titleZh} · 交互式教程`;
  }, []);
  useEffect(() => {
    document.documentElement.style.scrollBehavior = reduced ? 'auto' : '';
    // ?motion=reduce 与系统“减少动态效果”一致：CSS 过渡与入场动画也一起关闭
    document.documentElement.classList.toggle('is-reduced-motion', reduced);
  }, [reduced]);

  // 章节抽屉（窗口不足 1280px 时）：Esc 关闭；窗口拉宽到侧栏常驻时也收起
  useEffect(() => {
    if (!drawer) return;
    const mq = window.matchMedia('(min-width: 1280px)');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawer(false);
    };
    const onWide = () => {
      if (mq.matches) setDrawer(false);
    };
    window.addEventListener('keydown', onKey);
    mq.addEventListener('change', onWide);
    return () => {
      window.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onWide);
    };
  }, [drawer]);

  const go = (id: string, need: number) => {
    setShown((s) => Math.max(s, need));
    setTarget(id);
    setDrawer(false);
  };
  const jumpChapter = (n: number) => go(`chap-${n}`, n);

  // 展开后再滚动到目标。刚展开的章节里，模块会在首帧后按卡片宽度校准尺寸、画布测量宽度，
  // 目标上方的高度还会变；所以在主区尺寸稳定之前（连续 300ms 没有变化，最长 3s）跟着重新对齐，
  // 读者自己滚动、按键或点击时立即停止，不和读者抢滚动条。
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!target) return;
    const el = document.getElementById(target);
    if (!el) return;
    history.replaceState(null, '', `${location.search}#${target}`);
    setTarget(null);
    // 'instant'：不受 CSS scroll-behavior: smooth 影响，校准时不会出现一段段的平滑追赶
    const align = () => el.scrollIntoView({ block: 'start', behavior: 'instant' as ScrollBehavior });
    align();
    const main = mainRef.current;
    if (!main || typeof ResizeObserver === 'undefined') return;
    let quiet = 0;
    const stop = () => {
      ro.disconnect();
      window.clearTimeout(quiet);
      window.clearTimeout(cap);
      USER_EVENTS.forEach((ev) => window.removeEventListener(ev, stop, true));
    };
    const ro = new ResizeObserver(() => {
      align();
      window.clearTimeout(quiet);
      quiet = window.setTimeout(stop, 300);
    });
    ro.observe(main);
    quiet = window.setTimeout(stop, 300);
    const cap = window.setTimeout(stop, 3000);
    USER_EVENTS.forEach((ev) => window.addEventListener(ev, stop, { capture: true, passive: true }));
    return stop;
  }, [target, shown]);

  // 侧栏高亮当前所在的章
  useEffect(() => {
    const ids = ['top', ...CHAPTERS.slice(0, shown).map((c) => c.id), ...(shown > N ? CLOSING_IDS : [])];
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [shown]);

  const items = [
    ...CHAPTERS.map((c) => ({ id: c.id, num: `§${c.num}`, title: c.title, need: c.num })),
    { id: 'closing', num: '✦', title: '收束：结论分级', need: N + 1 },
    { id: 'glossary', num: '✦', title: '术语表', need: N + 1 },
    { id: 'sources', num: '✦', title: '来源与证据边界', need: N + 1 },
    { id: 'videos', num: '▶', title: 'B 站讲解视频', need: N + 1 },
  ];

  return (
    <>
      <header className="v9-topbar">
        <button type="button" className="v9-menu" aria-expanded={drawer} aria-controls="v9-side" onClick={() => setDrawer((d) => !d)}>
          章节
        </button>
        <span>VTW 精读</span>
      </header>
      <aside className={`slide-sidebar ${drawer ? 'is-open' : ''}`} id="v9-side" aria-label="章节目录">
        <a
          className="side-brand"
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            go('top', 0);
          }}
        >
          <span className="side-kicker">INTERACTIVE TUTORIAL</span>
          <span className="side-title">{tutorial.meta.titleZh}</span>
        </a>
        <nav className="side-list">
          {items.map((it) => (
            <button key={it.id} type="button" className={`side-item ${active === it.id ? 'is-on' : ''} ${shown >= it.need ? 'is-open' : ''}`} aria-current={active === it.id ? 'location' : undefined} onClick={() => go(it.id, it.need)}>
              <span className="side-num">{it.num}</span>
              <span className="side-name">{it.title}</span>
            </button>
          ))}
        </nav>
        <div className="side-foot">AAAI 2025 · 代码固定到 commit b9cb126</div>
      </aside>
      {drawer ? <div className="v9-scrim" onClick={() => setDrawer(false)} /> : null}

      <main className="v9-main" ref={mainRef}>
        <Hero onStart={() => jumpChapter(1)} onRoute={jumpChapter} />
        {CHAPTERS.slice(0, Math.min(shown, N)).map((c) => (
          <ChapterView
            key={c.id}
            ch={c}
            all={CHAPTERS}
            onJump={jumpChapter}
            next={c.num < N ? { label: `继续 §${c.num + 1}：${CHAPTERS[c.num].title}`, go: () => jumpChapter(c.num + 1) } : { label: '看结论分级、术语与来源', go: () => go('closing', N + 1) }}
          />
        ))}
        {shown > N ? <><Closing /><Videos /></> : null}
      </main>
    </>
  );
}
