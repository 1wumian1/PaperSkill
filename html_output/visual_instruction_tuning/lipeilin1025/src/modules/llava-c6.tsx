import React, {useState} from 'react';
import {Surface,C,drawPhoto,drawNotebook,drawPen,line,round,label} from './llava-kit';

const segments=['杯子','里','放着','几支','铅笔','。'];
const region:React.CSSProperties={border:'1px solid '+C.border,borderRadius:12,padding:'15px 18px',background:'#fffdf8',minWidth:0};

export const LLaVAC6:React.FC=()=>{
  const [step,setStep]=useState(0);
  const history=segments.slice(0,Math.max(0,step-1)).join('');
  const generated=segments.slice(0,step).join('');
  const current=step?segments[step-1]:null;
  return <div>
    <div className="step-ctrl" style={{flexWrap:'wrap'}}>
      <button type="button" className="tiny ghost" disabled={step===0} onClick={()=>setStep(s=>s-1)}>上一步</button>
      <span className="val" aria-live="polite">{step} / 6</span>
      <button type="button" className="tiny" disabled={step===6} onClick={()=>setStep(s=>s+1)}>{step===6?'已展开全部片段':'生成下一片段'}</button>
      <button type="button" className="tiny ghost" onClick={()=>setStep(0)}>重置</button>
    </div>
    <Surface height={320} label={step===6?'六个教学片段已全部展开':'已生成 '+step+' 个教学片段，后续内容仍被遮住'} draw={c=>{
      drawPhoto(c,28,53,247,208);
      drawNotebook(c,316,28,722,254);
      const left=396,cell=90,box=70,top=116;
      for(let i=0;i<6;i++){
        const known=i<step-1,newest=step>0&&i===step-1;
        round(c,left+i*cell,top,box,80,9,known?'#e1eaf1':newest?'#fff0df':'#f0f3ec',newest?C.orange:known?C.blue:C.border);
        label(c,String(i+1),left+i*cell+box/2,100,newest?C.orange:C.muted,20,'center');
        if(i<step){
          line(c,left+i*cell+15,top+30,left+i*cell+56,top+30,newest?C.orange:C.blue,4);
          line(c,left+i*cell+15,top+47,left+i*cell+42,top+47,newest?C.orange:C.blue,3);
        }else{
          c.save();c.setLineDash([4,5]);line(c,left+i*cell+18,top+40,left+i*cell+52,top+40,C.muted,2);c.restore();
        }
      }
      if(step>1){const right=left+(step-2)*cell+box;line(c,left,216,right,216,C.blue,3);line(c,left,207,left,216,C.blue,3);line(c,right,207,right,216,C.blue,3);}
      const penX=left+Math.max(0,step-1)*cell+48;
      drawPen(c,penX,139,.72,-.4,step===0?C.muted:C.orange);
      if(step>0)line(c,left,245,left+(step/6)*(5*cell+box),245,step===6?C.green:C.blue,4);
    }}/>
    <div style={{display:'flex',gap:'8px 20px',flexWrap:'wrap',fontSize:'1rem',margin:'10px 0 16px',color:C.muted}}><span><b style={{color:C.blue}}>蓝色</b> · 本步之前的答案</span><span><b style={{color:C.orange}}>橙色</b> · 本步新增</span><span>灰色 · 尚未生成</span></div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:12}} aria-live="polite">
      <div style={region}>
        <strong style={{color:C.blue}}>{step===0?'生成前的上下文':'第 '+step+' 步预测时可读的上下文'}</strong>
        <div style={{fontSize:'1rem',color:C.muted,marginTop:9}}>图像 ＋ 问题“杯子里有什么？”</div>
        <div style={{marginTop:8,minHeight:34}}><span style={{fontSize:'1rem',color:C.muted}}>已有答案：</span><b>{history||'无'}</b></div>
      </div>
      <div style={{...region,background:current?'#fff4e9':'#f6f7f2',borderColor:current?'#efc6a2':C.border}}>
        <strong style={{color:C.ink}}>本步新增片段</strong>
        <div style={{fontSize:28,fontWeight:750,minHeight:45,marginTop:8,color:current?C.orange:C.muted}}>{current||'尚未预测'}</div>
        <div style={{fontSize:'1rem',color:C.muted}}>生成之后，才可以加入后续上下文。</div>
      </div>
    </div>
    <div style={{margin:'20px 0 12px'}}>
      <div style={{fontSize:'1rem',color:C.muted,marginBottom:10}}>当前答案</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:8}} aria-label={'当前答案：'+(generated||'尚未生成')}>
        {segments.map((segment,i)=><span key={i} aria-label={i<step?'片段 '+(i+1)+'：'+segment:'片段 '+(i+1)+'：尚未生成'} style={{display:'inline-flex',minWidth:60,justifyContent:'center',padding:'8px 14px',border:'1px '+(i<step?'solid':'dashed')+' '+(i===step-1?C.orange:C.border),borderRadius:8,color:i<step?(i===step-1?C.orange:C.blue):C.muted,background:i<step?'#fffdf8':'#f6f7f2',fontWeight:i<step?700:500}}>{i<step?segment:'···'}</span>)}
      </div>
    </div>
    <div className={'feedback '+(step===6?'good':'')} style={{minHeight:76}} aria-live="polite">
      {step===0?'先给图像和问题，再开始预测。未来的答案还不能读入上下文。':step===6?'六个教学片段已经展开。真实模型继续预测停止符来结束输出；这里没有运行模型。':'预测“'+current+'”时，只能读取左侧列出的条件。它生成以后，下一步才可以读到它。'}
    </div>
    <p style={{fontSize:'1rem',color:C.muted,margin:'10px 0 0'}}>中文片段仅用于看清因果顺序，不对应真实 tokenizer 的切分。</p>
  </div>;
};
