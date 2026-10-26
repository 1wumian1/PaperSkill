# 来源与主张核查记录

核查日期：2026-10-03（中国标准时间）。状态：`VERIFIED` 表示已对照原论文或作者代码/项目页；`UNVERIFIED` 表示未找到足够原文支持；`AUTHOR_INPUT_NEEDED` 表示需作者额外决定。

## 权威来源

| ID | 来源 | 用途 |
|---|---|---|
| P1 | [CVPR 2024 官方 PDF](https://openaccess.thecvf.com/content/CVPR2024/papers/Wu_V_Guided_Visual_Search_as_a_Core_Mechanism_in_Multimodal_CVPR_2024_paper.pdf) | 最终发表版方法、表格、结论 |
| P2 | [作者 arXiv v2 PDF](https://arxiv.org/pdf/2312.14135) | 全文与附录、论文原始 Figure 裁取 |
| P3 | [作者代码仓库](https://github.com/penghao-wu/vstar) | 代码和 benchmark 结构核对 |
| P4 | [作者项目页](https://vstar-seal.github.io/) | 方法、Figure 和实验辅助核对 |

P1 和 P2 的主要表格数值一致。网页 Figure 资源取自 P2，保留图内原始标注。教学性 CSS 场景不使用论文实验图像。

## 核心主张与证据

| Claim | 网页内容 | 原文位置 | 状态 |
|---|---|---|---|
| C1 | 高分辨率图缩小后，小目标细节可能被低分辨率视觉编码遗漏 | P1 §1、§3.1 | VERIFIED |
| C2 | SEAL 由 VQA LLM、视觉搜索模型与 VWM 协作构成 | P1 §3、Figure 3 | VERIFIED |
| C3 | 搜索只在初始全局特征不足以回答时启动，VQA LLM 列出缺失目标 | P1 §3.1、Algorithm 1 | VERIFIED |
| C4 | 搜索先直接定位，失败后使用目标线索或场景线索热图，递归分块并按优先级搜索 | P1 §3.3.3、Algorithm 2 | VERIFIED |
| C5 | VWM 四块是 question、global image、searched targets、target location | P1 §3.1 | VERIFIED |
| C6 | V*Bench 有 191 张 SA-1B 高分辨率图，平均 2246×1582；主任务 115 条属性识别和 76 条空间关系 | P1 §4 | VERIFIED |
| C7 | SEAL / GPT-4V / LLaVA-1.5 的 V*Bench 总体准确率为 75.39% / 54.97% / 48.68% | P1 Table 1 | VERIFIED |
| C8 | 不带搜索 LLaVA* 为 45.02%，GroundingDINO 62.30%，OWL-ViT 62.82%，V* 搜索 75.39% | P1 Table 2 | VERIFIED |
| C9 | V* 搜索长度 4.65；去掉目标线索 5.22，去掉场景线索 5.36 | P1 Table 3 | VERIFIED |
| C10 | COCO-Search18 上 V* 长度 2.80；人类注视热图为 2.52 / 2.70 | P1 §5.3、Table 4 | VERIFIED |
| C11 | 单张 A100 上平均每目标搜索耗时 6.0 秒 | P1 §5.1 | VERIFIED |
| C12 | 作者讨论自然图像/常见目标适配、文档/图表/长视频/开放世界扩展问题 | P1 §6 | VERIFIED |
| C13 | VQA LLM 使用 Vicuna-7B；搜索模型使用 LLaVA-7B-v1.1 与 OWL-ViT-B/16 图像 backbone | P1 §3、P2 附录 A.3 | VERIFIED |
| C14 | 搜索过程聚焦单个目标实例；全局直接定位多个实例时可一起加入 VWM | P2 附录 A.4 | VERIFIED |
| C15 | 30 条 OCR 与 17 条 GPT-4V-hard 是额外探索子集 | P2 附录 B | VERIFIED |

## 教学性分析的边界

- “V* 属于主动视觉感知”是本教程的研究定位：证据是 P1 中按需选择区域并取得新视觉输入的机制。论文没有把它声明为完整物理 Agent。
- 目标设置错误、场景线索错误、对象本身无法辨认等失败链是**基于方法设计的分析**，不是作者的定量结论。
- 均匀 patch、通用高分辨率方法与常规 MLLM 的比较是对 P1 §2 与 §3.3.2 的教学性概括；论文未对所有现有方法统一测量计算成本。
- 实验台的场景、搜索路径、缩放滑块和例问是教学性示意，不是模型实时输出，也不代表论文实际 benchmark 样本。

## 尚未完成的核查或实现

- 未运行作者的 PyTorch 模型、未复现实验数字；页面展示的是原论文报告结果。
- 未制作“汇报模式”，优先完成主体章节。
- 本教程没有展示所有补充表格或训练细节；需要精确复现时应读 P1 全文、P2 附录和 P3 代码。

当前没有 `AUTHOR_INPUT_NEEDED` 项。工程与学术第一版状态：`READY_WITH_WARNINGS`（未复现实验；当前机器 npm registry TLS/连接异常，使用本地 pnpm 缓存完成构建验证）。
