// VTW 教程共用的绘图与控件工具：一套“泡茶”主题的 SVG 图元 + 统一的控件、反馈与先猜组件。
// 颜色语义遵循 contract.md §5：蓝 = 引导/当前状态，绿 = 论文方法/成功，红 = 旧方法/失败，
// 橙 = 用户可调参数/阈值，紫 = 辅助机制（本教程用于 FastV 等对照方法）。
// token 类型不用状态色区分：视觉 token = 茶叶棕方块；系统 token = 灰；文字 token = 清水色，
// 吸收图像信息后逐渐染上茶色（染色深浅 = 迁移进来的视觉信息，教学示意）。
import React, { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import './vtw.css';

export const C = {
  bg: '#f7f4ec',
  env: '#e8dfcf',
  envDark: '#a08a6a',
  support: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
  leaf: '#8a5a2b',
  tea: '#b98446',
  teaPale: '#efe0c2',
  water: '#e6eff8',
  waterLine: '#8aa3bf',
  sys: '#a3adbf',
  out: '#21324a',
};

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export function mix(c1: string, c2: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = p(c1);
  const b = p(c2);
  return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], clamp(t, 0, 1)))).join(',')})`;
}
/** 文字 token 的颜色：清水 → 茶色，t 为“吸收的视觉信息”（0–1，教学示意） */
export const waterTint = (t: number) => mix(C.water, C.tea, clamp(t, 0, 1));

// 减少动态效果：系统设置或 URL 参数 ?motion=reduce（两者走同一条代码路径）。
// 整页共用一个 MediaQueryList 与一组订阅，组件每次渲染不会重新创建监听。
const FORCE_REDUCE = typeof location !== 'undefined' && new URLSearchParams(location.search).get('motion') === 'reduce';
const RM = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
const rmSubscribe = (cb: () => void) => {
  if (!RM || FORCE_REDUCE) return () => {};
  RM.addEventListener('change', cb);
  return () => RM.removeEventListener('change', cb);
};
const rmSnapshot = () => FORCE_REDUCE || !!RM?.matches;
export function useReducedMotion() {
  return useSyncExternalStore(rmSubscribe, rmSnapshot, () => FORCE_REDUCE);
}

/**
 * 数值过渡：离散切换（点预设、换方法）用约 0.4 s 的 ease-out；
 * 连续拖动（两次目标变化间隔 < 140 ms）直接到位，不在图形后面拖尾。
 * 新目标从当前显示值转向，不排队回放旧目标；减少动态效果、标签页隐藏时直接到终值，
 * rAF 被节流时到点也一定落到终值。
 */
export function useTween(target: number, ms = 420) {
  const reduced = useReducedMotion();
  const [v, setV] = useState(target);
  const cur = useRef(target);
  const lastChange = useRef(0);
  useEffect(() => {
    const now = performance.now();
    const dragging = now - lastChange.current < 140;
    lastChange.current = now;
    if (reduced || ms <= 0 || dragging || document.hidden || !Number.isFinite(target) || cur.current === target) {
      cur.current = target;
      setV(target);
      return;
    }
    const from = cur.current;
    let raf = 0;
    const step = (t: number) => {
      const k = clamp((t - now) / ms, 0, 1);
      cur.current = lerp(from, target, 1 - Math.pow(1 - k, 3));
      setV(cur.current);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    const done = window.setTimeout(() => {
      cancelAnimationFrame(raf);
      cur.current = target;
      setV(target);
    }, ms + 150);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(done);
    };
  }, [target, ms, reduced]);
  return v;
}

/** 元素是否在视口内且标签页可见（用于暂停离屏的帧循环）。 */
export function useLiveVisible<T extends Element>(rootMargin = '80px'): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver((es) => setInView(es.some((e) => e.isIntersecting)), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  useEffect(() => {
    const on = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);
  return [ref, inView && pageVisible];
}

/** 可见时才运行的循环时钟（秒）；用于少量环境动效（水汽），不影响科学状态。离屏或标签页隐藏时不再调度帧。 */
export function useAmbientClock(active = true) {
  const reduced = useReducedMotion();
  const [ref, visible] = useLiveVisible<HTMLDivElement>('0px');
  const [t, setT] = useState(0);
  useEffect(() => {
    if (reduced || !active || !visible) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      setT((x) => x + dt);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reduced, active, visible]);
  return { t, ref };
}

// ------------------------------------------------------------------ SVG 图元（泡茶主题）

interface CupProps {
  x: number;
  y: number;
  /** 杯口宽度 */
  w?: number;
  /** 茶色深浅 0–1 */
  tint: number;
  /** 茶包状态：in 泡在水里，up 已撤出（提起在杯口上方），none 没有茶包 */
  bag?: 'in' | 'up' | 'none';
  /** 茶包画在哪里：0 = 泡在水里，1 = 提到杯口上方。传入时按这个连续进度绘制；不传时按 bag 画终态 */
  lift?: number;
  /** 假茶包（表 1 的白图）：灰色 */
  fake?: boolean;
  steam?: number;
  label?: string;
}

/** 一只带碟子的茶杯；tint 控制茶汤颜色，bag/lift 控制茶包位置。 */
export function TeaCup({ x, y, w = 200, tint, bag = 'none', lift, fake = false, steam = 0, label }: CupProps) {
  const h = w * 0.72;
  const top = y - h;
  const liquidTop = top + h * 0.16;
  const k = bag === 'none' ? 0 : lift !== undefined ? clamp(lift, 0, 1) : bag === 'up' ? 1 : 0;
  const bagY = lerp(liquidTop + h * 0.22, top - h * 0.42, k);
  const bagX = x + w * 0.08;
  const liquid = fake ? mix('#e9ecef', '#9aa1a9', tint) : mix(C.water, C.tea, tint);
  const path = `M${x - w / 2} ${top} L${x + w / 2} ${top} Q${x + w * 0.46} ${y - h * 0.08} ${x + w * 0.22} ${y} L${x - w * 0.22} ${y} Q${x - w * 0.46} ${y - h * 0.08} ${x - w / 2} ${top} Z`;
  const liquidPath = `M${x - w * 0.47} ${liquidTop} L${x + w * 0.47} ${liquidTop} Q${x + w * 0.44} ${y - h * 0.1} ${x + w * 0.21} ${y - 6} L${x - w * 0.21} ${y - 6} Q${x - w * 0.44} ${y - h * 0.1} ${x - w * 0.47} ${liquidTop} Z`;
  return (
    <g aria-hidden="true">
      <ellipse cx={x} cy={y + 8} rx={w * 0.62} ry={w * 0.08} fill={C.env} stroke={C.envDark} strokeWidth={2} />
      <path d={`M${x + w * 0.44} ${top + h * 0.2} q${w * 0.26} ${h * 0.05} ${w * 0.16} ${h * 0.38} q-${w * 0.05} ${h * 0.14} -${w * 0.24} ${h * 0.16}`} fill="none" stroke={C.support} strokeWidth={w * 0.05} strokeLinecap="round" />
      <path d={path} fill="#fffdf8" stroke={C.support} strokeWidth={3} />
      <path d={liquidPath} fill={liquid} />
      {steam > 0 &&
        [0, 1, 2].map((i) => (
          <path
            key={i}
            d={`M${x - w * 0.18 + i * w * 0.18} ${top - 8} q ${w * 0.05} -${h * 0.18} 0 -${h * 0.34} q -${w * 0.05} -${h * 0.16} 0 -${h * 0.3}`}
            fill="none"
            stroke={C.envDark}
            strokeWidth={3}
            strokeLinecap="round"
            opacity={0.25 + 0.2 * Math.sin(steam * 2 + i)}
          />
        ))}
      {bag !== 'none' && (
        <g>
          <line x1={bagX + w * 0.04} y1={bagY} x2={x + w * 0.42} y2={top - h * 0.34} stroke={C.envDark} strokeWidth={2} />
          <rect x={x + w * 0.36} y={top - h * 0.5} width={w * 0.16} height={h * 0.17} rx={4} fill={fake ? '#d9dde2' : '#f4e3c1'} stroke={C.support} strokeWidth={2} />
          <rect x={bagX - w * 0.09} y={bagY} width={w * 0.2} height={w * 0.24} rx={6} fill={fake ? '#c9ced5' : C.leaf} stroke={fake ? '#8a9099' : '#5e3b18'} strokeWidth={2} />
          {!fake && [0, 1, 2].map((i) => <circle key={i} cx={bagX - w * 0.04 + i * w * 0.05} cy={bagY + w * 0.12 + (i % 2) * w * 0.05} r={w * 0.017} fill="#5e3b18" />)}
          {k > 0.6 && (
            <circle cx={bagX + w * 0.01} cy={bagY + w * 0.3} r={w * 0.02} fill={fake ? '#9aa1a9' : C.tea} opacity={0.8} />
          )}
        </g>
      )}
      {label && (
        <text x={x} y={y + w * 0.24} textAnchor="middle" className="vtw-svg-t">
          {label}
        </text>
      )}
    </g>
  );
}

/** 一枚 token 方块。kind 决定外观；tint 只对文字 token 生效。 */
export function TokenRect({ x, y, s, kind, tint = 0, faded = false, struck = false }: { x: number; y: number; s: number; kind: 'sys' | 'vis' | 'ins' | 'out'; tint?: number; faded?: boolean; struck?: boolean }) {
  const fill = kind === 'vis' ? C.leaf : kind === 'sys' ? C.sys : kind === 'out' ? C.out : waterTint(tint);
  const stroke = kind === 'ins' ? C.waterLine : 'none';
  return (
    <g opacity={faded ? 0.18 : 1}>
      <rect x={x} y={y} width={s} height={s} rx={s * 0.18} fill={fill} stroke={stroke} strokeWidth={kind === 'ins' ? 2 : 0} />
      {struck && <path d={`M${x + 3} ${y + 3} L${x + s - 3} ${y + s - 3} M${x + s - 3} ${y + 3} L${x + 3} ${y + s - 3}`} stroke={C.red} strokeWidth={3} />}
    </g>
  );
}

/** 图例（28px）：一行若干项 */
export function Legend({ items }: { items: { kind: 'sys' | 'vis' | 'ins' | 'out' | 'tinted'; label: string }[] }) {
  return (
    <div className="vtw-legend">
      {items.map((it) => (
        <span key={it.label}>
          <i
            className="vtw-legend-sw"
            style={{
              background: it.kind === 'vis' ? C.leaf : it.kind === 'sys' ? C.sys : it.kind === 'out' ? C.out : it.kind === 'tinted' ? waterTint(0.75) : C.water,
              borderColor: it.kind === 'ins' || it.kind === 'tinted' ? C.waterLine : 'transparent',
            }}
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ DOM 控件

/**
 * 分段切换：选中指示器在选项之间平移（换行时一起定位），文字颜色同步过渡；
 * 方向键 / Home / End 切换，Tab 只停在当前项（roving tabindex）。
 */
export function Seg<T extends string>({ label, value, options, onChange, tone = 'blue' }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; tone?: 'blue' | 'orange' }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const update = () => {
      const b = btns.current[idx];
      if (b) setBox({ x: b.offsetLeft, y: b.offsetTop, w: b.offsetWidth, h: b.offsetHeight });
    };
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    ro.observe(row);
    return () => ro.disconnect();
  }, [idx, options.length]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const n = options.length;
    let j = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % n;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + n) % n;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = n - 1;
    if (j < 0) return;
    e.preventDefault();
    onChange(options[j].value);
    btns.current[j]?.focus();
  };
  return (
    <div className={`vtw-seg is-${tone}`} role="radiogroup" aria-label={label} ref={rowRef}>
      {box && <span className="vtw-seg-ind" aria-hidden="true" style={{ transform: `translate(${box.x}px, ${box.y}px)`, width: box.w, height: box.h }} />}
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={i === idx}
          tabIndex={i === idx ? 0 : -1}
          ref={(el) => {
            btns.current[i] = el;
          }}
          onClick={() => onChange(o.value)}
          onKeyDown={(e) => onKey(e, i)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Range({ label, value, min, max, step = 1, onChange, display, tone = 'orange' }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; display?: React.ReactNode; tone?: 'orange' | 'blue' }) {
  const p = ((value - min) / (max - min)) * 100;
  return (
    <label className={`vtw-range is-${tone}`}>
      <span className="vtw-range-top">
        <span>{label}</span>
        <b>{display ?? value}</b>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} style={{ ['--p' as string]: `${p}%` } as React.CSSProperties} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export function Feedback({ tone = 'info', children }: { tone?: 'info' | 'ok' | 'warn' | 'bad'; children: React.ReactNode }) {
  return (
    <div className={`vtw-fb is-${tone}`} role="status" aria-live="polite">
      <span className="vtw-fb-in" key={typeof children === 'string' ? children : undefined}>
        {children}
      </span>
    </div>
  );
}

/** 先猜：题干 + 选项按钮；作答后显示对错与解释，可下一题 / 重新开始。 */
export interface GuessItem<T extends string> {
  q: string;
  options: { value: T; label: string }[];
  answer: T;
  explain: string;
}
export function useGuess<T extends string>(items: GuessItem<T>[]) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<T | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const cur = items[Math.min(i, items.length - 1)];
  const pick = (v: T) => {
    if (picked !== null) return;
    setPicked(v);
    setAnswered((n) => n + 1);
    if (v === cur.answer) setScore((s) => s + 1);
  };
  const next = () => {
    if (i < items.length - 1) {
      setI(i + 1);
      setPicked(null);
    }
  };
  const restart = () => {
    setI(0);
    setPicked(null);
    setScore(0);
    setAnswered(0);
  };
  return { i, cur, picked, pick, next, restart, score, answered, total: items.length, done: answered === items.length && picked !== null };
}
export function GuessCard<T extends string>({ g }: { g: ReturnType<typeof useGuess<T>> }) {
  const right = g.picked !== null && g.picked === g.cur.answer;
  const ans = g.cur.options.find((o) => o.value === g.cur.answer)?.label;
  return (
    <div className="vtw-guess">
      <p className="vtw-guess-q">
        <span className="vtw-guess-k">先猜 {g.i + 1}/{g.total}</span>
        {g.cur.q}
      </p>
      {g.picked === null ? (
        <div className="vtw-guess-opts" role="group" aria-label="选择答案">
          {g.cur.options.map((o) => (
            <button key={o.value} type="button" onClick={() => g.pick(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      ) : (
        <Feedback tone={right ? 'ok' : 'warn'}>
          <b>{right ? '猜对了。' : `答案是“${ans}”。`}</b>
          {g.cur.explain}
        </Feedback>
      )}
      <div className="vtw-guess-bar">
        <span>
          已答 {g.answered}/{g.total} · 猜对 {g.score}
        </span>
        {g.picked !== null && g.i < g.total - 1 && (
          <button type="button" className="vtw-btn is-primary" onClick={g.next}>
            下一题
          </button>
        )}
        {g.answered > 0 && (
          <button type="button" className="vtw-btn" onClick={g.restart}>
            重新挑战
          </button>
        )}
      </div>
    </div>
  );
}

export function Btn({ children, onClick, primary = false, disabled = false, pressed }: { children: React.ReactNode; onClick: () => void; primary?: boolean; disabled?: boolean; pressed?: boolean }) {
  return (
    <button type="button" className={`vtw-btn ${primary ? 'is-primary' : ''}`} disabled={disabled} aria-pressed={pressed} onClick={onClick}>
      {children}
    </button>
  );
}

/** 百分数格式 */
export const pct = (v: number, d = 1) => `${v.toFixed(d)}%`;
