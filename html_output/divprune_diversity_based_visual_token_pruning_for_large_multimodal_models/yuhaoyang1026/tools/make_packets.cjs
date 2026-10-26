// 写出组装器需要的 shared.json / packet.json / 12 个章节 JSON（全片迁移版）。
// 用法：node make_packets.cjs <work 目录> <原版深入阅读 JSON>
// 讲者备注 = 原版的“深入”折叠内容 + 出处 / 口径 / 类比边界；页面只放关键内容。
const fs = require('fs');
const path = require('path');
const work = process.argv[2];
const deep = JSON.parse(fs.readFileSync(process.argv[3], 'utf8')).chapters;
const w = (rel, obj) => fs.writeFileSync(path.join(work, rel), JSON.stringify(obj, null, 2) + '\n');

const CODE = 'https://github.com/vbdi/divprune/blob/799e2d950aa01ba7860907f5a6d86061f885dca6/';
const ARCH = CODE + 'LLaVA/llava/model/llava_arch.py';

/** 原版“深入”内容转成讲者备注（表格行改成“ | ”分隔的文字） */
function deepNotes(chapId) {
  return (deep[chapId]?.deep ?? [])
    .map((s) =>
      s.replace(/\[表\] (\[.*\])/g, (_, json) => {
        try {
          return JSON.parse(json).map((r) => '· ' + r.join(' | ')).join('\n');
        } catch {
          return '';
        }
      }).replace(/\[\[ev:[^\]]+\]\]/g, '')
    )
    .join('\n\n');
}

w('shared.json', {
  meta: {
    titleEn: 'DivPrune: Diversity-based Visual Token Pruning for Large Multimodal Models',
    titleZh: 'DivPrune：基于多样性的视觉 Token 剪枝',
    venue: 'CVPR 2025 · Saeed Ranjbar Alvar, Gursimran Singh, Mohammad Akbari, Yong Zhang · Huawei Technologies Canada',
    authors: 'Saeed Ranjbar Alvar, Gursimran Singh, Mohammad Akbari, Yong Zhang',
    affiliation: 'Huawei Technologies Canada Co., Ltd.',
    domain: '多模态大模型 · 推理加速',
    coreProblem: '只能留下一小部分视觉 token 时，按“重要性”挑会扎堆。',
    coreInsight: 'DivPrune 把剪枝写成 Max-Min 多样性问题：每轮挑离已选集合最远的 token，用少量 token 覆盖整张图；无需训练与校准。',
    keywords: ['视觉 token 剪枝', 'Max-Min 多样性', '即插即用', 'TFLOPs'],
  },
  hero: {
    oldMethod: { title: '重要性 Top-k（FastV 等）', desc: '给 token 打分只留高分，名额被相似 token 占满。', componentId: 'dp-cover' },
    newMethod: { title: 'Max-Min 多样性选择（DivPrune）', desc: '每轮挑离已选集合最远的 token，覆盖整张图。', componentId: 'dp-cover' },
  },
});

const ANALOGY =
  '统一类比：野外测绘队在一张地图上布设观测点——地图格 = 视觉 token，插旗 = 保留 token，营地 = 解码层，补给 = TFLOP 预算。';

