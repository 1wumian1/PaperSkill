import React, {useState} from 'react';
import {Surface,C,drawPhoto,drawNotebook,line,round,label} from './llava-kit';

const choices=[
  {name:'简单描述',question:'请简要描述这张图。',answer:'一个杯子里放着三支铅笔。',count:0,feedback:'把描述改成一个问答，仍只覆盖“画面里有什么”。这是教学对照，不属于三类数据中的额外一类。'},
  {name:'对话',question:'杯子里放了什么？有几支？',answer:'杯子里放着铅笔，共三支。',count:58,feedback:'对话让模型围绕可见内容回答具体问题；原文也包含多轮问答。'},
  {name:'详细描述',question:'请详细描述杯子及其中的物品。',answer:'一个带把手的杯子放在桌面上，三支铅笔从杯口伸出。',count:23,feedback:'详细描述增加对画面细节的覆盖，不只报出类别名称。'},
  {name:'复杂推理',question:'这个杯子在这里被怎样使用？依据是什么？',answer:'杯中装着铅笔，因此它在这里被用来收纳文具。仅凭这张图，无法判断物品的主人。',count:77,feedback:'复杂推理要求把证据连成解释；不能把生成的答案当作无误的事实。'}
] as const;
const panel:React.CSSProperties={padding:'16px 18px',border:'1px solid '+C.border,borderRadius:12,minWidth:0,background:'#fffdf8'};

export const LLaVAC5:React.FC=()=>{
  const [type,setType]=useState(0),selected=choices[type];
  return <div>
    <div className="chip-row" aria-label="选择指令数据类型">{choices.map((choice,index)=><button type="button" key={choice.name} className={'chip '+(index===type?'selected':'')} aria-pressed={index===type} onClick={()=>setType(index)}>{choice.name}</button>)}</div>
    <Surface height={360} label={'纯文本教师使用描述与框信息，LLaVA 学生使用图像与'+selected.name+'指令'} draw={c=>{
      round(c,22,17,502,285,15,'#eef1e9',C.border);
      round(c,548,17,510,285,15,'#edf3ef',C.border);
      label(c,'教师文本',48,51,C.blue,23);
      label(c,'学生图像',575,51,C.green,23);
      drawNotebook(c,57,72,423,194);
      for(let i=0;i<3;i++)line(c,126,105+i*22,413-i*39,105+i*22,i===0?C.blue:C.dark,3);
      for(let i=0;i<3;i++){round(c,125+i*89,191,66,39,5,'#e7ece2',C.border);line(c,138+i*89,204,177+i*89,204,C.muted,2);line(c,138+i*89,216,165+i*89,216,C.muted,2);}
      drawPhoto(c,581,78,232,194);
      round(c,835,98,181,151,12,C.paper,C.border);
      c.beginPath();c.moveTo(835,154);c.lineTo(820,163);c.lineTo(835,173);c.fillStyle=C.paper;c.fill();
      const lines=type===0?2:type===1?3:4;
      for(let i=0;i<lines;i++)line(c,854,128+i*24,991-(i%2)*34,128+i*24,i===0?C.blue:C.dark,3);
      round(c,853,223,136,6,3,type===0?'#d6ded1':C.green);
      let stripX=40;
      for(let index=0;index<3;index++){const width=1000*choices[index+1].count/158;round(c,stripX,321,width-3,22,3,type===index+1?C.blue:type===0?['#a8baa0','#c4d0ba','#8fa98d'][index]:'#dce4d5');stripX+=width;}
    }}/>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:12,margin:'14px 0'}}>
      <div style={panel}><strong style={{color:C.blue}}>教师收到的证据</strong><p style={{margin:'6px 0',fontSize:'1rem'}}>描述：杯中放着三支铅笔。<br/>框信息：杯子、铅笔的类别与位置。</p><span style={{fontSize:'1rem',color:C.muted}}>纯文本 GPT-4 不接收原图。</span></div>
      <div style={panel}><strong style={{color:C.green}}>学生训练时的配对</strong><p style={{margin:'6px 0',fontSize:'1rem'}}>图像 ＋ 当前问题 → 预测答案</p><span style={{fontSize:'1rem',color:C.muted}}>生成的答案用作监督目标。</span></div>
    </div>
    <div style={{border:'1px solid '+C.border,borderRadius:12,overflow:'hidden'}} aria-live="polite">
      <div style={{padding:'13px 18px',background:'#eef3f7',color:C.blue}}><b>问</b><span style={{marginLeft:15}}>{selected.question}</span></div>
      <div style={{padding:'15px 18px',minHeight:88,background:'#fffdf8'}}><b style={{color:C.green}}>答</b><span style={{marginLeft:15}}>{selected.answer}</span></div>
    </div>
    <div style={{marginTop:20}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',fontSize:'1rem',marginBottom:9}}><strong>图中条带 · 三类数据共约 15.8 万条</strong><span style={{color:C.muted}}>{type===0?'简单描述仅作教学对照':selected.name+'：约 '+selected.count/10+' 万条'}</span></div>
      <div style={{display:'flex',flexWrap:'wrap',gap:'6px 22px',fontSize:'1rem',marginTop:9}}>{choices.slice(1).map((choice,index)=><span key={choice.name} style={{color:type===index+1?C.blue:C.muted,fontWeight:type===index+1?700:500}}>{choice.name} {choice.count/10} 万 · {(choice.count/158*100).toFixed(1)}%</span>)}</div>
    </div>
    <div className="feedback" style={{minHeight:76}} aria-live="polite">{selected.feedback}</div>
    <p style={{fontSize:'1rem',color:C.muted,margin:'10px 0 0'}}>问答与插画为教学示例；数据规模来自原文。15.8 万条是样本数，不是不同图片数。</p>
  </div>;
};
