import { useState } from 'react';
import { C, SceneCanvas, Chips, Feedback, Metrics, drawScene, drawPaper, drawPlant, drawFrame, line, rr, txt } from './PlantKit';

const supervisionFeedback = [
  '场景描述告诉模型画面内容，但没有逐实例的位置答案。',
  '框和表达联合监督语言与区域对应；示例坐标来自插画。',
  '点监督可指向细部；框与点不能无条件互相替代。',
  '论文加入不存在目标的查询，给拒绝错误指代提供监督。'
];
const queries = ['描述这张标本页', '框出绿色叶片', '指出叶片尖端', '找出紫色兰花'];
const targets = ['这张标本页上有一片绿色叶子。', '{ "框": [220, 70, 380, 215] }', '{ "点": [370, 75] }', '未找到该目标。'];

function specimen(ctx: CanvasRenderingContext2D) {
  ctx.beginPath(); ctx.moveTo(225, 190); ctx.quadraticCurveTo(230, 100, 370, 75); ctx.quadraticCurveTo(370, 165, 225, 190); ctx.closePath(); ctx.fillStyle = C.light; ctx.fill(); ctx.strokeStyle = C.dark; ctx.lineWidth = 2; ctx.stroke();
  line(ctx, 220, 212, 370, 75, C.dark, 2);
  [[253, 165, 252, 135], [278, 143, 288, 112], [301, 122, 321, 96], [253, 165, 286, 171], [278, 143, 321, 150], [301, 122, 345, 130]].forEach(v => line(ctx, v[0], v[1], v[2], v[3], C.dark, 1.5));
}

export function Chapter7Main() {
  const [supervision, setSupervision] = useState(0);
  return <>
    <Chips options={['场景描述', '框与表达', '点与表达', '不存在目标']} value={supervision} onChange={setSupervision} />
    <SceneCanvas width={1080} height={280} animate={false} label="同一片叶子分别配合描述、框、点和不存在目标的监督示例"
      draw={(ctx, w, h) => {
        ctx.clearRect(0, 0, w, h); drawScene(ctx, w, h);
        ctx.save(); ctx.translate(36, 40); ctx.scale(.8, .8);
        drawPaper(ctx, 0, 0, 560, 280); specimen(ctx);
        if (supervision === 0) drawFrame(ctx, 12, 12, 536, 256, C.border);
        if (supervision === 1) drawFrame(ctx, 220, 70, 160, 145, C.blue);
        if (supervision === 2) {
          ctx.beginPath(); ctx.arc(370, 75, 8, 0, Math.PI * 2); ctx.fillStyle = C.blue; ctx.fill();
          line(ctx, 352, 75, 388, 75, C.blue, 2); line(ctx, 370, 57, 370, 93, C.blue, 2);
        }
        if (supervision === 3) { drawFrame(ctx, 410, 78, 110, 140, C.purple, true); line(ctx, 420, 204, 510, 92, C.purple, 3); }
        ctx.restore();
        txt(ctx, '标本页', 260, 24, 20, C.blue, 'center'); txt(ctx, '监督信号', 830, 24, 20, C.blue, 'center');
        drawPaper(ctx, 650, 52, 350, 200);
        if (supervision === 0) [0, 1, 2, 3].forEach(i => rr(ctx, 695, 90 + i * 32, i === 3 ? 160 : 255, 10, 4, C.light));
        if (supervision === 1) { drawFrame(ctx, 735, 86, 180, 120, C.blue); line(ctx, 700, 224, 950, 224, C.border); }
        if (supervision === 2) { ctx.beginPath(); ctx.arc(825, 148, 12, 0, Math.PI * 2); ctx.fillStyle = C.blue; ctx.fill(); line(ctx, 780, 148, 870, 148, C.blue); line(ctx, 825, 103, 825, 193, C.blue); }
        if (supervision === 3) { drawFrame(ctx, 765, 87, 120, 120, C.purple, true); line(ctx, 777, 194, 873, 100, C.purple, 3); }
      }} />
    <div className="compare-row" aria-live="polite">
      <div className="metric"><div className="l">示意样本的指令</div><div>{queries[supervision]}</div></div>
      <div className="metric"><div className="l">示意样本的目标输出</div><code style={{ overflowWrap: 'anywhere' }}>{targets[supervision]}</code></div>
    </div>
    <Feedback tone="blue">{supervisionFeedback[supervision]} 教学示意，非模型预测；此处文本和坐标不是论文原始训练样本。</Feedback>
  </>;
}

const stageNames = ['视觉预训练', '多模态预训练', '长上下文', 'SFT', 'DPO'];
const stageFeedback = [
  '阶段一：论文描述只训练ViT；表2为1.5T token、8192上下文。',
  '阶段二：全参数解冻，多模态预训练2T token，上下文8192。',
  '阶段三：延续全参数训练，将上下文扩至32768，加入长视频等数据，0.6T token。',
  'SFT：冻结ViT。约200万条指令样本中，纯文本与多模态条数各半；这不等于token或计算量各半。',
  'DPO：冻结ViT，使用图文与纯文本偏好数据；偏好不等于坐标精度保证。'
];
type State = 'train' | 'frozen' | 'unlisted';
const stateNames: Record<State, string> = { train: '可训练', frozen: '冻结', unlisted: '未单列细节' };
const stateColors: Record<State, string> = { train: C.green, frozen: C.blue, unlisted: C.muted };

