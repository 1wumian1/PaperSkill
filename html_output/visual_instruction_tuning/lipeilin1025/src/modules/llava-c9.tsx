import React,{useState} from 'react';
import {Surface,C,round,line,label} from './llava-kit';
const variants=[
 {name:'最佳 13B',score:90.92,change:'参照配置',held:'13B、倒数第二层视觉特征、先做对齐预训练',lesson:'这是表 8 的参照项，用它衡量其余配置的变化。'},
 {name:'最后一层特征',score:89.96,change:'视觉特征：倒数第二层 → 最后一层',held:'13B 模型与对齐预训练保留',lesson:'该设置下降 0.96 个百分点。作者提出局部细节可能相关，这属于解释，不能仅凭分数证实机制。'},
 {name:'跳过对齐预训练',score:85.81,change:'省去阶段一的对齐预训练',held:'CLIP 与语言模型仍来自预训练',lesson:'该设置下降 5.11 个百分点，支持先学习视觉接口的价值；它不是把整个模型随机初始化。'},
 {name:'7B 模型',score:89.84,change:'语言模型规模：13B → 7B',held:'仍采用先对齐、后任务微调的路线',lesson:'该设置下降 1.08 个百分点。容量发生了变化，不能据此宣称同等预算下的优劣。'}
];
export const LLaVAC9:React.FC=()=>{
 const [variant,setVariant]=useState(0),v=variants[variant],delta=90.92-v.score;
 return <div>
  <div className="chip-row" aria-label="选择消融配置">{variants.map((item,i)=><button type="button" key={item.name} className={'chip'+(i===variant?' selected':'')} aria-pressed={i===variant} onClick={()=>setVariant(i)}>{item.name}</button>)}</div>
  <Surface height={300} label={`参照90.92%，${v.name}${v.score.toFixed(2)}%，差${delta.toFixed(2)}个百分点`} draw={c=>{
   const x=178,w=760;
   for(const tick of [0,25,50,75,100]){line(c,x+tick/100*w,48,x+tick/100*w,242,'#dfe6dd',1);label(c,String(tick),x+tick/100*w,272,C.muted,19,'center');}
   label(c,'参照',64,108,C.blue,25);label(c,'选中配置',64,202,C.orange,25);
   for(const [y,val,col] of [[75,90.92,C.blue],[169,v.score,C.orange]] as const){round(c,x,y,w,44,9,'#e0e7dc');round(c,x,y,val/100*w,44,9,col);label(c,val.toFixed(2),970,y+32,col,28,'center');}
   line(c,x,242,x+w,242,C.muted,1.5);
   if(variant>0){const xx=x+v.score/100*w,ref=x+90.92/100*w;line(c,xx,143,ref,143,C.orange,3);line(c,xx,135,xx,151,C.orange,2);line(c,ref,135,ref,151,C.orange,2);}
  }}/>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:14,marginTop:16}} aria-live="polite">
   <div style={{border:`1px solid ${C.border}`,borderRadius:12,padding:'16px 18px',background:'#f5f8fb'}}><span style={{color:C.muted}}>当前准确率</span><div style={{fontSize:32,fontWeight:750,color:C.blue}}>{v.score.toFixed(2)}%</div></div>
   <div style={{border:`1px solid ${C.border}`,borderRadius:12,padding:'16px 18px',background:'#fff7ef'}}><span style={{color:C.muted}}>相对参照</span><div style={{fontSize:32,fontWeight:750,color:variant?C.orange:C.muted}}>{variant?'−':'±'}{delta.toFixed(2)} <span style={{fontSize:19}}>个百分点</span></div></div>
  </div>
  <table className="paper" style={{width:'100%',tableLayout:'fixed'}} aria-label="当前配置的改变与保留条件"><tbody><tr><th style={{width:'20%'}}>改变了什么</th><td>{v.change}</td></tr><tr><th>保留的条件</th><td>{v.held}</td></tr></tbody></table>
  <div className="feedback" style={{minHeight:76}} aria-live="polite">{v.lesson}</div>
  <table className="paper" style={{width:'100%'}}><caption>原文第 9 页表 8 · ScienceQA 测试集准确率（越高越好）</caption><thead><tr><th>配置</th><th>准确率</th><th>差值</th></tr></thead><tbody>{variants.map((item,i)=><tr key={item.name} style={i===variant?{background:'#edf3f8',fontWeight:650}:undefined}><td>{item.name}</td><td>{item.score.toFixed(2)}%</td><td>{i===0?'参照':`−${(90.92-item.score).toFixed(2)} 个百分点`}</td></tr>)}</tbody></table>
 </div>;
};