// 每章开场页的情节说明与类比边界（与 dp-intro.tsx 中的 caption 对应，备注里给出完整版本）
const INTRO = {
  '01': { title: '地图切成格，每一格都要勘测', goal: '看清一张图会变成多少个视觉 token，以及它们在 LLM 里的工作量。', summary: 'LLaVA 1.5 一张图 576 个视觉 token；这个长度下计算量近似线性', interaction: '切换模型看格子数与每层工作量；右侧在导语 / 精读 / 要点之间切换', boundary: '类比比的是工作量（计算量），不是用时；用时与实测速度见第 9 章。' },
  '02': { title: '手电只照亮一处，按亮度插旗', goal: '理解“按重要性挑”为什么会把名额集中在一片区域。', summary: 'Top-k 不检查已选 token 之间是否重复；Max-Min 只看重复', interaction: '拖手电位置、切换插旗规则，看 6 个区域被覆盖几个', boundary: '亮度 = 示意分数；FastV 的真实分数来自第 K 层注意力，不一定集中在一处。' },
  '03': { title: '布点方案计数器永远转不完', goal: '理解理想目标为什么无法直接求解，DivPrune 换成了什么代理目标。', summary: '576 选 56 约有 10⁷⁸ 种方案；换成只看特征的多样性目标', interaction: '拖保留个数 M̃，看方案数的数量级', boundary: '方案数是组合事实；“需要多少时间”只是量级示意。' },
  '04': { title: '罗盘只读夹角，卷尺量直线', goal: '把“彼此尽量不同”写成可计算的 Max-Min 目标与余弦距离。', summary: '子集得分 = 最近一对的距离；余弦距离只看方向', interaction: '拖夹角与长度两个滑块，对比两种读数', boundary: '二维示意；真实特征为 4096 维，但“只看方向”的性质与维度无关。' },
  '05': { title: '每一针都落在最大的空白处', goal: '先直观看贪心怎样逐个落点，再进入伪代码逐步演示。', summary: '第一针选最孤立的点，之后每针落在离已有针最远处', interaction: '点“落下一针”，看空白半径逐针变小', boundary: '二维欧氏示意；真实算法在 4096 维特征空间量余弦距离。' },
  '06': { title: '把测绘图压在实地上逐项核对', goal: '先看论文与官方代码在哪些地方一致、哪里有差异。', summary: '13 个对照条目：一致 5、有差异 3、论文未说明 3、代码缺失 2', interaction: '拖动核对进度，看清单逐项亮起（数据与 6.1 同源）', boundary: '“缺失”指公开仓库里找不到对应实现，不代表作者没有做过。' },
  '07': { title: '补给固定，越晚精简装备旗越少', goal: '看清 Table 3 中“层位置”和“保留数”两个变量是怎么混在一起的。', summary: '固定约 19.6% 预算：Layer 0/1/2/3 只能留 56/39/21/2 个', interaction: '拖营地编号 K，看能布的旗数', boundary: '旗数为本页按 Eq. (5) 反推，论文没有报告。' },
  '08': { title: '三种测距工具量同一组旗', goal: '比较换距离与换规则各自的影响。', summary: '三种工具选出的最远一对各不相同，但余弦 / ℓ1 / ℓ2 的平均分只差 < 0.4', interaction: '切换卷尺 / 步数 / 罗盘，看“最远一对”怎样改变', boundary: '7 面旗的坐标是示意数据（经搜索使三种工具结果不同）；Table 4 的分数才是论文实测。原版“三把尺子都指出同一对”的说法过于理想化，本版改为“选法会变、分数接近”。' },
  '09': { title: '背包轻了 86%，全程只快两成多', goal: '区分理论 TFLOPs、预填充时间与端到端延迟。', summary: '14.10% 的 TFLOPs → 预填充约 2.05×、端到端约 1.29×', interaction: '拖背包减重比例，看两段路程的用时', boundary: '只有两个端点（原模型与 DivPrune）是 Table 2 实测，中间是线性示意。' },
  '10': { title: '两支测绘队的成绩单，先核对补给', goal: '读结果前先核对比较条件：预算对齐方式、FastV 配置与噪声。', summary: '同等补给下 FastV 第 3 层后只能留约 1 个 token', interaction: '拖 FastV 的保留数，看补给比例怎样变化（按 tflops.py 实时计算）', boundary: '补给比例由公式实时计算；“谁更好”仍以 Table 1 为准。' },
};

