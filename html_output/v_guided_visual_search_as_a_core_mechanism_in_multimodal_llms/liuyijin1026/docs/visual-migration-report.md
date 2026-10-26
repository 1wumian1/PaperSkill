# V* 全站视觉系统迁移验收记录

日期：2026-10-03。范围：当前独立 V* React/TypeScript 项目的视觉系统迁移。依据当前源码；未读取或复制 Vista4D 代码。

**状态：READY_WITH_WARNINGS。现有 15 章视觉迁移已覆盖；下述原有功能缺口不能被写成已完成回归。**

## 真实基线与保护边界

- 开始与结束均执行了 `git status --short`、`git diff --stat`。当前目录及父目录无 Git 仓库，命令报告 `not a git repository`。没有初始化仓库。
- 本轮开始前已有完整第一版：8 个 `src` 文件、论文图像、`docs/source-audit.md`、README、构建配置、依赖、dist 和 `.research` 资料。无法据 Git 区分更早的提交与未提交修改；没有将它们归为本轮成果。
- 修改前将整个 `src` 和 `package.json` 保存至 `.research/visual-migration/before/`。本轮差异以该快照为准，既有研究资料未删除。
- 真实第一版是全部 15 章同时呈现：Sidebar 锚点、页面滚动进度、逐步实验、10 张复习翻卡和各实验自己的重置。**不存在章节解锁/未解锁隐藏、独立 Review Mode、全局 Restart 或评分 Quiz。** 本轮只迁移视觉，没有新增这些状态机。
- AST 比对确认 `App.tsx` 和 `Interactions.tsx` 的 hooks、事件处理、元素 ID、教学数据数组均与快照一致。`src/content.ts` 完全未修改（SHA256：`B677397AF4CE53C3C50ABC07E94784D0B31F1ECC3039120C276D249C6F243140`）。
- 论文数字、算法叙述、章节顺序、2024 年范围、论文图像均保留。本轮没有重新进行学术事实审稿或模型复现；已有事实核查记录仍见 `docs/source-audit.md`。

## Inspatio 来源与提取结果

