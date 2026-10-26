import React from 'react';
import { widgetRegistry } from '../modules/registry';
import { CH, Rich } from '../modules/dp-intro';
import { SCENES } from '../modules/dp-survey';
import type { V9Chapter, V9Module } from './chapters';

// 一章 = 一张卡片，自上而下：本节问题 → 测绘队情节 → 交互模块 → 洞察 → 公式 → 核对 → 关键数字
// → 要点与误区 → 深入阅读（折叠）→ 继续下一章。版式与尺寸参照 PaperSkill 长滚动模板。

/** 讲稿文字里的网址转成链接 */
function Linkify({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s）)]+)/g);
  return <>{parts.map((p, i) => (/^https?:\/\//.test(p) ? <a key={i} href={p} target="_blank" rel="noopener noreferrer">{p.replace(/^https:\/\/github\.com\/vbdi\/divprune\/blob\/[0-9a-f]+\//, '')}</a> : p))}</>;
}

function Scene({ k }: { k: string }) {
  const scene = SCENES[k]();
  return (
    <div className="v9-zoom is-scene">
      <div className="dp-root v9-scene">
        {scene.canvas}
        <div className="v9-scene-ctl">{scene.controls}</div>
      </div>
    </div>
  );
}

function ModuleCard({ m, chapterId }: { m: V9Module; chapterId: string }) {
  const Widget = widgetRegistry[m.componentId];
  return (
    <section className="module" id={`m-${m.id}`}>
      <div className="module-head"><span className="num">{m.id}</span><h4>{m.title}</h4></div>
      <div className="module-body">
        <p className="module-desc">{m.desc}</p>
        <div className="v9-zoom">{Widget ? <Widget chapterId={chapterId} moduleId={m.id} /> : null}</div>
        {m.notes ? (
          <details className="v9-notes">
            <summary>出处与口径</summary>
            <div className="v9-notes-body"><Linkify text={m.notes} /></div>
          </details>
        ) : null}
      </div>
    </section>
  );
}

export function ChapterView({ ch, all, onJump, next }: {
  ch: V9Chapter; all: V9Chapter[]; onJump: (n: number) => void; next: { label: string; go: () => void };
}) {
  const c = CH[ch.key];
  return (
    <section className="chap" id={ch.id} aria-labelledby={`${ch.id}-t`}>
      <h2 className="chap-title" id={`${ch.id}-t`}>
        <span className="num">§{ch.num}.</span>{ch.title}<span className="badge-tag">{ch.badge}</span>
      </h2>
      <nav className="flow-mini" aria-label="章节进度">
        {all.map((x, i) => (
          <React.Fragment key={x.id}>
            {i > 0 ? <span className="flow-arrow" aria-hidden="true">→</span> : null}
            <button type="button" className={`flow-step ${x.num === ch.num ? 'is-on' : x.num < ch.num ? 'is-done' : ''}`}
              aria-current={x.num === ch.num ? 'step' : undefined} title={x.title} onClick={() => onJump(x.num)}>§{x.num}</button>
          </React.Fragment>
        ))}
      </nav>

      <div className="chap-bridge">
        <div className="cb-icon" aria-hidden="true">?</div>
        <div className="cb-body">
          <div className="cb-title">本节问题</div>
          <div className="cb-q">{c.question}</div>
          <div className="cb-text"><Rich text={c.bridge} /></div>
        </div>
      </div>

      {ch.analogyMode === 'scene' ? (
        <div className="analogy-card">
          <div className="analogy-visual"><Scene k={ch.key} /></div>
          <div className="analogy-body">
            <div className="analogy-kicker">测绘队 · 本章情节</div>
            <div className="analogy-title">{ch.analogy}</div>
            <p className="analogy-text">{c.caption}</p>
            <p className="analogy-bound"><b>类比边界</b>　{ch.boundary}</p>
          </div>
        </div>
      ) : (
        // 类比不再单独画一张图：直接画进模块（merged），或只留一句话（brief），避免同一件事讲两遍
        <div className="analogy-card is-slim">
          <div className="analogy-body">
            <div className="analogy-kicker">测绘队 · 本章情节{ch.analogyMode === 'merged' ? `（直接画在 ${ch.mergedInto} 里）` : ''}</div>
            <div className="analogy-title">{ch.analogy}</div>
            <p className="analogy-text">{c.caption}</p>
            <p className="analogy-bound"><b>类比边界</b>　{ch.boundary}</p>
            {ch.analogyMode === 'merged' ? (
              <a className="analogy-jump" href={`#m-${ch.mergedInto}`} onClick={(e) => { e.preventDefault(); document.getElementById(`m-${ch.mergedInto}`)?.scrollIntoView({ block: 'start' }); }}>到 {ch.mergedInto} 动手试 ↓</a>
            ) : null}
          </div>
        </div>
      )}

      {ch.modules.map((m) => <ModuleCard key={m.id} m={m} chapterId={ch.id} />)}

      <div className="insight-bar"><b>洞察</b>　<Rich text={c.insight} /></div>

      {c.formula ? (
        <div className="formula-explain">
          <p className="fe-hint">悬停或点按带下划线的符号，查看含义</p>
          <div className="fe-formula">{c.formula.lines.map((l, i) => <div key={i}>{l}</div>)}</div>
          {c.formula.note ? <p className="fe-note">{c.formula.note}</p> : null}
        </div>
      ) : null}

      {c.check ? <div className="v9-check"><b>核对</b>　<Rich text={c.check} /></div> : null}

      {c.facts ? (
        <div className="v9-facts">
          {c.facts.map((f) => <div key={f.value}><b>{f.value}</b><span>{f.label}</span></div>)}
        </div>
      ) : null}

      {c.extra ? <div className="v9-extra">{c.extra}</div> : null}

      <div className="embed-takeaway">
        {c.takeaways.map(([t, d], i) => (
          <React.Fragment key={t}>
            {i > 0 ? <div className="et-arrow" aria-hidden="true">→</div> : null}
            <div className="et-item"><div className="et-icon">{i + 1}</div><div className="et-title">{t}</div><div className="et-desc">{d}</div></div>
          </React.Fragment>
        ))}
      </div>

      <div className="v9-pits">
        <div className="v9-pits-title">常见误区</div>
        <ul>{c.pitfalls.map((p) => <li key={p}>{p}</li>)}</ul>
      </div>

      {ch.deep.length ? (
        <details className="v9-deep">
          <summary>深入阅读</summary>
          {ch.deep.map((d, i) => (
            <div key={i} className="v9-deep-block">
              {d.split('\n').map((line, j) => {
                if (line.startsWith('【深入】')) return <h5 key={j}>{line.slice(4)}</h5>;
                if (line.startsWith('[表] ')) {
                  try {
                    const rows = JSON.parse(line.slice(4)) as string[][];
                    return <table key={j} className="v9-deep-table"><tbody>{rows.map((r, k) => <tr key={k}>{r.map((x, q) => <td key={q}>{x.replace(/\[\[ev:[^\]]+\]\]/g, '')}</td>)}</tr>)}</tbody></table>;
                  } catch { return null; }
                }
                return <p key={j}>{line}</p>;
              })}
            </div>
          ))}
        </details>
      ) : null}

      <div className="chap-loader">
        <button type="button" className="chap-loader-btn" onClick={next.go}>{next.label}<span className="chap-loader-arrow" aria-hidden="true">→</span></button>
      </div>
    </section>
  );
}
