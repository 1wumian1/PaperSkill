import type { ReactNode } from 'react';

/** Inspatio's framed teaching shell; the child retains its own state and events. */
export function Module({ number, title, note, className = '', children }: {
  number: string;
  title: string;
  note?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return <div className={`interactive-panel ${className}`}>
    <header className="interactive-head">
      <span className="module-number">{number}</span>
      <h3>{title}</h3>
      {note}
    </header>
    <div className="module-body">{children}</div>
  </div>;
}
