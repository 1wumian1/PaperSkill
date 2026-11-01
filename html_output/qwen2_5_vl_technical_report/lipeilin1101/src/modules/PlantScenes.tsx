import React,{useState} from 'react';
import {C,SceneCanvas,Chips,Feedback,drawScene,drawPaper,drawPlant,drawFrame,drawPencil,drawMagnifier,drawRuler,rr,line,leaf} from './PlantKit';
type G=CanvasRenderingContext2D;
type Point = [number, number];
const smooth = (value:number) => { const p=Math.max(0,Math.min(1,value)); return p*p*(3-2*p); };

// A closed path lets the pencil finish, hold, and begin again without teleporting.
function tracePhase(time:number) {
 const phase=(time%5)/5;
 return {progress:smooth(phase/.78),opacity:1-smooth((phase-.9)/.1)};
}
function ellipsePoints(x:number,y:number,rx:number,ry:number):Point[] {
 return Array.from({length:81},(_,i)=>{
  const angle=-Math.PI/2+i/80*Math.PI*2;
  return [x+rx*Math.cos(angle),y+ry*Math.sin(angle)] as Point;
 });
}
function leafOutline():Point[] {
 const curves:Point[][]=[[[0,0],[-29,-25],[-28,-57],[0,-76]],[[0,-76],[29,-53],[28,-25],[0,0]]];
 const points:Point[]=[];
 curves.forEach((p,part)=>{
  for(let i=part?1:0;i<=40;i++) {
   const t=i/40,u=1-t;
   const x=u*u*u*p[0][0]+3*u*u*t*p[1][0]+3*u*t*t*p[2][0]+t*t*t*p[3][0];
   const y=u*u*u*p[0][1]+3*u*u*t*p[1][1]+3*u*t*t*p[2][1]+t*t*t*p[3][1];
   points.push([275+x*Math.cos(-.16)-y*Math.sin(-.16),112+x*Math.sin(-.16)+y*Math.cos(-.16)]);
  }
 });
 return points;
}
const specimenOutline=leafOutline();
function traceWithPencil(c:G,points:Point[],time:number,dotted=false) {
 const {progress,opacity}=tracePhase(time);
 if(dotted) {
  c.save();c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
  c.setLineDash([3,4]);c.lineWidth=1.5;c.strokeStyle='#afbbaa';c.stroke();c.restore();
 }
 const position=progress*(points.length-1),index=Math.min(points.length-2,Math.floor(position));
 const fraction=position-index;
 const x=points[index][0]+(points[index+1][0]-points[index][0])*fraction;
 const y=points[index][1]+(points[index+1][1]-points[index][1])*fraction;
 c.save();c.globalAlpha=opacity;c.beginPath();c.moveTo(...points[0]);
 for(let i=1;i<=index;i++)c.lineTo(...points[i]);
 c.lineTo(x,y);c.strokeStyle=C.blue;c.lineWidth=2;c.lineCap='round';c.lineJoin='round';c.stroke();c.restore();
 drawPencil(c,x,y,.4-1.08*smooth((y-40)/58),.65);
}
function specimen(c:G,x=275,y=112,s=1) {leaf(c,x,y,s,-.16);line(c,x,y,x-4,y+8,C.dark,2);}
function clip(c:G,x:number,y:number,a:number) {c.save();c.translate(x,y);c.rotate(a);c.strokeStyle='#728c80';c.lineWidth=5;c.beginPath();c.moveTo(-11,19);c.lineTo(-11,-18);c.bezierCurveTo(-11,-34,14,-34,14,-18);c.lineTo(14,24);c.bezierCurveTo(14,43,-20,43,-20,24);c.lineTo(-20,-20);c.stroke();c.restore();}
function notebook(c:G){drawPaper(c,167,14,226,112);specimen(c);}
function analogy(c:G,w:number,h:number,t:number,n:number){
 drawScene(c,w,h);const q=(Math.sin(t*Math.PI/1.9)+1)/2;
 if(n===2){
  const ww=145+80*q;drawPaper(c,280-ww/2,16,ww,108);c.save();c.beginPath();c.rect(280-ww/2,16,ww,108);c.clip();specimen(c,286,112,.9);c.restore();line(c,280,20,280,120,'#cdd7c6',1);
 }else if(n===4){
  for(let j=3;j>=0;j--){drawPaper(c,205+j*5,32+j*4,135,78);leaf(c,276+j*5,105+j*4,.60,0);}
  clip(c,248,48-q*5,-.20+.10*q);
 }else if(n===8){
  drawPaper(c,179,20,208,103);line(c,283,23,283,119,'#c9d5c0',1);
  const fold=30+66*q;rr(c,283,27,fold,84,4,'#eff3e7','#d0dac8');c.save();c.translate(283,0);c.scale(fold/96,1);leaf(c,48,103,.8);c.restore();
 }else if(n===9){
  rr(c,215,105,132,6,3,'#dfe5d7');c.beginPath();c.arc(280,69,49,0,Math.PI*2);c.fillStyle='#fbfaf2';c.fill();c.strokeStyle='#7f9885';c.lineWidth=6;c.stroke();
  rr(c,272,9,16,13,3,'#9caf9e');for(let i=0;i<12;i++){const a=i*Math.PI/6;line(c,280+Math.cos(a)*38,69+Math.sin(a)*38,280+Math.cos(a)*43,69+Math.sin(a)*43,'#71866d',2);}
  const a=-Math.PI/2+(t%5)/5*Math.PI*2;line(c,280,69,280+Math.cos(a)*34,69+Math.sin(a)*34,C.orange,3);c.beginPath();c.arc(280,69,4,0,Math.PI*2);c.fillStyle=C.blue;c.fill();
 }else{
  notebook(c);
  if(n===1)traceWithPencil(c,ellipsePoints(278,77,45,42),t,true);
  if(n===3){
   const x=242+q*65,y=66;
   c.save();c.beginPath();c.arc(x,y,27*.82,0,Math.PI*2);c.clip();
   c.translate(x,y);c.scale(1.7,1.7);c.translate(-x,-y);notebook(c);c.restore();
   drawMagnifier(c,x,y,.82);
  }
  if(n===5)drawRuler(c,190+q*30,102,174);
  if(n===6)traceWithPencil(c,specimenOutline,t);
  if(n===7)traceWithPencil(c,specimenOutline,t,true);
  if(n===10){
   const phase=(t%4)/4;
   const press=phase<.35?smooth(phase/.35):1-smooth((phase-.5)/.25);
   if(phase>=.35){c.save();c.globalAlpha=1-smooth((phase-.9)/.1);rr(c,321,95,30,21,2,undefined,C.green,2);line(c,327,105,334,111,C.green,2);line(c,334,111,346,99,C.green,2);c.restore();}
   const yy=39+press*41;rr(c,319,yy,36,15,4,'#849b83');rr(c,330,yy-27,14,30,5,'#987a50');c.beginPath();c.ellipse(337,yy-27,13,8,0,0,Math.PI*2);c.fillStyle='#ae8c5b';c.fill();
  }
 }
}
function Analogy({n}:{n:number}){return <SceneCanvas width={560} height={140} animate label={'植物观察手帐类比动画，第'+n+'章'} draw={(c,w,h,t)=>analogy(c,w,h,t,n)}/>;}
export function Analogy1(){return <Analogy n={1}/>;}export function Analogy2(){return <Analogy n={2}/>;}export function Analogy3(){return <Analogy n={3}/>;}export function Analogy4(){return <Analogy n={4}/>;}export function Analogy5(){return <Analogy n={5}/>;}export function Analogy6(){return <Analogy n={6}/>;}export function Analogy7(){return <Analogy n={7}/>;}export function Analogy8(){return <Analogy n={8}/>;}export function Analogy9(){return <Analogy n={9}/>;}export function Analogy10(){return <Analogy n={10}/>;}
function Hero({precise}:{precise:boolean}) {return <SceneCanvas width={560} height={240} animate label={precise?'根据表达定位右侧叶子的教学示意':'只描述整体场景的教学示意'} draw={(c,w,h,t)=>{
 drawScene(c,w,h);drawPaper(c,62,22,438,195);drawPlant(c,157,192,.86,1);drawPlant(c,278,192,.86,0);drawPlant(c,400,192,.86,2);
 const {progress:q,opacity}=tracePhase(t);const x=precise?355:100,y=precise?50:40,ww=precise?90:347,hh=precise?150:165;
 drawFrame(c,x,y,ww,hh,precise?C.green:C.blue,true);
 const length=2*(ww+hh),d=q*length;let px=x,py=y;
 if(d<ww)px=x+d;else if(d<ww+hh){px=x+ww;py=y+d-ww;}else if(d<2*ww+hh){px=x+2*ww+hh-d;py=y+hh;}else py=y+length-d;
 c.save();c.globalAlpha=opacity;c.beginPath();c.moveTo(x,y);
 if(d>=ww)c.lineTo(x+ww,y);
 if(d>=ww+hh)c.lineTo(x+ww,y+hh);
 if(d>=2*ww+hh)c.lineTo(x,y+hh);
 c.lineTo(px,py);c.strokeStyle=precise?C.green:C.blue;c.lineWidth=2.5;c.lineJoin='round';c.stroke();c.restore();
 drawPencil(c,px,py,.55-1.35*smooth((py-50)/150),.66);
 }}/>;}
