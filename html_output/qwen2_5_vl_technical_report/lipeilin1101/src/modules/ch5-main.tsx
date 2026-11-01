import { useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { C, SceneCanvas, Chips, Feedback, Metrics, canvasPoint, drawScene, drawPaper, drawPlant, drawFrame, line, txt } from './PlantKit';

const clamp = (n: number, max: number) => Math.max(0, Math.min(max, Math.round(n)));
const xyxy = (x: number, y: number, factor = 1) => `[${x * factor}, ${y * factor}, ${(x + 100) * factor}, ${(y + 140) * factor}]`;

function inputPlants(ctx: CanvasRenderingContext2D, ox: number, oy: number, scale: number) {
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);
  drawPaper(ctx, 0, 0, 560, 280);
  drawPlant(ctx, 110, 200, .82, 0);
  drawPlant(ctx, 250, 200, .82, 1);
  drawPlant(ctx, 400, 200, .82, 2);
  ctx.restore();
}

export function Chapter5Main() {
  const [box, setBox] = useState({ x: 350, y: 60 });
  const [moved, setMoved] = useState(false);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const move = (dx: number, dy: number) => {
    setBox(p => ({ x: clamp(p.x + dx, 460), y: clamp(p.y + dy, 140) }));
    setMoved(true);
  };
  const pointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const p = canvasPoint(event, 1080, 280);
    const px = (p.x - 36) / .8;
    const py = (p.y - 40) / .8;
    if (px < box.x || px > box.x + 100 || py < box.y || py > box.y + 140) return;
    drag.current = { dx: px - box.x, dy: py - box.y };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus();
    event.preventDefault();
  };
  const pointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current) return;
    const p = canvasPoint(event, 1080, 280);
    setBox({ x: clamp((p.x - 36) / .8 - drag.current.dx, 460), y: clamp((p.y - 40) / .8 - drag.current.dy, 140) });
    setMoved(true);
  };
  const endDrag = (event: PointerEvent<HTMLCanvasElement>) => {
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return <>
    <SceneCanvas width={1080} height={280} animate={false} label="两张同内容图像中的坐标映射；可拖动橙框或用方向键移动" tabIndex={0}
      style={{ touchAction: 'none', cursor: 'move' }}
      onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}
      onKeyDown={event => {
        const deltas: Record<string, [number, number]> = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] };
        const delta = deltas[event.key];
        if (delta) { event.preventDefault(); move(delta[0], delta[1]); }
      }}
      draw={(ctx, w, h) => {
        ctx.clearRect(0, 0, w, h); drawScene(ctx, w, h);
        inputPlants(ctx, 36, 40, .8); inputPlants(ctx, 596, 40, .8);
        txt(ctx, '输入图', 260, 24, 20, C.blue, 'center');
        txt(ctx, '原图', 820, 24, 20, C.green, 'center');
        drawFrame(ctx, 36 + box.x * .8, 40 + box.y * .8, 80, 112, C.orange);
        drawFrame(ctx, 596 + box.x * .8, 40 + box.y * .8, 80, 112, C.green);
        ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(36 + (box.x + 50) * .8, 40 + (box.y + 70) * .8, 5, 0, Math.PI * 2); ctx.fill();
        line(ctx, 510, 152, 565, 152, C.blue, 2);
        line(ctx, 557, 145, 565, 152, C.blue, 2); line(ctx, 557, 159, 565, 152, C.blue, 2);
      }} />
    <div className="controls ctrl" aria-label="移动输入图中的框">
      <button className="chip" onClick={() => move(-10, 0)} disabled={box.x === 0}>← 左移</button>
      <button className="chip" onClick={() => move(10, 0)} disabled={box.x === 460}>右移 →</button>
      <button className="chip" onClick={() => move(0, -10)} disabled={box.y === 0}>↑ 上移</button>
      <button className="chip" onClick={() => move(0, 10)} disabled={box.y === 140}>↓ 下移</button>
      <button className="chip" onClick={() => { setBox({ x: 350, y: 60 }); setMoved(false); drag.current = null; }}>重置</button>
    </div>
    <Metrics items={[{ label: '输入图尺寸', value: '560×280' }, { label: '原图尺寸', value: '1120×560' }, { label: '坐标映射倍率', value: '2×' }]} />
    <div className="compare-row" aria-live="polite">
      <div className="metric"><div className="l">输入图框 · 左上、右下</div><code>{xyxy(box.x, box.y)}</code></div>
      <div className="metric"><div className="l">原图框 · 左上、右下</div><code>{xyxy(box.x, box.y, 2)}</code></div>
    </div>
    <Feedback tone={moved ? 'orange' : 'blue'}>{moved ? `输入框${xyxy(box.x, box.y)}；原图坐标全部乘2。框已约束在输入图边界内，选对实例仍需语义判断。` : '输入图与原图大小不同，直接照抄坐标会错位。两图按相同显示大小展示，右侧绿色框对应的像素坐标为左侧的2倍。'}</Feedback>
  </>;
}

const relationFeedback = ['左侧叶子是目标，橙花是参照物。', '右侧叶子是目标，仅改变关系词就改变指代。', '目标与参照物不能混淆；此处按已知场景规则展示，非模型运行。'];

export function Chapter5Extra() {
  const [relation, setRelation] = useState(2);
  const targets = [220, 620, 420];
  const names = ['左侧叶子', '右侧叶子', '橙花'];
  const x = targets[relation];
  return <>
    <Chips options={['橙花左侧的叶子', '橙花右侧的叶子', '橙花']} value={relation} onChange={setRelation} />
    <SceneCanvas width={1080} height={280} animate={false} label="按规则高亮关系表达中的目标和参照物"
      draw={(ctx, w, h) => {
        ctx.clearRect(0, 0, w, h); drawScene(ctx, w, h);
        drawPaper(ctx, 80, 28, 650, 230);
        drawPlant(ctx, 220, 225, .95, 0); drawPlant(ctx, 420, 225, .95, 1); drawPlant(ctx, 620, 225, .95, 2);
        drawFrame(ctx, x - 55, 63, 110, 170, C.blue);
        txt(ctx, '目标', x, 49, 20, C.blue, 'center');
        if (relation !== 2) {
          drawFrame(ctx, 365, 63, 110, 170, C.purple, true);
          txt(ctx, '参照物', 420, 49, 20, C.purple, 'center');
          line(ctx, relation === 0 ? 275 : 475, 150, relation === 0 ? 365 : 565, 150, C.purple, 2);
        }
        drawPaper(ctx, 790, 72, 220, 160);
        drawPlant(ctx, 900, 207, .68, relation === 2 ? 1 : relation === 0 ? 0 : 2);
        drawFrame(ctx, 858, 92, 84, 122, C.blue);
      }} />
    <Metrics items={[{ label: '当前目标', value: names[relation] }, { label: '关系参照', value: relation === 2 ? '无须参照' : '橙花' }, { label: '展示依据', value: '已知布局规则' }]} />
    <Feedback tone="blue">{relationFeedback[relation]} 本图为教学示意，非模型预测。</Feedback>
  </>;
}
