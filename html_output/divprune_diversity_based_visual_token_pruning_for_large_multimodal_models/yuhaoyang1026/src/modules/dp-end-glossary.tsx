import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { GLOSSARY } from './dp-closing-data';

// 收束 · 术语表（移植自原版 v7）：左侧术语按钮，右侧“直觉 / 在本文中的作用”。

const KEYS = Object.keys(GLOSSARY);
// 按钮上的短名：去掉括注；过长的个别术语给出短写（完整名称在右侧标题）
const SHORT: Record<string, string> = { mmdp: 'Max-Min 多样性' };
const short = (k: string, t: string) => SHORT[k] ?? t.replace(/（[^）]*）/g, '').replace(/ \/ .*/, '');

export const DpEndGlossary: React.FC<WidgetProps> = () => {
  const [k, setK] = useState(KEYS[0]);
  const g = GLOSSARY[k];
  return (
    <div className="dp-root dp-end-g">
      <div className="dp-glass dp-gl-grid" role="group" aria-label="术语">
        {KEYS.map((key) => (
          <button key={key} type="button" className={key === k ? 'is-on' : ''} aria-pressed={key === k} onClick={() => setK(key)}>{short(key, GLOSSARY[key].term)}</button>
        ))}
      </div>
      <div className="dp-glass dp-end-panel">
        {/* 括注拆到第二行，标题只放术语本身 */}
        <div className="dp-h">{g.term.replace(/（[^）]*）/, '')}</div>
        {(g.term.match(/（([^）]*)）/)?.[1] ?? g.en) ? <div className="dp-muted">{[g.term.match(/（([^）]*)）/)?.[1], g.en].filter(Boolean).join(' · ')}</div> : null}
        <div><b>直觉：</b>{g.intuition}</div>
        <div className="dp-fb"><b>在本文中：</b>{g.role}</div>
      </div>
    </div>
  );
};
