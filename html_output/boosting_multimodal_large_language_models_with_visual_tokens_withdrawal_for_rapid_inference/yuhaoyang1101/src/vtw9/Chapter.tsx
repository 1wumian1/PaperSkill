import React from 'react';
import { widgetRegistry } from '../modules/registry';
import { tutorial as OLD } from './oldContent';
import { FormulaHtml, Rich, ZoomBox } from './Rich';
import type { V7Chapter, V7Module } from './chapters';

// 一章 = 一张卡片，自上而下：本节问题 → 泡茶情节 → 交互模块 → 洞察 → 公式 → 核对 → 关键数字
// → 要点与误区 → 深入阅读（折叠）→ 继续下一章。版式与尺寸参照 PaperSkill 长滚动模板（DivPrune v9）。

type OldChapter = NonNullable<typeof OLD.chapters>[number] & Record<string, any>;

export function ModuleCard({ m, chapterId }: { m: V7Module; chapterId: string }) {
  const Widget = widgetRegistry[m.componentId];
  return (
    <section className="module" id={`m-${m.id}`}>
      <div className="module-head">
        <span className="num">{m.id}</span>
        <h4>{m.title}</h4>
      </div>
      <div className="module-body">
        <p className="module-desc">{m.desc}</p>
        {m.fluid ? (
          Widget ? <Widget chapterId={chapterId} moduleId={m.id} /> : null
        ) : (
          <ZoomBox width={1472} height={m.h ?? 622}>
            {Widget ? <Widget chapterId={chapterId} moduleId={m.id} /> : null}
          </ZoomBox>
        )}
        {m.notes ? (
          <details className="v9-notes">
            <summary>出处与口径</summary>
            <div className="v9-notes-body">{m.notes}</div>
          </details>
        ) : null}
      </div>
    </section>
  );
}

