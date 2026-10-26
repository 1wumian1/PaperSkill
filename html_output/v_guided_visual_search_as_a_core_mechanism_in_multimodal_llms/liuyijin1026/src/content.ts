export const PAPER = 'https://openaccess.thecvf.com/content/CVPR2024/html/Wu_V_Guided_Visual_Search_as_a_Core_Mechanism_in_Multimodal_CVPR_2024_paper.html';
export const PDF = 'https://openaccess.thecvf.com/content/CVPR2024/papers/Wu_V_Guided_Visual_Search_as_a_Core_Mechanism_in_Multimodal_CVPR_2024_paper.pdf';
export const CODE = 'https://github.com/penghao-wu/vstar';
export const sections = [
  ['detail', '为什么“看过”不等于“看清”？', '为什么看过全图仍答不上来？'],
  ['choice', '什么时候应该主动寻找？', 'V* 每次都启动搜索吗？'],
  ['search', 'V* 怎样决定先看哪里？', '知道目标后，先搜索哪里？'],
  ['memory', '找到以后，怎样重新回答？', '为什么不能只把 crop 交给模型？'],
  ['experiments', '怎样证明这种搜索真的有价值？', '实验怎样检验关键细节？'],
  ['synthesis', 'V* 到底推进了什么？', '研究意义与边界是什么？'],
] as const;

// Transcribed from the local CVPR 2024 paper, Tables 1–3. No derived scores.
export const results = [
  { label: '主结果', title: '搜索能否帮助细节问答？', metric: '总体准确率（%）↑', source: 'Table 1 · 代表性对比，非完整榜单', rows: [['Human',98.95],['SEAL（V*）',75.39],['GPT-4V',54.97],['LLaVA-1.5',48.68]], caption: 'SEAL 在 V*Bench 上高于这里列出的模型，但仍低于人类。GPT-4V 是论文于 2023-10-31 测试的版本，不代表当前模型排名。' },
  { label: '搜索替换', title: '用检测器替换 V* 会怎样？', metric: '总体准确率（%）↑', source: 'Table 2 · 相同 VQA 训练数据的消融', rows: [['无 VWM / 无搜索',45.02],['VWM + GroundingDINO',62.30],['VWM + OWL-ViT',62.82],['VWM + V*',75.39]], caption: '保留 VWM、把搜索换成检测器时，分数低于完整 V*。这一对照支持搜索机制的价值，并未单独隔离所有 VWM 设计的贡献。' },
  { label: '线索消融', title: '引导线索能否减少搜索步数？', metric: '平均搜索长度（步）↓', source: 'Table 3 · 搜索策略与线索消融（节选）', rows: [['Random-BFS',7.18],['Sequential-BFS',6.62],['V*',4.65],['去掉目标特定线索',5.22],['去掉上下文线索',5.36]], caption: '移除任一线索后平均步数上升。论文标注了 245 个目标位置，但步数统计只纳入成功定位样本；此表不能说明失败率或实际耗时。' },
] as const;
