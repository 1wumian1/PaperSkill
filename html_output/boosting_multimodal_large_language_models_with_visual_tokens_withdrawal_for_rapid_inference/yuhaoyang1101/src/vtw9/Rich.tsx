import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { SymbolGlossary } from '../components/SymbolHint';
import { tutorial as OLD } from './oldContent';

// 长滚动版的轻量富文本与缩放容器。
// [[ev:键]] 证据芯片（链接到原文 / 代码固定行号）、[[t:键|文字]] 术语（悬停 / 聚焦 / 点按看释义）、
// [[tag:demo]] 内容口径、**粗体**、`代码`。

export type ContentTag = 'paper' | 'code' | 'extrap' | 'demo';
export const TAG_INFO: Record<ContentTag, { label: string; desc: string }> = {
  paper: { label: '论文实测', desc: '直接取自论文正文、表格或图（AAAI 正式版；arXiv 附录会单独注明），未经修改。' },
  code: { label: '代码事实', desc: '直接取自官方仓库固定 commit b9cb126 的代码或 README。' },
  extrap: { label: '公式外推', desc: '按论文公式或代码口径计算 / 反推得到，论文本身没有报告这个数字或配置。' },
  demo: { label: '教学示意', desc: '为讲解而绘制的示意数据或小模型，不是论文或真实模型的数据。' },
};

export function Tag({ kind }: { kind: ContentTag }) {
  const info = TAG_INFO[kind];
  if (!info) return null;
  return (
    <span className={`v7-tag is-${kind}`} title={info.desc}>
      {info.label}
    </span>
  );
}

export function EvChip({ id }: { id: string }) {
  const ev = OLD.evidence?.[id];
  if (!ev) return null;
  return (
    <a className={`v7-ev is-${ev.source}`} href={ev.url} target="_blank" rel="noopener noreferrer" title={`${ev.loc}：${ev.content}`}>
      {ev.label}
    </a>
  );
}

function Term({ id, label }: { id: string; label?: string }) {
  const g = OLD.glossary?.[id];
  const text = label ?? g?.term ?? id;
  if (!g) return <>{text}</>;
  const meaning = `${g.term}${g.en ? `（${g.en}）` : ''}：${g.intuition} ${g.role}`;
  return (
    <SymbolGlossary>
      <span className="formula-symbol v7-term" tabIndex={0} role="button" aria-label={meaning} data-formula-symbol="" data-formula-meaning={meaning}>
        {text}
      </span>
    </SymbolGlossary>
  );
}

const RE = /\[\[(ev|t|tag):([^\]|]+)(?:\|([^\]]+))?\]\]|\*\*([^*]+)\*\*|`([^`]+)`/g;

export function Rich({ text }: { text: string }) {
  const out: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(RE.source, 'g');
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] === 'ev') out.push(<EvChip key={key++} id={m[2]} />);
    else if (m[1] === 't') out.push(<Term key={key++} id={m[2]} label={m[3]} />);
    else if (m[1] === 'tag') out.push(<Tag key={key++} kind={m[2] as ContentTag} />);
    else if (m[4])
      out.push(
        <strong key={key++}>
          <Rich text={m[4]} />
        </strong>
      );
    else if (m[5]) out.push(<code key={key++}>{m[5]}</code>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

/** 旧版公式 HTML：<i data-s="键">…</i> 换成可悬停 / 聚焦 / 点按的符号，释义取自符号表。 */
export function FormulaHtml({ html, symbols }: { html: string; symbols: { key: string; desc: string }[] }) {
  const out = useMemo(() => {
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    return html.replace(/<i data-s="([^"]+)">([\s\S]*?)<\/i>/g, (_all, k: string, inner: string) => {
      const d = symbols.find((s) => s.key === k)?.desc ?? '';
      return `<i class="formula-symbol" tabindex="0" role="button" aria-label="${esc(d)}" data-formula-symbol="" data-formula-meaning="${esc(d)}">${inner}</i>`;
    });
  }, [html, symbols]);
  return (
    <SymbolGlossary>
      <span className="v7-fx" dangerouslySetInnerHTML={{ __html: out }} />
    </SymbolGlossary>
  );
}

/**
 * 交互模块按 1472 设计单位书写（28 / 34 / 44 字号）。参照页的做法是整体 zoom 到约 0.62（28 × 0.62 ≈ 17px）；
 * 这里按卡片实际宽度取 min(0.62, 宽 / 设计宽)，不低于 0.5；再窄时在卡片内横向滚动。
 */
export function ZoomBox({ width, height, max = 0.62, min = 0.5, children, className }: { width: number; height: number; max?: number; min?: number; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [z, setZ] = useState(max);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const w = el.clientWidth;
      if (w > 0) setZ(Math.max(min, Math.min(max, w / width)));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, max, min]);
  return (
    <div ref={ref} className={`v7-zoomwrap ${className ?? ''}`}>
      <div className="v7-zoom" style={{ zoom: z, width, height } as React.CSSProperties}>
        {children}
      </div>
    </div>
  );
}
