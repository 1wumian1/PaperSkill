import { useState } from 'react';
import { C, SceneCanvas, Feedback, Metrics, rr, line, txt, drawPaper, drawPlant, drawFrame } from './PlantKit';

export function Chapter9Main() {
  const [fps, setFps] = useState<1 | 2>(1);
  const [absolute, setAbsolute] = useState(false);
  const targetTime = 2;
  const targetIndex = targetTime * fps;
  const feedback = absolute
    ? `当前${fps}帧/秒：同一事件仍在2秒。对齐实际时间后，采样频率不改变这个时刻；实际时间ID还含实现中的缩放。`
    : `当前${fps}帧/秒：2秒事件对应零起始帧序号${targetIndex}。换一种采样频率，序号会变，事件时刻不会变。`;
  return <div>
    <div className="controls chip-row" aria-label="时间轴控制">
      <div role="group" aria-label="采样频率">
        {[1, 2].map((value) => <button key={value} type="button" className={`chip${fps === value ? ' selected' : ''}`} aria-pressed={fps === value} onClick={() => setFps(value as 1 | 2)}>{value}帧/秒</button>)}
      </div>
      <div role="group" aria-label="时间记录方式">
        <button type="button" className={`chip${!absolute ? ' selected' : ''}`} aria-pressed={!absolute} onClick={() => setAbsolute(false)}>帧序号示意</button>
        <button type="button" className={`chip${absolute ? ' selected' : ''}`} aria-pressed={absolute} onClick={() => setAbsolute(true)}>绝对时间示意</button>
      </div>
    </div>
    <SceneCanvas width={1080} height={280} animate={false} label={`植物观察时间轴：0到4秒，每秒${fps}帧，共${4 * fps + 1}个帧标记；目标固定2秒，当前显示${absolute ? '绝对时间2秒' : `帧序号${targetIndex}`}。`} draw={(ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      rr(ctx, 0, 0, w, h, 0, C.bg);
      drawPaper(ctx, 30, 35, 204, 204);
      drawPlant(ctx, 132, 215, 0.95, 0);
      drawFrame(ctx, 81, 58, 102, 163, C.blue);
      const startX = 300;
      const endX = 1020;
      const targetX = (startX + endX) / 2;
      line(ctx, startX, 154, endX, 154, C.muted, 2);
      for (let seconds = 0; seconds <= 4; seconds++) {
        const x = startX + seconds / 4 * (endX - startX);
        line(ctx, x, 145, x, 163, C.muted, 2);
      }
      rr(ctx, targetX - 29, 53, 58, 149, 9, absolute ? '#e2f1e6' : '#eef3fb', absolute ? C.green : C.blue, 3);
      for (let frame = 0; frame <= 4 * fps; frame++) {
        const x = startX + (frame / fps) / 4 * (endX - startX);
        const isTarget = frame === targetIndex;
        rr(ctx, x - 18, 93, 36, 44, 5, isTarget ? (absolute ? C.green : C.blue) : '#ffffff', isTarget ? (absolute ? C.green : C.blue) : C.border, isTarget ? 3 : 2);
        line(ctx, x, 137, x, 154, isTarget ? C.blue : C.muted, 2);
        ctx.beginPath();
        ctx.arc(x, 154, isTarget ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = isTarget ? (absolute ? C.green : C.blue) : C.light;
        ctx.fill();
      }
      // Both modes keep the target at the same geometric time position.
      // The small badge changes its encoding, never the event's physical time.
      rr(ctx, targetX - 59, 213, 118, 38, 19, '#ffffff', absolute ? C.green : C.blue, 2);
      txt(ctx, absolute ? '时刻2秒' : `帧序号${targetIndex}`, targetX, 238, 20, absolute ? C.green : C.blue, 'center');
      txt(ctx, '目标时刻', targetX, 36, 20, C.blue, 'center');
    }} />
    <Metrics items={[{ label: '采样范围（含两端）', value: `0–4秒 · ${4 * fps + 1}帧` }, { label: '固定事件时刻', value: '2秒' }, { label: absolute ? '当前时间示意值' : '当前零起始帧序号', value: absolute ? '2秒' : targetIndex }]} />
    <p className="hotspot-info"><strong>MRoPE的三个分量：</strong>静态图的时间分量t恒定，h/w区分高度与宽度；视频的t随时间变化。本图的秒数与帧序号均为教学示意，不是源码ID，也不等于模型必然理解任意空间关系。</p>
    <Feedback tone={absolute ? 'green' : 'blue'}>{feedback} 依据§2.1.2–2.1.3；教学示意，非模型预测。</Feedback>
  </div>;
}
