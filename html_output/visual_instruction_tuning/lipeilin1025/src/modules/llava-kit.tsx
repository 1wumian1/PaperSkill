import React, {useEffect,useRef} from 'react';
import {setupCanvas,observeCanvas} from '../lib/canvasKit';
export const C={bg:'#f5f8f0',light:'#b8c9a7',dark:'#76906a',wood:'#92400e',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#f07e47',purple:'#7c3aed',ink:'#21324a',muted:'#68778f',border:'#d7deea',paper:'#fffdf7'};
export function round(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r=8,fill=C.paper,stroke=''){c.beginPath();c.roundRect(x,y,Math.max(0,w),Math.max(0,h),Math.max(0,Math.min(r,w/2,h/2)));if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke();}}
export function line(c:CanvasRenderingContext2D,x:number,y:number,x2:number,y2:number,color=C.border,width=2){c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();}
export function label(c:CanvasRenderingContext2D,text:string,x:number,y:number,color=C.ink,size=22,align:CanvasTextAlign='left'){c.save();c.fillStyle=color;c.font='600 '+size+'px "Microsoft YaHei", "Segoe UI", sans-serif';c.textAlign=align;c.fillText(text,x,y);c.restore();}
function ellipse(c:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number,fill:string){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();}
/** All chapters share the same ceramic cup and exactly three pencils. */
export function drawPhoto(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number){
 c.save();round(c,x+3,y+5,w,h,10,'rgba(54,72,55,.10)');round(c,x,y,w,h,10,'#fffefa','#d3dccc');
 const inset=Math.min(w,h)*.065;c.beginPath();c.roundRect(x+inset,y+inset,w-inset*2,h-inset*2,5);c.clip();c.translate(x+inset,y+inset);c.scale((w-inset*2)/240,(h-inset*2)/180);
 c.fillStyle='#e7eddf';c.fillRect(0,0,240,180);c.fillStyle='#dce5d1';c.beginPath();c.moveTo(0,0);c.lineTo(68,0);c.lineTo(182,180);c.lineTo(0,180);c.fill();
 c.fillStyle='#ccd7bd';c.fillRect(0,145,240,35);line(c,0,146,240,146,'#bfcbae',1);ellipse(c,129,155,66,10,'rgba(66,85,63,.13)');
 c.beginPath();c.ellipse(165,108,23,30,0,0,Math.PI*2);c.strokeStyle='#536f79';c.lineWidth=13;c.stroke();c.beginPath();c.ellipse(166,108,22,28,0,-1.5,1.5);c.strokeStyle='#839e9f';c.lineWidth=4;c.stroke();
 c.beginPath();c.moveTo(74,74);c.quadraticCurveTo(72,75,74,119);c.lineTo(79,141);c.quadraticCurveTo(119,163,158,141);c.lineTo(163,76);c.closePath();c.fillStyle='#6c8990';c.fill();
 c.beginPath();c.moveTo(136,77);c.lineTo(161,77);c.lineTo(157,140);c.quadraticCurveTo(147,146,132,148);c.closePath();c.fillStyle='#58747e';c.fill();ellipse(c,118,75,45,11,'#aec1bc');ellipse(c,118,76,37,7,'#3e5964');
 for(const [dx,angle,col] of [[-22,-.17,'#c6a064'],[0,.025,'#89966c'],[20,.15,'#a57963']] as const){
  c.save();c.translate(118+dx,78);c.rotate(angle);round(c,-4,-63,8,76,1,col);line(c,-2,-60,-2,9,'rgba(255,255,255,.33)',1.2);
  c.beginPath();c.moveTo(-4,-63);c.lineTo(0,-76);c.lineTo(4,-63);c.closePath();c.fillStyle='#dcc7a2';c.fill();c.beginPath();c.moveTo(-1.4,-71);c.lineTo(0,-76);c.lineTo(1.4,-71);c.fillStyle='#455157';c.fill();c.restore();
 }
 c.beginPath();c.ellipse(118,76,42,9,0,0,Math.PI);c.strokeStyle='#8fa9aa';c.lineWidth=4;c.stroke();line(c,85,94,85,124,'#a5bdb8',4);line(c,92,95,92,111,'#a5bdb8',2);ellipse(c,117,146,27,3,'rgba(198,216,205,.22)');c.restore();
}
export function drawNotebook(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number){
 c.save();round(c,x+4,y+6,w,h,11,'rgba(77,95,67,.10)');round(c,x,y,w,h,10,'#fcfcf6','#cbd4c2');round(c,x+7,y+5,22,h-10,5,C.blue);line(c,x+43,y+12,x+43,y+h-12,'#e8c9b9',1);
 for(let yy=y+31;yy<y+h-10;yy+=24)line(c,x+55,yy,x+w-16,yy,'#e5e9df',1);
 for(let yy=y+18;yy<y+h-9;yy+=26){c.beginPath();c.ellipse(x+15,yy,9,3,0,0,Math.PI*2);c.strokeStyle='#c5d1c7';c.lineWidth=2;c.stroke();}line(c,x+w-8,y+13,x+w-8,y+h-14,'#eff1e8',2);c.restore();
}
export function drawPen(c:CanvasRenderingContext2D,x:number,y:number,s=1,angle=-.55,color=C.blue){c.save();c.translate(x,y);c.rotate(angle);c.scale(s,s);round(c,-6,-70,12,54,5,color);round(c,-6,-63,12,6,1,'#c8a86c');line(c,3,-54,3,-26,'rgba(255,255,255,.44)',2);line(c,7,-57,7,-34,'#bfa269',2);c.beginPath();c.moveTo(-5,-16);c.lineTo(0,0);c.lineTo(5,-16);c.closePath();c.fillStyle='#d3b67c';c.fill();line(c,0,-9,0,-1,C.ink,1.2);c.restore();}
export function drawMagnifier(c:CanvasRenderingContext2D,x:number,y:number,s=1){c.save();c.translate(x,y);c.scale(s,s);line(c,20,23,49,54,'#997849',13);line(c,23,25,47,50,'#c4a16a',4);ellipse(c,0,0,31,31,'rgba(243,251,246,.22)');c.beginPath();c.arc(0,0,31,0,Math.PI*2);c.strokeStyle=C.blue;c.lineWidth=6;c.stroke();c.beginPath();c.arc(-2,-2,24,3.5,4.9);c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=3;c.stroke();c.restore();}
export function drawRuler(c:CanvasRenderingContext2D,x:number,y:number,w=180){round(c,x,y+2,w,25,3,'rgba(111,85,37,.12)');round(c,x,y,w,24,3,'#e0cca3','#bca27a');for(let i=8;i<w-4;i+=8)line(c,x+i,y+1,x+i,y+(i%40===0?15:8),'#a0865c',1);line(c,x+8,y+19,x+w-8,y+19,'#ecdcb9',1);}
export function drawClip(c:CanvasRenderingContext2D,x:number,y:number,s=1){c.save();c.translate(x,y);c.scale(s,s);round(c,-20,-7,40,25,4,C.blue);line(c,-17,14,17,14,'#557089',2);for(const dx of [-9,9]){c.beginPath();c.moveTo(dx,1);c.lineTo(dx,-23);c.quadraticCurveTo(dx+3,-33,dx+10,-25);c.lineTo(dx+9,-12);c.strokeStyle='#b4c2bd';c.lineWidth=3;c.stroke();}c.restore();}
export function drawStamp(c:CanvasRenderingContext2D,x:number,y:number,s=1){c.save();c.translate(x,y);c.scale(s,s);round(c,-26,-9,52,15,4,'#a78652');round(c,-23,5,46,4,1,C.blue);round(c,-9,-38,18,29,6,C.blue);ellipse(c,0,-39,17,8,'#3f5d79');line(c,-5,-35,-5,-17,'#6a8294',2);c.restore();}
type SurfaceProps=Omit<React.CanvasHTMLAttributes<HTMLCanvasElement>,'width'|'height'> & {draw:(ctx:CanvasRenderingContext2D,t:number)=>void;width?:number;height?:number;animate?:boolean;label?:string};
export function Surface({draw,width=1080,height=280,animate=false,label:accessible='交互示意图',style,...rest}:SurfaceProps){
 const ref=useRef<HTMLCanvasElement>(null),fn=useRef(draw),paint=useRef<((t:number)=>void)|null>(null);fn.current=draw;
 useEffect(()=>{
  const canvas=ref.current;if(!canvas)return;const c=setupCanvas(canvas,width,height);canvas.style.width='100%';canvas.style.height='auto';
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');let raf=0,visible=false,active=false;
  const render=(t:number)=>{c.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);c.clearRect(0,0,width,height);c.fillStyle=C.bg;c.fillRect(0,0,width,height);c.save();fn.current(c,t);c.restore();canvas.classList.add('is-ready');};paint.current=render;
  const tick=(ms:number)=>{render(ms/1000);if(active)raf=requestAnimationFrame(tick);};const stop=()=>{active=false;cancelAnimationFrame(raf);raf=0;};
  const start=()=>{if(animate&&!motion.matches){if(!active){active=true;raf=requestAnimationFrame(tick);}}else render(motion.matches?2.5:performance.now()/1000);};
  const disconnect=observeCanvas(canvas,()=>{visible=true;start();},()=>{visible=false;stop();});
  const sync=()=>{stop();render(motion.matches?2.5:performance.now()/1000);if(visible)start();};motion.addEventListener('change',sync);
  const resize=()=>{const dpr=window.devicePixelRatio||1;if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}render(motion.matches?2.5:performance.now()/1000);};window.addEventListener('resize',resize);
  render(motion.matches?2.5:performance.now()/1000);return()=>{stop();disconnect();motion.removeEventListener('change',sync);window.removeEventListener('resize',resize);paint.current=null;};
 },[width,height,animate]);
 useEffect(()=>{paint.current?.(window.matchMedia('(prefers-reduced-motion: reduce)').matches?2.5:performance.now()/1000);},[draw]);
 return <canvas {...rest} ref={ref} width={width} height={height} role="img" aria-label={accessible} style={{display:'block',width:'100%',height:'auto',aspectRatio:width+' / '+height,maxWidth:'100%',touchAction:rest.onPointerDown?'none':undefined,...style}}/>;
}
export function point(event:React.PointerEvent<HTMLCanvasElement>,w=1080,h=280){const r=event.currentTarget.getBoundingClientRect();return{x:(event.clientX-r.left)/r.width*w,y:(event.clientY-r.top)/r.height*h};}
const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
function strokeCheck(c:CanvasRenderingContext2D,x:number,y:number,scale=1){c.save();c.translate(x,y);c.scale(scale,scale);c.beginPath();c.moveTo(-12,0);c.lineTo(-3,10);c.lineTo(16,-12);c.strokeStyle=C.green;c.lineWidth=3;c.lineCap='round';c.lineJoin='round';c.stroke();c.restore();}
export function Analogy({action='write',variant='new'}:{action?:string;variant?:string}){
 return <Surface width={560} height={140} animate label="观察图片与撰写讲解的动态插画" draw={(c,t)=>{
  const phase=(t%4.8)/4.8,progress=phase<.58?smooth(phase/.58):phase<.82?1:1-smooth((phase-.82)/.18);
  drawPhoto(c,42,14,159,112);drawNotebook(c,257,12,254,114);
  if(action==='uncover'){
   c.save();c.translate(44,16);c.rotate(-.12*progress);round(c,-progress*55,-progress*80,155,108,5,'#e5dac4','#cbbd9f');
   for(let i=0;i<3;i++)line(c,18-progress*55,28+i*17-progress*80,115-i*13-progress*55,28+i*17-progress*80,'#b7a98d',2);c.restore();line(c,316,47,463,47,C.blue,3);line(c,316,72,430,72,C.dark,2);
  }else if(action==='inspect'){
   const cx=101+progress*39,cy=66;c.save();c.beginPath();c.arc(cx,cy,28,0,Math.PI*2);c.clip();c.translate(cx,cy);c.scale(1.65,1.65);c.translate(-cx,-cy);drawPhoto(c,42,14,159,112);c.restore();drawMagnifier(c,cx,cy,.95);line(c,316,47,450,47,C.blue,3);line(c,316,71,415,71,C.dark,2);
  }else if(action==='align'){
   line(c,314,45,459,45,C.blue,3);line(c,314,71,420,71,C.dark,2);c.save();c.translate(307,89);c.rotate((1-progress)*-.2);drawRuler(c,0,0,179);c.restore();
  }else if(action==='adjust'){
   const spread=20+progress*25;c.save();c.translate(383,31);c.beginPath();c.arc(-spread,63,spread*2,-progress*.28,0);c.strokeStyle=C.orange;c.lineWidth=2;c.stroke();line(c,0,0,-spread,63,C.blue,4);line(c,0,0,spread,63,C.blue,4);ellipse(c,0,0,5,5,'#bc9d65');line(c,-spread,62,-spread,70,C.ink,1.5);line(c,spread,62,spread,70,C.ink,1.5);c.restore();
  }else if(action==='bookmark'){
   line(c,315,47,466,47,C.blue,3);line(c,315,71,431,71,C.dark,2);line(c,315,95,454,95,C.dark,2);const y=-30+progress*48;c.beginPath();c.moveTo(468,y);c.lineTo(486,y);c.lineTo(486,y+52);c.lineTo(477,y+45);c.lineTo(468,y+52);c.closePath();c.fillStyle=C.orange;c.fill();
  }else if(action==='erase'){
   line(c,315,46,464,46,C.blue,3);line(c,315,94,431,94,C.dark,2);const x=315+progress*139;if(x<453)line(c,x+15,70,468,70,'#9ba393',2.5);c.save();c.translate(x,69);c.rotate(-.13);round(c,-13,-11,33,22,5,'#e0c4b5','#c7a48f');round(c,-13,-11,13,22,4,'#a6b5aa');c.restore();
  }else if(action==='clip'){
   line(c,315,53,462,53,C.blue,3);line(c,315,78,422,78,C.dark,2);drawClip(c,385,16-(1-progress)*36,.9);
  }else if(action==='compare'){
   line(c,315,47,464,47,C.blue,3);line(c,315,72,420,72,C.dark,2);strokeCheck(c,465,91,.62);drawMagnifier(c,330+progress*123,72,.74);
  }else if(action==='stamp'){
   line(c,315,43,462,43,C.blue,3);line(c,315,66,420,66,C.dark,2);const down=phase<.45?smooth(phase/.45):phase<.61?1:1-smooth((phase-.61)/.25);if(phase>.43&&phase<.9){round(c,423,87,53,23,4,'','rgba(34,141,92,.6)');strokeCheck(c,449,98,.48);}drawStamp(c,450,81-(1-down)*33,.82);
  }else{
   const first=variant==='old'?'杯子、铅笔':'杯子作笔筒',firstProgress=Math.min(1,progress*1.5),secondProgress=Math.max(0,(progress-.67)/.33),ink=variant==='old'?C.muted:C.green;
   c.save();c.beginPath();c.rect(313,38,firstProgress*136,30);c.clip();label(c,first,316,60,ink,21);c.restore();
   if(variant!=='old'){c.save();c.beginPath();c.rect(313,67,secondProgress*110,30);c.clip();label(c,'收纳铅笔',316,88,C.blue,21);c.restore();}
   const second=variant!=='old'&&progress>.67;drawPen(c,316+(second?secondProgress*100:firstProgress*125),second?88:60,.55,-.52,variant==='old'?C.muted:C.blue);
  }
 }}/>;
}
export const LLaVAKit:React.FC=()=>null;
