import React,{useState} from 'react';
import {Surface,C,round,line,label,drawPen,drawPhoto,point} from './llava-kit';

const stages=[
 {name:'① 特征对齐',data:'59.5 万图文对',updates:'只更新 W',note:'用筛选后的 CC3M 图文对学习视觉接口；CLIP 与 Vicuna 都固定。'},
 {name:'② 指令微调',data:'15.8 万条指令',updates:'更新 W + Vicuna',note:'聊天分支学习按指令回答；CLIP 固定，投影与语言模型共同更新。'},
 {name:'③ 推理',data:'图像 + 用户问题',updates:'所有权重固定',note:'利用已学到的参数生成答案，没有参数更新。'}
];
const nodes=[
 {name:'CLIP ViT-L/14',role:'视觉编码器',input:'输入图像 Xᵥ',output:'Zᵥ（dᵥ × N）',detail:'提取一串视觉特征。冻结参数不会切断图像信息；它仍参与每次前向计算。'},
 {name:'线性投影 W',role:'视觉连接层',input:'Zᵥ（dᵥ × N）',output:'Hᵥ（dₗ × N）',detail:'以同一个线性映射处理每个视觉位置，改变特征维度，保留序列长度 N。'},
 {name:'Vicuna',role:'语言模型',input:'视觉表示 + 文本上下文',output:'下一个答案 token 的概率',detail:'视觉表示与文本共同构成条件，用于逐步预测回答；文本分支直接进入语言模型。'}
];
function arrow(c:CanvasRenderingContext2D,x:number,y:number,xx:number,yy:number,color:string,width=3){line(c,x,y,xx,yy,color,width);const a=Math.atan2(yy-y,xx-x);line(c,xx,yy,xx-12*Math.cos(a-.45),yy-12*Math.sin(a-.45),color,width);line(c,xx,yy,xx-12*Math.cos(a+.45),yy-12*Math.sin(a+.45),color,width);}
function lock(c:CanvasRenderingContext2D,x:number,y:number){round(c,x-13,y-1,26,24,5,'#bac7c6');c.beginPath();c.arc(x,y-2,9,Math.PI,0);c.lineTo(x+9,y+2);c.strokeStyle=C.muted;c.lineWidth=3;c.stroke();c.beginPath();c.arc(x,y+9,3,0,Math.PI*2);c.fillStyle=C.paper;c.fill();}
export const LLaVAC8:React.FC=()=>{
 const [stage,setStage]=useState(0),[selected,setSelected]=useState(1),s=stages[stage],node=nodes[selected];
 const trainable=[false,stage!==2,stage===1],xs=[185,460,735];
 return <div>
  <div className="chip-row" aria-label="选择训练阶段">{stages.map((v,i)=><button type="button" key={v.name} className={'chip'+(stage===i?' selected':'')} aria-pressed={stage===i} onClick={()=>setStage(i)}>{v.name}</button>)}</div>
  <div style={{display:'flex',justifyContent:'space-between',gap:16,flexWrap:'wrap',padding:'14px 18px',background:'#f5f7fa',borderRadius:12,marginBottom:14}} aria-live="polite"><strong style={{color:C.blue}}>{s.updates}</strong><span style={{color:C.muted}}>{s.data}</span></div>
  <Surface height={340} label={`${s.name}：CLIP冻结，投影${trainable[1]?'更新':'冻结'}，Vicuna${trainable[2]?'更新':'冻结'}`} style={{cursor:'pointer'}} onPointerDown={e=>{const p=point(e,1080,340);if(p.y<58||p.y>210)return;for(let i=0;i<3;i++)if(p.x>=xs[i]&&p.x<=xs[i]+210)setSelected(i);}} draw={c=>{
   drawPhoto(c,20,83,125,105);label(c,'图像',83,58,C.muted,21,'center');arrow(c,145,136,185,136,selected===0?C.orange:C.blue,3);
   for(let i=0;i<2;i++)arrow(c,xs[i]+210,136,xs[i+1],136,selected===i+1?C.orange:C.blue,selected===i+1?4:2.5);
   for(let i=0;i<3;i++){
    const x=xs[i],active=i===selected;
    round(c,x+3,63,210,152,15,'#dfe6db');round(c,x,58,210,152,15,active?'#edf3f8':C.paper,active?C.blue:C.border);
    label(c,String(i+1),x+25,92,active?C.blue:C.muted,26);
    if(i===0){for(let r=0;r<3;r++)for(let j=0;j<4;j++)round(c,x+27+j*21,113+r*20,14,14,3,(j+r)%3===0?'#8caaa2':'#c4d6ce');}
    if(i===1){for(let r=0;r<3;r++)for(let j=0;j<4;j++)round(c,x+28+j*19,113+r*18,13,12,2,j===r?C.blue:'#bfd0cb');line(c,x+24,108,x+24,166,C.muted,2);line(c,x+105,108,x+105,166,C.muted,2);}
    if(i===2){for(let j=0;j<3;j++)round(c,x+24,114+j*19,90-j*14,10,4,j===0?C.blue:'#b4c8bf');}
    if(trainable[i])drawPen(c,x+159,168,.76,-.3,C.orange);else lock(c,x+160,135);
    line(c,x+16,198,x+194,198,trainable[i]?C.orange:'#b8c7c1',5);
   }
   round(c,472,260,220,52,10,'#eef2f7',C.border);for(let j=0;j<3;j++)line(c,491,273+j*12,661-j*21,273+j*12,C.blue,2.5);label(c,'文本',426,292,C.muted,21,'center');
   line(c,692,286,840,286,selected===2?C.orange:C.blue,2.5);arrow(c,840,286,840,210,selected===2?C.orange:C.blue,2.5);
   arrow(c,945,136,1002,136,C.green,3);for(let j=0;j<3;j++)round(c,1004+j*17,116,11,38,4,j===2?C.green:'#8eb6a0');
  }}/>
  <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10,marginTop:14}}>{nodes.map((n,i)=><button type="button" key={n.name} aria-pressed={i===selected} onClick={()=>setSelected(i)} style={{cursor:'pointer',textAlign:'left',font:'inherit',color:C.ink,border:`1px solid ${i===selected?C.blue:C.border}`,borderRadius:12,padding:'14px 12px',background:i===selected?'#edf3f8':'#fff'}}>
   <span style={{display:'block',fontWeight:700}}>{i+1} · {n.name}</span><span style={{display:'block',fontSize:17,color:C.muted,marginTop:4}}>{n.role}</span><span style={{display:'inline-block',marginTop:10,fontSize:17,color:trainable[i]?'#a65725':C.muted,background:trainable[i]?'#fff0df':'#edf1ef',padding:'2px 9px',borderRadius:6}}>{trainable[i]?'✎ 更新参数':'▣ 冻结参数'}</span>
  </button>)}</div>
  <div style={{padding:'16px 18px',background:'#f8faf7',borderRadius:12,marginTop:14}} aria-live="polite"><div style={{display:'flex',gap:12,flexWrap:'wrap',color:C.blue,fontFamily:'var(--ui-font-mono)'}}><span>{node.input}</span><span>→</span><strong>{node.output}</strong></div><p style={{margin:'10px 0 0'}}>{node.detail}</p></div>
  <div className="feedback" style={{minHeight:68}} aria-live="polite">{s.note} ScienceQA 使用另一个任务微调分支，不能和聊天分支混为一谈。</div>
 </div>;
};
