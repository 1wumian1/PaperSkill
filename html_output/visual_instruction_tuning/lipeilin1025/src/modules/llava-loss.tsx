import React,{useId,useState} from 'react';
import {Surface,C,line,round,label} from './llava-kit';

export const LLaVALoss:React.FC=()=>{
 const [p,setP]=useState(.2),id=useId(),loss=-Math.log(p);
 return <div>
  <div className="ctrl" style={{flexWrap:'wrap'}}><label htmlFor={id}>正确 token 的概率 p <span className="val">{p.toFixed(2)}</span></label><input id={id} type="range" min="0.05" max="0.95" step="0.05" value={p} onChange={e=>setP(Number(e.target.value))} onKeyDown={e=>{if(e.key.startsWith('Arrow'))e.stopPropagation();}}/></div>
  <div className="chip-row">{[.05,.2,.5,.95].map(v=><button type="button" key={v} className={'chip'+(Math.abs(v-p)<.001?' selected':'')} aria-pressed={Math.abs(v-p)<.001} onClick={()=>setP(v)}>p = {v.toFixed(2)}</button>)}</div>
  <Surface height={340} label={`负对数似然曲线：概率${p.toFixed(2)}，损失${loss.toFixed(3)}`} draw={c=>{
   const X=(v:number)=>95+v*590,Y=(v:number)=>280-v*75;
   round(c,36,22,680,293,14,C.paper,C.border);
   for(let y=0;y<=3;y++){line(c,95,Y(y),685,Y(y),'#e0e5df',1);label(c,String(y),80,Y(y)+6,C.muted,18,'right');}
   for(const x of [0,.25,.5,.75,1]){line(c,X(x),53,X(x),280,'#e9ede6',1);label(c,x.toFixed(2),X(x),306,C.muted,16,'center');}
   line(c,95,45,95,280,C.muted,1.5);line(c,95,280,685,280,C.muted,1.5);label(c,'损失',63,46,C.blue,18,'center');
   c.beginPath();for(let i=5;i<=100;i++){const v=i/100;i===5?c.moveTo(X(v),Y(-Math.log(v))):c.lineTo(X(v),Y(-Math.log(v)));}c.strokeStyle=C.blue;c.lineWidth=4;c.stroke();
   c.save();c.setLineDash([5,5]);line(c,95,Y(loss),X(p),Y(loss),C.orange,2);line(c,X(p),Y(loss),X(p),280,C.orange,2);c.restore();
   c.beginPath();c.arc(X(p),Y(loss),9,0,Math.PI*2);c.fillStyle=C.paper;c.fill();c.strokeStyle=C.orange;c.lineWidth=4;c.stroke();
   const cx=886,cy=145,r=70;c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.strokeStyle='#e0e7df';c.lineWidth=20;c.stroke();c.beginPath();c.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+Math.PI*2*p);c.strokeStyle=C.orange;c.lineWidth=20;c.stroke();
   label(c,`${Math.round(p*100)}%`,cx,cy+12,C.orange,36,'center');label(c,'正确词概率',cx,255,C.ink,22,'center');
  }}/>
  <div style={{display:'flex',flexWrap:'wrap',alignItems:'baseline',justifyContent:'center',gap:'10px 24px',padding:'18px 10px',fontFamily:'var(--ui-font-mono)'}} aria-live="polite"><span>−ln({p.toFixed(2)})</span><span>=</span><strong style={{fontSize:32,color:C.blue}}>{loss.toFixed(3)}</strong></div>
  <div className="feedback" style={{minHeight:68}} aria-live="polite">{p<=.2?'正确目标被赋予的概率较低，因此惩罚较大。':p>=.8?'正确目标被赋予的概率较高，因此惩罚接近 0。':'随着正确目标的概率提高，负对数似然持续下降。'} 这里固定目标 token，只演示 −ln p 的数学关系。</div>
 </div>;
};