// 模块页：componentId、导出名、场景 id、目标、摘要、操作、备注
const MOD = {
  '1.1': { cid: 'dp-m1-pipeline', exp: 'DpM1Pipeline', scene: 'ch01-pipeline', goal: '跟随一次推理，看 DivPrune 插在流水线的哪一步。', summary: '剪枝在投影层之后、拼接之前，只在预填充时做一次', interaction: '选模型、开关 DivPrune、按上一步 / 下一步', notes: '视觉 token 数：LLaVA 1.5 为 576（24×24），LLaVA 1.6 各数据集平均 1598–2292，视频 8 帧 × 144 = 1152（§4.1、tflops.py）。问题长度取代码中各数据集平均文本长度（图像约 45、视频约 69），仅作示意。\n35 个前缀 token 是代码中硬编码的 SYS_TOKEN_LEN（' + ARCH + '#L365-L367 ）；视频模型的 DivPrune 实现不在公开代码中，前缀长度未知。\n颜色：蓝 = 当前步骤 / 视觉 token；绿 = DivPrune 保留的 token；虚框 = 被剪掉的位置。格子只表示数量，哪些位置被选中见第 5、6 章。' },
  '1.2': { cid: 'dp-m1-ledger', exp: 'DpM1Ledger', scene: 'ch01-ledger', goal: '看视觉 token 在序列里占多少，单层计算量的三项各占多少。', summary: '视觉占序列的绝大部分；二次项只占单层计算的 3%–12%', interaction: '切换模型与数据集', notes: '文本与视觉 token 数为 tflops.py 中的硬编码平均值（代码事实）；三项占比按 Eq. (5) 单层项（+ 号）计算（公式外推）。二次项与线性项之比约 2n / (4d + 2m)。\n三项用同一色相的深浅区分，不承担状态含义。' },
  '2.1': { cid: 'dp-m2-compare', exp: 'DpM2Compare', scene: 'ch02-compare', goal: '同一预算下比较 Top-k / 随机 / Max-Min 的覆盖、冗余与相关性。', summary: '没有哪种挑法在所有场景都占优：高分集中时 Top-k 扎堆，有无关离群点时 Max-Min 会浪费名额', interaction: '切换三个场景与三种方法，拖保留比例', notes: '教学示意：二维点、欧氏距离、人为构造的分数；“相关性”来自场景设定，不是模型输出，几何覆盖也不等于任务精度。真实的 FastV 分数来自 LLM 第 K 层注意力，真实的 DivPrune 在 4096 维投影特征上用余弦距离。\n表格中“最近对”= 选中点中最近一对的距离（Eq. (3) 方括号内的量），越大越不冗余。\n颜色：红 = 重要性 Top-k（旧方法）、灰 = 随机、绿 = Max-Min、蓝 = 最近的一对。' },
  '3.1': { cid: 'dp-m3-explosion', exp: 'DpM3Explosion', scene: 'ch03-explosion', goal: '把子集数量放到对数刻度上，看它离“可穷举”有多远。', summary: 'C(576, 56) ≈ 3.4 × 10⁷⁸，宇宙年龄内每秒试一百万个也只能试约 10²⁴ 个', interaction: '选 M、拖保留比例 r', notes: '组合数用对数精确计算（公式外推）；“宇宙年龄约 4.4 × 10¹⁷ 秒”“可观测宇宙原子数约 10⁸⁰”为常见数量级估计，仅作参照。\n红色 = 穷举需要的子集数（不可行）；蓝色虚线 = 参照线。' },
  '4.1': { cid: 'dp-m4-cosine', exp: 'DpM4Cosine', scene: 'ch04-cosine', goal: '只改长度、只改夹角，分别看两种距离的变化。', summary: '余弦距离只随夹角变化，向量长度不影响它', interaction: '拖夹角 θ 与 ω 的长度两个滑块', notes: 'Eq. (4)：d(γ, ω) = 1 − γ·ω / (‖γ‖‖ω‖)，范围 [0, 2]。教学示意：二维向量。\n颜色：绿 = 余弦距离（DivPrune 的度量）、灰虚线 = 欧氏距离、蓝 = 可调向量 ω。' },
  '4.2': { cid: 'dp-m4-bottleneck', exp: 'DpM4Bottleneck', scene: 'ch04-bottleneck', goal: '亲手选一个子集，体会 Max-Min 得分由“最近的一对”决定。', summary: '10 个点选 4 个，共 210 种；得分 = 子集内最近一对的距离', interaction: '在画布或按钮上点选 4 个点；显示 / 隐藏穷举最优', notes: '距离在固定纵横比坐标中计算，画面上的远近与数值一致。最优解由 210 种子集穷举得到。\n颜色：橙 = 你选的点、蓝 = 子集中最近的一对（得分）、绿虚线圈 = 穷举最优。' },
  '5.2': { cid: 'dp-m5-exact', exp: 'DpM5Exact', scene: 'ch05-exact', goal: '同时跑 Algorithm 1 与穷举，看贪心是否总能达到最优。', summary: '200 组 12 选 4 的随机点里，贪心并非总是最优', interaction: '换一组点、找一个反例；下方直方图为 200 组的统计', notes: '本页外推：比例只针对“12 个二维均匀随机点选 4 个”的玩具问题，不能直接推广到 576 个 4096 维 token；它只说明贪心不保证最优。\n论文 §3.3 称“求得了精确解”，但 Algorithm 1 是贪心，没有回溯，也没有给出最优性证明。\n颜色：绿 = 贪心选中、蓝虚线 = 穷举最优、黄 = 贪心不是最优。' },
  '6.1': { cid: 'dp-m6-codemap', exp: 'DpM6Codemap', scene: 'ch06-codemap', goal: '逐条对照论文描述与官方代码（固定 commit 行号）。', summary: '主干一致；候选集 R、保留比例、Eq. (5) 符号有差异；层内剪枝与视频模型代码缺失', interaction: '按状态筛选，点条目查看论文 / 代码 / 结论', notes: '代码摘录逐字取自 commit 799e2d9，页面只留关键 2–4 行，完整上下文见 GitHub 链接。\n补充：位置编码在 generate 路径中按剪枝后长度重新连续编号（代码推断，未运行验证）；run_Divprune.sh 运行名写 7B、实际加载 13B（第 8、15 行）。\n颜色：绿 = 一致、黄 = 有差异、蓝 = 论文未说明、红 = 公开代码缺失。第 6 章开场的核对清单读同一份数据。' },
  '6.2': { cid: 'dp-m6-keep', exp: 'DpM6Keep', scene: 'ch06-keep', goal: '看保留个数怎么算，以及保留 token 送入 LLM 时的顺序。', summary: 'M̃ = int(round(r·M))；送入 LLM 前按位置排序，选择顺序被丢弃', interaction: '拖 SUBSET_RATIO、选 M、切换两种顺序', notes: '代码事实：llava_arch.py 第 153 行 threshold_terms = int(round(threshold_ratio * image_feature_length))；L378–L381 keep_indexs.sort()。\n图块图是程序生成的 24×24 示意场景（固定 576 个图块，特征为颜色向量），只用于展示选择与排序逻辑；保留个数按代码公式对任意 M 计算。\n补充材料写“剪枝率 91.2%”，按它只能保留 51 个，TFLOPs 与 Table 1 不符。' },
  '7.1': { cid: 'dp-m7-budget', exp: 'DpM7Budget', scene: 'ch07-budget', goal: '看固定预算下，越晚剪枝每层能留的 token 越少。', summary: 'Layer 0/1/2/3 只能留 56/39/21/2 个，层位置与保留数两个变量混在一起', interaction: '切换剪枝层；打开“假设保留数相同”看 TFLOPs 会涨多少', notes: '保留数 39 / 21 / 2 为本页按 Eq. (5) 反推（公式外推），复算的 TFLOP 比例与 Table 3 一致；Table 3 的分数为论文实测（MMB、MMMU、POPE、SQA 四列平均）。\n正文说该消融“使用 5 个数据集”（§4.6），表中只有 4 列。19.61% 与 Table 1 的 15.63% 是同一配置，差别来自取平均的数据集不同。\n颜色：浅蓝 = 剪枝前、绿 = 保留、灰 = 文本、橙虚线 = 读者选的剪枝层。' },
  '7.2': { cid: 'dp-m7-causal', exp: 'DpM7Causal', scene: 'ch07-causal', goal: '看因果注意力下，晚剪的 token 是否已把信息传给问题 token。', summary: '信息只能向后流；第 K 层后剪，被剪 token 的信息已混入问题 token', interaction: '选剪枝位置，点“逐层播放”', notes: '教学示意：用“信息集合的并集”粗略代表注意力的混合作用，真实模型中信息的强弱由注意力权重决定。位置 = 前缀 2、视觉 8、问题 4，共 5 层。\n颜色：绿 = 来自保留 token 的信息、浅蓝 = 来自被剪 token 的信息、橙虚线 = 剪枝位置。' },
  '8.1': { cid: 'dp-m8-strategies', exp: 'DpM8Strategies', scene: 'ch08-strategies', goal: '同一张示意图上比较五种挑法，对照 Table 4 实测分数。', summary: '余弦 62.34、ℓ1 61.94、ℓ2 62.22、随机 56.66、Min-Max 46.53', interaction: '切换五种策略；随机可换一组', notes: '左侧为教学示意（程序生成的场景、4 维颜色特征、Min-Max 用贪心近似）；右侧分数直接取自 Table 4（LLaVA 1.5-7B，保留 56 个，TFLOP 19.61%，单次运行）。\n正文“低约 5.6%”“低约 15.8%”是百分点差；相对降幅约 9.1% 与 25.4%（公式外推）。\n颜色：绿 = Max-Min 系列、灰 = 随机、红 = Min-Max（反面对照）。' },
  '9.2': { cid: 'dp-m9-race', exp: 'DpM9Race', scene: 'ch09-race', goal: '把理论 TFLOPs、预填充、端到端、显存放在一起比较。', summary: '14.10% 的 TFLOPs → 预填充约 2.05×、端到端约 1.29×、显存少 0.55 GB', interaction: '切换指标；时间类指标点“开跑”', notes: '全部数值取自 Table 2（LLaVA-NeXT-Video-7B，VideoChatGPT 499 个样本平均，8 × V100，batch = 1）。跑道进度与实测时间成正比；深色段为预填充。\n正文“快约 55%”“少约 400MB”与表格算出的 51.2%、0.55 GB 不一致，原因未知。\n颜色：灰 = 原模型、紫 = VTW、红 = FastV、绿 = DivPrune。' },
  '10.1': { cid: 'dp-m10-results', exp: 'DpM10Results', scene: 'ch10-results', goal: '浏览各表各数据集的分数，并在两种差值口径间切换。', summary: '高剪枝率下 DivPrune 普遍领先同类即插即用方法；小差距无法判断方向', interaction: '选结果表、数据集、差值口径；可显示校准 / 微调 / 可变比例方法', notes: '表格数值逐格转录自 Table 1 / 2 与补充材料 Table 1。论文为单次运行，没有逐样本结果或置信区间，本页不估算误差带、不做显著性判断。\nTFLOP 列中 “Variable” 表示保留数随样本变化。△ = 使用校准集，• = 使用微调；DivPrune* = 对齐 PruMerge 保留比例的 DivPrune。\n颜色：只有 DivPrune（绿）、FastV（红）、VTW（紫）用语义色，其余方法统一用灰蓝。' },
  '10.2': { cid: 'dp-m10-fairness', exp: 'DpM10Fairness', scene: 'ch10-fairness', goal: '检查 FastV 的低分有多少来自配置，以及 Fig. 1 的平均方式。', summary: '随机留 56 个已比 FastV 高出一大截；Fig. 1 的排序对平均方式不敏感', interaction: '切换检查项 A / B；B 中切换平均方式', notes: 'A：FastV 来自 Table 1（K = 3，之后约保留 1 个，15.69%），随机来自 Table 4（Layer 0 保留 56 个）；两组数字跨表，比较只能作为提示（本页推断）。\nB：Fig. 1 纵轴 = COCO CIDEr、OKVQA、POPE、MMB 的平均（后三项 ÷ 100）；复算原模型 0.783、DivPrune 0.721，与图中读数一致（目测读图）。CIDEr ÷ 原模型值为本页外推。' },
};