export function Chapter7Extra() {
  const [stage, setStage] = useState(0);
  const states: State[] = stage === 0 ? ['train', 'unlisted', 'frozen'] : stage < 3 ? ['train', 'train', 'train'] : ['frozen', 'unlisted', 'train'];
  const tokenAmounts = ['1.5T', '2T', '0.6T', '—', '—'];
  const contexts = ['8192', '8192', '32768', '—', '—'];
  return <>
    <Chips options={stageNames} value={stage} onChange={setStage} />
    <SceneCanvas width={1080} height={280} animate={false} label="各训练阶段的视觉编码器、特征合并模块和语言模型状态；绿色可训练，蓝色冻结，灰色未单列"
      draw={(ctx, w, h) => {
        ctx.clearRect(0, 0, w, h); drawScene(ctx, w, h);
        txt(ctx, '模块状态', 350, 30, 20, C.blue, 'center'); txt(ctx, '训练记录', 890, 30, 20, C.blue, 'center');
        [70, 290, 510].forEach((x, i) => {
          const color = stateColors[states[i]];
          rr(ctx, x, 62, 170, 142, 14, '#ffffff', color, 3);
          if (i === 0) {
            for (let r = 0; r < 3; r++) for (let col = 0; col < 3; col++) rr(ctx, x + 38 + col * 32, 91 + r * 30, 24, 22, 4, C.light);
          } else if (i === 1) {
            for (let r = 0; r < 2; r++) for (let col = 0; col < 2; col++) rr(ctx, x + 28 + col * 27, 96 + r * 30, 22, 24, 4, C.light);
            line(ctx, x + 86, 123, x + 108, 123, C.muted, 2); rr(ctx, x + 116, 94, 27, 60, 5, C.light);
          } else [0, 1, 2].forEach(row => rr(ctx, x + 28, 94 + row * 30, row === 2 ? 84 : 114, 11, 5, C.light));
          if (states[i] === 'frozen') {
            rr(ctx, x + 138, 175, 19, 16, 3, C.blue);
            ctx.beginPath(); ctx.arc(x + 147.5, 175, 6, Math.PI, 0); ctx.strokeStyle = C.blue; ctx.lineWidth = 2; ctx.stroke();
          }
          if (i < 2) { line(ctx, x + 178, 133, x + 212, 133, C.muted, 2); line(ctx, x + 205, 127, x + 212, 133, C.muted, 2); line(ctx, x + 205, 139, x + 212, 133, C.muted, 2); }
        });
        drawPaper(ctx, 770, 58, 240, 150);
        if (stage === 0) drawPlant(ctx, 890, 185, .62, 0);
        if (stage === 1) { drawPlant(ctx, 835, 184, .55, 0); [0, 1, 2].forEach(i => rr(ctx, 892, 90 + i * 29, 88, 9, 4, C.light)); }
        if (stage === 2) [0, 1, 2, 3].forEach(i => { rr(ctx, 794 + i * 47, 88, 36, 90, 5, '#ffffff', C.border); line(ctx, 800 + i * 47, 110, 824 + i * 47, 110, C.light, 2); });
        if (stage === 3) { [0, 1].forEach(i => rr(ctx, 796, 88 + i * 28, 180 - i * 44, 10, 4, C.light)); line(ctx, 870, 163, 882, 175, C.green, 3); line(ctx, 882, 175, 904, 148, C.green, 3); }
        if (stage === 4) { rr(ctx, 794, 88, 75, 88, 5, '#ffffff', C.green, 2); rr(ctx, 909, 88, 75, 88, 5, '#ffffff', C.border, 2); line(ctx, 809, 131, 822, 145, C.green, 3); line(ctx, 822, 145, 852, 112, C.green, 3); }
        line(ctx, 110, 242, 970, 242, C.border, 2);
        for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(110 + i * 215, 242, i === stage ? 11 : 6, 0, Math.PI * 2); ctx.fillStyle = i === stage ? C.orange : C.border; ctx.fill(); }
      }} />
    <div className="metrics" aria-live="polite">
      {['视觉编码器 ViT', '特征合并模块', '语言模型 LLM'].map((name, index) => <div className="metric" key={name}><div className="l">{name}</div><div style={{ color: stateColors[states[index]], fontWeight: 700 }}>{stateNames[states[index]]}</div></div>)}
    </div>
    <Metrics items={[{ label: '当前阶段', value: stageNames[stage] }, { label: '表2训练token量', value: tokenAmounts[stage] }, { label: '表2上下文长度', value: contexts[stage] }]} />
    <Feedback tone={stage === 4 ? 'orange' : 'blue'}>{stageFeedback[stage]}{stage === 0 || stage >= 3 ? ' 合并模块的冻结细节在所引阶段描述中未单列，此处不推断。' : ''}{stage >= 3 ? ' 横线表示本处不列token量或上下文数字。' : ''} 依据§2.2.2表2、§2.3.1与§2.3.4；教学示意，非模型预测。</Feedback>
  </>;
}
