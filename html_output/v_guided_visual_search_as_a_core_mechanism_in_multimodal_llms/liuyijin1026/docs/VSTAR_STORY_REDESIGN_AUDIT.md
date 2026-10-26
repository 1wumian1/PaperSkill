# V* 故事重构前内容审计

日期：2026-10-03。权威：本地 CVPR 2024 正式版 `.research/vstar-cvpr.pdf` 与作者 [项目页](https://vstar-seal.github.io/)；数值继续依据正式版 Tables 1–3。页面情境均为教学示意，不是模型运行或论文实验样本。

## 基线与计数

本轮开始时 `src/content.ts` 实际列出 **5 个核心章节**，另有 Landing 和 Final。`VSTAR_CONTENT_REDUCTION_AUDIT.md` 记录的是更早的 **15 章版本**，并非当前页面。当前主要教学交互 4 个：`PassiveActive`、`SearchLab`、`MemoryLab`、`Results`。静态 `Overview`、导航、Review/Restart 不计。目录没有 Git 仓库；本轮文件哈希与大小见 `.research/story-redesign/baseline.*`，不能追溯更早未提交修改。

| current_section | current_purpose | paper_support | teaching_value | story_role | decision | merge_target | reason |
|---|---|---|---|---|---|---|---|
| Landing | 标题、方法暗示、杯子图形 | §1/Fig.1 支持问题；画面是示意 | 高 | 制造疑问 | REWRITE_FOR_STORY | Landing | 去掉提前揭示 crop 的并列图，先提出同一个问题 |
| 01 passive | 全局输入和按需搜索对照 | §1、§3.1，VERIFIED | 高 | 看见不等于看清 | MERGE | 新 §1、§2 | 现有单一 demo 同时讲动机与方案；拆成细节体验和路径选择 |
| 02 overview | 静态 SEAL 流程 | §3.1、Algorithm 1，VERIFIED | 高 | 全局地图 | REWRITE_FOR_STORY | 新 §3 | 补直接回答分支，并逐步揭示 VQA → V* → VWM → VQA |
| 03 search | 6 步杯子搜索 | §3.2.3、Algorithm 2；具体路径 UNVERIFIED，标教学示意 | 极高 | 核心方法 | KEEP | 新 §4 | 保留单一大型实验；把回答阶段移到 VWM 后，避免抢跑 |
| 04 memory | 两行李箱证据累积 | §3.1、Algorithm 1，VERIFIED；场景示意 | 高 | 新证据回到推理 | REWRITE_FOR_STORY | 新 §5 | 改用前章同一个杯子案例，清楚呈现四个 VWM block |
| 05 experiments | 三组表格 | §4、§5、Tables 1–3，VERIFIED | 高 | 检验机制 | MERGE | 新 §6 | 先解释 V*Bench 为什么检验搜索，再进入对照结果 |
| Final | 三个要点与边界 | §6、§5.1/5.4，VERIFIED | 高 | 最终回顾 | MERGE | 新 §7 + Final | 贡献与边界进入 §7；Final 只保留简短回顾、最多三题自测 |

## 旧 15 章去向

以下是历史审计中的 15 章，而非本轮将要删除的代码。`KEEP/MERGE/DELETE` 记录其到新故事线的最终归属，避免误称它们仍在当前网站。

| old_section | old_purpose | paper_support | teaching_value | story_role | decision | merge_target | reason |
|---|---|---|---|---|---|---|---|
| 01 passive | 被动感知对照 | §1/§3.1 | 高 | 动机 | MERGE | §1/§2 | 分开细节瓶颈与主动寻找选择 |
| 02 bottleneck | 编码分辨率 | §1/§3.1 | 中 | 动机 | MERGE | §1 | 只保留必要说明，不恢复滑块 |
| 03 intuition | 方法直觉 | §3.1 | 高 | 总路线 | MERGE | §3 | 和 pipeline 合并 |
| 04 pipeline | 完整流程 | Algorithm 1 | 高 | 总路线 | MERGE | §3 | 唯一总框架 |
| 05 search | 引导式搜索 | §3.2.3/Algorithm 2 | 极高 | 核心机制 | KEEP | §4 | 最大交互 |
| 06 memory | 视觉工作记忆 | §3.1/Algorithm 1 | 高 | 证据整合 | KEEP | §5 | 保持同一案例 |
| 07 human | 人类注视 | §5.3/Table 4 | 低 | 实验旁支 | DELETE | — | 主线无需独立认知比较 |
| 08 bench | 基准与样本 | §4 | 高 | 测量问题 | MERGE | §6 | 保留两类任务和规模 |
| 09 experiments | 多组结果 | Tables 1–3/5 | 高 | 证据 | KEEP | §6 | 只保留主张所需对照 |
| 10 figures | 原图画廊 | 正式版图像 | 中 | 旁支 | DELETE | — | 原论文链接可供深读，避免重复总图 |
| 11 agency | 主动性边界 | §1/§6 | 中 | 范围 | MERGE | §7 | 明确图内任务引导搜索，不扩为自主 Agent |
| 12 related | 相关路径矩阵 | §2 | 低 | 背景 | DELETE | — | 对核心机制非必需 |
| 13 contributions | 三项贡献 | §1 | 高 | 收束 | MERGE | §7 | 不独立碎片化 |
| 14 limitations | 局限 | §6/Table 5 | 高 | 边界 | MERGE | §7 | 仅保留原文有据的边界 |
| 15 review | 长复习 | 教学归纳 | 中 | 回顾 | MERGE | Final | 最多三题，短结尾 |

## 内容决定

- 保留：按需搜索、目标或上下文线索、递归分块优先级、目标 crop 与坐标、VWM 四块、V*Bench 两任务、论文主要对照结果。
- 删除：当前搜索交互中提前给出最终回答的第 6 步；它改由 §5 完成。旧人类注视专题、独立画廊、相关方法矩阵已在此前版本删除，本轮不恢复。
- 学术边界：示意画面、杯中绿色液体、搜索路径均明确标“教学示意”；结果只称论文报告，不称复现。VWM 是当前问题的工作输入，不是长期记忆。V* 不是通用 computer-use 或自主视觉 Agent。

## 证据状态

`VERIFIED`：SEAL 组成及按需搜索、VWM 四块、V* 搜索线索和递归、V*Bench 规模与任务、Tables 1–3 数值，均已对照 CVPR 正式版及作者项目页。`UNVERIFIED`：教学场景的颜色与具体搜索路径不属于论文实测，页面明确标注。`AUTHOR_INPUT_NEEDED`：无阻塞项。