const CHAPTERS = [
  { n: '01', title: '01 · 一张图 = 576 个 token', mods: ['1.1', '1.2'], next: ['看一次推理里 DivPrune 插在哪里', '这些 token 占了多少计算', '按“重要性”挑 token 为什么会扎堆'] },
  { n: '02', title: '02 · 按“重要性”挑会扎堆', mods: ['2.1'], next: ['同一预算下三种挑法的对比', '理想目标为什么算不动'] },
  { n: '03', title: '03 · 理想目标算不动', mods: ['3.1'], next: ['子集数量到底有多大', '“彼此尽量不同”怎样写成目标'] },
  { n: '04', title: '04 · Max-Min：最近的一对尽量远', mods: ['4.1', '4.2'], next: ['余弦距离只看方向', '亲手找一个子集的短板', 'Algorithm 1 怎样一个个挑'] },
  { n: '05', title: '05 · Algorithm 1', mods: ['5.1', '5.2'], next: ['照着伪代码跑一遍', '贪心一定是最优吗', '论文伪代码和官方代码一致吗'] },
  { n: '06', title: '06 · 从伪代码到 LLaVA', mods: ['6.1', '6.2'], next: ['逐条对照论文与代码', '留几个、按什么顺序放回去', '在第几层剪最好'] },
  { n: '07', title: '07 · 在哪一层剪', mods: ['7.1', '7.2'], next: ['固定预算下每层留几个', '晚剪的 token 留下了什么', '换距离、换规则哪个影响大'] },
  { n: '08', title: '08 · 尺子不重要，规则才重要', mods: ['8.1'], next: ['五种挑法与 Table 4', '省下的算力能换多少速度'] },
  { n: '09', title: '09 · 理论算力 ≠ 实际速度', mods: ['9.1', '9.2'], next: ['按 tflops.py 复算 TFLOP 比例', '四种指标放在一起比', '结果亮眼，比较条件公平吗'] },
  { n: '10', title: '10 · 先对口径再下结论', mods: ['10.1', '10.2'], next: ['逐表浏览结果与差值', 'FastV 输在哪里', '哪些结论已证明、哪些仍未知'] },
];

