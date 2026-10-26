import React, { useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { Btn, C, FONT_MONO, FONT_SANS, Tag, toCanvas, useStage } from './dp-kit';
import { bruteBest, euclidOf, minPair, type Pt } from './dp-maxmin';

// 4.2 找短板（移植自原版 v7）：10 个点中选 4 个，Eq. (3) 方括号内的值 = 子集内最近一对的距离。
// 颜色：橙 = 你选的点；蓝 = 子集里最近的一对（得分）；绿虚线圈 = 穷举最优解。

const K = 4;
const LABELS = 'ABCDEFGHIJ'.split('');
const PTS: Pt[] = [
  { x: 0.1, y: 0.28, c: 0 }, { x: 0.22, y: 0.78, c: 0 }, { x: 0.33, y: 0.45, c: 0 }, { x: 0.42, y: 0.16, c: 0 },
  { x: 0.5, y: 0.62, c: 0 }, { x: 0.6, y: 0.88, c: 0 }, { x: 0.66, y: 0.38, c: 0 }, { x: 0.78, y: 0.12, c: 0 },
  { x: 0.84, y: 0.66, c: 0 }, { x: 0.93, y: 0.4, c: 0 },
];
const W = 760;
const H = 546;
const AR = 1.6;
const SC = Math.min((W - 80) / AR, H - 80);
const OX = (W - SC * AR) / 2;
const OY = (H - SC) / 2;
const pos = (i: number) => ({ x: OX + PTS[i].x * AR * SC, y: OY + PTS[i].y * SC });

export const DpM4Bottleneck: React.FC<WidgetProps> = () => {
  const [sel, setSel] = useState<number[]>([1, 2, 4, 5]);
  const [showBest, setShowBest] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const d = useMemo(() => euclidOf(PTS.map((p) => ({ ...p, x: p.x * AR }))), []);
  const best = useMemo(() => bruteBest(PTS.length, K, d), [d]);
  const mp = minPair(sel, d);
  const cur = sel.length >= 2 ? mp.v : 0;
  const ref = useRef<HTMLCanvasElement>(null);
  useStage(ref, W, H, (ctx) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.86)';
    ctx.beginPath(); ctx.roundRect(0, 0, W, H, 18); ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(39,68,110,0.25)';
    for (let a = 0; a < sel.length; a++) for (let b = a + 1; b < sel.length; b++) {
      const p = pos(sel[a]), q = pos(sel[b]);
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
    }
    if (showBest) best.set.forEach((i) => {
      const p = pos(i);
      ctx.strokeStyle = C.green; ctx.lineWidth = 3; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.arc(p.x, p.y, 28, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    });
    if (sel.length >= 2 && mp.a >= 0) {
      const p = pos(mp.a), q = pos(mp.b);
      ctx.strokeStyle = C.blue; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
      ctx.font = `700 24px ${FONT_MONO}`; ctx.fillStyle = C.blue;
      ctx.fillText(mp.v.toFixed(3), (p.x + q.x) / 2 + 12, (p.y + q.y) / 2 - 10);
    }
    PTS.forEach((_, i) => {
      const p = pos(i), on = sel.includes(i);
      ctx.beginPath(); ctx.arc(p.x, p.y, on ? 19 : 16, 0, Math.PI * 2);
      ctx.fillStyle = on ? C.orange : '#fff'; ctx.strokeStyle = on ? '#b85620' : C.muted; ctx.lineWidth = 2;
      ctx.fill(); ctx.stroke();
      ctx.font = `800 22px ${FONT_SANS}`; ctx.fillStyle = on ? '#fff' : C.ink; ctx.textAlign = 'center';
      ctx.fillText(LABELS[i], p.x, p.y + 8); ctx.textAlign = 'left';
    });
  }, [sel, showBest, best, mp.a, mp.b, mp.v]);

  const toggle = (i: number) => {
    if (sel.includes(i)) { setMsg(null); setSel(sel.filter((x) => x !== i)); }
    else if (sel.length >= K) setMsg(`已经选满 ${K} 个：先取消一个已选点，再选新的。`);
    else { setMsg(null); setSel([...sel, i]); }
  };
  const onCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = toCanvas(e, W, H);
    let bi = -1, bd = 34;
    PTS.forEach((_, i) => { const p = pos(i); const dd = Math.hypot(p.x - x, p.y - y); if (dd < bd) { bd = dd; bi = i; } });
    if (bi >= 0) toggle(bi);
  };
  const full = sel.length === K;
  const ratio = full ? cur / best.v : 0;
  let tone = '';
  let fb = `已选 ${sel.length} / ${K} 个。选满后，蓝线就是子集里最近的一对——它的长度就是得分。`;
  if (full) {
    if (ratio > 0.999) { tone = 'is-good'; fb = `得分 ${cur.toFixed(3)}，等于穷举最优值。最优子集里没有任何两点挤在一起。`; }
    else { tone = 'is-limit'; fb = `得分是最优值的 ${(ratio * 100).toFixed(0)}%。短板是 ${LABELS[mp.a]}–${LABELS[mp.b]}：换掉其中一个，往更空的地方挪。`; }
  }

  return (
    <div className="dp-root">
      <div className="dp-split-top">
        <span className="dp-h">从 10 个点里选 4 个，让最近的一对尽量远</span>
        <span className="dp-split-tags"><Tag kind="demo" /></span>
      </div>
      <canvas ref={ref} className="dp-canvas dp-split-cv is-tap" style={{ width: W, height: H }} onPointerUp={onCanvas}
        role="img" aria-label={`点选画布：已选 ${sel.map((i) => LABELS[i]).join('、') || '无'}`} />
      <div className="dp-glass dp-split-panel">
        <div className="dp-chips" role="group" aria-label="用按钮选择点（键盘可用）">
          {PTS.map((_, i) => (
            <button key={i} type="button" className={sel.includes(i) ? 'is-on' : ''} aria-pressed={sel.includes(i)} onClick={() => toggle(i)}>{LABELS[i]}</button>
          ))}
        </div>
        <div className="dp-readouts2">
          <div className="is-cur"><span>你的子集得分</span><b className="dp-em">{sel.length >= 2 ? cur.toFixed(3) : '—'}</b></div>
          <div className="is-good"><span>穷举最优（210 种）</span><b className="dp-em">{showBest ? best.v.toFixed(3) : '？'}</b></div>
        </div>
        <div className="dp-row">
          <Btn onClick={() => setShowBest((v) => !v)}>{showBest ? '隐藏最优解' : '显示最优解'}</Btn>
          <Btn onClick={() => { setSel([]); setMsg(null); }}>清空</Btn>
          {showBest ? <span className="dp-muted">最优：{best.set.map((i) => LABELS[i]).join('、')}</span> : null}
        </div>
        <div className={`dp-fb ${msg ? 'is-limit' : tone}`} role="status" aria-live="polite">{msg ?? fb}</div>
      </div>
    </div>
  );
};
