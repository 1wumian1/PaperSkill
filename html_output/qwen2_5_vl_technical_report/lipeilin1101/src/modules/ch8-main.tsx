import { useState } from 'react';
import { C, SceneCanvas, Feedback, Metrics, rr, line, txt, drawPlant, drawFrame, canvasPoint } from './PlantKit';

const stages = [
  { name: '图像切块', shortShape: '32×32', input: '448×448像素', output: '1024个patch', detail: '14×14像素步长切块；32×32＝1024。图标内的网格只表示切块机制，未逐一画满1024个patch。', feedback: '448×448输入按14切块，得到1024个patch；这里只展示静态图。' },
  { name: '视觉编码器', shortShape: '1024×z', input: '1024个patch', output: '1024×1280特征', detail: '32层ViT使用2D-RoPE。多数层是局部窗口注意力，全局层为零起始索引7、15、23、31，图中用橙色勾勒。', feedback: '32层视觉编码器：2D-RoPE、窗口层与四个全局层共同编码。' },
  { name: '特征合并', shortShape: '256×h', input: '1024×1280特征', output: '256×3584视觉token', detail: '相邻四特征先拼接为5120维，再经两层MLP映射到7B的3584维；不是平均池化，也不是四份独立投影。', feedback: '相邻四特征合并后得到256个3584维视觉token，供7B语言模型使用。' },
  { name: '语言模型', shortShape: '28层', input: '视觉token＋指令', output: '逐个文本token', detail: '7B语言模型有28层，隐藏维度3584；将视觉token与文本指令共同处理。此处的MRoPE属于语言模型侧。', feedback: 'Qwen2.5语言模型融合视觉token与指令；MRoPE与视觉编码器的2D-RoPE应区分。' },
  { name: '坐标输出', shortShape: 'JSON', input: '生成的文本序列', output: '结构化坐标文本', detail: '输出可写成JSON等结构化文本。示例框在448×448输入内，但格式正确不等于目标选对。', feedback: '语言模型生成坐标文本；生成路径不是独立的传统检测头。' },
];

export function Chapter8Main() {
  const [node, setNode] = useState(0);
  const active = stages[node];
  return <div>
    <div className="controls chip-row" role="group" aria-label="选择架构部件">
      {stages.map((stage, i) => <button type="button" className={`chip${node === i ? ' selected' : ''}`} aria-pressed={node === i} key={stage.name} onClick={() => setNode(i)}>{stage.name}</button>)}
    </div>
    <SceneCanvas width={1080} height={280} animate={false} label={`可点选架构图，当前为${active.name}；可使用左右方向键、Home和End键切换。`} tabIndex={0}
      onPointerDown={(event) => {
        const p = canvasPoint(event, 1080, 280);
        const hit = stages.findIndex((_, i) => p.x >= 24 + i * 208 && p.x <= 208 + i * 208 && p.y >= 58 && p.y <= 212);
        if (hit >= 0) setNode(hit);
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); setNode((value) => (value + 1) % stages.length); }
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); setNode((value) => (value + stages.length - 1) % stages.length); }
        else if (event.key === 'Home') { event.preventDefault(); setNode(0); }
        else if (event.key === 'End') { event.preventDefault(); setNode(stages.length - 1); }
      }}
      draw={(ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        rr(ctx, 0, 0, w, h, 0, C.bg);
        for (let i = 0; i < 4; i++) {
          const x = 208 + i * 208;
          const downstream = i >= node;
          line(ctx, x, 135, x + 24, 135, downstream ? C.blue : C.border, downstream ? 4 : 2);
          line(ctx, x + 18, 130, x + 24, 135, downstream ? C.blue : C.border, 2);
          line(ctx, x + 18, 140, x + 24, 135, downstream ? C.blue : C.border, 2);
        }
        for (let i = 0; i < stages.length; i++) {
          const x = 24 + i * 208;
          const chosen = i === node;
          rr(ctx, x, 58, 184, 154, 14, '#ffffff', chosen ? C.blue : C.border, chosen ? 4 : 2);
          ctx.save();
          ctx.globalAlpha = chosen ? 1 : 0.44;
          if (i === 0) {
            rr(ctx, x + 44, 84, 96, 96, 3, C.bg, C.dark, 2);
            drawPlant(ctx, x + 92, 172, 0.51, 0);
            for (let k = 1; k < 8; k++) {
              line(ctx, x + 44 + k * 12, 84, x + 44 + k * 12, 180, C.blue, 1);
              line(ctx, x + 44, 84 + k * 12, x + 140, 84 + k * 12, C.blue, 1);
            }
          } else if (i === 1) {
            for (let k = 0; k < 32; k++) {
              const global = [7, 15, 23, 31].includes(k);
              rr(ctx, x + 32 + (k % 8) * 16, 90 + Math.floor(k / 8) * 24, 11, 17, 2, global ? C.orange : C.light, global ? C.orange : C.dark, 1.5);
            }
          } else if (i === 2) {
            for (let k = 0; k < 4; k++) rr(ctx, x + 30 + (k % 2) * 25, 107 + Math.floor(k / 2) * 25, 20, 20, 3, C.light, C.dark, 2);
            line(ctx, x + 80, 132, x + 105, 132, C.blue, 3);
            line(ctx, x + 100, 127, x + 105, 132, C.blue, 2);
            line(ctx, x + 100, 137, x + 105, 132, C.blue, 2);
            rr(ctx, x + 113, 106, 39, 52, 5, C.blue);
            for (let k = 1; k < 4; k++) line(ctx, x + 120, 110 + k * 10, x + 145, 110 + k * 10, '#ffffff', 1.5);
          } else if (i === 3) {
            for (let k = 0; k < 28; k++) rr(ctx, x + 36 + (k % 7) * 17, 91 + Math.floor(k / 7) * 24, 12, 17, 2, C.blue, C.blue, 1);
          } else {
            rr(ctx, x + 43, 81, 98, 108, 5, C.bg, C.dark, 2);
            drawPlant(ctx, x + 100, 174, 0.46, 2);
            drawFrame(ctx, x + 77, 103, 46, 75, C.orange);
            line(ctx, x + 51, 94, x + 61, 94, C.blue, 2);
            line(ctx, x + 51, 94, x + 51, 175, C.blue, 2);
            line(ctx, x + 51, 175, x + 61, 175, C.blue, 2);
          }
          ctx.restore();
        }
        txt(ctx, active.name, 540, 32, 20, C.blue, 'center');
        txt(ctx, active.shortShape, 116 + node * 208, 247, 20, C.blue, 'center');
      }} />
    <Metrics items={[{ label: '固定模型与图像', value: '7B · 448×448' }, { label: '当前部件接收', value: active.input }, { label: '当前部件输出', value: active.output }]} />
    <p className="hotspot-info"><strong>{active.name}：</strong>{active.detail}{node === 4 ? <code> {'{"bbox":[280,120,420,400]}'}（教学示例）</code> : null}</p>
    <Feedback tone="blue">{active.feedback} 形状为教学推导，依据§2.1、表1；视觉场景非模型预测。</Feedback>
  </div>;
}