// 两张样张沿用 v8 样张的模块定义与备注
const SAMPLE = {
  '5.1': {
    module: { kind: 'module', id: '5.1', title: '照着伪代码跑一遍 Algorithm 1', desc: '每按一次“下一步”，画布、数组 D、伪代码行与反馈一起更新；也可以先猜下一点再揭晓。', componentId: 'dp-stepper' },
    scene: {
      id: 'alg1-stepper', title: '5.1 · Algorithm 1 的两阶段贪心选择', goal: '逐步计算数组 D，看每轮的 argmax 选中谁；也可以先猜再揭晓。',
      summary: '第一阶段选最孤立的点，第二阶段反复选离已选集合最远的点',
      interaction: '切换点集与演示方式，按下一步 / 自动播放；挑战模式下在画布上点出预测的点（或用列表选择编号）',
      notes:
        'Algorithm 1（论文原文，第 1–22 行）：\n' +
        '1 M̃: subset size; Ev: visual tokens; Ẽv: selected subset\n2 Initialize Ẽv=[] and R = Ev\n3 // First stage: add the first token\n4 D = [] initialize the distance array\n5 for i in R do\n6   dmin = +inf\n7   for j in R do\n8     If (i ≠ j & d(i, j) ≤ dmin) then dmin = d(i, j)\n9   Add dmin to D\n10 k = R[arg max (D)]\n11 move k from R to Ẽv\n12 // Second stage: iteratively add the subsequent tokens\n13 while |Ẽv| < M̃ do\n14   D = [] initialize the distance array\n15   for i in R do\n16     dmin = +inf\n17     for j in Ẽv do\n18       If d(i, j) ≤ dmin then dmin = d(i, j)\n19     Add dmin to D\n20   k = R[arg max (D)]\n21   move k from R to Ẽv\n22 Return Ẽv\n' +
        '页面只显示当前步骤最关键的几行（含原始行号），完整伪代码见上。\n' +
        '教学示意：24 个二维点、欧氏距离，代替真实的 4096 维投影特征与余弦距离；选择逻辑与 Algorithm 1 一致（并列时取编号最小者）。数组 D 的柱高按本轮最大值缩放，不同轮请比较柱顶数值。\n' +
        '两阶段 D 的定义不同：第一阶段是“到其他候选的最近距离”，第二阶段是“到已选集合的最近距离”；只有第二阶段每轮被选点的 D 不增（可能相等）。\n' +
        '实现差异：伪代码把选中的 k 移出 R；官方代码没有移出，每轮对全部候选计算到已选集合的最小距离，靠“到自身距离为 0”避免重复（' + ARCH + '#L161-L170 ）。\n' +
        '开销：全部两两距离用一次矩阵乘法算好；距离矩阵约 576² × 4096 ≈ 1.4 × 10⁹ 次乘加，只占一次预填充的 0.04%–0.08%（本页外推），但 Table 2 中 DivPrune 的预填充比 FastV / VTW 多约 11 ms。\n' +
        '颜色：蓝 = 当前计算（最近者连线、D 柱）；绿 = 被选中（argmax 柱、Ẽv 中的点）；橙 = 你的预测；红 = 预测错误。',
      componentId: 'dp-stepper', moduleId: '5.1',
    },
  },
  '9.1': {
    module: { kind: 'module', id: '9.1', title: 'TFLOPs 复算器', desc: '选论文配置或以其为起点自定义，按 tflops.py 同口径复算并与表格比对；高级口径中有三个口径开关。', componentId: 'dp-calc' },
    scene: {
      id: 'tflops-calc', title: '9.1 · 按 tflops.py 复算 TFLOP 比例', goal: '选论文配置看能否复现；再以它为起点自定义，或切换口径开关。',
      summary: '16 个可核对配置中 15 个与论文一致；视频模型 FastV 的 14.20% 无法复现',
      interaction: '常用参数：选论文配置、以其为起点自定义（模型、保留规则、K、保留量）、回到起点、恢复默认；高级口径：三个开关',
      notes:
        '口径：与官方 tflops.py（' + CODE + 'tflops.py ）逐行一致——每层 4μd² + 2μ²d + 2μdm，前 K 层按完整长度 μ = N + M、其余 T − K 层按剪枝后长度 μ̃ = N + M̃ 计算，再除以原模型；TFLOP 比例取各数据集比例的算术平均。只计 LLM 解码层的预填充，不含视觉编码器与逐词解码。\n' +
        '论文 Eq. (5) 印刷为 “−2μ²d”，按它算 LLaVA 1.5-7B 为 16.50%，与表格不符；代码为 “+2n²d”，可复现 16 个可核对配置中的 15 个（本页外推核对）。\n' +
        '视频模型 FastV 的 14.20% 无法复现：论文没有单独给出视频模型的基线超参数，按 K = 3 保留 2 或 3 个 token 分别得到 14.15% 与 14.22%，原因未知。\n' +
        'FastV 配置：K = 3，R = 0.001（补充材料 §5），按“保留比例”解读才能复现 15.69%；与 FastV 默认的“第 2 层后留一半”相差很远。VTW：关闭校准，7B 用 K = 4。\n' +
        '自定义：从论文配置切到自定义时，完整复制模型、数据集范围、K 与保留规则；未改动时结果与预设一致。切换模型时 K 在同一次状态更新里约束到新模型的层数。\n' +
        '理论 ≠ 实测：Table 2（LLaVA-NeXT-Video-7B，8 × V100）中 14.10% 的 TFLOPs 换来约 2.05× 预填充提速、1.29× 端到端提速、显存少 0.55 GB；正文“快约 55%”“少约 400MB”与表格算出的 51.2%、0.55 GB 不一致，原因未知。\n' +
        '颜色：绿 = 复现一致 / DivPrune；红 = FastV（旧方法）；紫 = VTW；橙 = 用户自定义；黄 = 复算不一致。',
      componentId: 'dp-calc', moduleId: '9.1',
    },
  },
};

