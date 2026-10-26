# V* 故事驱动重构验收

日期：2026-10-03（北京时间）。对象：`E:\PaperSkill_projects\vstar_web`。状态：`READY_WITH_WARNINGS`；网页构建和浏览器回归通过，论文实验未在本机复现，项目也没有 ESLint 配置。事实以 [CVPR 2024 正式版](https://openaccess.thecvf.com/content/CVPR2024/papers/Wu_V_Guided_Visual_Search_as_a_Core_Mechanism_in_Multimodal_CVPR_2024_paper.pdf) 为准，作者[项目页](https://vstar-seal.github.io/)交叉核对；两处用户指定参考站于本轮浏览器中均返回 200。

## 交付与计数

| # | 要求 | 本轮实际结果 |
|---|---|---|
| 1 | BEFORE_SECTION_COUNT | **5 个核心章节**，另有 Landing + Final。旧 15 章是此前已裁剪的历史版本，见 `VSTAR_CONTENT_REDUCTION_AUDIT.md`。 |
| 2 | AFTER_SECTION_COUNT | **7 个核心章节**，另有 Landing + Final。 |
| 3 | BEFORE_MAJOR_INTERACTION_COUNT | **4**：`PassiveActive`、`SearchLab`、`MemoryLab`、`Results`。 |
| 4 | AFTER_MAJOR_INTERACTION_COUNT | **6**：细节切换、行动选择、SEAL 逐步流程、V* 搜索、VWM 累积、结果 tabs。Final 自测属于轻交互。 |
| 5 | 删除的章节 | 本轮实际删除独立章节 **0**；旧 15 章中的 human、figures、related 已于此前裁剪，本轮没有假称重复删除。 |
| 6 | 合并的章节 | 原 `passive` 的“瓶颈 + 方案”拆入新 §1/§2；原 `experiments` 扩充为 V*Bench + 结果 §6；原 Final 的限制移入 §7。旧 15 章逐项去向见审计。 |
| 7 | 最终故事线 | 看不清 → 不猜、继续找 → SEAL 总路线 → V* 引导搜索 → VWM 接回回答 → V*Bench 检验 → 贡献与边界 → Final。 |
| 8 | 每章核心问题 | §1 全图为何还不够；§2 信息不足后怎么办；§3 搜索怎样接回答；§4 看哪里；§5 证据怎样保留；§6 怎样检验；§7 证明什么与不能证明什么。 |
| 9 | 每章主要交互 | §1 切换、§2 选择、§3 流程、§4 搜索、§5 累积、§6 tabs、§7 静态回放；Final 三题。 |
| 10 | Guided Visual Search | 保留先直接定位、线索选择、分块优先级、递归、原图 crop 五阶段；新增随机/顺序/V* 的示意顺序图。最终回答移到 §5，避免方法尚未闭环时抢答。 |
| 11 | Visual Working Memory | 改为同一杯子案例；按问题、全图、目标 crop、原图位置四块逐步累积，最后交给 VQA LLM。没有长期记忆设定。 |
| 12 | V*Bench / Results | 基准动机在先，191 图、115 属性、76 空间问题；再用 Table 1–3 的三个对照 tabs 解释主结果、搜索替换、线索消融。 |
| 13 | Landing | 只提出桌上杯子的局部细节问题、论文标题、作者和 CTA，不提前讲完整流程。 |
| 14 | Final | 一句总题、三个 takeaways、三道自测、Review/Restart；不增加新论文知识。 |
| 15 | Inspatio 视觉迁移 | 保留其灰蓝页背景、白色纸张卡、深蓝标题与按钮、橙交互强调、浅灰模块头、18/24px 外壳圆角及柔和阴影。已用首页及首章截图对照 [Inspatio 页面](https://reducttech.github.io/PaperSkill/papers/inspatio_world_a_real_time_4d_world_simulator_via_spatiotemporal_autoregressive_modeling/lyaqiqi0816/)。 |
| 16 | Vista4D 教学节奏 | 参考[最终 Vista4D](https://reducttech.github.io/PaperSkill/papers/vista4d_video_reshooting_with_4d_point_clouds/liuyijin09150915/)首章的问题式标题、单章承担一问、交互解释一事与章节接续；没有复制 4D 论文内容。 |
| 17 | 学术事实审计 | §3.1/Algorithm 1、§3.2.3/Algorithm 2、§4、Tables 1–3、§6 已对照本地正式版文本。未添加自主 Agent、长时记忆、反思、工具使用或虚构训练流程；示意路径与颜色明确标注。 |
| 18 | 教学示意与标注 | 桌上杯子、绿色液体、室内画面、四格顺序与逐步路径均为教学重绘，页面多处显示“教学示意”，不称论文原图或实时模型输出。 |
| 19 | Responsive QA | 浏览器实测 1440、1280、1024、768、430、375px，Hero、七章、搜索、VWM、结果、Final 无页面横向溢出；手机截图检查搜索布局。 |
| 20 | Keyboard QA | Enter 开导航与选择策略、Space 选择行动、Escape 关抽屉、结果 tabs 方向键、可见 focus outline 均实测通过。按钮均采用原生 `button`。 |
| 21 | Reduced Motion QA | 浏览器 `prefers-reduced-motion: reduce` 下过渡为 `0s`，搜索终态仍能静态查看 crop。 |
| 22 | Build | `npm run build` 通过：`tsc -b` + Vite 8.0.13。 |
| 23 | Lint / typecheck | TypeScript **PASS**，项目无 `lint` script 或 ESLint 配置，完整 lint **未配置**。 |
| 24 | localhost | Vite 在 `http://127.0.0.1:5173/` 启动；Playwright 实测 7 章推进、9 项交互/复习动作、键盘、宽度与参考站，无 `pageerror`。 |
| 25 | 修改文件 | `README.md`、`src/App.tsx`、`src/content.ts`、`src/main.tsx`、`src/components/Interactions.tsx`、`src/styles/interactions.css`、`src/styles/vstar-paper.css`。 |
| 26 | 新增文件 | `src/components/StoryInteractions.tsx`、`src/styles/story.css`、本轮三份 `docs/VSTAR_STORY_*.md`；QA 脚本、基线与截图在 `.research/story-redesign/`。 |
| 27 | 删除文件 | 六个不再使用的旧模块样式：`comparison.css`、`figures.css`、`memory.css`、`pipeline.css`、`resolution.css`、`results.css`。旧交互组件从 `Interactions.tsx` 移除；原论文图片未删。 |
| 28 | 本轮开始前已有修改 | 目录无 `.git`，无法识别更早未提交修改。开始时已存在 5 章版、Inspatio 迁移样式、4 个交互、Review/Restart；本轮 `src/docs/public` 哈希清单保存在 `.research/story-redesign/baseline.sha256`。 |
| 29 | 本轮新增修改 | 从上述 5 章基线扩为 7 章故事路径、同案贯穿、六个主交互、三题自测、显式章节桥、新审计/架构/报告；没有提交、推送、建分支、PR 或部署。 |
| 30 | 未完成项 | 未运行原作者模型或复现实验；无现成 ESLint。真人学习效果与完整屏幕阅读器审计未验证。无阻塞的 `AUTHOR_INPUT_NEEDED`。 |

## 论文事实与修订 ledger

| 位置 | 原问题 | 修订 | 证据及状态 |
|---|---|---|---|
| 原 §1 / §2 | 动机与解决方案堆在一个对照演示 | 先体验信息缺口，再选择任务相关搜索 | CVPR §1、§3.1，`VERIFIED` |
| 原 §2 Overview | 一次展示全部流程 | 逐步展开并注明足够时直接回答 | §3.1、Algorithm 1，`VERIFIED` |
| 原 §3 SearchLab | 搜索模块自身提前作答 | 只到 crop 与位置，回答移交 VWM | §3.2.3、Algorithm 2；具体轨迹 `UNVERIFIED`，已标示意 |
| 原 §4 MemoryLab | 另换行李箱案例 | 接续同一杯子案例；四块工作输入逐步出现 | §3.1、Algorithm 1，四块 `VERIFIED`；颜色示意 |
| 原 §5 Results | 直接进入结果 | 先解释 V*Bench 两类任务，再看三组对照 | §4、§5、Tables 1–3，`VERIFIED` |

## 最终门槛

| Check | Result | 依据 |
|---|---|---|
| STORY_CONTINUITY | PASS | 每章结尾有具体疑问，前五章同一个杯子案例 |
| ACADEMIC_CORE_PRESERVED | TRUE | SEAL、V*、VWM、V*Bench 和主要结果均保留 |
| UNSUPPORTED_CAPABILITY_ADDED | FALSE | 无自主 Agent、长时记忆等额外能力宣称 |
| GUIDED_SEARCH_CENTRAL | TRUE | §4 单一最大教学实验，含策略与递归搜索 |
| VWM_ACCURATE | TRUE | 四块字段及重新回答路径对照 Algorithm 1 |
| REDUNDANT_CONTENT_REMAINING | FALSE | 旧重复演示/闲置组件清理；§7 与 Final 仅简短回顾 |
| INSPATIO_VISUAL_SYSTEM_MATCH | PASS | 同 tokens、壳层、模块与交互强调；浏览器图像已对照 |
| VISTA4D_STORY_RHYTHM_MATCH | PARTIAL | 问题链和一章一问已实现；未做真人教学效果评价 |
| RESPONSIVE | PASS | 六档浏览器宽度无横向溢出 |
| ACCESSIBILITY | PARTIAL | 键盘与 reduced-motion 通过；未做完整屏幕阅读器审计 |
| BUILD | PASS | `npm run build` 成功 |

浏览器证据：`.research/story-redesign/qa-report.json`、各章截图及两个参考站截图。正式版论文网页在通用网页抓取工具中返回 403，论文事实核对使用本地正式版 PDF 全文及可访问的作者项目页；浏览器 QA 不被当作论文事实来源。
