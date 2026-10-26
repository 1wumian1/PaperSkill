import type { TutorialData } from '../types';

// Compatibility data for the existing six-chapter page. App.tsx remains the renderer.
export const paperLinks = {
  arxiv: 'https://arxiv.org/abs/2312.14135',
} as const;

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'V*: Guided Visual Search as a Core Mechanism in Multimodal LLMs',
    titleZh: 'V*：以引导式视觉搜索作为多模态大语言模型的核心机制',
    venue: 'CVPR 2024',
    authors: 'Penghao Wu, Saining Xie',
    affiliation: '',
    domain: '多模态大语言模型 · 高分辨率视觉问答',
    coreProblem: '高分辨率、视觉拥挤的场景中，固定全局视觉输入或缩放可能丢失关键小目标，使模型缺乏回答所需的视觉证据。',
    coreInsight: '当前视觉证据不足时，主动搜索缺失目标，再把新证据加入视觉工作记忆后重新回答。',
    keywords: ['Guided Visual Search', 'Visual Working Memory', 'V*Bench'],
  },
  hero: {
    oldMethod: {
      title: 'Passive MLLM',
      desc: '固定全局视觉输入可能让关键小目标的细节消失。',
      componentId: 'vstar-hero',
    },
    newMethod: {
      title: 'V*',
      desc: '证据不足时主动搜索，再根据新发现的细节回答。',
      componentId: 'vstar-hero',
    },
  },
  chapters: [
    {
      kind: 'chapter', id: 'detail', title: '为什么“看过”不等于“看清”？',
      modules: [{ kind: 'module', id: '1.1', title: 'Passive MLLM vs V*', desc: '比较固定全局输入和主动寻找小目标的观察过程。', componentId: 'vstar-passive-active' }],
      scenes: [{ id: 'detail-lab', title: '全局看过，细节却不够', goal: '理解关键小目标为何会在全局缩放中丢失。', summary: '视觉证据不足并不等于推理能力不足。', interaction: '推进左右对照实验，观察两种模型的证据变化。', next: '判断何时需要启动搜索。', notes: '对应页面第 1 章和 PassiveVsActiveLab；正文与交互仍由现有 App.tsx 呈现。', componentId: 'vstar-passive-active', moduleId: '1.1' }],
    },
    {
      kind: 'chapter', id: 'choice', title: '什么时候应该主动寻找？',
      modules: [{ kind: 'module', id: '2.1', title: '什么时候启动 Search？', desc: '判断当前视觉证据是否足够，再决定是否搜索。', componentId: 'vstar-s2-decision' }],
      scenes: [{ id: 'choice-experiment', title: '搜索的触发条件', goal: '区分可以直接回答与需要补充视觉证据的情形。', summary: '搜索只在证据不足时触发。', interaction: '在现有决策实验中观察回答和 Search 分支。', next: '看 V* 如何选定优先搜索区域。', notes: '对应页面第 2 章和 S2DecisionExperiment。', componentId: 'vstar-s2-decision', moduleId: '2.1' }],
    },
    {
      kind: 'chapter', id: 'search', title: 'V* 怎样决定先看哪里？',
      modules: [{ kind: 'module', id: '3.1', title: 'V* 怎样决定先看哪里', desc: '利用目标与上下文线索安排搜索优先级。', componentId: 'vstar-s3-search' }],
      scenes: [{ id: 'search-experiment', title: '线索引导的优先搜索', goal: '理解目标线索、上下文线索与候选区域排序。', summary: '先查看最可能包含目标的区域。', interaction: '操作现有搜索实验，观察线索、热图及局部证据。', next: '把找到的证据放回回答过程。', notes: '对应页面第 3 章和 S3SearchExperiment。', componentId: 'vstar-s3-search', moduleId: '3.1' }],
    },
    {
      kind: 'chapter', id: 'memory', title: '找到以后，怎样重新回答？',
      modules: [{ kind: 'module', id: '4.1', title: 'Visual Working Memory', desc: '组织问题、全图、局部目标与位置后重新回答。', componentId: 'vstar-s4-memory' }],
      scenes: [{ id: 'memory-workbench', title: '把新证据放入视觉工作记忆', goal: '理解局部细节如何和全局上下文共同参与回答。', summary: 'VWM 保留问题、全图、目标和位置。', interaction: '操作现有 VWM 工作台，观察证据组合。', next: '检查实验是否支持这套机制。', notes: '对应页面第 4 章和 S4MemoryWorkbench。', componentId: 'vstar-s4-memory', moduleId: '4.1' }],
    },
    {
      kind: 'chapter', id: 'experiments', title: '怎样证明这种搜索真的有价值？',
      modules: [{ kind: 'module', id: 'evidence-journey', title: 'V*Bench 与实验结果', desc: '阅读任务设计、主结果与消融证据。', componentId: 'vstar-s5-evidence' }],
      scenes: [{ id: 'evidence-journey', title: '从任务到消融的证据链', goal: '判断实验支持了哪些搜索相关结论。', summary: 'V*Bench 检验复杂场景中的细粒度视觉问答。', interaction: '沿现有证据旅程查看主结果和消融实验。', next: '总结贡献与边界。', notes: '对应页面第 5 章和 S5EvidenceJourney。', componentId: 'vstar-s5-evidence', moduleId: 'evidence-journey' }],
    },
    {
      kind: 'chapter', id: 'synthesis', title: 'V* 到底推进了什么？',
      modules: [{ kind: 'module', id: '6.1', title: 'V* 的贡献与边界', desc: '总结主动视觉搜索的推进、证据与局限。', componentId: 'vstar-s6-synthesis' }],
      scenes: [{ id: 'synthesis-review', title: '贡献与边界', goal: '把主动搜索、VWM 和实验结论连成整体。', summary: 'V* 把固定视觉输入推进到任务驱动的主动视觉搜索。', interaction: '阅读现有综合面板并回顾各环节。', next: '进入页面末尾的回顾。', notes: '对应页面第 6 章和 S6Synthesis。', componentId: 'vstar-s6-synthesis', moduleId: '6.1' }],
    },
  ],
};