export function HeroOld(){return <Hero precise={false}/>;}export function HeroNew(){return <Hero precise/>;}
export function Chapter1Main(){
 const[task,setTask]=useState(0);
 const prompts=['这张图里有什么？','找到橙色花朵。','找到橙花右侧的宽叶植物。','给出右侧窄叶植物的框。'];
 const outputs=['三盆植物，一盆开着橙色花。','橙色花朵位于左侧。','目标是中间的宽叶植物，橙花提供参照。','示意框：[450, 48, 558, 232]，以整张 1080×280 示意画布左上角为原点。'];
 const fb=['描述概括了画面，但没有指定实例或边界。','属性把候选缩小到橙花；仍需定位它的位置。','关系表达同时需要目标、参照物和“右侧”的对应。','坐标输出可以核对边界；格式正确仍需检验是否找对目标。'];
 return <><Chips options={['描述场景','按属性寻找','按关系寻找','给出坐标']} value={task} onChange={setTask}/><SceneCanvas label="三盆植物与当前任务的目标范围" draw={(c,w,h)=>{
 drawScene(c,w,h);drawPaper(c,45,20,610,240);drawPlant(c,186,227,1.1,1);drawPlant(c,345,227,1.1,0);drawPlant(c,505,227,1.1,2);
 if(task===0)drawFrame(c,108,38,465,203,C.blue,true);
 if(task===1)drawFrame(c,148,41,77,58,C.orange);
 if(task===2){drawFrame(c,286,43,117,190,C.blue);drawFrame(c,146,42,79,58,C.orange,true);line(c,230,78,279,78,C.orange,2);}
 if(task===3)drawFrame(c,450,48,108,184,C.blue);
 rr(c,727,59,282,161,12,'#fffdf7',C.border);
 for(let i=0;i<4;i++)rr(c,752,88+i*29,task===3?[180,130,190,108][i]:[180,213,165,110][i],7,3,i===task?C.blue:'#d9e2d0');
 }} /><div className="step-desc"><b>{prompts[task]}</b><br/>{outputs[task]}</div><Feedback>{fb[task]} 教学示意，非模型预测。</Feedback></>;
}
