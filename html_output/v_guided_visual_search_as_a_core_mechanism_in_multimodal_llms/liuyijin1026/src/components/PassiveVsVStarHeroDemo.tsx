import { useEffect, useState } from 'react';
import './PassiveVsVStarHeroDemo.css';

// One clock drives both cards: 10 s demonstration, 1 s hold, 400 ms reset.
const boundaries = [0, 850, 1500, 3000, 4500, 6000, 7500, 10000, 11000, 11200, 11400];
const passiveStatus = [
  '同一张完整场景', '杯子里有绿色液体', '全图缩入固定视觉输入',
  '小目标的有效视觉细节减少', '视觉证据不足', '视觉证据不足',
  '视觉证据不足 · 无法可靠判断', '视觉证据不足 · 无法可靠判断', '视觉证据不足 · 无法可靠判断',
];
const activeStatus = [
  '同一张完整场景', '先看完整场景', '根据问题寻找杯子',
  '常识线索：先看桌面', '缩小范围，定位杯子', 'Target found · 找到目标',
  'Answer: Green · 绿色', 'Answer: Green · 绿色', 'Answer: Green · 绿色',
];

// Original teaching illustration. Both views and the zoom use this exact geometry;
// the cup is not replaced by an invented detail image at the end of the search.
function DiningScene() {
  return <g className="vhero-room">
    <path className="vhero-wall" d="M0 0H900V280H0Z"/>
    <path className="vhero-floor" d="M0 280H900V400H0Z"/>
    <path className="vhero-line" d="M0 280H900M150 280L70 400M750 280L840 400"/>
    <rect className="vhero-window" x="60" y="35" width="215" height="155" rx="3"/>
    <path className="vhero-line" d="M167 35V190M60 112H275"/>
    <rect className="vhero-frame" x="345" y="48" width="104" height="85" rx="3"/>
    <path className="vhero-line" d="M360 117L386 82L404 103L433 72"/>
    <path className="vhero-furniture" d="M735 160H865V300H735Z"/>
    <path className="vhero-line" d="M744 205H855M744 248H855M795 160V300"/>
    <path className="vhero-vase" d="M785 134H814L810 160H789Z"/>
    <path className="vhero-line" d="M800 134V78M799 116L778 99M800 106L820 88"/>
    <path className="vhero-furniture" d="M226 192Q226 180 239 180H290Q302 180 302 192V320H288V238H240V320H226ZM590 183H660V315H645V234H605V315H590Z"/>
    <path className="vhero-table-leg" d="M210 273H230V385H210ZM635 273H655V385H635Z"/>
    <path className="vhero-table" d="M240 206H625L690 283H172Z"/>
    <path className="vhero-table-edge" d="M172 283H690V296H172Z"/>
    <ellipse className="vhero-plate" cx="323" cy="247" rx="46" ry="14"/>
    <ellipse className="vhero-line" cx="323" cy="247" rx="32" ry="9"/>
    <ellipse className="vhero-plate" cx="566" cy="261" rx="43" ry="13"/>
    <ellipse className="vhero-line" cx="566" cy="261" rx="30" ry="8"/>
    <path className="vhero-line" d="M263 235L249 261M380 235L391 261M517 250L508 274M618 250L631 274"/>
    <path className="vhero-napkin" d="M415 255L452 252L468 269L430 273Z"/>
    <ellipse className="vhero-plate" cx="435" cy="222" rx="30" ry="10"/>
    <path className="vhero-bowl" d="M405 220Q412 243 435 243Q458 243 465 220Z"/>
    <g className="vhero-glass">
      <ellipse className="vhero-cup-shadow" cx="532" cy="232" rx="15" ry="4"/>
      <path className="vhero-glass-wall" d="M522 204H541L538 230Q531 234 525 230Z"/>
      <path className="vhero-liquid" d="M524 216H539L537 229Q531 232 526 229Z"/>
      <ellipse className="vhero-liquid" cx="531.5" cy="216" rx="7.5" ry="2.4"/>
      <ellipse className="vhero-glass-rim" cx="531.5" cy="204" rx="9.5" ry="3"/>
      <path className="vhero-glass-shine" d="M526 208L528 226"/>
    </g>
  </g>;
}

function DemoCard({ active, phase }: { active: boolean; phase: number }) {
  const zoomed = active && phase >= 5 && phase < 9;
  const compressed = !active && phase >= 2 && phase < 9;
  const focus = active && phase >= 2 && phase < 5;
  const success = active && phase >= 5;
  const status = (active ? activeStatus : passiveStatus)[Math.min(phase, 8)];
  const detail = !active && phase >= 4 ? '全局场景仍可见，关键局部细节不足。' : '\u00a0';
  return <article className={`vhero-card ${active ? 'vhero-new' : 'vhero-old'}`} aria-label={active ? 'V* 主动寻找局部证据' : 'Passive MLLM 固定视觉输入'}>
    <div className="vhero-head">{active ? '本文方法' : '传统方法'}</div>
    <div className="vhero-canvas">
      <div className="vhero-subtitle">{active && phase >= 2 ? '杯子里的液体是什么颜色？' : '\u00a0'}</div>
      <svg className={`vhero-scene${compressed ? ' is-compressed' : ''}${zoomed ? ' is-zoomed' : ''}`} viewBox="0 0 900 400" role="img" aria-label={compressed ? '完整餐桌场景整体缩小，杯中颜色细节不足' : zoomed ? '同一场景中的杯子局部放大，可见绿色液体' : '餐厅全景：桌面上有一个盛着绿色液体的小玻璃杯'}>
        <g className="vhero-image"><DiningScene/></g>
        {!active && phase === 1 && <rect className="vhero-hint" x="510" y="193" width="43" height="47" rx="5"/>}
        <rect className={`vhero-focus${phase >= 4 ? ' at-glass' : phase >= 3 ? ' at-table' : ''}`} x="0" y="0" width="900" height="400" rx="10" style={{ opacity: focus ? 1 : 0 }}/>
      </svg>
      <div className="vhero-cue">{active ? phase >= 5 ? 'glass · 局部放大' : phase >= 4 ? 'Focus: glass' : phase >= 3 ? 'Context: table' : phase >= 2 ? 'Target: glass' : '\u00a0' : compressed ? '全局 resize' : '\u00a0'}</div>
      <div className={`vhero-status${success ? ' is-found' : ''}`}>
        <strong key={status}>{status}</strong>
        <span key={detail}>{detail}</span>
      </div>
    </div>
  </article>;
}

export function PassiveVsVStarHeroDemo() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const started = performance.now();
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const elapsed = (performance.now() - started) % boundaries[boundaries.length - 1];
      const next = boundaries.findIndex(boundary => boundary > elapsed);
      setPhase(next - 1);
      timer = setTimeout(tick, boundaries[next] - elapsed + 8);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);
  return <div className="vhero-demo" role="group" aria-label="教学示意：固定视觉输入与任务引导搜索的自动循环对照" data-phase={phase}>
    <div className={`vhero-compare${phase >= 8 ? ' is-resetting' : ''}`}>
      <DemoCard active={false} phase={phase}/>
      <DemoCard active phase={phase}/>
    </div>
  </div>;
}
