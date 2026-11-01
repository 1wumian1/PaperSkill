// 长滚动版的章节表。v7.1 精简：每章只保留有独立信息的栏目——
// intro 合并“本节问题 + 导语”；analogy 只在类比有独立解释价值的章保留（第 4、6 章）；
// show 指定洞察、公式、关键数字、要点、误区里哪些留下（重复同一结论的不再显示）。
// 模块的“出处与口径”取自章节包组装出的 src/data/tutorial.ts；模块说明改为“怎么操作、看什么变化”。
import { tutorial } from '../data/tutorial';

export interface V7Module {
  id: string;
  componentId: string;
  title: string;
  desc: string;
  notes: string;
  /** 交互区高度（设计单位，默认 622）；内容在所有状态下都更矮时调低，避免卡片底部留白 */
  h?: number;
  /** 容器适配的模块：按卡片实际宽度绘制，不经整体缩放 */
  fluid?: boolean;
}
export interface V7Show {
  /** 显示哪些公式卡（旧版 formulas 的下标）；未列出的公式若有说明，归入“符号与推导”一行 */
  formulas: number[];
  insight: boolean;
  facts: boolean;
  takeaways: number[];
  pitfalls: number[];
}
export interface V7Chapter {
  num: number;
  id: string; // chap-N，同时是旧版内容（oldContent）的章节键
  title: string;
  badge: string;
  intro: string;
  analogy?: { title: string; story: string; boundary: string };
  /** 覆盖旧版“核对”文字（用于把分散在公式说明里的口径合并进来） */
  check?: string;
  show: V7Show;
  /** 隐藏的公式说明已并入别处（如第 7 章并入核对）时，不再单列“符号与推导” */
  hideFormulaNotes?: boolean;
  modules: V7Module[];
}

// v7.2：这几个高频操作的模块改为容器适配（画布按卡片宽度绘制，控件用网页实际尺寸）
const FLUID = new Set(['vtw-token-bill', 'vtw-info-migration', 'vtw-withdraw-tower', 'vtw-kv-cache']);
const SCENES = tutorial.chapters.flatMap((c) => c.scenes.map((s) => ({ ...s, chapterId: c.id })));
function mod(componentId: string, id: string, desc: string, h?: number): V7Module {
  const s = SCENES.find((x) => x.componentId === componentId)!;
  return { id, componentId, title: s.title, desc, notes: s.notes, h, fluid: FLUID.has(componentId) };
}

