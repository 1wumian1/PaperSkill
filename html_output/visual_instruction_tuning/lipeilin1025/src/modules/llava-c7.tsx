import React, {useState} from 'react';
import {Surface,C,drawPhoto,round,line,label,point} from './llava-kit';

const parts=[
 {name:'图像',sample:'杯子与三支铅笔',mask:0,detail:'视觉特征提供回答所需的图像条件。这里不要求模型逐像素重建图像。'},
 {name:'用户问题',sample:'杯子里放着什么？',mask:0,detail:'问题告诉模型要回答什么。它作为条件参与计算，但不计入助手答案的损失。'},
 {name:'助手答案',sample:'杯子里放着铅笔。',mask:1,detail:'正确答案是监督目标。训练时，模型利用真实的历史答案来预测后续 token。'},
 {name:'停止符',sample:'本轮回答结束',mask:1,detail:'停止位置也接受监督，让模型学习何时结束这一轮回答。'}
];
export const LLaVAC7:React.FC=()=>{
 const [part,setPart]=useState(1),item=parts[part];
 return <div>
  <div className="chip-row" aria-label="选择序列片段">{parts.map((p,i)=><button type="button" className={'chip'+(i===part?' selected':'')} aria-pressed={i===part} key={p.name} onClick={()=>setPart(i)}>{i+1} · {p.name}</button>)}</div>
  <Surface height={320} label={`选中${item.name}，监督掩码为${item.mask}`} style={{cursor:'pointer'}} onPointerDown={e=>{const p=point(e,1080,320);if(p.y<50||p.y>270)return;const i=Math.floor((p.x-52)/248);if(i>=0&&i<4&&p.x<52+i*248+226)setPart(i);}} draw={c=>{
   label(c,'输入序列',56,30,C.blue,20);label(c,'答案损失',56,307,C.muted,20);
   for(let i=0;i<4;i++){
    const x=52+i*248,selected=i===part,supervised=parts[i].mask===1;
    round(c,x+3,56,226,144,16,'#e2e7de');round(c,x,50,226,144,16,selected?'#edf2f8':C.paper,selected?C.blue:C.border);
    label(c,String(i+1),x+24,83,selected?C.blue:C.muted,24);
    if(i===0)drawPhoto(c,x+61,68,125,108);
    else if(i===3){round(c,x+85,95,55,55,12,supervised?'#e0f0e6':'#e7ece8');round(c,x+101,111,23,23,4,C.green);}
    else {const widths=i===1?[110,87,54]:[117,102,70];widths.forEach((w,j)=>line(c,x+58,100+j*23,x+58+w,100+j*23,i===2?C.green:C.blue,5));}
    line(c,x+113,199,x+113,224,selected?C.orange:C.border,selected?3:2);
    round(c,x,228,226,45,9,supervised?'#e0f0e5':'#e9eee7',selected?C.orange:'');
    label(c,String(parts[i].mask),x+113,260,supervised?C.green:C.muted,30,'center');
   }
  }}/>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:12,marginTop:16}}>
   <div style={{padding:'14px 18px',border:`1px solid ${C.border}`,borderRadius:12,background:'#f6f8fb'}}><span style={{color:C.muted}}>当前片段</span><br/><strong>{item.sample}</strong></div>
   <div style={{padding:'14px 18px',border:`1px solid ${C.border}`,borderRadius:12,background:item.mask?'#edf7ef':'#f6f8fb'}}><span style={{color:C.muted}}>是否计入答案损失</span><br/><strong style={{color:item.mask?C.green:C.blue}}>mᵢ = {item.mask} · {item.mask?'计入':'不计入'}</strong></div>
  </div>
  <div className={'feedback'+(item.mask?' good':'')} style={{minHeight:70}} aria-live="polite">{item.detail}</div>
 </div>;
};
