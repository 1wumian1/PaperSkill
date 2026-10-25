import React, {useId, useState} from 'react';
import {Surface, C, line, round, label} from './llava-kit';

function vector(c:CanvasRenderingContext2D, x:number, y:number, dx:number, dy:number, color:string, width:number) {
  const endX=x+dx, endY=y+dy, angle=Math.atan2(dy,dx);
  line(c,x,y,endX,endY,color,width);
  c.beginPath(); c.moveTo(endX,endY);
  c.lineTo(endX-15*Math.cos(angle-.42),endY-15*Math.sin(angle-.42));
  c.lineTo(endX-15*Math.cos(angle+.42),endY-15*Math.sin(angle+.42));
  c.closePath(); c.fillStyle=color; c.fill();
}
const presets=[{name:'压掉一维',value:0},{name:'保持不变',value:1},{name:'反转方向',value:-1}];
const card:React.CSSProperties={padding:'14px 18px',border:'1px solid '+C.border,borderRadius:12,background:'#fffdf8',minWidth:0};

export const LLaVAC4:React.FC=()=>{
  const [a,setA]=useState(0),id=useId(),formatted=a.toFixed(1);
  const explanation=a===0
    ? '第一维变成 0：输入中这一维的信息被丢弃；第二维仍是 0.5。'
    :a===1?'此时 W 是单位矩阵，输入与输出重合。接入语言模型，仍不等于学会了语义。'
    :a<0?'第一维改变了符号，输出落到纵轴左侧；第二维没有改变。'
    :'第一维按系数伸缩，第二维保持 0.5。线性层改变的是向量坐标。';
  return <div>
    <div className="chip-row" aria-label="选择投影示例">
      {presets.map(item=><button key={item.name} type="button" className={'chip '+(a===item.value?'selected':'')} aria-pressed={a===item.value} onClick={()=>setA(item.value)}>{item.name} · a={item.value}</button>)}
    </div>
    <div className="ctrl" style={{flexWrap:'wrap'}}>
      <label htmlFor={id}>投影系数 a <span className="val">{formatted}</span></label>
      <input id={id} type="range" min={-1} max={2} step={.1} value={a} onChange={event=>setA(Number(event.target.value))} onKeyDown={event=>{if(event.key.startsWith('Arrow'))event.stopPropagation();}}/>
    </div>
    <Surface height={340} label={'蓝色输入为（1，0.5），橙色输出为（'+formatted+'，0.5）'} draw={c=>{
      round(c,28,18,1024,300,16,C.paper,C.border);
      const x=(v:number)=>386+v*270, y=(v:number)=>260-v*215;
      for(const tick of [-1,-.5,0,.5,1,1.5,2])line(c,x(tick),43,x(tick),275,tick===0?'#9daca5':'#e7ebe3',tick===0?1.7:1);
      for(const tick of [0,.25,.5,.75,1])line(c,78,y(tick),992,y(tick),tick===0?'#9daca5':'#e7ebe3',tick===0?1.7:1);
      for(const tick of [-1,0,1,2])label(c,String(tick),x(tick),300,C.muted,19,'center');
      for(const tick of [.5,1])label(c,String(tick),62,y(tick)+6,C.muted,18,'right');
      c.save(); c.setLineDash([6,6]);
      line(c,x(a),y(.5),x(a),y(0),C.orange,2);
      line(c,x(0),y(.5),x(a),y(.5),C.orange,2);
      c.restore();
      vector(c,x(0),y(0),270,-107.5,C.blue,7);
      vector(c,x(0),y(0),a*270,-107.5,C.orange,4);
      c.beginPath();c.arc(x(0),y(0),5,0,Math.PI*2);c.fillStyle=C.ink;c.fill();
      c.beginPath();c.arc(x(a),y(.5),10,0,Math.PI*2);c.fillStyle=C.paper;c.fill();c.strokeStyle=C.orange;c.lineWidth=4;c.stroke();
    }}/>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,margin:'16px 0'}} aria-live="polite">
      <div style={card}><div style={{fontSize:'1rem',color:C.muted}}>蓝色 · 固定输入 z</div><strong style={{display:'block',fontFamily:'var(--ui-font-mono)',fontSize:24,color:C.blue,marginTop:6}}>(1, 0.5)</strong></div>
      <div style={card}><div style={{fontSize:'1rem',color:C.muted}}>线性投影 W</div><div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,fontFamily:'var(--ui-font-mono)',marginTop:5}}><span style={{fontSize:40,lineHeight:1}}>[</span><span style={{display:'grid',gridTemplateColumns:'44px 44px',textAlign:'center',fontSize:21,lineHeight:1.25}}><b style={{color:C.orange}}>{formatted}</b><span>0</span><span>0</span><span>1</span></span><span style={{fontSize:40,lineHeight:1}}>]</span></div></div>
      <div style={{...card,background:'#fff4e9',borderColor:'#efc6a2'}}><div style={{fontSize:'1rem',color:C.muted}}>橙色 · 输出 h = Wz</div><strong style={{display:'block',fontFamily:'var(--ui-font-mono)',fontSize:24,color:C.ink,marginTop:6}}>({formatted}, 0.5)</strong></div>
    </div>
    <div className="feedback" style={{minHeight:72}} aria-live="polite">{explanation}</div>
    <p style={{fontSize:'1rem',color:C.muted,margin:'10px 0 0'}}>这里用二维矩阵看清运算；a 不是模型的实际权重，图中距离也不表示语义质量。</p>
  </div>;
};
