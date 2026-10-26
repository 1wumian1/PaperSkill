// 收束章的数据（移植自原版 v7 的 tutorial.ts：术语表、结论分级、来源）。
import { PAPER_PDF, SUPP_PDF, COMMIT } from './dp-data';

export interface GlossaryDef { term: string; en?: string; intuition: string; role: string }
export interface VerdictItem { claim: string; basis: string }
export interface VerdictGroup { level: 'proven' | 'explained' | 'unknown'; title: string; desc: string; items: VerdictItem[] }
export interface SourceLink { label: string; url: string; note: string }

const HTML = 'https://openaccess.thecvf.com/content/CVPR2025/html/Alvar_DivPrune_Diversity-based_Visual_Token_Pruning_for_Large_Multimodal_Models_CVPR_2025_paper.html';
const MAIN = PAPER_PDF;
const SUPP = SUPP_PDF;

export const GLOSSARY: Record<string, GlossaryDef> = {
    lmm: { term: '大型多模态模型（LMM）', en: 'Large Multimodal Model', intuition: '能同时读图（或视频）和文字的大语言模型：先把图像编码成 token，再和文字一起交给 LLM。', role: '论文测试的对象：LLaVA 1.5-7B/13B、LLaVA 1.6-7B、LLaVA-NeXT-Video-7B。' },
    vtoken: { term: '视觉 token', en: 'visual token', intuition: '图像中一小块区域编码后的向量，在 LLM 眼里和一个文字 token 地位相同。', role: '剪枝对象。LLaVA 1.5 每图 576 个，每个 4096 维。' },
    projector: { term: '投影层', en: 'projector', intuition: '把视觉编码器的输出“翻译”到 LLM 词向量空间的一个小网络。', role: 'DivPrune 在投影层输出（即送入 LLM 的视觉 token）上计算余弦距离。' },
    prefill: { term: '预填充', en: 'prefill', intuition: '生成答案前，LLM 一次性处理全部输入并建立 KV cache 的阶段。', role: 'Eq. (5) 的 TFLOPs 只统计这一阶段；DivPrune 的选择也只在这一阶段做一次。' },
    kvcache: { term: 'KV cache', intuition: '把已处理 token 的键（K）和值（V）缓存起来，生成下一个词时不必重算。', role: '剪枝后缓存里只存保留的 token，因此能省显存；论文称 DivPrune 与 KV cache 兼容。' },
    mmdp: { term: '最大-最小多样性问题（MMDP）', en: 'Max-Min Diversity Problem', intuition: '从一堆元素里挑固定个数，让挑出的元素中“最近的那一对”尽量远。', role: 'DivPrune 对剪枝问题的数学表述（Eq. (3)）。' },
    cosdist: { term: '余弦距离', en: 'cosine distance', intuition: '1 减去两个向量夹角的余弦；只看方向、不看长度，范围 [0, 2]。', role: 'DivPrune 默认的距离（Eq. (4)）；Table 4 显示换成 ℓ1/ℓ2 影响很小。' },
    greedy: { term: '贪心算法', en: 'greedy algorithm', intuition: '每一步都做当下看起来最好的选择，从不回头修改。', role: 'Algorithm 1 的本质：每轮加入离已选集合最远的 token。它不保证得到 Eq. (3) 的最优解。' },
    tflops: { term: 'TFLOPs / TFLOP 比例', intuition: '万亿次浮点运算；比例是剪枝后计算量占原模型的百分比。', role: '论文对齐各方法算力的标尺（Eq. (5)）；只是理论估算，不等于实测速度。' },
    e2e: { term: '端到端延迟', en: 'end-to-end latency', intuition: '从输入到生成完整答案所用的总时间。', role: 'Table 2 中 DivPrune 从 4.37 s 降到 3.39 s；受输出长度影响。' },
    fastv: { term: 'FastV', intuition: '在 LLM 第 K 层看注意力分数，把得分低的视觉 token 剪掉。', role: '主要对手；本文实验中被配置为 K = 3、之后只保留约 1 个视觉 token。' },
    vtw: { term: 'VTW', en: 'Visual Tokens Withdrawal', intuition: '到某一层之后，把视觉 token 全部撤走。', role: '主要对手；本文关闭其校准，按 FLOPs 选层（7B 为 K = 4）。' },
    prumerge: { term: 'PruMerge', intuition: '在视觉编码器侧，根据注意力把 token 聚类、合并成少数几个。', role: '可变比例对手；DivPrune* 对齐它的平均保留比例。' },
    fitprune: { term: 'FitPrune', intuition: '用一小批校准数据，算出每层该剪多少 token 的“配方”。', role: '需要校准集的对照方法。' },
    m3: { term: 'M³（Matryoshka 多模态模型）', intuition: '通过微调，让模型学会使用嵌套的多粒度视觉 token。', role: '需要微调的对照方法；在部分数据集上高于 DivPrune。' },
    calib: { term: '校准集', en: 'calibration set', intuition: '为确定方法超参数而额外准备的一小批数据。', role: 'DivPrune 不需要；FitPrune、VTW（默认）需要。' },
    tsne: { term: 't-SNE', intuition: '把高维数据压到二维的可视化方法，擅长保留“谁和谁挨得近”。', role: 'Fig. 3(a) 用它展示选择分布；簇间距离不能直接解读。' },
    causal: { term: '因果注意力', en: 'causal attention', intuition: '每个位置只能看到它前面的位置，信息不能从后往前流。', role: '解释为什么晚剪的视觉 token 可能已把信息传给后面的问题 token（第 7 章）。' },
    se: { term: '标准误', en: 'standard error', intuition: '换一批同类题目重测时，分数大约会波动多少。', role: '描述单个模型分数的抽样波动量级；判断两个模型的差异需要同一批题目的配对分析。论文未报告任何不确定性。' },
    lmmseval: { term: 'lmms-eval', intuition: '一个开源的多模态模型统一评测工具包。', role: '论文所有基准分数都用它跑出；数据集划分由其任务名决定。' },
    ablation: { term: '消融实验', en: 'ablation study', intuition: '每次只改方法的一个部件，看效果变化多少。', role: 'Table 3（剪枝层位置）与 Table 4（距离与策略）。' },
    cider: { term: 'CIDEr', intuition: '图像描述任务的评分，衡量生成句子与多条参考描述的一致程度，可以超过 1。', role: 'COCO、Flickr、Nocaps 的指标；Fig. 1 把它与 0–1 分数直接平均。' },
};

