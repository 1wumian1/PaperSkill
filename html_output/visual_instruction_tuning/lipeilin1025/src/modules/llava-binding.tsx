import React,{useState} from 'react';
import {Surface,C,round,line,label} from './llava-kit';

function strawberry(c:CanvasRenderingContext2D,x:number,y:number,s:number,angle=0){
 c.save();c.translate(x,y);c.rotate(angle);c.scale(s,s);
 c.beginPath();c.moveTo(-28,-19);c.bezierCurveTo(-48,-4,-24,35,0,48);c.bezierCurveTo(24,35,48,-4,28,-19);c.bezierCurveTo(11,-32,-11,-32,-28,-19);c.fillStyle='#b96159';c.fill();
 c.beginPath();c.moveTo(-20,-17);c.bezierCurveTo(-31,-3,-20,20,-8,26);c.strokeStyle='#ce8b7b';c.lineWidth=5;c.stroke();
 for(const [xx,yy] of [[-20,-5],[0,-11],[19,-3],[-12,13],[10,15],[0,33]]){c.beginPath();c.ellipse(xx,yy,2,3,.3,0,Math.PI*2);c.fillStyle='#ead7a6';c.fill();}
 for(let i=0;i<5;i++){c.save();c.rotate((i-2)*.55);c.beginPath();c.moveTo(0,-21);c.quadraticCurveTo(-13,-39,-6,-44);c.quadraticCurveTo(6,-37,0,-21);c.fillStyle=i%2?'#77906a':'#8fa77b';c.fill();c.restore();}
 c.restore();
}
export const LLaVABinding:React.FC=()=>{
 const [answer,setAnswer]=useState<number|null>(null),correct=answer===1;
 const color=answer===null?C.blue:correct?C.green:C.red;
 return <div>
  <Surface height={320} label="教学重绘：酸奶旁边有草莓，但口味没有标签证据" draw={c=>{
   round(c,30,25,1020,270,16,'#e5ebdf',C.border);round(c,43,38,994,243,12,C.paper);
   c.save();c.beginPath();c.rect(55,50,970,219);c.clip();c.fillStyle='#eaf0e2';c.fillRect(55,50,970,219);c.fillStyle='#dce3d1';c.fillRect(55,215,970,54);
   c.beginPath();c.ellipse(335,236,115,16,0,0,Math.PI*2);c.fillStyle='#c2cfbb';c.fill();
   c.beginPath();c.moveTo(240,145);c.quadraticCurveTo(251,231,275,237);c.quadraticCurveTo(335,248,394,237);c.quadraticCurveTo(420,228,430,145);c.closePath();c.fillStyle='#9bb8b0';c.fill();
   c.beginPath();c.ellipse(335,145,95,31,0,0,Math.PI*2);c.fillStyle='#d4e2d4';c.fill();c.beginPath();c.ellipse(335,141,86,25,0,0,Math.PI*2);c.fillStyle='#fffdf2';c.fill();c.beginPath();c.ellipse(330,138,47,10,-.1,0,Math.PI*2);c.strokeStyle='#e4e8d9';c.lineWidth=2;c.stroke();line(c,258,168,268,213,'#cadbd0',5);
   strawberry(c,647,183,1,-.3);strawberry(c,724,206,.79,.22);c.restore();
   const y=87;c.save();c.setLineDash(answer===null?[6,6]:[]);if(correct){line(c,426,y,502,y,C.blue,3);line(c,558,y,632,y,C.blue,3);}else line(c,426,y,632,y,color,3);c.restore();
   if(correct){label(c,'≠',530,100,C.blue,36,'center');}else if(answer===0){line(c,518,73,542,97,C.red,4);line(c,542,73,518,97,C.red,4);}else label(c,'?',530,99,C.blue,34,'center');
   label(c,'共现',880,130,C.ink,25,'center');label(c,'口味',880,218,correct?C.blue:color,25,'center');if(correct)label(c,'≠',880,177,C.blue,29,'center');else line(c,880,144,880,180,C.border,2);
   if(answer===0){c.beginPath();c.arc(880,210,41,0,Math.PI*2);c.strokeStyle=color;c.lineWidth=2;c.setLineDash([5,5]);c.stroke();c.setLineDash([]);}
  }}/>
  <p style={{margin:'16px 0 12px',fontWeight:700}}>看到“草莓在酸奶旁边”，能否断定“这是草莓味酸奶”？</p>
  <div className="chip-row"><button type="button" className={'chip'+(answer===0?' selected':'')} aria-pressed={answer===0} onClick={()=>setAnswer(0)}>能，图中有草莓</button><button type="button" className={'chip'+(answer===1?' selected':'')} aria-pressed={answer===1} onClick={()=>setAnswer(1)}>不能，缺少口味证据</button></div>
  <div className={'feedback'+(correct?' good':'')} style={{minHeight:84,borderLeftColor:color}} aria-live="polite">{answer===null?'先作判断，再区分“物体共同出现”和“属性属于哪个物体”。':correct?'判断成立：图像支持“旁边有草莓”，不足以证明酸奶的口味。需要包装文字等额外证据。':'这个推断跨过了证据边界：草莓与酸奶共同出现，不等于酸奶具有草莓口味。'}</div>
  <p style={{fontSize:18,color:C.muted,margin:'14px 0 0'}}>这是重绘的教学场景。原文第 7–8 页表 6 记录了相应的属性绑定失败；它是定性案例，不能换算成错误率。</p>
 </div>;
};
