# 视觉指令微调 交互式教程

基于论文 *Visual Instruction Tuning*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

## 本地运行

```bash
npm install
npm run dev       # 开发预览 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

最终提交应保留整个项目目录，不要只复制 `index.html` 或 `dist/`。

## 目录结构

| 路径 | 说明 | 是否生成器（Agent）修改 |
| ---- | ---- | ---- |
| `src/data/tutorial.ts` | 论文专属内容（章节、模块、公式、B 站、元信息） | ✅ 唯一数据文件 |
| `src/styles/paper.css` | 论文专属 `:root` 配色覆盖 | ✅ 仅此 CSS |
| `src/modules/*.tsx` + `registry.tsx` | 论文专属 Canvas 交互组件 | ✅ 在 registry 注册 |
| `public/images/*` | 论文原图（可选） | ✅ 仅放图 |
| `src/components/*` | 静态展示组件（Hero/Chapter/Module…） | ❌ 模板框架默认 |
| `src/lib/*` | 静态工具（canvasKit / B 站） | ❌ 模板框架默认 |
| `src/styles/{tokens,components}.css` | 静态设计令牌与组件样式 | ❌ 模板框架默认 |

## 配色语义（contract.md §5，保持稳定）

- `--blue` 指导/当前状态，`--green` 成功/本文方法，`--red` 失败/传统方法
- `--orange` 用户强调，`--purple` 辅助机制

切勿把 `--accent` 重新定义成别的语义角色。

## 论文版本与教学范围

本导读对应 Haotian Liu 等人的 **Visual Instruction Tuning**（NeurIPS 2023），即原版 LLaVA，不混用 LLaVA-1.5 或后续版本的结构与实验结果。

- [会议论文原文](https://papers.neurips.cc/paper_files/paper/2023/file/6dcf277ea32ce3288914faf369fe6de0-Paper-Conference.pdf)
- [作者项目主页](https://llava-vl.github.io/)
- 10 章、12 个主动交互模块，覆盖视觉编码、线性投影、指令数据、自回归生成、答案损失、两阶段训练、消融与能力边界。
- 公式、模型条件与实验结果在对应章节标注原文章节、页码或表格。不同评测协议分别展示；标准差不作置信区间解释；ScienceQA 外部组合结果与单模型结果明确区分。

## 素材与示意说明

杯子、铅笔、笔记本、放大镜、尺子等插画由本项目 Canvas 代码绘制。属性绑定练习为依据论文定性案例自行绘制的教学示意，未复制论文原图。`public/images/review/` 为本项目网页截图，仅供评审参考。

交互中的问答、低维向量、投影矩阵、特征与 token 演示均为教学示例，不执行真实模型推理，也不用于报告模型实测性能。项目不包含论文 PDF、第三方图片或外部字体；延伸视频仅提供公开来源链接。
