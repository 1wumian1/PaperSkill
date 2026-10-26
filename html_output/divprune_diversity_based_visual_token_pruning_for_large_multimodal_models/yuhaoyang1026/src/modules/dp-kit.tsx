// DivPrune 页面共用的小工具：语义色、减少动态效果、画布逐帧舞台、缩放后的指针坐标、
// 分段切换、按钮、滑块和“内容口径”标记。只被 src/modules 下的页面组件引用。
import React, { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import './dp.css';

// 功能色对齐 contract.md §5：蓝 = 当前状态 / 引导，绿 = 本文方法 / 正确，红 = 旧方法 / 失败，
// 橙 = 用户参数与强调，紫 = 辅助方法（VTW），黄 = 证据边界（复算不一致、外推提醒）。
// 珊瑚 / 蓝紫 / 薄荷只用于装饰层（背景、渐变标题），不承担状态含义。
export const C = {
  blue: '#27446e',
  blueLight: '#5d7fb3',
  green: '#228d5c',
  greenLight: '#62c093',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  yellow: '#c07100',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
  soft: '#eef3fb',
  coral: '#ff7a5c',
  violet: '#8a5cf0',
  mint: '#3fbfa6',
};

export const FONT_SANS = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",system-ui,sans-serif';
export const FONT_MONO = 'ui-monospace,"Cascadia Code","SFMono-Regular",Consolas,monospace';

/** URL 参数 ?motion=reduce 与系统偏好走同一条路径（便于在无法改系统设置时复核）。 */
const FORCE_REDUCE = typeof window !== 'undefined' && new URLSearchParams(location.search).get('motion') === 'reduce';

export function useReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => FORCE_REDUCE || matchMedia(query).matches);
  useEffect(() => {
    if (FORCE_REDUCE) return;
    const mq = matchMedia(query);
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

export const approach = (cur: number, target: number, dt: number, k = 9) => target + (cur - target) * Math.exp(-k * dt);
export const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

/** 设计尺寸固定的画布：按 2 倍像素绘制，在舞台缩放后仍清晰。 */
export function prep(canvas: HTMLCanvasElement, w: number, h: number) {
  const dpr = 2;
  if (canvas.width !== w * dpr) canvas.width = w * dpr;
  if (canvas.height !== h * dpr) canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

/**
 * 元素是否在视口附近（上下各留 200px 预读）。屏外的画布暂停逐帧绘制，自动播放也暂停。
 */
export function useInView(ref: RefObject<Element>, margin = '200px 0px'): boolean {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin]);
  return inView;
}

/**
 * 宽表 / 宽图的横向滚动区：内容比可用宽度宽时（手机竖屏）在模块内左右滑动，并在上方显示提示；放得下时提示不出现。
 */
export const XScroll: React.FC<{ className?: string; label: string; children: React.ReactNode }> = ({ className, label, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setScrollable(el.scrollWidth > el.clientWidth + 1);
    check();
    window.addEventListener('resize', check);
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(check);
    ro?.observe(el);
    if (el.firstElementChild) ro?.observe(el.firstElementChild);
    return () => { window.removeEventListener('resize', check); ro?.disconnect(); };
  }, []);
  return (
    <>
      {scrollable ? <div className="dp-swipe-hint">左右滑动查看完整内容 →</div> : null}
      <div ref={ref} className={`dp-xscroll ${className ?? ''}`} tabIndex={scrollable ? 0 : undefined}
        role={scrollable ? 'region' : undefined} aria-label={scrollable ? `${label}（可左右滑动）` : undefined}>{children}</div>
    </>
  );
};

/** 滑块等“直接操作”刚发生过：此时画布直接画到目标状态，不做缓动，保证跟手。 */
let lastDirectInput = -1e9;
export const markDirectInput = () => { lastDirectInput = performance.now(); };
const isDirectInput = () => performance.now() - lastDirectInput < 120;

/**
 * 按需绘制的画布舞台。
 * - draw 只收 ctx（参数个数 ≤ 1）视为静止画面：状态变化时画一次，不开逐帧循环。
 * - 用到 t / dt 的画面：状态变化（点击）后播放 animMs 毫秒的过渡，然后画一帧最终状态（t 传 999）并停下。
 *   过渡途中再次变化会从当前画面续接（各模块的 approach 缓动本身可中断）。
 * - 滑块拖动（markDirectInput）与减少动态效果：直接画最终状态。
 * - 画布滚出视口时暂停；回到视口时直接画出当前状态（学习进度保存在 React 状态里，不会丢）。
 */