[官方参考页面](https://reducttech.github.io/PaperSkill/papers/inspatio_world_a_real_time_4d_world_simulator_via_spatiotemporal_autoregressive_modeling/lyaqiqi0816/)；[官方源码目录](https://github.com/ReductTech/PaperSkill/tree/main/html_output/inspatio_world_a_real_time_4d_world_simulator_via_spatiotemporal_autoregressive_modeling/lyaqiqi0816)。访问日期 2026-10-03，GitHub tree SHA `a94f6089b9c0b7a83947e854a5014403ca3975e1`，文件 blob SHA 与来源保存在 `.research/visual-migration/reference-manifest.json`。

已读 `tokens.css`、`components.css`、`paper.css`、`ppt-mode.css`、`App.tsx`、Hero/Module/ChapterBridge/PptBars，以及 hero-new、m1-problems、m8-arch、m10-race 模块。提取 UI 外壳与设计规则，未引入参考论文的模型、场景、实验或数值。

| 系统 | 参考规则 | V* 映射 |
|---|---|---|
| Palette | gray-blue page、white paper、blue guidance、orange action、green success、red failure、purple auxiliary | 原有正确色值保留；统一状态、背景、边框语义；补充少量可读文本深色别名 |
| Typography | Segoe UI/PingFang SC/Hiragino Sans GB/Arial；Cascadia Code/SFMono/Consolas | 54px/900 Hero；30px/800 chapter；18px/800 module；18px body；16px description；13–15px 注释和控件 |
| Spacing | main 1120/28px；chapter 32px；module header 14×20px、body 18×22×22px | 共享变量与壳组件；现有 Sidebar 占位时限制可用宽度；窄屏增加导航留白 |
| Shape | 24/18/12/8/999px | Hero/chapter/module/card/control/pill 分层 |
| Shadow | 0 12px 34px rgba(25,42,70,.08) | Hero、chapter 统一柔和阴影；小卡片以边框为主 |
| Motion | 160/280/480ms；统一 ease-out/ease-in-out/spring | 控件及场景状态过渡使用同一组 tokens；reduced-motion 关闭过渡，保留静态结果 |
| Accessibility | 3px rgba(39,68,110,.4) outline，offset 3px | 按钮、链接、滑块、卡片共用焦点规则；无 outline:none |

静态检查核对了 **30 项已有共享颜色、字体、半径、阴影、motion tokens，均与 Inspatio 值完全一致**。间距与字号变量是在同一体系内补充的命名，不声称参考源码原本具有这些变量名。

## 逐项交付与验收（对应请求 1–31）

| 项 | 结果 |
|---|---|
| 1 全站迁移 | 覆盖 Landing、15 章、7 个交互模块、图表/结果、Sidebar、Final；不是仅修改首页。 |
| 2 修改文件 | 7 个既有源码文件修改、10 个源码文件新增；另新增本文报告，测试/参考/截图在 `.research/visual-migration/`。详细列表见下文。 |
| 3 Tokens | 页面 #eef2f7/#f7f9fc；白色卡片；主蓝 #27446e、橙 #f07e47；成功/警告/失败/辅助紫统一。 |
| 4 Typography | 移除巨型 V* 品牌标题、9–11px 常规阅读文字；完整论文标题升为 54px 主标题；手机 34–38px。代码字段保留统一等宽字族。 |
| 5 层级 | 页面背景 → 白色 chapter → 带浅灰 header 的 Module → 局部 stage → 解释卡片。新增无状态 `Module.tsx`；实验事件由原组件继续持有。 |
| 6 Border/radius/shadow | 统一 1px #d7deea、选择边框 #9fb0c8、24/18/12/8/pill 层级、参考柔和阴影。 |
| 7 Landing | 居中论文型 Hero，完整英文标题、中文说明、作者元信息、V* 原始 Figure 1、视觉证据循环、开始学习及论文/代码链接。 |
| 8 Sidebar | 浅色底、灰蓝边框、浅蓝 active、3px 蓝色左边框；保持原锚点逻辑。1379px 以下使用抽屉，顶部预留导航栏避免挡住实验按钮。 |
| 9 Progress | 原有滚动进度保留；改为主蓝，增加 progressbar 可访问名称及数值；滚动到底实测 100%。没有将其改称章节完成度。 |
| 10 Guided Visual Search | 5 个既有状态、历史步骤、场景线索、分块与 crop 完整保留。说明/controls 浅色；当前状态蓝；定位后证据反馈绿。重置回第一步。 |
| 11 VWM | 四块工作区仍是原论文字段；soft blue 存储区域、同步选择、辅助 VQA 说明区；未新增长期记忆或自主 Agent 模块。 |
| 12 Active vs Passive | 桌面同宽同高卡片、同大小 stage；常规方案 muted、V* 蓝；没有通过红绿胜负对照夸大结论。窄屏堆叠。 |
| 13 其他章节 | 信息瓶颈、核心直觉、SEAL、人与模型、V*Bench、Figure、主动性、相关方法、贡献、限制全部沿用原顺序迁移。 |
| 14 Results | 主结果/消融/搜索效率/通用能力为浅色实验卡，统一 header；条形图比较值不变，基线为中性灰蓝；相关方法表格可横向滚动。未新增 best 标签或伪造数据。 |
| 15 Final | 10 张复习卡为白色，展开态浅蓝，收尾为 soft blue 与绿色边线；原逐题展开、全部重置、回到首页保留。原本没有评分 Quiz，所以未新增 correct/incorrect 判题。 |
| 16 深色 UI 清理 | 原深蓝渐变 closing 已移除；Hero、controls、pipeline、memory、results、caption、status 均为浅色。 |
| 17 局部深色 viewport | 无新增深色 viewport；原论文图像内的暗色摄影/标注保留，避免改变论文证据。教学室内场景的桌面等物体颜色属于场景，不作为 UI 背景色。 |
| 18 Responsive | Chrome 实测 1440/1280/1024/768/430/375，并附加 320px；全部无页面水平溢出；comparison、memory、results 正常堆叠。 |
| 19 Keyboard/focus | Enter/Space 操作按钮与复习卡、方向键操作滑块；实测 3px focus-visible。关闭抽屉时 Sidebar 不可聚焦；导航后实验状态保留。 |
| 20 Reduced motion | `prefers-reduced-motion: reduce` 下动画/过渡关闭、滚动无平滑；搜索仍能逐步到终态，crop 可见。 |
| 21 Progressive 回归 | 既有实验逐步交互通过；**章节渐进解锁原本不存在，不能记为通过**。15 章初始同时渲染行为保留。 |
| 22 Review/Reset | 10 张复习卡展开/折叠/全部重置、搜索重置、比较循环、pipeline 从头复习均通过。**独立 Review Mode 与全局 Restart 原本不存在。** |
| 23 Lint | 自定义 targeted 静态检查通过：TS AST 行为/数据保持、13 个 CSS 解析、变量定义、禁止移除 focus、过小 UI 字号、tokens 对齐。项目没有 ESLint 依赖、配置或 lint script，未将此称为 full ESLint 通过。 |
| 24 Build | 完整 `tsc -b` + `vite build` 最终成功；产物 CSS 38.91kB、JS 245.30kB。过程中一次并发旧构建产生 EBUSY，之后串行重建成功。 |
| 25 Localhost | `http://127.0.0.1:5173/` 实际浏览器验收；15 章截图、所有 Figure 切换加载、主要交互全部通过，pageerror 为 0。 |
| 26 Diff stat | 仓库 diff 不可用；快照的只读 `git diff --no-index --stat`：**17 files changed, 2722 insertions(+), 114 deletions(-)**。大量行数来自原压缩 CSS 的展开排版与模块拆分。该统计只覆盖 src；不包括报告和研究/QA文件。 |
| 27 本轮前修改 | 没有 Git 历史，无法认证早先未提交修改。开始时存在的源码与文件视为用户基线，已快照；现有论文内容与研究资料保留。 |
| 28 本轮新增 | 共享 Module、shell.css、vstar-paper.css、7 个模块 CSS、新间距/字体 tokens、中文 UI 标签与可访问属性，以及迁移/验收记录。dist 与 tsbuildinfo 为构建重生成。 |
| 29 英文 UI | 保留 V*、完整论文标题、Guided Visual Search、Visual Working Memory、SEAL/VWM/VQA LLM、模型/数据集名称、原始 Figure/Table/Algorithm 编号、VWM 字段及论文图内文字，便于与原文核对。普通按钮、步骤、panel 标签优先中文。 |
| 30 深色区域 | 只保留原论文图像内的暗部及教学场景物体本色；没有深色 control shell、黑色 finale 或大面积 dashboard。 |
| 31 未完成项 | 没有已知明显未迁移的视觉区域。完整清单仍受原有功能缺口、无 Git 元数据与未配置 full lint 的限制；未补建不在视觉范围内的章节解锁/独立复习模式/全局重启/评分 Quiz。 |

## 实际逐项对照结论

- Landing：已对照线上 Hero 截图和 Hero.tsx；标题、居中布局、白色外壳、metadata pills、CTA 与参考同体系。V* 使用已有原图 preview，而非复制参考的汽车/世界模拟器场景。
- Chapter：已逐章检查全部 15 张截图；对照参考 chapter 的 32px padding、18px radius、30px 标题与 Georgia 蓝色编号。
- Module：对照参考 14×20 header、18×22 body、白底边框；所有 7 个交互采用共享组件；结果卡同步采用同类 header。
- Button/Tab/Chip：蓝色 pill 主操作、白色边框次操作、统一焦点；Tabs 按用户更具体的要求用浅蓝选中态，参考部分 chip 的实心蓝用于步骤状态。
- Sidebar：已读取并截取参考 PptBars Sidebar。参考 active 是实心蓝，本轮采用用户明确要求的浅蓝 + 左侧蓝线；V* 的 15 章导航与参考的 10 章导航逻辑分别保留。
- Final：已实际展开参考到第 10 章，截取末章及最后 Module。该参考以结果/局限/延伸阅读收束，不是评分 Quiz；V* 保留自己的复习卡，只统一浅色 paper 外壳和总结视觉。
- 一眼仍有区别的部分是论文标题长度、V* 原图/搜索室内场景、各论文既有内容与交互、侧栏布局细节；这些是论文内容与用户明确约束，不是另造一套配色、字体或外壳。

## 修改文件清单

既有文件修改：

- `src/App.tsx`：Hero/章节标题最小 DOM 调整、普通标签中文化、进度可访问属性。
- `src/components/Interactions.tsx`：接入共享 Module、中文标签、VWM 按钮选中属性。
- `src/main.tsx`：样式入口。
- `src/styles/paper-tokens.css`：保留正确 tokens、增加语义文字色及字号/spacing 变量。
- `src/styles/base.css`：foundation、chapter、typography、focus、reduced motion。
- `src/styles/components.css`：共享 Module/buttons/tabs/controls/callouts。
- `src/styles/interactions.css`：模块 imports、通用约束与响应式组合规则。

新增源码：

- `src/components/Module.tsx`
- `src/styles/shell.css`
- `src/styles/vstar-paper.css`
- `src/styles/modules/comparison.css`
- `src/styles/modules/resolution.css`
- `src/styles/modules/pipeline.css`
- `src/styles/modules/search.css`
- `src/styles/modules/memory.css`
- `src/styles/modules/results.css`
- `src/styles/modules/figures.css`

源码外新增：本文；`.research/visual-migration/` 中的基线快照、参考源码/来源清单、迁移脚本、CSS 排版脚本、targeted 静态检查脚本及结果、Playwright 回归脚本及 JSON、桌面/平板/手机与参考页面截图。`.research` 继续沿用原有忽略规则。

## 验证状态

- `VERIFIED`：源码基线、设计源文件、token 对齐、行为/数据保持、构建、当前 Chrome 尺寸/交互/键盘/reduced-motion 检查、线上参考页的 Hero/Sidebar/末章对照。
- `UNVERIFIED`：本轮未重审的论文全部学术主张、模型复现、Safari/Firefox/实体触屏设备、缺少配置的 full ESLint。源论文事实沿用现有 audit，不新增推断。
- `AUTHOR_INPUT_NEEDED`：本轮视觉范围内无必须输入项；若以后需要恢复任务描述中的章节解锁、独立 Review Mode 等，应另行明确它们的真实实现来源或作为功能任务处理。

最终没有执行：`git add`、`git commit`、`git push`、`git reset`、`git restore`、`git checkout`、创建或切换 branch、PR、deploy。
