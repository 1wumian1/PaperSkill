import { useRef, useState } from 'react';
import { C, SceneCanvas, Feedback, Metrics, drawScene, drawPaper, drawPlant, line, txt } from './PlantKit';

const WIDTH = 1080;
const HEIGHT = 280;

export function Chapter2Main() {
  const [side, setSide] = useState(224);
  const sourceRef = useRef<HTMLCanvasElement | null>(null);
  const sampleRef = useRef<HTMLCanvasElement | null>(null);
  const patchesPerSide = side / 14;
  const patchCount = patchesPerSide ** 2;
  const tokenCount = patchCount / 4;
  const ratio = Number((tokenCount / 64).toFixed(2));
  const feedback = side === 224
    ? '224×224：256 个 patch 合成 64 个视觉 token。细节与预算一起受尺寸影响。'
    : side === 672
      ? '672×672：2304 个 patch 合成 576 个视觉 token；视觉序列是 224 尺寸的 9 倍。'
      : `${side}×${side}：${patchCount} 个 patch 合成 ${tokenCount} 个视觉 token。尺寸增大带来更多输入；这不是准确率或速度的实测曲线。`;

  return <div>
    <SceneCanvas width={WIDTH} height={HEIGHT} animate={false}
      label={`同一株植物的分辨率示意：${side}乘${side}像素，${patchCount}个视觉patch，合并为${tokenCount}个视觉token`}
      draw={(ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        drawScene(ctx, w, h);
        drawPaper(ctx, 48, 38, 638, 218);
        drawPaper(ctx, 730, 38, 318, 218);
        if (!sourceRef.current) {
          const source = document.createElement('canvas');
          source.width = 280;
          source.height = 280;
          const sourceCtx = source.getContext('2d');
          if (sourceCtx) {
            sourceCtx.fillStyle = C.bg;
            sourceCtx.fillRect(0, 0, 280, 280);
            drawPlant(sourceCtx, 140, 250, 1.35, 0);
          }
          sourceRef.current = source;
        }
        if (!sampleRef.current) sampleRef.current = document.createElement('canvas');
        const sample = sampleRef.current;
        // Intentionally simplified display sampling; these are not model input pixels.
        const displaySamples = side / 7;
        sample.width = displaySamples;
        sample.height = displaySamples;
        const sampleCtx = sample.getContext('2d');
        if (sampleCtx) {
          sampleCtx.drawImage(sourceRef.current, 0, 0, displaySamples, displaySamples);
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(sample, 258, 44, 208, 208);
          ctx.restore();
        }
        line(ctx, 704, 122, 720, 136, C.muted, 2);
        line(ctx, 720, 136, 704, 150, C.muted, 2);
        const gx = 784;
        const gy = 44;
        const size = 208;
        const unit = size / patchesPerSide;
        ctx.save();
        ctx.globalAlpha = 0.24;
        ctx.drawImage(sourceRef.current, gx, gy, size, size);
        ctx.restore();
        for (let i = 0; i <= patchesPerSide; i++) {
          const grouped = i % 2 === 0;
          const color = grouped ? C.light : C.border;
          const weight = grouped ? 1.25 : 0.55;
          line(ctx, gx + i * unit, gy, gx + i * unit, gy + size, color, weight);
          line(ctx, gx, gy + i * unit, gx + size, gy + i * unit, color, weight);
        }
        txt(ctx, '同一观察页', 362, 26, 20, C.text, 'center');
        txt(ctx, '切块与合并', 888, 26, 20, C.text, 'center');
      }} />
    <div className="controls ctrl">
      <label htmlFor="ch2-side">处理后边长 <span className="val">{side} 像素</span></label>
      <input id="ch2-side" type="range" min={224} max={672} step={28} value={side}
        aria-valuetext={`${side} 像素，合并为 ${tokenCount} 个视觉 token`}
        onKeyDown={event => event.stopPropagation()}
        onChange={event => setSide(Number(event.currentTarget.value))} />
    </div>
    <Metrics items={[
      { label: '处理尺寸 H′×W′', value: `${side}×${side}` },
      { label: '视觉 patch 数', value: patchCount },
      { label: '合并后视觉 token 数', value: tokenCount },
      { label: '相对 224 输入的 token 数', value: `${ratio} 倍` },
    ]} />
    <Feedback tone={side === 224 ? 'blue' : 'orange'}>{feedback}</Feedback>
  </div>;
}