export const CHAPTERS: V7Chapter[] = [
  {
    num: 1, id: 'chap-1', title: '一张图的账单：576 个视觉 token', badge: '问题背景',
    intro: '一张 336×336 的图进入 LLaVA-1.5 会变成 576 个[[t:vtok|视觉 token]]，几乎占满整段输入。先把账算清楚：每一层的计算量有多少是它们带来的？',
    show: { formulas: [], insight: true, facts: false, takeaways: [], pitfalls: [0, 1] },
    modules: [mod('vtw-token-bill', '1.1', '播放或拖动进度：一张图被切块、排进输入序列，再在 32 层里逐层付费；切换模型或拖动指令长度，看视觉 token 占输入的比例和占每层 Ω(s) 的比例。')],
  },
  {
    num: 2, id: 'chap-2', title: '旧路的四道坎：按“重要性”挑 token', badge: '动机',
    intro: 'VTW 之前的方法（[[t:fastv|FastV]]、[[t:prumerge|PruMerge]]）按“重要性”挑出要保留的视觉 token。作者认为这条路本身有短板：先看它与问题的相关性，再逐一看四道坎。',
    show: { formulas: [0], insight: true, facts: false, takeaways: [], pitfalls: [0, 1] },
    modules: [
      mod('vtw-question-pruning', '2.1', '点照片里的蛋糕、瓶子或叉子换一个问题，再切换三种保留规则：看答题需要的图块（虚线框）有没有被留下。'),
      mod('vtw-old-hurdles', '2.2', '点选四个短板之一，看它卡在哪里、VTW 怎样绕开；第 3 项可拖动解码步，比较两种做法的缓存能否复用。'),
    ],
  },
  {
    num: 3, id: 'chap-3', title: '观察一：深层的注意力流向系统 token', badge: '证据 ①',
    intro: '要说明深层不需要视觉 token，作者先看注意力：深层正在预测下一个词的[[t:outtok|输出 token]]，还在看图吗？',
    show: { formulas: [0], insight: true, facts: true, takeaways: [1], pitfalls: [0, 1] },
    modules: [mod('vtw-attention-layers', '3.1', '拖动层索引（可切换 7B / 13B 与“按每个 token 平均”）：看输出位置的注意力光束与下方曲线怎样变化；也可以先猜再看。')],
  },
  {
    num: 4, id: 'chap-4', title: '观察二：信息在浅层就“迁移”进了文字', badge: '证据 ②',
    intro: '深层不怎么看图，那图像信息去哪了？[[t:causal|因果自注意力]]会让它在浅层就流进排在后面的[[t:instok|指令 token]]——这就是[[t:migr|信息迁移]]。',
    analogy: {
      title: '茶味已经溶进了水里',
      story: '茶包泡上几分钟，茶味已经溶进水里，这时把茶包拿出来，茶还是那杯茶。可如果一开始泡的是一包味道不对的假茶包，拿出来以后水里的怪味也不会消失——这正是表 1 里“白图比不给图更低”的直觉。',
      boundary: '茶包 = 视觉 token，茶汤 = 问题（指令）token；真实模型里信息并不像溶质那样单向扩散到饱和，迁移是否完成要靠表 1、图 8 与 KL 校准检验。',
    },
    show: { formulas: [0], insight: true, facts: false, takeaways: [], pitfalls: [0, 1] },
    modules: [
      mod('vtw-info-migration', '4.1', '播放或拖动进度：计算逐层推进，图像信息沿注意力流进排在后面的问题 token（茶色上涨，示意）；越过第 K 层后视觉 token 撤走，已吸收的信息保留。拖动 K，或点“让视觉 token 读问题？”看因果掩码的阻断。'),
      mod('vtw-table1-ablation', '4.2', '先猜三种条件里谁的 MME 总分最低，再点茶杯切换解读；柱状图是论文原值。'),
    ],
  },
  {
    num: 5, id: 'chap-5', title: '方法：前 K 层完整处理，第 K+1 层入口撤走视觉 token', badge: '方法',
    intro: '两个观察合起来就是 VTW：前 K 层完整处理图文，在第 K+1 层入口把视觉 token 一次全部撤走，之后只算文字 token。',
    show: { formulas: [0, 1], insight: true, facts: false, takeaways: [], pitfalls: [1] },
    modules: [
      mod('vtw-withdraw-tower', '5.1', '播放或拖动进度：token 逐层上升，到撤出边界时视觉通道被撤走、文字通道继续；右侧累计计算量随同一进度增长。也可以拖动 K、切换两种层号口径，或点阶段按钮直接跳转。'),
      mod('vtw-prefill-decode', '5.2', '点“下一步”走完一次推理的 7 步，代码行随步骤高亮；第 5、6 步先猜再揭晓。'),
    ],
  },
  {
    num: 6, id: 'chap-6', title: '缓存与位置：撤出之后，剩下的 token 怎么编号', badge: '工程',
    intro: '撤出之后有两个工程问题：[[t:kv|KV Cache]] 每层存多少、省多少？剩下的文字 token 还用原来的[[t:pe|位置编号]]吗？',
    analogy: {
      title: '泡好的茶汤留着喝，杯子坐原座位',
      story: '泡好的茶汤留在壶里，下一口直接倒，不必重泡（KV Cache）。茶包拿走后，留下的杯子可以继续坐原来的座位，也可以全部往前挪、重新编号；重新编号看着整齐，后来加的茶和之前的杯子就对不上号了。',
      boundary: '缓存大小按 6.1 的公式计算；“座位号”只提示保留原位置编号，作用由旋转位置编码的相对距离决定。',
    },
    show: { formulas: [], insight: false, facts: true, takeaways: [], pitfalls: [0, 1] },
    modules: [
      mod('vtw-kv-cache', '6.1', '拖动 K 与已生成词数 t：32 层每层缓存的 token 数与总缓存同时更新（按本页公式估算，不是显存实测）。'),
      mod('vtw-position-ids', '6.2', '切换 Keep / Rearrange：看同一对 token 在浅层与深层的相对距离是否一致，并对照表 6。'),
    ],
  },
  {
    num: 7, id: 'chap-7', title: '选 K：用 KL 散度找第一个“尝不出差别”的层', badge: '校准',
    intro: '撤得早省得多，撤得太早会掉分。VTW 用 20 个样本做一次校准：从第 5 层往后试，第一个输出分布与原模型的 [[t:kl|KL 散度]]低于[[t:eta|阈值 η]] 的层就是 K。',
    check:
      '**论文与代码不一致**：论文写 η = 0.003，KL(·, ·) < η，没有说明方向 [[ev:setting]] [[ev:eq6]]；代码按模型名设阈值——7B 为 0.003、13B 为 0.0005、LLaVA-NeXT 为 0.0001，取第一个平均 KL **≤** η 的层 [[ev:cEta]]，算的是 KL(P_VTW ‖ P_原模型)，且只用第一个输出 token 的分布 [[ev:cKL]]。候选层循环硬编码了 `35:611` 这一段 [[ev:cFindk]]，只适合 LLaVA-1.5 的输入布局。表 2 里的 K（16、20、16）是**手动设定**的，不是校准结果 [[ev:tab2]]。',
    show: { formulas: [], insight: false, facts: true, takeaways: [], pitfalls: [] },
    hideFormulaNotes: true,
    modules: [
      mod('vtw-k-tradeoff', '7.1', '点三个预设或拖动 K：上面板是计算量（Eq. 1 外推），下面板只画表 5 的实测准确率点。'),
      mod('vtw-kl-scan', '7.2', '切换阈值 η：看从 K = 5 往后扫描停在哪一层，以及表 5 对应的准确率。'),
    ],
  },
  {
    num: 8, id: 'chap-8', title: '算力账：FLOPs、延迟与显存要分开看', badge: '复算',
    intro: '“省了约 45% 的 FLOPs”和“快了 45%”不是一回事。先按论文口径复算 TFLOPs，再把同一次实验的五个倍数分开看。',
    show: { formulas: [], insight: false, facts: false, takeaways: [], pitfalls: [1] },
    modules: [
      mod('vtw-flops-check', '8.1', '点选论文配置，看本页能否复算出论文的比例；拖动 K 即为自定义配置（只做外推，不与论文比较）。', 540),
      mod('vtw-latency-memory', '8.2', '点任一指标行：看原始数值，以及这个倍数为什么和 TFLOPs 不同。'),
    ],
  },
  {
    num: 9, id: 'chap-9', title: '结果：VTW 与原模型、FastV、两种“乱撤”的对照', badge: '证据 ③',
    intro: '表 2 除了原模型和 FastV，还有两个“乱撤”的对照组——随机丢 token（[[t:rand|Rand]]）与随机层撤出（[[t:vtwr|VTW†]]），它们比 VTW 本身更能说明机制。',
    show: { formulas: [0], insight: true, facts: true, takeaways: [], pitfalls: [0, 1] },
    modules: [mod('vtw-table2-results', '9.1', '切换模型与方法（或进入先猜模式）：看六个基准相对原模型的变化；所有方法共用同一把刻度。')],
  },
  {
    num: 10, id: 'chap-10', title: '边界与反例：什么时候不该这样撤', badge: '边界',
    intro: '最后把 VTW 放到它不占优的场景：撤得太早、随机层撤出、需要细粒度信息的子任务，以及论文没测过的长回答。',
    show: { formulas: [0], insight: false, facts: true, takeaways: [], pitfalls: [0] },
    modules: [
      mod('vtw-boundary-cases', '10.1', '切换场景、拖动 K：涂色格表示这个词在该层仍要读取视觉 token（教学设定），红格表示它需要的视觉信息已被撤走。'),
      mod('vtw-mme-subtasks', '10.2', '切换模型：看 14 个 MME 子任务的分差，并核对子项之和是否等于表中总分。'),
    ],
  },
];

export const VERDICT_MODULE = mod('vtw-verdict-sort', '✦', '逐条把说法放进三个等级之一，揭晓依据；红色小条表示放错的说法。', 540);

export const ROUTES = [
  { title: '先懂原理', path: '§1 → §3 → §4 → §5', to: 1 },
  { title: '复现代码与算力', path: '§5 → §6 → §7 → §8', to: 5 },
  { title: '检查证据与边界', path: '§4 → §9 → §10 → 结论分级', to: 4 },
];