const chapterFiles = [];
const widgets = [
  { componentId: 'dp-cover', exportName: 'DpCover', file: 'dp-cover.tsx' },
  { componentId: 'dp-guide', exportName: 'DpGuide', file: 'dp-guide.tsx' },
  { componentId: 'dp-stepper', exportName: 'DpStepper', file: 'dp-stepper.tsx' },
  { componentId: 'dp-calc', exportName: 'DpCalc', file: 'dp-calc.tsx' },
];

// ---------- chap-1 导读 ----------
chapterFiles.push('chap-1.json');
w('packets/p1/chap-1.json', {
  kind: 'chapter', id: 'chap-1', title: '导读', modules: [],
  scenes: [{
    id: 'guide', title: '关键数字与阅读路线', goal: '先看四个数字和它们的实验条件，再按目的选一条路线。',
    summary: '保留 56/576 个视觉 token、TFLOP 比例 15.63%、无需训练、预填充 2.05×',
    interaction: '点路线卡片跳到路线第一章的开场页',
    next: '一张图进了模型，要处理多少个视觉 token',
    notes:
      '四个数字的出处与条件：\n' +
      '① 56 / 576：LLaVA 1.5 每张图 576 个视觉 token；官方代码 SUBSET_RATIO = 0.098，DivPrune 函数中保留数 = int(round(0.098 × 576)) = 56（' + ARCH + '#L146-L171 ）。代码事实。\n' +
      '② 15.63%：Table 1，LLaVA 1.5-7B 上 DivPrune 的 TFLOP 比例，是 11 个数据集比例的算术平均（单个数据集 11.70%–23.89%）。论文实测。\n' +
      '③ 0：DivPrune 不需要训练、微调或校准数据，只用视觉 token 自身的特征（§3、§4.1）。论文实测。\n' +
      '④ 2.05×：Table 2，LLaVA-NeXT-Video-7B，8 × V100 32GB，VideoChatGPT 499 个样本平均；预填充 0.330 → 0.161 s。同表端到端只快约 1.29×（4.37 → 3.39 s），显存峰值少 0.55 GB。原版首页漏写了“视频模型”这一条件，本版补上。\n' +
      '三条阅读路线来自原版十章结构，分别跳到第 2、6、7 章的开场页。\n' +
      '“读前须知”三条边界分别对应第 9 章（理论 FLOPs ≠ 实测速度）、第 5 章（贪心不保证 Eq. (3) 最优）、第 2 / 10 章（几何多样性 ≠ 任务精度）。\n' + ANALOGY,
    componentId: 'dp-guide',
  }],
});

