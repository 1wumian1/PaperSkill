# V* 中文交互式论文教程

论文：**V*: Guided Visual Search as a Core Mechanism in Multimodal LLMs**（Penghao Wu、Saining Xie，CVPR 2024）。

## 本地运行

需要 Node.js 22.13+。

```bash
npm install
npm run dev
```

终端会显示本地访问地址。生产构建：`npm run build`；预览构建：`npm run preview`。

本项目已有本地依赖时可直接运行上述脚本；本轮重构没有新增依赖。

## 教程结构

Landing + 7 章 + Final：看见 ≠ 看清 → 继续寻找 → SEAL 总路线 → Guided Visual Search → Visual Working Memory → V*Bench 与实验 → 总结与边界 → 简短自测。前五章使用同一个杯子教学示意；每章末尾有通往下一问题的显式桥接。

主要交互包括全局/局部细节切换、下一步选择、SEAL 流程揭示、引导式搜索实验、VWM 证据累积和结果切换。Final 有三道简短自测。教学场景、路径、颜色不是论文实测样本；页面不运行论文模型。

## 资料与核查

- [CVPR 官方论文页](https://openaccess.thecvf.com/content/CVPR2024/html/Wu_V_Guided_Visual_Search_as_a_Core_Mechanism_in_Multimodal_CVPR_2024_paper.html)
- [CVPR 官方 PDF](https://openaccess.thecvf.com/content/CVPR2024/papers/Wu_V_Guided_Visual_Search_as_a_Core_Mechanism_in_Multimodal_CVPR_2024_paper.pdf)
- [作者代码](https://github.com/penghao-wu/vstar)
- [作者项目页](https://vstar-seal.github.io/)

重要数值、方法步骤与边界见 [docs/source-audit.md](docs/source-audit.md)。本轮内容决策与章节地图见 [故事重构审计](docs/VSTAR_STORY_REDESIGN_AUDIT.md) 和 [故事架构](docs/VSTAR_STORY_ARCHITECTURE.md)。`public/assets/paper` 保留了较早版本从作者 arXiv v2 PDF 裁取的图片；当前页面没有加载它们。

视觉体系以 PaperSkill Inspatio World 页面及其源码为主参考；Vista4D 只用于教学问题链、章节粒度与收尾节奏的参考。项目运行时不依赖两个参考站。
