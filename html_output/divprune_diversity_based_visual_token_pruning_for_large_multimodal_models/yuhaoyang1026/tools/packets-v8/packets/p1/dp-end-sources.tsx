import React from 'react';
import type { WidgetProps } from './registry';
import { Tag, type ContentTag } from './dp-kit';
import { SOURCES } from './dp-closing-data';

// 收束 · 来源与证据边界：四种内容口径、固定 commit 的来源链接、贯穿全片的几条边界。

const TAGS: ContentTag[] = ['paper', 'code', 'extrap', 'demo'];
// 页面上的口径说明用短句（完整定义见各标签的悬停提示）
const SHORT: Record<ContentTag, string> = { paper: '论文正文、表格、图（含补充材料）', code: '官方仓库 commit 799e2d9 的代码', extrap: '按论文公式或代码算出，论文没报告', demo: '讲解用的示意数据' };
const LIMITS = [
  '代码与论文有 3 处差异（候选集 R、保留比例 91.2% vs 0.098、Eq. (5) 的符号），2 处公开代码缺失（层内剪枝、视频模型）。',
  '视频模型 FastV 的 14.20% 按代码口径无法复现（得 14.15% / 14.22%）。',
  '贪心不保证 Eq. (3) 最优；多样性高 ≠ 任务精度高；理论 FLOPs ≠ 实测速度。',
];

export const DpEndSources: React.FC<WidgetProps> = () => (
  <div className="dp-root dp-end-s">
    <div className="dp-glass dp-src-tags">
      {TAGS.map((t) => <div key={t}><Tag kind={t} /><span>{SHORT[t]}</span></div>)}
    </div>
    <div className="dp-src-body">
      <ul className="dp-glass dp-src-links">
        {SOURCES.map((s) => (
          <li key={s.label}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label} ↗</a><span className="dp-muted">{s.note}</span></li>
        ))}
      </ul>
      <div className="dp-fb is-limit dp-src-limits">
        <b>贯穿全片的证据边界</b>
        <ul>{LIMITS.map((x) => <li key={x}>{x}</li>)}</ul>
      </div>
    </div>
  </div>
);