// ---------- chap-2 … chap-11：原版第 01–10 章 ----------
CHAPTERS.forEach((ch, idx) => {
  const id = `chap-${idx + 2}`;
  const it = INTRO[ch.n];
  const introCid = `dp-intro-${ch.n}`;
  widgets.push({ componentId: introCid, exportName: `DpIntro${ch.n}`, file: `${introCid}.tsx` });
  const modules = [];
  const scenes = [{
    id: `ch${ch.n}-intro`, title: it.title, goal: it.goal, summary: it.summary, interaction: it.interaction,
    next: ch.next[0],
    notes: [ANALOGY, '本页情节：' + it.title + '。类比边界：' + it.boundary, '右侧“精读”“要点与误区”两层分别对应原版的洞察 / 关键数字与要点 / 误区。', deepNotes(`chap-${Number(ch.n)}`)].filter(Boolean).join('\n\n'),
    componentId: introCid,
  }];
  const orig = deep[`chap-${Number(ch.n)}`];
  ch.mods.forEach((mid, k) => {
    const next = ch.next[k + 1] ?? '';
    if (SAMPLE[mid]) {
      modules.push(SAMPLE[mid].module);
      scenes.push({ ...SAMPLE[mid].scene, next });
      return;
    }
    const m = MOD[mid];
    const om = orig.modules.find((x) => x.id === mid);
    widgets.push({ componentId: m.cid, exportName: m.exp, file: `${m.cid}.tsx` });
    modules.push({ kind: 'module', id: mid, title: om.title, desc: om.desc, componentId: m.cid });
    scenes.push({
      id: m.scene, title: `${mid} · ${om.title}`, goal: m.goal, summary: m.summary, interaction: m.interaction, next,
      notes: m.notes, componentId: m.cid, moduleId: mid,
    });
  });
  chapterFiles.push(`${id}.json`);
  w(`packets/p1/${id}.json`, { kind: 'chapter', id, title: ch.title, modules, scenes });
});

