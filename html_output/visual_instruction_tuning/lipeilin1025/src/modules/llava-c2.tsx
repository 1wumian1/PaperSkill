import React, { useState } from 'react';
import { Surface, C, drawPhoto, line, round, point } from './llava-kit';

// Fixed teaching coordinates, not CLIP activations or semantic attributes.
const vectors = [
  [.10, .20, -.10, .40, .00, .30], [.35, -.10, .60, .20, .15, -.25], [.20, .30, .10, -.20, .40, .05],
  [-.10, .50, .20, .40, -.30, .15], [.45, .10, -.35, .65, .20, -.15], [.30, -.20, .55, .10, -.10, .40],
  [.00, .15, .30, -.10, .25, .40], [.25, .40, -.15, .20, .30, .10], [.10, -.05, .20, .30, .15, .35],
];
const regionNotes = [
  '背景也占据视觉位置；并非每个位置都对应一个物体。',
  '铅笔跨越多个区域；一个物体可能贡献多个位置的表示。',
  '边缘区域同样形成表示；它不需要先被命名成一个词。',
  '杯子轮廓横跨网格；图像分块不是目标检测框。',
  '杯口与铅笔在局部相邻；位置特征仍会结合整张图的上下文。',
  '把手只是杯子的一部分；一个位置不等于一个完整物体。',
  '桌面与阴影也进入视觉表示，不只保留可命名的主体。',
  '杯身分布在多个网格中；视觉序列并不是物体名称列表。',
  '选择的是一个空间位置，而不是一个预先规定的类别。',
];

export const LLaVAC2: React.FC = () => {
  const [patch, setPatch] = useState(4);
  const gx = 58, gy = 54, gw = 344, gh = 240, cw = gw / 3, ch = gh / 3;
  return <div>
    <div className="chip-row" aria-label="选择图像区域">
      {vectors.map((_, i) => <button type="button" key={i} className={`chip ${patch === i ? 'selected' : ''}`} aria-pressed={patch === i} onClick={() => setPatch(i)}>区域 {i + 1}</button>)}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'center', color: C.muted, fontSize: 16, fontWeight: 700, margin: '4px 0 10px' }}><span>完整图像中的位置</span><span>该区域的局部放大</span></div>
    <Surface height={340} label={`选中区域 ${patch + 1}；右侧放大同一区域的图像内容`} style={{ cursor: 'pointer' }} onPointerDown={event => {
      const p = point(event, 1080, 340);
      if (p.x >= gx && p.x < gx + gw && p.y >= gy && p.y < gy + gh) setPatch(Math.floor((p.y - gy) / ch) * 3 + Math.floor((p.x - gx) / cw));
    }} draw={c => {
      drawPhoto(c, 50, 46, 360, 260);
      for (let i = 1; i < 3; i++) {
        line(c, gx + i * cw, gy, gx + i * cw, gy + gh, '#ffffffb0', 2);
        line(c, gx, gy + i * ch, gx + gw, gy + i * ch, '#ffffffb0', 2);
      }
      const sx = gx + (patch % 3) * cw, sy = gy + Math.floor(patch / 3) * ch;
      c.fillStyle = '#f07e471c'; c.fillRect(sx, sy, cw, ch);
      c.strokeStyle = C.orange; c.lineWidth = 4; c.strokeRect(sx, sy, cw, ch);
      c.save(); c.setLineDash([5, 7]); line(c, sx + cw, sy, 624, 56, '#bfccbe', 2); line(c, sx + cw, sy + ch, 624, 296, '#bfccbe', 2); c.restore();
      round(c, 613, 45, 366, 262, 16, C.paper, C.border);
      c.save(); c.beginPath(); c.roundRect(624, 56, 344, 240, 10); c.clip();
      c.translate(624, 56); c.scale(344 / cw, 240 / ch);
      drawPhoto(c, 50 - sx, 46 - sy, 360, 260); c.restore();
      c.strokeStyle = C.orange; c.lineWidth = 3; c.beginPath(); c.roundRect(624, 56, 344, 240, 10); c.stroke();
      round(c, 718, 309, 150, 5, 2, '#c3d0bd');
    }}/>
    <div style={{ padding: '16px 20px', marginTop: 14, background: '#f8fafc', border: `1px solid ${C.border}`, borderRadius: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}><strong style={{ color: C.blue }}>位置 {patch + 1} 的向量示例</strong><span style={{ color: C.muted, fontSize: 16 }}>6 个数值坐标 · 非 CLIP 实测</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 7, fontFamily: 'var(--ui-font-mono)' }} aria-label={`位置 ${patch + 1} 的六维教学向量`}>
        {vectors[patch].map((v, i) => <div key={i} style={{ textAlign: 'center', borderRadius: 8, background: '#eaf0f5', padding: '8px 2px' }}><span style={{ color: C.muted, display: 'block', fontSize: 13 }}>{i + 1}</span><strong style={{ color: C.blue, fontSize: 18 }}>{v.toFixed(2)}</strong></div>)}
      </div>
    </div>
    <div className="feedback" style={{ minHeight: 72 }} aria-live="polite">{regionNotes[patch]} 放大图展示局部像素；下方数值只演示向量形式，真实编码特征还吸收其他位置的信息。</div>
  </div>;
};