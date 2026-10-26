# V* 内容架构与裁剪审计

审计日期：2026-10-03。此文件先于业务代码修改生成。

## Intake / 来源

任务：现有 React 教程的结构重组、内容裁剪与 Inspatio 视觉延续；不发布、不提交 Git。
权威顺序：CVPR 2024 正式版 `.research/vstar-cvpr.pdf` / `.txt` > 预印本 `.research/vstar.pdf` / `.txt` > 旧网页。
已读：现有全部 15 章节、Landing、Final、7 个模块组件及 Review；论文方法、实验、结论；本地 Inspatio 源码、tokens、组件、App、Hero 与参考截图。
参考源码溯源：`.research/visual-migration/reference-manifest.json`，commit a94f6089b9c0b7a83947e854a5014403ca3975e1。来源为用户指定 PaperSkill 仓库和页面。
在线 paper/参考页抓取工具分别返回 403 / inaccessible；论文事实依据本地正式版全文核对。参考页后续在浏览器回归时再检查。
目录没有 .git：开始前 git status / git diff --stat 均失败；不得声称工作区干净或知道原有未提交差异。已保存本轮源码与 package.json 到 `.research/content-reduction/before/`。

## 计数口径

原 `.chapter` = 15（包括旧复习）；其中核心内容/专题 14 + Final 1。Landing 不计。
新核心章节 = 5；另有 Landing 和 Final，总屏幕节点 7；新内容区块（含 Final）= 6。
原主要教学交互 = 8：PassiveActive、ResolutionDemo、PipelineExplorer、SearchLab、MemoryLab、BenchExplorer、FigureGallery、Review。
新主要教学交互 = 4：感知对照、搜索实验、证据累积、结果切换。导航/进度/重置不算教学交互。

## 逐章节决策

| CURRENT_SECTION | CURRENT_PURPOSE | PAPER_SUPPORT | TEACHING_VALUE | DECISION | MERGE_TARGET | REASON |
|---|---|---|---|---|---|---|
| Landing | 标题、方法预览、四卡片 | §1/Fig.1；混入完整方法 | 标题高，重复预览低 | MERGE | Landing/§2 | 仅标题、一句话、静态核心视觉与 CTA；删四卡片 |
| 01 passive | 感知差别 | §1/§3.1 VERIFIED；场景为教学示意 | 高 WHY | KEEP | §1 | 保留唯一对照 |
| 02 bottleneck | 编码分辨率 | §1/§3.1 VERIFIED | 必要背景，但重复演示 | MERGE | §1 | 合并一句原因；删滑块 |
| 03 intuition | 整体流程 | §3.1/Alg.1 VERIFIED | 高 WHAT | MERGE | §2 | 与 pipeline 合并 |
| 04 pipeline | 可点击流程步骤 | §3.1/§3.2/Alg.1–2 VERIFIED | 总览高，额外交互低 | MERGE | §2 | 用一张含直接回答分支的静态图 |
| 05 search | 引导式搜索 | §3.2/Alg.2 VERIFIED；场景为教学示意 | 核心 HOW | KEEP | §3 | 一台实验；呈现线索选择、递归、停止、局部证据 |
| 06 memory | 四类输入 | §3.1/Alg.1 VERIFIED | 核心 HOW | KEEP | §4 | 从切换卡片改为证据逐步累积；无长期记忆 |
| 07 human | 人类注视比较 | §5.3/Table4 VERIFIED | 对五个问题非必需 | DELETE | — | 不做独立认知科学旁枝 |
| 08 bench | 基准细节与示例 | §4 VERIFIED | 实验背景必要 | MERGE | §5 | 留191图、115/76、两任务；删除独立实验与例图 |
| 09 experiments | 四组结果 | Tables1–3/5 VERIFIED | 高 DOES IT WORK | KEEP | §5 | 单结果模块，三个视图；Table5仅保留边界说明 |
| 10 figures | 七张原图切换 | 预印本图号与正式版不一致 | 主故事重复 | DELETE | — | 原图深读改为论文链接；不再复制总体图 |
| 11 agency | 主动性边界 | 原文 + 教学分析 | 必要边界，长专题重复 | MERGE | §1/Final | 仅保留图像内部搜索范围 |
| 12 related | 四路径比较 | 原文 + 教学分类 | 低；重复动机 | DELETE | — | 不保留泛化方法矩阵 |
| 13 contributions | 三项贡献 | §1 VERIFIED | 重复总览/结果 | MERGE | §2/§5/Final | 不独立设章 |
| 14 limitations | 六限制、四推断 | 正文与预印本混合 | 高，但过长 | MERGE | Final | 只留正式版域限制、搜索时间、非全面提升三项 |
| 15 review | 十题与总结 | 教学归纳 | 复习价值，冗余高 | MERGE | Final | 三个takeaways、三限制、Review/Restart；无quiz |

## 冻结架构与主张模型

研究问题：高分辨率拥挤图像中，固定全局视觉输入缺少细节时怎样取得任务相关证据？
中心主张：SEAL 用 V* 定位缺失目标，再通过 VWM 把目标 crop 和位置交给 VQA LLM。

| ID | 保留主张 | 证据 | 边界 | 状态 |
|---|---|---|---|---|
| C1 | 缩小全图可能遗漏小目标细节 | E1 CVPR §1 | 论文所讨论模型，不代表2026所有MLLM | VERIFIED |
| C2 | 不足时列出目标；足够时可直接回答 | E2 §3.1/Alg.1 | 静态图像 VQA | VERIFIED |
| C3 | 先定位，目标线索弱时用上下文，再按优先级递归搜索 | E3 §3.2.3/Alg.2 | 示意不是真实模型输出，不保证成功 | VERIFIED |
| C4 | VWM 含问题、全图、目标crop、位置；失败状态也记录 | E4 §3.1/Alg.1 | 工作输入，不是跨任务记忆 | VERIFIED |
| C5 | V*Bench和消融支持该机制 | E5 Tables1–3 | 191图；历史模型；步数仅成功定位样本 | VERIFIED |

冻结顺序：Landing → WHY §1 → WHAT §2 → HOW Search §3 → HOW Memory §4 → DOES IT WORK §5 → SO WHAT Final。
与前人差异以论文比较为限：固定输入的 LLaVA；检测器替换 GroundingDINO/OWL-ViT；不引入后续 autonomous agent。

## 学术修订 ledger

| 位置 | 原问题 | 修订 | 原因/证据 |
|---|---|---|---|
| 全站来源 | §3.3 与 Figure4–8 混用预印本编号 | 主故事统一 CVPR §3.2 与 Algorithms1–2 | 正式版方法编号已核对 |
| 搜索 | 示意最终只显示框和目标名字 | 展示裁取后的绿色液体与回答；标为教学示意 | 解释新增视觉证据，不冒充运行模型 |
| VWM | 四张卡同时出现，只切高亮 | 先问题/全图，再逐个加入crop/位置，最后回答 | Alg.1 的累积顺序 |
| Results | “不只是多给crop”等宽泛因果措辞 | 限定为表2检测器替换结果；不声称独立隔离memory效果 | Table2 对照范围 |
| 全站进度 | 只有滚动百分比 | 五个概念完成进度与逐章解锁；复习不改变完成量 | 教学设计，非论文事实 |

AUTHOR_INPUT_NEEDED：无阻塞项。学习时间与真实学生理解程度 UNVERIFIED，不能通过浏览器测试证明。