// ---------- chap-12 收束 ----------
widgets.push(
  { componentId: 'dp-end-verdict', exportName: 'DpEndVerdict', file: 'dp-end-verdict.tsx' },
  { componentId: 'dp-end-glossary', exportName: 'DpEndGlossary', file: 'dp-end-glossary.tsx' },
  { componentId: 'dp-end-sources', exportName: 'DpEndSources', file: 'dp-end-sources.tsx' },
);
chapterFiles.push('chap-12.json');
w('packets/p1/chap-12.json', {
  kind: 'chapter', id: 'chap-12', title: '收束', modules: [],
  scenes: [
    {
      id: 'verdict', title: '结论分级：已证明 / 有解释 / 仍未知', goal: '把全片的结论按证据强度分成三级，逐条看依据。',
      summary: '已证明 5 条、有解释但未证实 5 条、仍然未知 5 条', interaction: '切换等级，点论断查看依据', next: '术语表',
      notes: '分级标准：已证明 = 在论文测试的模型、数据集与单次运行条件下有直接数据支撑；有解释但未证实 = 有解释或一致证据，但实验设计不足以排除其他解释；仍然未知 = 没有足够证据或超出测试范围。\n测绘队复盘：地图格（视觉 token）怎么切、旗（保留 token）怎么插已经讲清；补给（TFLOPs）与全程用时（端到端）的差距、比赛条件（FastV 配置）的公平性，是读结果时最需要先核对的两件事。\n' + ANALOGY,
      componentId: 'dp-end-verdict',
    },
    {
      id: 'glossary', title: '术语表', goal: '查一个术语的直觉解释，以及它在本文中的作用。',
      summary: '23 个术语：模型结构、算法、指标与对照方法', interaction: '点术语查看解释', next: '来源与证据边界',
      notes: '术语表移植自原版；每条包含“直觉”和“在本文中的作用”。标准误一条只描述单个模型分数的抽样波动，判断两个模型的差异需要同一批题目的配对分析。',
      componentId: 'dp-end-glossary',
    },
    {
      id: 'sources', title: '来源与证据边界', goal: '查看四种内容口径、来源链接，以及贯穿全片的证据边界。',
      summary: '论文实测 / 代码事实 / 公式外推 / 教学示意；代码固定到 commit 799e2d9', interaction: '点链接在新标签页打开来源', next: '',
      notes: '代码引用全部固定到 commit 799e2d950aa01ba7860907f5a6d86061f885dca6；核心文件最后修改于 commit 689ab4d（2025-03-23）。编号、数字以 CVPR 2025 正式版及补充材料为准，arXiv 预印本仅供参考。\n本版（v8）相对原版修正的内容见 SAMPLE-NOTES.md。',
      componentId: 'dp-end-sources',
    },
  ],
});

w('packets/p1/packet.json', { chapters: chapterFiles, widgets });
console.log(`packets written: ${chapterFiles.length} chapters, ${widgets.length} widgets`);
