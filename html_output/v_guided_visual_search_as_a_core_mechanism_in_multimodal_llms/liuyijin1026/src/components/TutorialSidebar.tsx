import { useEffect, useRef } from 'react';

type TutorialSidebarProps = {
  chapters: readonly { id: string; title: string }[];
  activeId: string;
  revealed: number;
  drawerOpen: boolean;
  collapsed: boolean;
  onDrawerChange: (open: boolean) => void;
  onCollapsedChange: (collapsed: boolean) => void;
  onNavigate: (id: string) => void;
};

/** Sidebar markup and classes from InSpatio-World's PptBars component. */
export function TutorialSidebar({ chapters, activeId, revealed, drawerOpen, collapsed, onDrawerChange, onCollapsedChange, onNavigate }: TutorialSidebarProps) {
  const toggle = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sidebar.current?.querySelector<HTMLButtonElement>('button')?.focus();

    const close = () => { onDrawerChange(false); toggle.current?.focus(); };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key !== 'Tab') return;
      const items = [toggle.current, ...Array.from(sidebar.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])].filter((item): item is HTMLButtonElement => item !== null);
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    const onResize = () => { if (window.innerWidth > 768) onDrawerChange(false); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [drawerOpen, onDrawerChange]);

  return <>
    <button ref={toggle} type="button" className="slide-sidebar-toggle" onClick={() => onDrawerChange(!drawerOpen)} aria-label={drawerOpen ? '关闭章节导航' : '打开章节导航'} aria-expanded={drawerOpen} aria-controls="chapter-sidebar">
      <span className="slide-sidebar-toggle-icon" aria-hidden="true">{drawerOpen ? '✕' : '☰'}</span>目录
    </button>
    {drawerOpen && <div className="slide-sidebar-overlay" onClick={() => { onDrawerChange(false); toggle.current?.focus(); }} aria-hidden="true"/>}
    <aside id="chapter-sidebar" ref={sidebar} className="slide-sidebar" aria-label="学习导航">
      <div className="slide-sidebar-header">
        <div className="slide-sidebar-venue">INTERACTIVE TUTORIAL</div>
        <div className="slide-sidebar-title">V*：以引导式视觉搜索作为多模态大语言模型的核心机制 · 交互式教程</div>
      </div>
      <nav className="slide-sidebar-nav" aria-label="章节导航">
        {chapters.map((chapter, index) => <button key={chapter.id} type="button" className={`slide-sidebar-item ${activeId === chapter.id ? 'active' : ''} ${index < revealed ? '' : 'is-locked'}`} onClick={() => onNavigate(chapter.id)} aria-current={activeId === chapter.id ? 'step' : undefined} title={chapter.title}>
          <span className="slide-sidebar-num">§{index + 1}</span>
          <span className="slide-sidebar-text">{chapter.title}</span>
        </button>)}
      </nav>
    </aside>
    <button type="button" className="slide-sidebar-collapse" onClick={() => onCollapsedChange(!collapsed)} title={collapsed ? '展开目录' : '折叠目录'} aria-label={collapsed ? '展开目录' : '折叠目录'} aria-expanded={!collapsed} aria-controls="chapter-sidebar">
      <span aria-hidden="true">{collapsed ? '☰' : '◀'}</span>
    </button>
  </>;
}