export function useStage(
  ref: RefObject<HTMLCanvasElement>,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, t: number, dt: number) => void,
  deps: unknown[],
  animMs = 900
) {
  const reduced = useReducedMotion();
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const animated = draw.length > 1;
  const inView = useInView(ref);
  const run = useRef({ raf: 0, start: 0, last: 0, active: false, dirty: false, mounted: false });

  const paint = (t: number, dt: number) => {
    const c = ref.current;
    if (!c) return;
    const ctx = prep(c, w, h);
    if (ctx) drawRef.current(ctx, t, dt);
  };
  const stop = () => { cancelAnimationFrame(run.current.raf); run.current.active = false; };
  const loop = (now: number) => {
    const r = run.current;
    if (!r.start) { r.start = now; r.last = now; }
    const elapsed = now - r.start;
    if (elapsed >= animMs) { paint(999, 0); r.active = false; return; }
    paint(elapsed / 1000, Math.min(0.05, (now - r.last) / 1000));
    r.last = now;
    r.raf = requestAnimationFrame(loop);
  };

  // 状态变化：先同步画一帧（缩略图、后台标签页里画面也完整），需要时再启动有限时长的过渡
  useEffect(() => {
    const r = run.current;
    // 首次挂载不是用户操作，直接画最终状态（页面加载时不播过渡）
    const first = !r.mounted;
    r.mounted = true;
    if (first || !animated || reduced || isDirectInput()) { stop(); paint(999, 0); r.dirty = false; return; }
    if (!r.active) paint(0, 0);
    if (!inView) { r.dirty = true; return; }
    stop();
    r.start = 0;
    r.active = true;
    r.raf = requestAnimationFrame(loop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, w, h, ...deps]);

  // 滚出视口：停在当前帧；回到视口：直接画出当前状态
  useEffect(() => {
    const r = run.current;
    if (!inView) {
      if (r.active) { stop(); r.dirty = true; }
      return;
    }
    if (r.dirty) { paint(999, 0); r.dirty = false; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  useEffect(() => () => stop(), []);
}

/** 指针坐标换算到画布设计坐标：显示尺寸已被舞台缩放，必须按包围盒比例换算。 */
export function toCanvas(e: React.PointerEvent<HTMLCanvasElement>, w: number, h: number) {
  const r = e.currentTarget.getBoundingClientRect();
  return { x: ((e.clientX - r.left) * w) / r.width, y: ((e.clientY - r.top) * h) / r.height };
}

export interface SegOption<T extends string | number> {
  value: T;
  label: string;
}

/** 分段切换：键盘左右键切换；选中项用蓝色（当前状态）。 */
export function Seg<T extends string | number>({ options, value, onChange, label }: {
  options: SegOption<T>[]; value: T; onChange: (v: T) => void; label: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const j = (i + (e.key === 'ArrowRight' ? 1 : options.length - 1)) % options.length;
    onChange(options[j].value);
    refs.current[j]?.focus();
  };
  return (
    <div className="dp-seg" role="radiogroup" aria-label={label}>
      {options.map((o, i) => (
        <button key={String(o.value)} ref={(el) => (refs.current[i] = el)} type="button" role="radio"
          aria-checked={o.value === value} tabIndex={o.value === value ? 0 : -1}
          className={o.value === value ? 'is-on' : ''} onClick={() => onChange(o.value)} onKeyDown={(e) => onKey(e, i)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Btn({ children, onClick, disabled, primary, label }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; primary?: boolean; label?: string;
}) {
  return (
    <button type="button" className={`dp-btn ${primary ? 'is-primary' : ''}`} onClick={onClick} disabled={disabled} aria-label={label}>
      {children}
    </button>
  );
}

/** 滑块：拇指为橙色（用户参数）；数值同时写进 aria-valuetext。 */
export function Slider({ label, value, min, max, step = 1, onChange, display }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; display: string;
}) {
  const p = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <label className="dp-slider">
      <span className="dp-slider-top"><span>{label}</span><b>{display}</b></span>
      <input type="range" min={min} max={max} step={step} value={value} aria-valuetext={display}
        style={{ ['--p' as string]: `${p}%` } as React.CSSProperties}
        onChange={(e) => { markDirectInput(); onChange(Number(e.target.value)); }} />
    </label>
  );
}

export type ContentTag = 'paper' | 'code' | 'extrap' | 'demo';
export const TAG_LABEL: Record<ContentTag, string> = { paper: '论文实测', code: '代码事实', extrap: '公式外推', demo: '教学示意' };
export const TAG_DESC: Record<ContentTag, string> = {
  paper: '直接取自论文正文、表格或图（CVPR 2025 正式版或补充材料）。',
  code: '直接取自官方仓库固定 commit 799e2d9 的代码。',
  extrap: '按论文公式或官方代码计算得到，论文本身没有报告这个数字或配置。',
  demo: '为讲解而生成的示意数据，不是论文或模型的真实数据。',
};

export function Tag({ kind }: { kind: ContentTag }) {
  return <span className={`dp-tag dp-tag-${kind}`} title={TAG_DESC[kind]}>{TAG_LABEL[kind]}</span>;
}

export const CODE_COMMIT = '799e2d950aa01ba7860907f5a6d86061f885dca6';
export const codeUrl = (file: string, anchor = '') => `https://github.com/vbdi/divprune/blob/${CODE_COMMIT}/${file}${anchor}`;
