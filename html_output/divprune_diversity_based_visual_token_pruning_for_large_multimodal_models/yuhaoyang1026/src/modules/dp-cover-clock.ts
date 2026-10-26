import { createContext, useContext } from 'react';

// 封面两侧共用的时钟：进度存在普通对象里，由封面的一个 rAF 循环推进，订阅者直接重绘画布。
// 不经过 React 状态，所以播放时不会每帧重新渲染组件。

export interface CoverClock {
  get(): number;
  set(p: number): void;
  subscribe(fn: (p: number) => void): () => void;
}

export function createCoverClock(initial = 0): CoverClock {
  let progress = initial;
  const subs = new Set<(p: number) => void>();
  return {
    get: () => progress,
    set: (p) => { progress = Math.max(0, Math.min(1, p)); subs.forEach((fn) => fn(progress)); },
    subscribe: (fn) => { subs.add(fn); fn(progress); return () => { subs.delete(fn); }; },
  };
}

export const CoverClockContext = createContext<CoverClock>(createCoverClock(1));
export const useCoverClock = () => useContext(CoverClockContext);
