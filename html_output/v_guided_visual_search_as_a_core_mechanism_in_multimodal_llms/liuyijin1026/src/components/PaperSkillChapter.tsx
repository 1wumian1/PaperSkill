import { Fragment, type ReactNode } from 'react';

// Copied from E:\vista4d_web\src\modules\TutorialChapters.tsx.
export function FlowMini({ total, current }: { total: number; current: number }) {
  return <div className="flow-mini">
    {Array.from({ length: total }).map((_, index) => {
      const section = index + 1;
      const className = section < current
        ? 'flow-step done'
        : section === current
          ? 'flow-step active'
          : 'flow-step';

      return <Fragment key={section}>
        {index > 0 ? <span className="flow-arrow">→</span> : null}
        <div className={className} data-step={section}>§{section}</div>
      </Fragment>;
    })}
  </div>;
}

export function ChapterBridge({ children }: { children: ReactNode }) {
  return <div className="chap-bridge">
    <div className="cb-icon">🔗</div>
    <div className="cb-body">
      <div className="cb-title">本节作用</div>
      <div className="cb-text">{children}</div>
    </div>
  </div>;
}

export function SectionHeading({ number, eyebrow, title, children, total, id }: { number: number; eyebrow: string; title: string; children: ReactNode; total: number; id: string }) {
  const badge = number <= 2 ? 'inf' : number === 5 ? 'trn' : 'both';
  return <>
    <h2 id={id} tabIndex={-1} className="chap-title">
      <span className="num">§{number}.</span>
      {title}
      <span className={`badge-tag ${badge}`}>{eyebrow}</span>
    </h2>
    <FlowMini total={total} current={number} />
    <ChapterBridge>{children}</ChapterBridge>
  </>;
}
