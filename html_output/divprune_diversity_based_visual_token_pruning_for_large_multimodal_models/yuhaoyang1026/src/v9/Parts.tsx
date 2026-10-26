import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { tutorial } from '../data/tutorial';
import { CoverClockContext, createCoverClock } from '../modules/dp-cover-clock';
import { useBiliVideos, type BiliCard } from '../lib/useBiliVideos';
import { DpCover } from '../modules/dp-cover';
import { DpEndVerdict } from '../modules/dp-end-verdict';
import { DpEndGlossary } from '../modules/dp-end-glossary';
import { DpEndSources } from '../modules/dp-end-sources';
import { Tag, useInView, useReducedMotion } from '../modules/dp-kit';
import { ROUTES, STATS, VIDEOS } from './chapters';

// 封面、收束三节与 B 站推荐。封面两侧动画共用一个时钟：封面在视口内时播放一次（约 6 秒）后停在结果上，
// 滚出视口暂停、回来从暂停处继续；“重播”从头再放。减少动态效果时直接显示结果。

const COVER_MS = 6000;

export function Hero({ onStart, onRoute }: { onStart: () => void; onRoute: (n: number) => void }) {
  const { meta, hero } = tutorial;
  const reduced = useReducedMotion();
  // 时钟从“结果”开始：不跑动画帧的环境（缩略图、后台标签页）直接显示结论；第一次真正拿到动画帧时才从头播放
  const clock = useMemo(() => createCoverClock(1), []);
  const pending = useRef(true);
  const duelRef = useRef<HTMLDivElement>(null);
  const inView = useInView(duelRef, '0px');
  const [runId, setRunId] = useState(0);
  const [done, setDone] = useState(true);
  useEffect(() => {
    if (reduced) { clock.set(1); setDone(true); return; }
    if (!inView || (!pending.current && clock.get() >= 1)) return;
    let raf = 0, last = 0, warm = 0;
    const loop = (now: number) => {
      // 连续两帧间隔不到 100ms，才算真的在播放（后台标签页、截图环境可能只给一帧），这时才从头开始
      if (pending.current) {
        if (!(warm && now - warm < 100)) { warm = now; raf = requestAnimationFrame(loop); return; }
        pending.current = false; clock.set(0); setDone(false);
      }
      const dt = last ? Math.min(50, now - last) : 0;
      last = now;
      clock.set(clock.get() + dt / COVER_MS);
      if (clock.get() >= 1) { setDone(true); return; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [clock, inView, reduced, runId]);
  const replay = () => { pending.current = true; setDone(false); setRunId((n) => n + 1); };
  return (
    <section className="hero" id="top">
      <span className="hero-badge">INTERACTIVE TUTORIAL</span>
      <h1>{meta.titleEn}</h1>
      <p className="hero-sub">{meta.titleZh} · {meta.venue.split(' · ')[0]}</p>
      <p className="hero-authors">{meta.authors} · {meta.affiliation}</p>
      <p className="hero-abstract">{meta.coreProblem}{meta.coreInsight}</p>
      <div className="hero-chips">{meta.keywords.map((k) => <span key={k}>{k}</span>)}</div>

      <CoverClockContext.Provider value={clock}>
        <div className="hero-duel" ref={duelRef}>
          {(['oldMethod', 'newMethod'] as const).map((side) => (
            <div key={side} className={`hero-panel ${side === 'oldMethod' ? 'is-old' : 'is-new'}`}>
              <div className="hero-panel-head">{hero[side].title}</div>
              <div className="v9-zoom is-cover"><DpCover chapterId="cover" moduleId={side} /></div>
              <p>{hero[side].desc}</p>
            </div>
          ))}
        </div>
      </CoverClockContext.Provider>
      <p className="hero-note">教学示意：同一片点云、同样 16 个名额，左边按“重要性”挑，右边按 Max-Min 挑。
        {done && !reduced ? <button type="button" className="hero-replay" onClick={replay}>重播</button> : null}
      </p>

      <div className="hero-stats">
        {STATS.map((s) => <div key={s.value}><b>{s.value}</b><span>{s.label}</span><Tag kind={s.tag} /></div>)}
      </div>

      <div className="hero-routes">
        <span className="hero-routes-k">按目的选一条路线</span>
        {ROUTES.map((r) => (
          <button key={r.title} type="button" onClick={() => onRoute(r.to)}><b>{r.title}</b><span>{r.path}</span></button>
        ))}
      </div>
      <p className="hero-warn">读前须知：理论 FLOPs ≠ 实测速度；贪心不保证全局最优；几何多样性 ≠ 任务精度。</p>

      <div className="hero-cta">
        <span>准备好了吗？</span>
        <button type="button" className="chap-loader-btn" onClick={onStart}>开始学习 §1<span className="chap-loader-arrow" aria-hidden="true">→</span></button>
      </div>
    </section>
  );
}

export function Closing() {
  return (
    <section className="chap v9-closing" id="closing" aria-labelledby="closing-t">
      <h2 className="chap-title" id="closing-t"><span className="num">✦</span>收束<span className="badge-tag">证据分级</span></h2>
      <div className="module" id="verdict">
        <div className="module-head"><span className="num">A</span><h4>结论分级：已证明 / 有解释但未证实 / 仍然未知</h4></div>
        <div className="module-body"><div className="v9-zoom"><DpEndVerdict chapterId="closing" moduleId="verdict" /></div></div>
      </div>
      <div className="module" id="glossary">
        <div className="module-head"><span className="num">B</span><h4>术语表</h4></div>
        <div className="module-body"><div className="v9-zoom"><DpEndGlossary chapterId="closing" moduleId="glossary" /></div></div>
      </div>
      <div className="module" id="sources">
        <div className="module-head"><span className="num">C</span><h4>来源与证据边界</h4></div>
        <div className="module-body"><div className="v9-zoom"><DpEndSources chapterId="closing" moduleId="sources" /></div></div>
      </div>
    </section>
  );
}

/** 与模板 BiliVideos 同一套卡片结构；标题、UP 主、时长用核对过的静态数据，封面与播放量运行时补充（拿不到时显示渐变底）。 */
export function Videos() {
  const [data, setData] = useState<Record<string, BiliCard | null>>({});
  const [bad, setBad] = useState<Record<string, boolean>>({});
  const onLoad = useCallback((bvid: string, d: BiliCard | null) => setData((p) => ({ ...p, [bvid]: d })), []);
  useBiliVideos(VIDEOS.map((v) => v.bvid), onLoad);
  return (
    <section className="dl-related-section" id="videos" aria-labelledby="videos-t">
      <h3 id="videos-t">延伸学习 · B 站讲解视频</h3>
      <p>推荐几个相关的视频讲解，帮助加深理解。每张卡片下写了它对应本教程的哪一部分。</p>
      <div className="dl-video-strip">
        {VIDEOS.map((v) => {
          const d = data[v.bvid];
          const cover = !bad[v.bvid] ? ('cover' in v ? v.cover : d?.cover) ?? '' : '';
          return (
            <a key={v.bvid} className="dl-video-card" href={`https://www.bilibili.com/video/${v.bvid}`} target="_blank" rel="noopener noreferrer" data-bvid={v.bvid}>
              <div className={`dl-video-link-cover ${cover ? 'is-loaded' : ''}`}>
                {cover ? <img className="dl-video-cover-img" src={cover} alt="" referrerPolicy="no-referrer" loading="lazy" onError={() => setBad((p) => ({ ...p, [v.bvid]: true }))} /> : null}
                <div className="dl-video-play" aria-hidden="true">▶</div>
                <span className="dl-video-link-tag">B 站</span>
                <span className="dl-video-duration">{d?.duration ?? v.len}</span>
              </div>
              <strong>{v.title}</strong>
              <div className="dl-video-meta"><span>{v.up}</span>{d?.views ? <span className="views">{d.views}</span> : null}</div>
              <div className="dl-video-why">{v.why}</div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
