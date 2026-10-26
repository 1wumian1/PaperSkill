# DivPrune：基于多样性的视觉 Token 剪枝 · 交互式教程（v9 长滚动版）

基于论文 *DivPrune: Diversity-based Visual Token Pruning for Large Multimodal Models*（CVPR 2025）的 React + TypeScript + Vite 网页项目。

## 本地运行

```bash
npm install
npm run dev       # 开发预览
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

调试参数：`?motion=reduce`（与系统“减少动态效果”走同一条路径）、`?all=1`（一次展开全部章节）、`#chap-N` / `#closing` / `#videos`（打开时直接定位）。

## 版式

参照 PaperSkill 长滚动模板：左侧固定章节栏（288px），主区一列卡片（章卡最宽 1064px）；
窗口宽度不足 1280px 时章节栏收为抽屉（顶栏“章节”按钮打开），960px 以下另走手机版式；
封面后按“开始学习 / 继续下一章”逐章展开，侧栏可直接跳到任一章。每章自上而下：
本节问题 → 测绘队情节 → 交互模块 → 洞察 → 公式 → 核对 → 关键数字 → 要点与误区 → 深入阅读（折叠）。
最后是收束（结论分级、术语表、来源与证据边界）和“延伸学习 · B 站讲解视频”。

修改说明见 [CHANGES-v9.md](CHANGES-v9.md)（改回长滚动版式）、[CHANGES-v9.1.md](CHANGES-v9.1.md)（性能与减少重复讲解，含修改前后测量）、[CHANGES-v9.2.md](CHANGES-v9.2.md)（第 6 章筛选联动、4.1 布局与窄窗口适配）、[CHANGES-v9.3.md](CHANGES-v9.3.md)（961–1279px 中间宽度的共用布局）、[CHANGES-v9.4.md](CHANGES-v9.4.md)（手机竖屏下 4.1 / 5.1 / 8.1 / 6.1 改为上下排列）与 [CHANGES-v9.5.md](CHANGES-v9.5.md)（手机收尾：结论分级、术语表、宽表滑动提示）。

## 目录

| 路径 | 说明 |
| ---- | ---- |
| `src/App.tsx` | 外壳：章节栏、逐章展开、定位 |
| `src/v9/chapters.ts` | 章节表、导读数字、阅读路线、B 站视频列表 |
| `src/v9/Chapter.tsx` | 一章的版式 |
| `src/v9/Parts.tsx` | 封面、收束、B 站推荐 |
| `src/v9/deep.json` | 原版 v7 的“深入阅读”内容 |
| `src/styles/v9.css` | 外壳样式 |
| `src/modules/*` | 交互模块与计算库（沿用 v8；`dp-intro.tsx` 存各章导语 / 公式 / 要点，`dp-survey.tsx` 存十个测绘队情节） |
| `src/data/tutorial.ts` | v8 组装出的章节数据（模块标题、说明、出处与口径） |
| `tools/` | v8 的章节数据包与生成脚本（留作溯源） |
| `tools/measure/` | 性能对比用的虚拟帧测量页脚本、操作脚本与结果（见 CHANGES-v9.1.md 第四节）；`widths.html` + `layout.js` 为逐宽度布局检查（见 CHANGES-v9.3.md），`closingcheck.js` 为收束页手机点按检查（见 CHANGES-v9.5.md） |

`src/components/`、`src/lib/` 里的 PPT 播放器文件来自 v8 工程，v9 外壳不再使用（构建时不会打包进去）。
