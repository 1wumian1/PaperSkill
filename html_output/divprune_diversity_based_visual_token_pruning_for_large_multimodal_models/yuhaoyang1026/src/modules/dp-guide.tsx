import React from 'react';
import type { WidgetProps } from './registry';
import { Tag, type ContentTag } from './dp-kit';

// 导读页：原版首页的关键数字（补全了实验条件）、按目的的阅读路线、四种内容口径。
// 播放器的封面只承载英文标题与两种方法的同步动画，所以这些内容放在紧随其后的这一页。

const STATS: { value: string; label: string; tag: ContentTag }[] = [
  { value: '56 / 576', label: '每张图保留的视觉 token（LLaVA 1.5）', tag: 'code' },
  { value: '15.63%', label: 'TFLOP 比例（LLaVA 1.5-7B，Table 1）', tag: 'paper' },
  { value: '0', label: '额外训练与校准步骤：即插即用，只用视觉特征', tag: 'paper' },
  { value: '2.05×', label: '预填充 0.330 → 0.161 s（Table 2，视频 7B）', tag: 'paper' },
];

// 原版十章的三条路线：点卡片跳到路线第一章的开场页。
const ROUTES: { title: string; path: string; slide: string; start: string }[] = [
  { title: '先懂原理', path: '第 2 → 3 → 4 → 5 章', slide: 'ch02-intro', start: '从第 2 章“扎堆”开始' },
  { title: '复现代码与算力', path: '第 6 → 9 章', slide: 'ch06-intro', start: '从第 6 章“论文 ↔ 代码”开始' },
  { title: '检查证据与边界', path: '第 7 → 10 章 → 结论分级', slide: 'ch07-intro', start: '从第 7 章“剪在哪一层”开始' },
];

export const DpGuide: React.FC<WidgetProps> = () => (
  <div className="dp-root dp-guide">
    <div className="dp-guide-stats">
      {STATS.map((s) => (
        <div className="dp-guide-stat dp-glass" key={s.value}>
          <div className="dp-em">{s.value}</div>
          <div className="dp-guide-label">{s.label}</div>
          <Tag kind={s.tag} />
        </div>
      ))}
    </div>
    <div className="dp-guide-side">
      <h3 className="dp-h">按目的选一条路线</h3>
      {ROUTES.map((r) => (
        <a key={r.title} className="dp-guide-route dp-glass" href={`?slide=${r.slide}`}>
          <span><b>{r.title}</b><span className="dp-muted"> · {r.path}</span></span>
          <span className="dp-guide-go">{r.start} →</span>
        </a>
      ))}
    </div>
    <div className="dp-guide-foot">
      <span className="dp-guide-tags">
        <Tag kind="paper" /> <Tag kind="code" /> <Tag kind="extrap" /> <Tag kind="demo" />
      </span>
      <span className="dp-muted">读前须知：理论 FLOPs ≠ 实测速度；贪心不保证全局最优；几何多样性 ≠ 任务精度。</span>
    </div>
  </div>
);
