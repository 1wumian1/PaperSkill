import React, { useEffect, useRef, useState } from 'react';
import { tutorial } from '../data/tutorial';
import { CoverPlaybackContext } from '../components/CoverPlayback';
import { widgetRegistry } from '../modules/registry';
import { useReducedMotion } from '../modules/vtw-kit';
import { tutorial as OLD } from './oldContent';
import { Rich, Tag, ZoomBox, type ContentTag } from './Rich';
import { ModuleCard } from './Chapter';
import { ROUTES, VERDICT_MODULE } from './chapters';

// 封面与收束。封面两侧动画共用一个时钟：封面在视口内时播放一次（约 6 秒）后停在结果上，
// 滚出视口暂停、回来继续；“重播”从头再放；减少动态效果时直接显示结果。
const COVER_MS = 6000;

function useCoverClock(ref: React.RefObject<HTMLElement>) {
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(1); // 先停在结果：不跑动画帧的环境（缩略图、后台标签页）直接显示结论
  const [playing, setPlaying] = useState(false);
  const [run, setRun] = useState(0);
  const pending = useRef(true);
  const cur = useRef(1);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((es) => setInView(es.some((e) => e.isIntersecting)));
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  useEffect(() => {
    if (reduced) {
      cur.current = 1;
      setProgress(1);
      setPlaying(false);
      return;
    }
    if (!inView || (!pending.current && cur.current >= 1)) return;
    let raf = 0;
    let last = 0;
    let warm = 0;
    const loop = (now: number) => {
      if (pending.current) {
        // 连续两帧间隔不到 100ms，才算真的在播放，这时才从头开始
        if (!(warm && now - warm < 100)) {
          warm = now;
          raf = requestAnimationFrame(loop);
          return;
        }
        pending.current = false;
        cur.current = 0;
        setPlaying(true);
      }
      const dt = last ? Math.min(50, now - last) : 0;
      last = now;
      cur.current = Math.min(1, cur.current + dt / COVER_MS);
      setProgress(cur.current);
      if (cur.current >= 1) {
        setPlaying(false);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced, run]);
  const replay = () => {
    pending.current = true;
    setRun((n) => n + 1);
  };
  return { progress, playing, replay, reduced };
}

const STATS: { value: string; label: string; tag: ContentTag }[] = [
  { value: '55.19%', label: 'LLaVA-1.5-7B 的 TFLOPs（K = 16，表 2）', tag: 'paper' },
  { value: '0.63×', label: '每样本延迟（NeXT-7B，SQA，单张 3090，表 4）', tag: 'paper' },
  { value: '0.65×', label: '单样本显存（同上，表 4）', tag: 'paper' },
  { value: '20 / 0.003', label: '选 K 的样本数 / 阈值 η（正文设置）', tag: 'paper' },
];

export function Hero({ onStart, onRoute }: { onStart: () => void; onRoute: (n: number) => void }) {
  const { meta, hero } = tutorial;
  const duel = useRef<HTMLDivElement>(null);
  const clock = useCoverClock(duel);
  const Cover = widgetRegistry[hero.oldMethod.componentId];
  return (
    <section className="hero" id="top">
      <span className="hero-badge">INTERACTIVE TUTORIAL</span>
      <h1>{meta.titleEn}</h1>
      <p className="hero-sub">{meta.titleZh} · AAAI 2025</p>
      <p className="hero-authors">
        {meta.authors} · {meta.affiliation}
      </p>
      <p className="hero-abstract">
        一张图在 LLaVA-1.5 里是 576 个视觉 token，几乎占满整段输入，却要在每一层参与计算。VTW 发现视觉信息在浅层已经迁移进文字 token：前 K 层完整处理图文，在第 K+1 层入口把视觉 token 全部撤走；无需训练，用 20 个样本的 KL 校准选出 K。
      </p>
      <div className="hero-chips">
        {['视觉 token 撤出', '信息迁移', 'KL 校准选层', '兼容 KV Cache', 'TFLOPs'].map((k) => (
          <span key={k}>{k}</span>
        ))}
      </div>
      <CoverPlaybackContext.Provider value={{ progress: clock.progress, playing: clock.playing }}>
        <div className="hero-duel" ref={duel}>
          {(['oldMethod', 'newMethod'] as const).map((side) => (
            <div key={side} className={`hero-panel ${side === 'oldMethod' ? 'is-old' : 'is-new'}`}>
              <div className="hero-panel-head">{hero[side].title}</div>
              <ZoomBox width={664} height={380} max={0.7} min={0.45} className="is-cover">
                {Cover ? <Cover chapterId="cover" moduleId={side} /> : null}
              </ZoomBox>
              <p>{hero[side].desc}</p>
            </div>
          ))}
        </div>
      </CoverPlaybackContext.Provider>
      <p className="hero-note">
        教学示意：同一杯茶、同一把刻度，左边 32 层都带着茶包（视觉 token），右边第 17 层入口拿出茶包；竖条高度按 Eq. (1) 外推。
        {!clock.playing && !clock.reduced ? (
          <button type="button" className="hero-replay" onClick={clock.replay}>
            重播
          </button>
        ) : null}
      </p>
      <div className="hero-stats">
        {STATS.map((s) => (
          <div key={s.value}>
            <b>{s.value}</b>
            <span>{s.label}</span>
            <Tag kind={s.tag} />
          </div>
        ))}
      </div>
      <div className="hero-routes">
        <span className="hero-routes-k">按目的选一条路线</span>
        {ROUTES.map((r) => (
          <button key={r.title} type="button" onClick={() => onRoute(r.to)}>
            <b>{r.title}</b>
            <span>{r.path}</span>
          </button>
        ))}
      </div>
      <p className="hero-warn">读前须知：理论 FLOPs ≠ 实测速度；第一个词的 KL 校准 ≠ 整段回答都安全；单次运行的小差值无法判断是否超出评测波动。</p>
      <div className="hero-cta">
        准备好了吗？
        <button type="button" className="chap-loader-btn" onClick={onStart}>
          开始学习 §1<span className="chap-loader-arrow" aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}

const LEVEL_TONE: Record<string, string> = { proven: 'is-ok', explained: 'is-warn', unknown: 'is-unknown' };

export function Closing() {
  const verdict = OLD.verdict ?? [];
  const glossary = Object.entries(OLD.glossary ?? {});
  const sources = OLD.sources ?? [];
  const retell = OLD.retell ?? [];
  return (
    <>
      <section className="chap" id="closing" aria-labelledby="closing-t">
        <h2 className="chap-title" id="closing-t">
          <span className="num">✦</span>收束：结论分级<span className="badge-tag">总结</span>
        </h2>
        <div className="chap-bridge">
          <div className="cb-icon" aria-hidden="true">?</div>
          <div className="cb-body">
            <div className="cb-title">本节问题</div>
            <div className="cb-q">读完这一篇，哪些结论站得住？</div>
            <div className="cb-text">把每条说法放进“已证明 / 有解释但未证实 / 仍然未知”，揭晓依据；全部分级列在下方。</div>
          </div>
        </div>
        <ModuleCard m={VERDICT_MODULE} chapterId="closing" />
        <div className="v7-verdict">
          {verdict.map((v: any) => (
            <div key={v.level} className={`v7-verdict-col ${LEVEL_TONE[v.level] ?? ''}`}>
              <h3>{v.title}</h3>
              <p className="v7-muted">{v.desc}</p>
              <ul>
                {v.items.map((it: any) => (
                  <li key={it.claim}>
                    <b>
                      <Rich text={it.claim} />
                    </b>
                    <span>
                      <Rich text={it.basis} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <details className="v9-deep">
          <summary>复述练习：用自己的话讲一遍（5 问）</summary>
          {retell.map((r: any, i: number) => (
            <details key={r.q} className="v7-retell">
              <summary>
                {i + 1}. {r.q}
              </summary>
              <p>
                <Rich text={r.a} />
              </p>
            </details>
          ))}
        </details>
      </section>

      <section className="chap" id="glossary" aria-labelledby="glossary-t">
        <h2 className="chap-title" id="glossary-t">
          <span className="num">✦</span>术语表<span className="badge-tag">{glossary.length} 条</span>
        </h2>
        <dl className="v7-gloss">
          {glossary.map(([k, g]: [string, any]) => (
            <div key={k} id={`g-${k}`}>
              <dt>
                {g.term}
                {g.en ? <span>{g.en}</span> : null}
              </dt>
              <dd>
                {g.intuition}
                <br />
                <span className="v7-muted">{g.role}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="chap" id="sources" aria-labelledby="sources-t">
        <h2 className="chap-title" id="sources-t">
          <span className="num">✦</span>来源与证据边界<span className="badge-tag">溯源</span>
        </h2>
        <ul className="v7-sources">
          {sources.map((s: any) => (
            <li key={s.label}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.label}
              </a>
              <span>{s.note}</span>
            </li>
          ))}
        </ul>
        <div className="v9-check">
          <b>内容口径</b>　页面用四种标记区分来源：<Tag kind="paper" /> <Tag kind="code" /> <Tag kind="extrap" /> <Tag kind="demo" />（悬停可看说明）。论文为单次运行，没有逐题结果和置信区间，小差值一律只报差值；Eq. (5) 与代码的层号差一层，正文统一按代码口径：前 K 层完整处理图文，在第 K+1 层入口撤走视觉 token。
        </div>
      </section>
    </>
  );
}
