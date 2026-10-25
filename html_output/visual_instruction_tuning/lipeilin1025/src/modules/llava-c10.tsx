import React,{useEffect,useRef,useState} from 'react';
import {Surface,C,line,round,label} from './llava-kit';

type Row={name:string;value:number;sd?:number;role?:'paper'|'ensemble'|'best'};
const benchmarks:{name:string;unit:string;sample:string;source:string;feedback:string;rows:Row[]}[]=[
 {name:'COCO 指令消融',unit:'相对评分（%）· 越高越好',sample:'30 张图 · 90 个问题',source:'原文第 7 页，表 4 · COCO-Val2014',feedback:'GPT-4 根据图像的文字标注评价回答，再相对文本版 GPT-4 的参考回答归一化。85.1 是这一协议中的相对评分，不是准确率。',rows:[{name:'无指令微调',value:21.5},{name:'仅对话',value:73.8},{name:'对话 + 5% 详细描述 + 10% 复杂推理',value:80.5},{name:'详细描述 + 复杂推理',value:81.9},{name:'全部三类数据',value:85.1,role:'best'}]},
 {name:'野外图像',unit:'相对评分均值 ± 标准差（%）',sample:'24 张图 · 60 个问题 · 3 次推理',source:'原文第 7 页，表 5',feedback:'± 表示三次推理结果的标准差，不是置信区间。这组问题与 COCO 不同，两个协议的分数不能直接解释为同一难度上的进退。',rows:[{name:'OpenFlamingo',value:19.1,sd:.4},{name:'BLIP-2',value:38.1,sd:1},{name:'LLaVA',value:67.3,sd:2,role:'best'}]},
 {name:'ScienceQA',unit:'选择题准确率（%）',sample:'4,241 道测试题 · 经任务微调',source:'原文第 9 页，表 7',feedback:'90.92% 属于任务微调后的 LLaVA；92.53% 属于 LLaVA 与文本版 GPT-4 联合判断。后者增加了外部模型，不能归为 LLaVA 独立能力。',rows:[{name:'文本版 GPT-4（2-shot）',value:82.69},{name:'LLaVA（任务微调）',value:90.92,role:'paper'},{name:'LLaVA + GPT-4（补答）',value:90.97,role:'ensemble'},{name:'LLaVA + GPT-4（联合判断）',value:92.53,role:'ensemble'}]}
];
export const LLaVAC10:React.FC=()=>{
 const [benchmark,setBenchmark]=useState(0),[started,setStarted]=useState(false),[running,setRunning]=useState(false),[run,setRun]=useState(0),startAt=useRef(0);
 const b=benchmarks[benchmark],digits=benchmark===2?2:1;
 useEffect(()=>{if(!running)return;const timer=window.setTimeout(()=>setRunning(false),1600);return()=>window.clearTimeout(timer);},[running,run]);
 const start=()=>{startAt.current=performance.now()/1000;setStarted(true);setRunning(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);setRun(n=>n+1);};
 return <div>
  <div className="chip-row" aria-label="选择评测协议">{benchmarks.map((item,i)=><button key={item.name} type="button" className={'chip'+(i===benchmark?' selected':'')} aria-pressed={i===benchmark} onClick={()=>{setBenchmark(i);setStarted(false);setRunning(false);}}>{item.name}</button>)}</div>
  <div style={{padding:'14px 18px',borderRadius:12,background:'#f3f7fa',display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',margin:'12px 0'}}><strong style={{color:C.blue}}>{b.unit}</strong><span style={{color:C.muted}}>{b.sample}</span></div>
  <button type="button" className="tiny" onClick={start} style={{margin:'4px 0 18px'}}>{running?'重新开始':started?'重新对比':'开始对比'}</button>
  <table className="paper" style={{width:'100%',tableLayout:'fixed'}} aria-label={b.name+'论文报告结果'}>
   <caption>{b.source} · 数值为论文报告值</caption>
   <thead><tr><th style={{width:'38%'}}>方法或数据配置</th><th style={{width:'42%'}}>同一尺度 0–100</th><th style={{width:'20%'}}>结果</th></tr></thead>
   <tbody>{b.rows.map((row,i)=>{
    const col=row.role==='ensemble'?C.purple:row.role==='best'?C.green:row.role==='paper'?C.blue:'#8a9d99';
    return <tr key={row.name} style={{background:row.role==='paper'||row.role==='best'?'#f2f7f3':undefined}}>
     <td style={{fontWeight:row.role?700:500,overflowWrap:'anywhere'}}>{row.name}</td>
     <td style={{padding:'12px 4px'}}>
      <Surface key={benchmark+'-'+run+'-'+i} width={640} height={76} animate={running} label={row.name+' '+row.value.toFixed(digits)+(row.sd!==undefined?'，标准差 '+row.sd.toFixed(1):'')} draw={(c,t)=>{
       const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
       const p=!started?0:!running||reduce?1:Math.max(0,Math.min(1,(t-startAt.current)/1.4)),eased=1-Math.pow(1-p,3);
       const x=12,w=604;round(c,x,23,w,30,7,'#e0e7dd');if(p>0)round(c,x,23,w*row.value/100*eased,30,7,col);
       if(row.sd!==undefined&&p===1){const lo=x+w*(row.value-row.sd)/100,hi=x+w*(row.value+row.sd)/100;line(c,lo,38,hi,38,C.ink,2);line(c,lo,30,lo,46,C.ink,2);line(c,hi,30,hi,46,C.ink,2);}
       for(const v of [0,50,100])line(c,x+w*v/100,58,x+w*v/100,64,C.muted,1);
      }}/>
     </td>
     <td style={{fontWeight:750,color:col,fontVariantNumeric:'tabular-nums'}}>{row.value.toFixed(digits)}{row.sd!==undefined?<><br/><span style={{fontSize:17,fontWeight:500}}>± {row.sd.toFixed(1)}</span></>:null}</td>
    </tr>;
   })}</tbody>
  </table>
  {benchmark===2?<p style={{color:C.purple,fontSize:18,margin:'10px 0'}}>紫色行使用外部 GPT-4；与蓝色的 LLaVA 单模型结果分开解读。</p>:null}
  <div className="feedback" style={{minHeight:85}} aria-live="polite">{b.feedback}</div>
 </div>;
};