export function ChapterView({ ch, all, onJump, next }: { ch: V7Chapter; all: V7Chapter[]; onJump: (n: number) => void; next: { label: string; go: () => void } }) {
  const c = (OLD.chapters ?? []).find((x) => x.id === ch.id) as OldChapter;
  const deep = (c.deepDives ?? []) as { title: string; facts?: { value: string; label: string }[]; blocks?: any[] }[];
  const facts = ch.show.facts ? deep.flatMap((d) => d.facts ?? []).slice(0, 3) : [];
  const takeaways = (c.takeaways ?? []).filter((_: any, i: number) => ch.show.takeaways.includes(i));
  const pitfalls = (c.pitfalls ?? []).filter((_: any, i: number) => ch.show.pitfalls.includes(i));
  const hiddenNotes = ch.hideFormulaNotes ? [] : (c.formulas ?? []).filter((f: any, i: number) => !ch.show.formulas.includes(i) && f.note);
  return (
    <section className="chap" id={ch.id} aria-labelledby={`${ch.id}-t`}>
      <h2 className="chap-title" id={`${ch.id}-t`}>
        <span className="num">§{ch.num}.</span>
        {ch.title}
        <span className="badge-tag">{ch.badge}</span>
      </h2>
      <nav className="flow-mini" aria-label="章节进度">
        {all.map((x, i) => (
          <React.Fragment key={x.id}>
            {i > 0 ? <span className="flow-arrow" aria-hidden="true">→</span> : null}
            <button type="button" className={`flow-step ${x.num === ch.num ? 'is-on' : x.num < ch.num ? 'is-done' : ''}`} aria-current={x.num === ch.num ? 'step' : undefined} title={x.title} onClick={() => onJump(x.num)}>
              §{x.num}
            </button>
          </React.Fragment>
        ))}
      </nav>

      <div className="chap-bridge">
        <div className="cb-icon" aria-hidden="true">?</div>
        <div className="cb-body">
          <div className="cb-title">本节问题</div>
          <div className="cb-text v7-intro">
            <Rich text={ch.intro} />
          </div>
        </div>
      </div>

      {ch.analogy ? (
        <div className="analogy-card is-slim">
          <div className="analogy-body">
            <div className="analogy-kicker">泡茶 · 类比</div>
            <div className="analogy-title">{ch.analogy.title}</div>
            <p className="analogy-text">{ch.analogy.story}</p>
            <p className="analogy-bound">
              <b>类比边界</b>　{ch.analogy.boundary}
            </p>
          </div>
        </div>
      ) : null}

      {ch.modules.map((m) => (
        <ModuleCard key={m.id} m={m} chapterId={ch.id} />
      ))}

      {ch.show.insight && c.insight ? (
        <div className="insight-bar">
          <b>洞察</b>　<Rich text={c.insight} />
        </div>
      ) : null}

      {(c.formulas ?? []).filter((_: any, i: number) => ch.show.formulas.includes(i)).map((f: any) => (
        <div className="formula-explain" key={f.label}>
          <p className="fe-hint">
            {f.label}　悬停、聚焦或点按带下划线的符号，查看含义
          </p>
          <div className="fe-formula">
            <FormulaHtml html={f.html} symbols={f.symbols} />
          </div>
          <p className="fe-note">
            <Rich text={f.plain} />
            {f.note ? (
              <>
                <br />
                <Rich text={f.note} />
              </>
            ) : null}
          </p>
        </div>
      ))}

      {hiddenNotes.length ? (
        <div className="v7-derive">
          <b>符号与推导</b>
          {hiddenNotes.map((f: any) => (
            <span key={f.label}>
              {f.label}（公式见上方模块）：<Rich text={f.note} />
            </span>
          ))}
        </div>
      ) : null}

      {ch.check || c.check ? (
        <div className="v9-check">
          <b>核对</b>　<Rich text={ch.check ?? c.check ?? ""} />
        </div>
      ) : null}

      {facts.length ? (
        <div className="v9-facts">
          {facts.map((f) => (
            <div key={f.value + f.label}>
              <b>{f.value}</b>
              <span>
                <Rich text={f.label} />
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {takeaways.length ? (
        <div className="embed-takeaway">
          {takeaways.map((t: { title: string; desc: string }, i: number) => (
            <React.Fragment key={t.title}>
              {i > 0 ? <div className="et-arrow" aria-hidden="true">→</div> : null}
              <div className="et-item">
                <div className="et-icon">{i + 1}</div>
                <div className="et-title">{t.title}</div>
                <div className="et-desc">
                  <Rich text={t.desc} />
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      ) : null}

      {pitfalls.length ? (
        <div className="v9-pits">
          <div className="v9-pits-title">常见误区</div>
          <ul>
            {pitfalls.map((p: string) => (
              <li key={p}>
                <Rich text={p} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {deep.length ? (
        <details className="v9-deep">
          <summary>深入阅读</summary>
          {deep.map((d) => (
            <div key={d.title} className="v9-deep-block">
              <h5>{d.title}</h5>
              {(d.blocks ?? []).map((b, j) =>
                b.type === 'p' ? (
                  <p key={j}>
                    <Rich text={b.text} />
                  </p>
                ) : b.type === 'list' ? (
                  <ul key={j} className="v7-deep-list">
                    {b.items.map((it: string) => (
                      <li key={it}>
                        <Rich text={it} />
                      </li>
                    ))}
                  </ul>
                ) : b.type === 'table' ? (
                  <div key={j} className="v7-table-scroll">
                    <table className="v9-deep-table">
                      <thead>
                        <tr>
                          {b.head.map((h: string, k: number) => (
                            <th key={k}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {b.rows.map((r: string[], k: number) => (
                          <tr key={k}>
                            {r.map((x, q) => (
                              <td key={q}>{x}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {b.caption ? <p className="v7-caption">{b.caption}</p> : null}
                  </div>
                ) : null
              )}
            </div>
          ))}
        </details>
      ) : null}

      <div className="chap-loader">
        <button type="button" className="chap-loader-btn" onClick={next.go}>
          {next.label}
          <span className="chap-loader-arrow" aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}