export const VERDICT: VerdictGroup[] = [
    {
      level: 'proven',
      title: '已证明',
      desc: '在论文测试的模型、数据集与单次运行条件下，有直接数据支撑。',
      items: [
        { claim: '在约 10–17% 的 TFLOP 比例下，DivPrune 的分数普遍高于作者复现的 FastV 与 VTW。', basis: 'Table 1（3 个图像模型 × 11 个数据集）、Table 2（5 个视频数据集）、补充材料 Table 1（3 个数据集）；均在同一环境下单次运行。' },
        { claim: '论文报告的 TFLOP 比例可以按公式与代码复现。', basis: '本页按 tflops.py 口径（+2n²d）复算 16 个可核对配置，15 个与表格一致；视频模型的 FastV（14.20%）不一致，原因未知。' },
        { claim: '在 Layer 0、保留 56 个 token 时，Max-Min 规则优于随机与 Min-Max。', basis: 'Table 4：62.34 / 56.66 / 46.53（四个数据集平均，单次运行）。' },
        { claim: '在 LLaVA-NeXT-Video-7B 上，DivPrune 降低了预填充时间、端到端延迟和显存峰值。', basis: 'Table 2：0.330→0.161 s，4.37→3.39 s，14.06→13.51 GB（VideoChatGPT 499 个样本平均，8×V100）。' },
        { claim: '把距离度量换成 ℓ1 或 ℓ2，结果几乎不变。', basis: 'Table 4：62.34 / 61.94 / 62.22。' },
      ],
    },
    {
      level: 'explained',
      title: '有解释但未证实',
      desc: '论文给出了解释或一致的证据，但实验设计不足以排除其他解释。',
      items: [
        { claim: '“多样性高 → 更能代表原 token → 精度更高”的因果链。', basis: 'Fig. 3(b) 显示 DivPrune 的 Max-Min 距离更高，但这正是它直接优化的量；Table 4 的随机/Min-Max 对照与该解释一致，但没有“多样性程度 vs 精度”的剂量关系实验。' },
        { claim: '在 Layer 0 剪枝优于在中间层剪枝。', basis: 'Table 3 固定了 TFLOPs，越晚剪保留越少（本页反推为 56/39/21/2），层位置与保留数两个变量混在一起。' },
        { claim: 'FastV、VTW 端到端更慢，是因为每个解码步都要重复剪枝计算。', basis: '§4.5 的解释依赖基线的具体实现；论文未说明实现版本，也未报告输出长度。' },
        { claim: 'Algorithm 1 求得了 MMDP 的精确解 / 达到最高多样性。', basis: 'Algorithm 1 是贪心算法；5.2 的穷举对照显示贪心并非总是最优；论文未给出最优性证明。' },
        { claim: '剪枝能提升部分任务的表现（POPE、MMMU、VizWiz）。', basis: 'POPE、MMMU 的差值很小（+0.18、+0.67 个百分点），论文为单次运行、未报告不确定性，无法判断是否超出评测波动；VizWiz 的原因论文未分析。' },
      ],
    },
    {
      level: 'unknown',
      title: '仍然未知',
      desc: '论文没有提供足够证据，或者超出了论文的测试范围。',
      items: [
        { claim: '结果的波动范围有多大。', basis: '全部为单次运行，没有多次运行或置信区间。' },
        { claim: '在其他架构和更大模型上的效果。', basis: '论文只测试了 LLaVA 系列（7B、13B）。README 列出了社区移植到 Gemma、Qwen2.5-VL 的仓库，但不属于论文证据。' },
        { claim: '与问题相关的细节任务会损失多少。', basis: 'DivPrune 不看问题文本；补充材料中 TextVQA 下降约 10 分，但论文未分析原因。' },
        { claim: '在更多 token（高分辨率、长视频）下的开销与效果。', basis: '距离矩阵为 M × M，贪心循环为 M̃ 轮串行；论文最多只测到约 2300 个视觉 token（LLaVA 1.6）。' },
        { claim: '层内剪枝与视频实验能否用公开代码复现。', basis: '公开仓库没有层内剪枝与视频模型的 DivPrune 实现，也没有与 Table 2 设置一致的效率脚本。' },
      ],
    },
  ];

export const SOURCES: SourceLink[] = [
    { label: '正式版论文（CVF Open Access）', url: HTML, note: 'CVPR 2025，第 9392–9401 页；编号以此为准' },
    { label: '正式版 PDF', url: MAIN, note: '讲稿中的页码与节号指向它' },
    { label: '补充材料 PDF', url: SUPP, note: '页面中标注为 supp' },
    { label: 'arXiv 2503.02175', url: 'https://arxiv.org/abs/2503.02175', note: '预印本，不以它为准' },
    { label: '官方代码 vbdi/divprune', url: `https://github.com/vbdi/divprune/tree/${COMMIT}`, note: '固定到 commit 799e2d9' },
    { label: 'FastV 原论文（arXiv 2403.06764）', url: 'https://arxiv.org/abs/2403.06764', note: '只用于说明 FastV 的默认设定' },
  ];
