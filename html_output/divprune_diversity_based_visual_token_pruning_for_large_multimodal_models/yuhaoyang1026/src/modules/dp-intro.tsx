import React, { useState } from 'react';
import { SymbolHint as S } from '../components/SymbolHint';
import { Seg, Tag, type ContentTag } from './dp-kit';
import { SCENES } from './dp-survey';

// 每章第一页：左侧测绘队情节（可操作），右侧三层阅读：导语（问题 / 导语 / 公式 / 核对）、
// 精读（洞察与关键数字）、要点与误区。长推导、出处与类比边界的细节放在讲稿。

/** 轻量富文本：**粗体**、[[tag:paper|code|extrap|demo]] 口径标记 */
export function Rich({ text }: { text: string }) {
  const out: React.ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\[\[tag:(paper|code|extrap|demo)\]\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(m[1] ? <b key={k++}>{m[1]}</b> : <Tag key={k++} kind={m[2] as ContentTag} />);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

export interface IntroData {
  question: string;
  analogy: string;
  caption: string;
  bridge: string;
  formula?: { lines: React.ReactNode[]; note?: string };
  check?: string;
  insight: string;
  facts?: { value: string; label: string }[];
  extra?: React.ReactNode;
  takeaways: [string, string][];
  pitfalls: string[];
}

export const CH: Record<string, IntroData> = {
  '01': {
    question: '一张图进了模型，要处理多少个视觉 token？',
    analogy: '地图切成格，每一格都要勘测',
    caption: '一格 = 一个视觉 token；每格都要在 LLM 的每一层里处理一遍。',
    bridge: 'LLaVA 1.5 把一张图切成 **576 个**视觉 token，LLaVA 1.6 约 1600–2300 个，视频 8 帧共 1152 个；问题文本通常只有几十个。LLM 每一层、每生成一个词都以它们为条件。',
    formula: {
      lines: [
        <>P(<S meaning="模型输出的 N̂ 个 token（答案）">y₁…y<sub>N̂</sub></S> | <S meaning="N 个文本 token">E<sub>t</sub></S>, <S meaning="M 个视觉 token（LLaVA 1.5 中 M = 576）；剪枝后换成子集 Ẽv">E<sub>v</sub></S>) = <S meaning="连乘 N̂ 项：联合概率 = 每一步条件概率之积">∏</S> P(<S meaning="第 i 个输出 token">y<sub>i</sub></S> | <S meaning="第 i 步之前已生成的 token">y<sub>&lt;i</sub></S>, E<sub>t</sub>, E<sub>v</sub>)</>,
      ],
      note: 'Eq. (1)：每生成一个词，都以全部文本与视觉 token 为条件。',
    },
    check: '论文说成本随长度“二次增长”；按它自己的计算式，这个长度下二次项只占单层计算的 3%–12%，计算量近似线性 [[tag:extrap]]。',
    insight: '剪枝不改模型参数，只减少它能看到的视觉 token——所以能即插即用，但删掉的信息再也找不回来。',
    facts: [
      { value: '576', label: 'LLaVA 1.5 视觉 token（24 × 24 图块）' },
      { value: '≈ 3%', label: 'n ≈ 600 时二次项占单层计算（外推）' },
      { value: '1152', label: '视频 8 帧 × 144' },
    ],
    takeaways: [['视觉占大头', '一张图几百到上千个 token，问题只有几十个。'], ['近似线性', '这个尺度下剪掉多少 token，大致就省多少计算。'], ['每步都要读', '预填充和逐词解码都以全部视觉 token 为条件。']],
    pitfalls: ['“576 个 token”是 24 × 24 个图块的特征向量，不是 576 个像素。', '文本长度 N 不固定：代码里的 15–113 是各数据集的平均估计。'],
  },
  '02': {
    question: '按“重要性”挑 token，为什么会扎堆？',
    analogy: '手电只照亮一处，按亮度插旗',
    caption: '亮度 = 重要性分数：照到哪里旗就插在哪里，名额挤在同一片区域。',
    bridge: 'FastV、PruMerge 用注意力给 token 打分、只留高分的。论文指出：高分 token 往往彼此相似，名额被重复信息占满；剪得越狠，这个问题越严重。',
    check: 'Fig. 3(a) 只是单个样本的 t-SNE 图，簇间距离不能直接解读；它能说明“会扎堆”，不能证明“总是扎堆”。',
    insight: '“重要”不等于“有代表性”：Top-k 从不检查已选 token 之间是否重复，Max-Min 只看重复。',
    extra: (
      <table className="dp-intro-table">
        <thead><tr><th>方法</th><th>剪在哪</th><th>靠什么</th></tr></thead>
        <tbody>
          <tr><td>FastV</td><td>LLM 第 K 层后</td><td>第 K 层注意力</td></tr>
          <tr><td>PruMerge</td><td>视觉编码器输出</td><td>注意力 + 聚类合并</td></tr>
          <tr><td>VTW</td><td>LLM 第 K 层后</td><td>撤走全部视觉 token</td></tr>
          <tr><td>FitPrune</td><td>LLM 内部多层</td><td>校准集注意力差异</td></tr>
          <tr><td>M³</td><td>视觉编码器输出</td><td>微调的嵌套表示</td></tr>
          <tr className="is-ours"><td>DivPrune</td><td>LLM 第 0 层前</td><td>余弦距离 Max-Min</td></tr>
        </tbody>
      </table>
    ),
    takeaways: [['高分集中时可能扎堆', '按分数选择不主动去重，是否冗余取决于分数与特征的分布。'], ['覆盖与相关性要权衡', '几何分散不自动等于更高的任务精度。'], ['DivPrune 的定位', '不训练、不校准、即插即用。']],
    pitfalls: ['2.1 的“重要性分数”是人为构造的；FastV 的真实分数来自第 K 层注意力，因样本而异。', '论文实验里的 FastV 第 3 层后几乎只留 1 个 token（第 10 章），不能直接当作“注意力打分有多差”的证据。'],
  },
  '03': {
    question: '理想目标为什么算不动？',
    analogy: '布点方案计数器永远转不完',
    caption: '576 格里插 56 面旗约有 10⁷⁸ 种方案，只能换一条好执行的规则。',
    bridge: '理想做法是让剪枝前后的输出尽量一致（Eq. (2)），但这要运行模型，而且 576 选 56 约有 10⁷⁸ 种挑法。DivPrune 换成只看特征的目标：让留下的 token 彼此尽量不同。',
    formula: {
      lines: [
        <>求 <S meaning="剪枝规则：从全部视觉 token 映射到保留子集">f</S>：<S meaning="全部 M 个视觉 token">E<sub>v</sub></S> → <S meaning="保留下来的子集">Ẽ<sub>v</sub></S>，min ℒ(<S meaning="剪枝前的输出分布（Eq. 1）">𝒫</S>, <S meaning="剪枝后的输出分布">𝒫̃</S>)</>,
        <>约束：|Ẽ<sub>v</sub>| = <S meaning="保留个数（代码中 LLaVA 1.5 为 56）">M̃</S></>,
      ],
      note: 'Eq. (2) 是问题的一般表述；DivPrune 不直接优化它，而用 Eq. (3) 作代理。',
    },
    check: '补充材料写“剪枝率 91.2%”，代码用的是保留比例 0.098（剪 90.2%）；只有后者能复现 Table 1 的 15.63% [[tag:extrap]]。',
    insight: '最关键的一步是换目标：从“让输出不变”（必须跑模型）换成“让 token 彼此不同”（只需特征）。代价是它不知道用户问了什么。',
    facts: [
      { value: '3.4×10⁷⁸', label: 'C(576, 56)：576 选 56（外推）' },
      { value: '56', label: 'LLaVA 1.5 保留的视觉 token' },
      { value: '−10.1', label: 'TextVQA 降幅（supp Table 1）' },
    ],
    takeaways: [['理想目标算不动', '要跑模型，且子集多达约 10⁷⁸ 个。'], ['换成代理目标', '只看特征的多样性，无需训练与校准。'], ['代价：不看问题', '问题只关心小区域时可能吃亏。']],
    pitfalls: ['Eq. (2) 是问题的一般表述，不是 DivPrune 实际优化的目标。', '剪枝率与保留率方向相反：代码的 SUBSET_RATIO 是保留率。'],
  },
  '04': {
    question: '“彼此尽量不同”怎样写成可计算的目标？',
    analogy: '罗盘只读夹角，卷尺量直线',
    caption: '原点是营地，γ、ω 是两支测绘队走出的方向：罗盘读夹角（余弦距离），走得再远读数也不变；卷尺量两队之间的直线（欧氏距离），会跟着变。',
    bridge: 'MMDP 在所有大小为 M̃ 的子集里，挑“最近一对距离最大”的那个（Eq. (3)）。距离用余弦距离（Eq. (4)），只看方向、不看长度，在 4096 维投影特征上计算。',
    formula: {
      lines: [
        <>Ẽ<sub>v</sub> = <S meaning="在所有子集 S 中取使方括号最大的那个">arg max</S> [ <S meaning="S 内两两不同元素间的最小距离，即子集的短板">min<sub>γ≠ω∈S</sub></S> d(γ, ω) ]，|<S meaning="E_v 的任意子集，大小为 M̃">S</S>| = M̃</>,
        <><S meaning="余弦距离，范围 [0, 2]">d(γ, ω)</S> = 1 − <S meaning="内积除以两个向量长度之积：消去长度，只看方向">γ·ω / (‖γ‖‖ω‖)</S></>,
      ],
      note: 'Eq. (3)、(4)。原式没写 γ ≠ ω；若允许 γ = ω，min 恒为 0，Algorithm 1 第 8 行的 i ≠ j 印证应取不同元素。',
    },
    insight: 'Max-Min 是“短板”指标：只要有一对几乎相同的 token，整组得分就低——所以它天然惩罚冗余。',
    facts: [
      { value: '[0, 2]', label: '余弦距离的取值范围' },
      { value: '0.586', label: 'd(0°,45°) + d(45°,90°) < d(0°,90°) = 1' },
      { value: '4096', label: '7B 投影特征维度' },
    ],
    takeaways: [['看最近的一对', '子集得分 = 内部最小两两距离。'], ['余弦只看方向', '向量长度不影响距离。'], ['补全了读', 'γ、ω 必须不同，子集大小恰为 M̃。']],
    pitfalls: ['1 − cos 不满足三角不等式，经典的“贪心 2-近似”保证不能直接套用。', '4.2 用二维欧氏距离示意；论文在 4096 维特征上用余弦距离。'],
  },
  '05': {
    question: 'Algorithm 1 怎样一个个挑出 M̃ 个 token？',
    analogy: '每一针都落在最大的空白处',
    caption: '落针 = 选 token：第一针落在最孤立处，之后每针落在离已有针最远处。5.1 逐步演示。',
    bridge: 'Algorithm 1 先挑**最孤立**的 token，再一轮轮挑“离已选集合最远”的候选，直到选满 M̃ 个；全部两两距离只用一次矩阵乘法算好。',
    formula: {
      lines: [
        <><S meaning="第 t 轮选中的 token，随后从 R 移入 Ẽv">k<sub>t</sub></S> = <S meaning="剩余候选集合，初始为全部 M 个视觉 token">R</S>[ arg max<sub>i∈R</sub> min<sub>j∈<S meaning="已选集合，每轮多 1 个">Ẽ<sub>v</sub></S></sub> d(i, j) ]，<S meaning="轮次；总轮数 = M̃">t</S> = 2…M̃</>,
      ],
      note: 'Algorithm 1 第 13–21 行的公式化写法（非论文编号公式）；第 1 轮改为“到其他候选的最近距离”。',
    },
    check: '论文称“求得了精确解”，但 Algorithm 1 是贪心，没有回溯或穷举，不保证达到 Eq. (3) 的最优——5.2 能找到反例。',
    insight: '贪心每轮都填补当前最大的空洞：很快，但从不回头修正。',
    facts: [
      { value: '56', label: 'LLaVA 1.5 的选择轮数 = M̃' },
      { value: '≈ 0.04%', label: '距离矩阵占一次预填充计算（外推）' },
      { value: '+11 ms', label: '预填充比 FastV / VTW 慢（Table 2）' },
    ],
    takeaways: [['先选最孤立的', '第一阶段：最近邻距离最大的 token。'], ['再反复填空洞', '到已选集合最远的候选，直到 M̃ 个。'], ['贪心 ≠ 最优', '小规模穷举就能找到反例。']],
    pitfalls: ['伪代码会把选中的 k 移出 R；官方代码没有移出，靠“到自身距离为 0”避免重复选。', '循环次数是 M̃，不是 M。'],
  },
  '06': {
    question: '论文的伪代码和官方代码一致吗？',
    analogy: '把测绘图压在实地上逐项核对',
    caption: '测绘图 = 论文，实地 = 官方代码。左边列出 13 处具体对照，有差异和代码缺失的排在前面；点任一处看结论，6.1 会同步选中同一处。',
    bridge: '核心代码只有两处：DivPrune 函数和它在拼好输入后的调用。主干与论文一致；保留比例、候选集处理、索引偏移和排序有细节差异。',
    formula: {
      lines: [<><S meaning="保留个数（代码中的 threshold_terms）">M̃</S> = int(round(<S meaning="SUBSET_RATIO：图像 0.098，tflops.py 中视频为 0.1">r</S> · <S meaning="视觉 token 总数（image_feature_length）">M</S>)) → round(0.098 × 576) = 56</>],
      note: 'llava_arch.py 第 153 行（代码口径，非论文编号公式）。',
    },
    check: '代码索引从 **0** 开始：s 是视觉段内的位置（0…M−1），加上硬编码的 SYS_TOKEN_LEN = 35 才是序列位置；换对话模板就需要改。',
    insight: '论文说“选哪些”，代码还决定“放哪里”：保留的 token 按原位置排序后送入 LLM，选择顺序被丢弃。',
    facts: [
      { value: '0.098', label: 'SUBSET_RATIO（保留率）' },
      { value: '35', label: '硬编码的系统前缀长度' },
      { value: '13', label: '对照条目：一致 5 · 有差异 3' },
    ],
    takeaways: [['主干一致', '第 0 层、投影特征、余弦距离、两阶段贪心。'], ['细节有差', '0.098 ≠ 91.2%、候选集不移除、硬编码 35、按位置排序。'], ['部分实验无代码', '层内剪枝、视频模型、Table 2 的效率设置。']],
    pitfalls: ['SUBSET_RATIO 是保留比例：0.098 = 保留 9.8%。', '代码只处理 batch 第 0 个样本，与论文 batch = 1 的设定一致，不能直接批量推理。'],
  },
  '07': {
    question: '在第几层剪最好？Table 3 里藏着什么？',
    analogy: '补给固定，越晚精简装备旗越少',
    caption: '补给（TFLOP 预算）固定：越晚精简装备，能布的旗越少（旗数按 Eq. (5) 反推）。',
    bridge: 'DivPrune 默认在 **Layer 0**（进入解码器之前）剪枝。Table 3 在固定约 19.6% TFLOPs 下比较第 0–3 层：平均分 62.34 → 60.44 → 56.99 → 38.60。',
    formula: {
      lines: [<><S meaning="第 K 层剪枝时可保留数：K = 0/1/2/3 约为 56/39/21/2">M̃(K)</S> = max {'{'} M̃ : TFLOP 比例(<S meaning="剪枝层；0 = 进入第 1 层之前">K</S>, M̃) ≤ <S meaning="固定预算，Table 3 中约 19.6%">B</S> {'}'}</>],
      note: '按 Eq. (5) 反推保留数（本页外推，非论文公式）。',
    },
    check: '预算固定时越晚剪，能留的越少：本页按 Eq. (5) 反推为 **56 → 39 → 21 → 2** 个，恰好复现 Table 3 的 TFLOP 列 [[tag:extrap]]。表中同时变了“层位置”和“保留数”。',
    insight: '固定预算的消融回答的是“预算怎么花”，不是“哪一层的信息更好”。',
    facts: [
      { value: '62.34', label: 'Layer 0 平均分（Table 3）' },
      { value: '38.60', label: 'Layer 3 平均分（Table 3）' },
      { value: '19.6%', label: '固定的 TFLOP 预算' },
    ],
    takeaways: [['Layer 0 是默认', '进入第一层前剪，全部层受益。'], ['第二个变量', '固定预算下保留数 56 → 39 → 21 → 2。'], ['信息不能倒流', '晚剪的 token 可能已把信息传给后面的问题。']],
    pitfalls: ['“Layer 1”指第 1 层处理完后再剪；“Layer 0”才是进入任何解码层之前。', '39、21、2 是本页反推值，论文没有报告。'],
  },
  '08': {
    question: '换距离、换规则，哪个影响大？',
    analogy: '三种测距工具量同一组旗',
    caption: '这组旗里三种工具指出的“最远一对”各不相同；Table 4 中三种距离的平均分却几乎一样。',
    bridge: 'Table 4 换距离：余弦 62.34、ℓ1 61.94、ℓ2 62.22，几乎一样；换规则：随机 56.66、Min-Max 46.53，明显变差。都在保留 56 个、单次运行的条件下。',
    formula: {
      lines: [<><S meaning="按 Min-Max 规则选出的子集">Ẽ<sub>v</sub></S> = arg min<sub><S meaning="任意含 M̃ 个元素的子集">S</S></sub> max<sub>γ≠ω∈S</sub> d(γ, ω)</>],
      note: 'Min-Max（§4.6 文字描述，未编号）：与 Eq. (3) 相反，挑一团彼此相似的 token。',
    },
    check: '正文说随机“低约 5.6%”、Min-Max“低约 15.8%”——其实是**百分点**；相对降幅约 9.1% 与 25.4% [[tag:extrap]]。',
    insight: '用哪把尺子几乎不影响结果，挑选规则决定结果。',
    facts: [
      { value: '< 0.4', label: '三种距离平均分之差（单次运行）' },
      { value: '56.66', label: '随机保留 56 个（Table 4）' },
      { value: '46.53', label: 'Min-Max（Table 4）' },
    ],
    takeaways: [['尺子不重要', '三种距离平均分相差 < 0.4。'], ['规则很重要', '62.34 > 56.66 > 46.53。'], ['注意“%”', '论文的“%”在这里是百分点。']],
    pitfalls: ['“5.6%”“15.8%”是百分点差，不是相对比例。', '8.1 的图块特征是 4 维颜色向量，不是 CLIP 特征。'],
  },
  '09': {
    question: '省下的理论算力，能换来多少实际速度？',
    analogy: '背包轻了 86%，全程只快两成多',
    caption: '背包轻了 86%（理论 TFLOPs），第一段路（预填充）快了一倍，全程（端到端）只快两成多。9.2 用 Table 2 的实测值赛跑。',
    bridge: 'TFLOP 比例按 Eq. (5) 估算，只计 LLM 解码层的预填充。Table 2 实测：14.10% 的 TFLOPs 换来约 **2.05×** 预填充提速、**1.29×** 端到端提速、显存少 0.55 GB。',
    formula: {
      lines: [
        <>比例 = [<S meaning="剪枝所在层；DivPrune 为 0，本文实验中 FastV 为 3">K</S>·f(<S meaning="剪枝前序列长度 μ = N + M">μ</S>) + (<S meaning="解码层数：7B 为 32，13B 为 40">T</S>−K)·f(<S meaning="剪枝后序列长度 μ̃ = N + M̃">μ̃</S>)] / [T·f(μ)]</>,
        <>f(n) = 4n<S meaning="隐藏维度：7B 为 4096">d</S>² <b className="dp-bad-sign">−</b> 2n²d + 2nd<S meaning="FFN 中间维度：7B 为 11008">m</S>（按正式版印刷）</>,
      ],
      note: 'Eq. (5)。印刷的“−2n²d”与代码不一致，只有“+”能复现表格（9.1 可切换）。',
    },
    check: 'Eq. (5) 印刷为 **−2μ²d**，按它算 LLaVA 1.5-7B 为 16.50%，与表不符；代码为 **+2n²d**，可复现 16 个可核对配置中的 15 个 [[tag:extrap]]。',
    insight: 'TFLOPs 只是理论账：端到端还包括视觉编码、逐词解码和调度，所以 14% 的算力只换来约 1.29× 的端到端提速。',
    facts: [
      { value: '2.05×', label: '预填充 0.330 → 0.161 s' },
      { value: '1.29×', label: '端到端 4.37 → 3.39 s' },
      { value: '−0.55 GB', label: '显存峰值 14.06 → 13.51 GB' },
    ],
    takeaways: [['能复现', '按代码的 + 号，16 个配置中 15 个一致。'], ['理论 ≠ 实测', '预填充约 2.05×，端到端约 1.29×。'], ['正文要对表', '“55%”“400MB”与表格算出的不一致。']],
    pitfalls: ['不要把“TFLOP 比例 14.10%”说成“快 7 倍”。', 'Table 1 的 TFLOPs 是 11 个数据集比例的平均，单个数据集在 11.70%–23.89% 之间。'],
  },
  '10': {
    question: '结果很亮眼，比较条件公平吗？',
    analogy: '两支测绘队的成绩单，先核对补给',
    caption: '同样约 15.6% 的补给下，FastV 队过了第 3 营地只能留约 1 面旗（按 tflops.py 实时计算）。',
    bridge: '在约 10–17% 的 TFLOP 比例下，DivPrune 在 16 个数据集上普遍领先同类即插即用方法，补充材料的 3 个数据集也一致。例如 COCO CIDEr：FastV 0.06，DivPrune 0.96（原模型 1.10）。',
    formula: {
      lines: [<><S meaning="标准误：换一批同分布题目，单个模型的准确率大约波动这么多（不是两个模型差值的区间）">SE</S> ≈ √( <S meaning="准确率（0–1）">p</S>(1 − p) / <S meaning="题量；论文未报告，取公开基准常见规模">n</S> )</>],
      note: '教学示例：只描述一个模型自己的波动量级，不能用来判断两个模型谁更好；F1 等指标不适用。',
    },
    check: '全部为单次运行，没有置信区间；POPE、MMMU 上“超过原模型”的差值很小，无法判断是否超出评测波动。',
    insight: '差距越小，越要先问噪声；差距越大，越要先问比较条件。',
    facts: [
      { value: '0.06 → 0.96', label: 'COCO CIDEr：FastV vs DivPrune' },
      { value: '≈ 1 个', label: 'FastV 第 3 层后保留的 token（外推）' },
      { value: '单次', label: '全部结果均为单次运行' },
    ],
    takeaways: [['优势真实', '高剪枝率下普遍领先同类即插即用方法。'], ['先对口径', '百分点 / 百分比、噪声、聚合方式。'], ['差距受配置影响', 'FastV 被迫第 3 层后只留约 1 个 token。']],
    pitfalls: ['“下降 5.1%”可能是百分点，“下降 12.7%”可能是相对比例——回到表格自己算。', 'FastV / VTW 的低分对应极端配置，不代表它们默认设定下的表现。'],
  },
};

export function DpIntro({ k }: { k: string }) {
  const c = CH[k];
  const scene = SCENES[k]();
  const [tab, setTab] = useState<'lead' | 'deep' | 'keys'>('lead');
  return (
    <div className="dp-root dp-intro">
      <div className="dp-intro-left">
        {scene.canvas}
        <div className="dp-intro-ctl">{scene.controls}</div>
        <p className="dp-intro-cap">{c.caption}</p>
      </div>
      <div className="dp-intro-right dp-glass">
        <Seg label="阅读层次" options={[{ value: 'lead', label: '导语' }, { value: 'deep', label: '精读' }, { value: 'keys', label: '要点与误区' }]} value={tab} onChange={setTab} />
        {tab === 'lead' ? (
          <>
            <h3 className="dp-h">{c.question}</h3>
            <p className="dp-intro-p"><Rich text={c.bridge} /></p>
            {c.formula ? (
              <div className="dp-intro-formula">
                {c.formula.lines.map((l, i) => <div key={i} className="dp-intro-eq">{l}</div>)}
                {c.formula.note ? <div className="dp-muted">{c.formula.note}</div> : null}
              </div>
            ) : null}
            {c.check && !c.formula ? <div className="dp-fb is-limit"><b>核对</b>　<Rich text={c.check} /></div> : null}
          </>
        ) : tab === 'deep' ? (
          <>
            <div className="dp-intro-insight"><Rich text={c.insight} /></div>
            {c.facts ? (
              <div className="dp-intro-facts">
                {c.facts.map((f) => (
                  <div key={f.value}><b className="dp-em">{f.value}</b><span className="dp-muted">{f.label}</span></div>
                ))}
              </div>
            ) : null}
            {c.extra}
            {/* 有公式的章，“核对”放在精读层，导语层留给问题、导语与公式 */}
            {c.check && c.formula ? <div className="dp-fb is-limit"><b>核对</b>　<Rich text={c.check} /></div> : null}
          </>
        ) : (
          <>
            <ul className="dp-intro-list is-keys">
              {c.takeaways.map(([t, d]) => <li key={t}><b>{t}</b>：{d}</li>)}
            </ul>
            <ul className="dp-intro-list is-pits">
              {c.pitfalls.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
