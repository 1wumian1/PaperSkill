import React, { useRef, useState } from 'react';
import { Surface, C, round, line, label, point } from './llava-kit';

const W = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, -1]];
const z = [1, .5, -.5];
const h = W.map(row => row.reduce((sum, weight, i) => sum + weight * z[i], 0));
const number = (n: number) => n < 0 ? `−${Math.abs(n)}` : String(n);

export const LLaVAC3: React.FC = () => {
  const [plateY, setPlateY] = useState(254);
  const [dragging, setDragging] = useState(false);
  const pointer = useRef<number | null>(null);
  const dragOffset = useRef(0);
  const connected = plateY <= 152;
  const clamp = (y: number) => Math.max(130, Math.min(254, y));
  const release = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pointer.current !== e.pointerId) return;
    pointer.current = null;
    setDragging(false);
    setPlateY(y => y <= 192 ? 130 : 254);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };
  return <div>
    <div className="chip-row" aria-label="选择连接方式">
      <button type="button" className={`chip ${!connected ? 'selected' : ''}`} aria-pressed={!connected} onClick={() => setPlateY(254)}>直接连接</button>
      <button type="button" className={`chip ${connected ? 'selected' : ''}`} aria-pressed={connected} onClick={() => setPlateY(130)}>接入投影</button>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', color: C.muted, fontSize: 16, fontWeight: 700, margin: '4px 0 10px' }}><span>视觉向量：3 维</span><span>线性投影：4 × 3</span><span>语言接口：4 维</span></div>
    <Surface height={340} label={connected ? '投影矩阵把三维输入映射为四维输出，接口可以接收' : '直接连接时三维输入无法匹配四维接口；可将投影卡片拖入中间虚线槽'} style={{ cursor: dragging ? 'grabbing' : 'grab' }}
      onPointerDown={e => {
        const p = point(e, 1080, 340);
        if (p.x < 466 || p.x > 614 || p.y < plateY - 45 || p.y > plateY + 45) return;
        pointer.current = e.pointerId; dragOffset.current = p.y - plateY;
        e.currentTarget.setPointerCapture(e.pointerId); setDragging(true);
      }}
      onPointerMove={e => { if (pointer.current === e.pointerId) setPlateY(clamp(point(e, 1080, 340).y - dragOffset.current)); }}
      onPointerUp={release} onPointerCancel={release}
      draw={c => {
        round(c, 42, 57, 295, 147, 16, C.paper, C.border);
        round(c, 737, 57, 301, 147, 16, C.paper, connected ? '#a8cbb5' : '#d7deea');
        z.forEach((v, i) => { round(c, 68 + i * 83, 100, 66, 61, 10, '#e8eef4', '#c7d5e1'); label(c, number(v), 101 + i * 83, 139, C.blue, 27, 'center'); });
        for (let i = 0; i < 4; i++) {
          round(c, 759 + i * 65, 100, 54, 61, 10, connected ? '#e4f1e7' : '#eef1eb', connected ? '#b1d0bb' : '#d9e0d5');
          if (connected) label(c, number(h[i]), 786 + i * 65, 139, C.green, 24, 'center');
          else { c.save(); c.setLineDash([3, 4]); line(c, 774 + i * 65, 131, 800 + i * 65, 131, C.muted, 2); c.restore(); }
        }
        line(c, 337, 131, 460, 131, connected ? C.blue : C.border, 3);
        line(c, 620, 131, 737, 131, connected ? C.green : C.border, 3);
        line(c, 723, 123, 737, 131, connected ? C.green : C.border, 3); line(c, 723, 139, 737, 131, connected ? C.green : C.border, 3);
        c.save(); c.setLineDash([6, 7]); round(c, 458, 77, 164, 108, 14, '#edf1e8', connected ? C.green : '#b6c4b2'); c.restore();
        if (!connected) {
          line(c, 670, 112, 694, 148, C.red, 4); line(c, 694, 112, 670, 148, C.red, 4);
          c.save(); c.setLineDash([3, 5]); line(c, 540, 194, 540, plateY - 49, '#b6c4b2', 2); c.restore();
        }
        round(c, 470, plateY - 41, 140, 86, 12, connected ? '#e4f0e8' : '#fff3e6', connected ? C.green : C.orange);
        for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) {
          const v = W[row][col]; round(c, 499 + col * 28, plateY - 27 + row * 17, 13, 10, 3, v === 0 ? '#dce4d9' : v < 0 ? C.orange : C.blue);
        }
        line(c, 522, plateY + 34, 558, plateY + 34, connected ? '#8dae97' : '#d9b382', 3);
        if (connected) {
          c.beginPath(); c.moveTo(863, 233); c.lineTo(878, 247); c.lineTo(910, 213); c.strokeStyle = C.green; c.lineWidth = 5; c.lineCap = 'round'; c.stroke();
        }
      }}/>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, marginTop: 14 }}>
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 18px', background: '#f8fafc' }}>
        <strong style={{ color: C.blue }}>教学用矩阵 W</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10 }}><span style={{ color: C.muted }}>4 行 × 3 列</span><div aria-label="矩阵行分别为一零零、零一零、零零一、一一负一" style={{ borderLeft: `2px solid ${C.blue}`, borderRight: `2px solid ${C.blue}`, padding: '2px 14px', fontFamily: 'var(--ui-font-mono)' }}>{W.map((row, i) => <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(3,32px)', textAlign: 'center' }}>{row.map((v, j) => <span key={j}>{number(v)}</span>)}</div>)}</div></div>
      </div>
      <div aria-live="polite" style={{ border: `1px solid ${connected ? '#b8d5c1' : C.border}`, borderRadius: 12, padding: '14px 18px', background: connected ? '#f0f7f1' : '#f8fafc' }}>
        <strong style={{ color: connected ? C.green : C.muted }}>{connected ? 'h = Wz' : '接口尚不能接收'}</strong>
        <p style={{ margin: '10px 0', fontFamily: 'var(--ui-font-mono)' }}>z = [1, 0.5, −0.5]ᵀ</p>
        <div style={{ color: connected ? C.green : C.muted, fontFamily: 'var(--ui-font-mono)' }}>{connected ? 'h = [1, 0.5, −0.5, 2]ᵀ' : '3 个坐标 ≠ 4 个坐标'}</div>
      </div>
    </div>
    <div className={`feedback ${connected ? 'good' : ''}`} style={{ minHeight: 72 }} aria-live="polite">{connected ? '投影接入后，输出变成 4 维；最后一项为 1 + 0.5 − (−0.5) = 2。维度兼容后，仍要通过训练学习有用的语义映射。' : '把橙色矩阵卡片向上拖入虚线槽，或点击“接入投影”。直接传递 3 个坐标，无法满足需要 4 个坐标的输入接口。'}</div>
  </div>;
};