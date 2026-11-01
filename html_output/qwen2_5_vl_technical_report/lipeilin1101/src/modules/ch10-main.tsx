import { useEffect, useRef, useState } from 'react';
import { C, SceneCanvas, Feedback, rr, line, txt } from './PlantKit';

const results = [
  { label: 'RefCOCO val', unit: 'REC分数（%）↑', scores: [89.1, 90.0, 92.7], feedback: 'RefCOCO val：89.1、90.0、92.7。原文报告分数，非本机复现。' },
  { label: 'RefCOCO testB', unit: 'REC分数（%）↑', scores: [84.0, 85.4, 89.7], feedback: 'RefCOCO testB：84.0、85.4、89.7；不要与val混用。' },
  { label: 'RefCOCOg test', unit: 'REC分数（%）↑', scores: [85.7, 87.2, 90.3], feedback: 'RefCOCOg test：85.7、87.2、90.3；较长描述不等于专项关系推理测验。' },
  { label: 'ODinW-13', unit: 'mAP ↑（0–100）', scores: [37.5, 37.3, 43.1], feedback: 'ODinW-13 mAP：37.5、37.3、43.1；7B在这行并不高于3B。' },
];
const models = ['3B', '7B', '72B'];
const colors = [C.blue, C.orange, C.purple];

export function Chapter10Main() {
  const [dataset, setDataset] = useState(0);
  const [run, setRun] = useState(0);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(1);
  const startedAt = useRef(0);
  const current = results[dataset];

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => { setProgress(1); setRunning(false); }, 1200);
    return () => window.clearTimeout(timer);
  }, [running, run]);

  function selectDataset(index: number) {
    if (index === dataset) return;
    setDataset(index);
    startComparison();
  }

  function startComparison() {
    startedAt.current = performance.now() / 1000;
    setRun((value) => value + 1);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setProgress(reduceMotion ? 1 : 0);
    setRunning(!reduceMotion);
  }

  return <div>
    <div className="controls chip-row" role="group" aria-label="选择同一评测划分">
      {results.map((result, index) => <button type="button" className={`chip${dataset === index ? ' selected' : ''}`} aria-pressed={dataset === index} key={result.label} onClick={() => selectDataset(index)}>{result.label}</button>)}
      <button type="button" className="btn tiny" onClick={startComparison}>重播对比</button>
    </div>
    <p><strong>当前图表：{current.label}</strong> · {current.unit} · 横轴统一为0–100；三条图形从上到下依次为3B、7B、72B。</p>
    <div className="chip-row" aria-label="图表顺序与颜色">
      {models.map((model, index) => <span className="chip" key={model}><span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 3, background: colors[index], display: 'inline-block' }} />{index + 1}. Qwen2.5-VL-{model}</span>)}
    </div>
    <SceneCanvas width={1080} height={280} animate={running} label={`${current.label}同一指标的三模型条形图；从上至下3B、7B、72B，终值${current.scores.join('、')}，单位${current.unit}。精确数据始终显示在下方表格。`} draw={(ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      rr(ctx, 0, 0, w, h, 0, C.bg);
      const amount = running ? Math.min(1, Math.max(0.006, (t - startedAt.current) / 1.2)) : progress;
      const eased = 1 - Math.pow(1 - amount, 3);
      const left = 65;
      const width = 920;
      for (let tick = 0; tick <= 10; tick++) {
        const x = left + tick / 10 * width;
        line(ctx, x, 30, x, 229, tick === 0 ? C.muted : C.border, tick === 0 ? 2 : 1);
      }
      current.scores.forEach((score, index) => {
        const y = 47 + index * 65;
        rr(ctx, left, y, width, 35, 7, '#e9ede5');
        const barWidth = score / 100 * width * eased;
        if (barWidth > 0) rr(ctx, left, y, barWidth, 35, Math.min(7, barWidth / 2), colors[index]);
      });
      txt(ctx, '0', left, 258, 20, C.muted, 'center');
      txt(ctx, '100', left + width, 258, 20, C.muted, 'center');
    }} />
    <table className="paper">
      <caption>论文表6 · 原文结果（↑越高越好；当前选择行以蓝色标记）</caption>
      <thead><tr><th scope="col">数据集与划分</th><th scope="col">指标与单位</th>{models.map((model) => <th scope="col" key={model}>{model}</th>)}</tr></thead>
      <tbody>{results.map((result, index) => <tr key={result.label} aria-selected={dataset === index} style={dataset === index ? { background: '#eef3fb' } : undefined}>
        <th scope="row">{dataset === index ? '● ' : ''}{result.label}</th><td>{result.unit}</td>{result.scores.map((score, i) => <td key={models[i]}><strong>{score.toFixed(1)}</strong></td>)}
      </tr>)}</tbody>
    </table>
    <Feedback tone={dataset === 3 ? 'orange' : 'blue'}>{current.feedback} {running ? '正在展开原文终值，1.2秒后停止。' : '切换基准可直接更新图表；请比较同一行。'} 表格数据始终可读；动画不是训练曲线或速度测量。</Feedback>
    <p className="hotspot-info">来源：<a href="https://arxiv.org/html/2502.13923v1" target="_blank" rel="noreferrer">原论文§3.3.3、表6</a>。REC结果保留原始划分，不自行补充阈值；ODinW-13为基准集合平均mAP。原表另列GroundingDINO为55.0 mAP，但外部模型并非训练条件受控的消融。属性与空间关系仍需分别设计带标注的评测，不能由这些综合分数直接推定。</p>
  </div>;
}
