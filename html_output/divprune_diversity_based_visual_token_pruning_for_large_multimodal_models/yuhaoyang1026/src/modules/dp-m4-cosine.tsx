import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, FONT_SANS, Slider, Tag, useStage } from './dp-kit';

// 4.1 余弦距离 vs 欧氏距离，同时是第 4 章的测绘队类比（原先单独的罗盘情节并入这里）：
// 原点 = 营地，γ / ω = 两支测绘队走出的方向；罗盘读夹角（余弦距离），卷尺量两队之间的直线（欧氏距离）。
// γ 固定为单位长度、指向右方；ω 可调夹角与长度。
// 颜色：绿 = 余弦距离（DivPrune 用的度量）及夹角；灰虚线 = 欧氏距离；蓝 = 可调向量 ω。

const W = 760;
const H = 546;

export const DpM4Cosine: React.FC<WidgetProps> = () => {
  const [deg, setDeg] = useState(50);
  const [len, setLen] = useState(1);
  const last = useRef<'deg' | 'len' | null>(null);
  const th = (deg * Math.PI) / 180;
  const dc = 1 - Math.cos(th);
  const l2 = Math.hypot(1 - len * Math.cos(th), -len * Math.sin(th));
  const ref = useRef<HTMLCanvasElement>(null);
  useStage(ref, W, H, (ctx) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.86)';
    ctx.beginPath(); ctx.roundRect(0, 0, W, H, 18); ctx.fill();
    // 比例尺固定：按最大长度 1.6 留出箭头与标签的边距（左右各约 90px），任何夹角下端点和标签都在画布内，
    // 改变长度时 1 个单位始终是同样的像素，便于直接比较长短。
    const MAX_LEN = 1.6, MARGIN = 92;
    const ox = W / 2, oy = H - 80, unit = Math.floor((W / 2 - MARGIN) / MAX_LEN);
    ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.setLineDash([5, 6]);
    ctx.beginPath(); ctx.arc(ox, oy, unit, Math.PI, 0); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(30, oy); ctx.lineTo(W - 30, oy); ctx.stroke();
    ctx.font = `600 22px ${FONT_SANS}`; ctx.fillStyle = C.muted; ctx.textAlign = 'center';
    ctx.fillText('虚线半圆 = 长度 1', ox, oy - unit - 14);
    // 营地（原点）
    ctx.fillStyle = '#92400e';
    ctx.beginPath(); ctx.moveTo(ox - 16, oy + 30); ctx.lineTo(ox, oy + 6); ctx.lineTo(ox + 16, oy + 30); ctx.closePath(); ctx.fill();
    ctx.font = `700 22px ${FONT_SANS}`; ctx.fillStyle = C.muted; ctx.fillText('营地', ox, oy + 58);
    const ax = ox + unit, ay = oy;
    const bx = ox + Math.cos(th) * unit * len, by = oy - Math.sin(th) * unit * len;
    ctx.strokeStyle = '#8a96a8'; ctx.lineWidth = 3; ctx.setLineDash([9, 6]);
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = `700 22px ${FONT_SANS}`; ctx.fillStyle = C.muted; ctx.textAlign = 'center';
    // “卷尺”标签放在线段中点的法线方向、远离营地的一侧；线段太短（两队几乎重合）时不标
    const tdx = bx - ax, tdy = by - ay, tl = Math.hypot(tdx, tdy);
    if (tl > 40) {
      let nx = -tdy / tl, ny = tdx / tl;
      const mx0 = (ax + bx) / 2, my0 = (ay + by) / 2;
      const away = nx * (mx0 - ox) + ny * (my0 - oy);
      if (away < -1 || (Math.abs(away) <= 1 && ny < 0)) { nx = -nx; ny = -ny; }
      ctx.fillText('卷尺', mx0 + nx * 30, my0 + ny * 30 + 8);
    }
    ctx.strokeStyle = C.green; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(ox, oy, 54, -th, 0); ctx.stroke();
    const arrow = (x: number, y: number, color: string) => {
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(x, y); ctx.stroke();
      const a = Math.atan2(y - oy, x - ox);
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.lineTo(x - 20 * Math.cos(a - 0.4), y - 20 * Math.sin(a - 0.4));
      ctx.lineTo(x - 20 * Math.cos(a + 0.4), y - 20 * Math.sin(a + 0.4));
      ctx.closePath(); ctx.fill();
    };
    arrow(ax, ay, C.ink);
    arrow(bx, by, C.blue);
    ctx.font = `800 30px ${FONT_SANS}`; ctx.textAlign = 'left';
    ctx.fillStyle = C.ink; ctx.fillText('γ 队', ax - 34, ay + 40);
    ctx.fillStyle = C.blue; ctx.fillText('ω 队', bx + (Math.cos(th) >= 0 ? 14 : -76), by - 12);
    ctx.fillStyle = C.green; ctx.font = `800 28px ${FONT_SANS}`;
    const mx = ox + 72 * Math.cos(th / 2), my = oy - 72 * Math.sin(th / 2);
    ctx.textAlign = Math.cos(th / 2) > 0.3 ? 'left' : 'center';
    ctx.fillText(`罗盘 θ = ${deg}°`, mx + 4, my);
    ctx.textAlign = 'left';
  }, [th, len, deg]);

  let msg = '先只让 ω 队走远或走近，再只改两队的方向夹角，看罗盘和卷尺哪个读数会变。';
  let tone = '';
  if (last.current === 'len') {
    msg = `ω 队走了不同的距离：卷尺读数变为 ${l2.toFixed(3)}，罗盘读数仍是 ${dc.toFixed(3)}——方向没变，余弦距离就不变。`;
    tone = 'is-good';
  } else if (last.current === 'deg') {
    msg = `两队方向变了：罗盘读数（余弦距离）变为 ${dc.toFixed(3)}（${deg < 90 ? '小于 1，方向相近' : deg === 90 ? '正交时恰为 1' : '大于 1，方向相反'}）。${deg === 0 ? '方向相同时读数为 0，哪怕两队走的距离不同。' : ''}`;
    tone = deg === 0 ? 'is-limit' : '';
  }

  return (
    <div className="dp-root">
      <div className="dp-split-top">
        <span className="dp-h">两个视觉 token = 从营地出发的两支测绘队</span>
        <span className="dp-split-tags"><Tag kind="demo" /></span>
      </div>
      <canvas ref={ref} className="dp-canvas dp-split-cv" style={{ width: W, height: H }} role="img"
        aria-label={`夹角 ${deg} 度，ω 长度 ${len.toFixed(2)}，余弦距离 ${dc.toFixed(3)}，欧氏距离 ${l2.toFixed(3)}`} />
      <div className="dp-glass dp-split-panel">
        <div className="dp-readouts2">
          <div className="is-good"><span>罗盘：余弦距离 <span style={{ whiteSpace: 'nowrap' }}>1 − cos θ</span></span><b className="dp-em">{dc.toFixed(3)}</b></div>
          <div><span>卷尺：欧氏距离 <span style={{ whiteSpace: 'nowrap' }}>‖γ − ω‖</span></span><b className="dp-em">{l2.toFixed(3)}</b></div>
        </div>
        <Slider label="两队方向夹角 θ" value={deg} min={0} max={180} onChange={(v) => { last.current = 'deg'; setDeg(v); }} display={`${deg}°`} />
        <Slider label="ω 队走出的距离（γ 队固定为 1）" value={len} min={0.3} max={1.6} step={0.01} onChange={(v) => { last.current = 'len'; setLen(v); }} display={len.toFixed(2)} />
        <div className={`dp-fb ${tone}`} role="status" aria-live="polite">{msg}</div>
      </div>
    </div>
  );
};
