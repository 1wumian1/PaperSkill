import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

export const C = { bg:'#f5f8f0', light:'#b8c9a7', dark:'#76906a', support:'#92400e', blue:'#27446e', green:'#228d5c', red:'#c43f52', orange:'#f07e47', purple:'#7c3aed', text:'#21324a', muted:'#68778f', border:'#d7deea' };
type G = CanvasRenderingContext2D;
export function rr(c:G,x:number,y:number,w:number,h:number,r:number,fill?:string,stroke?:string,lw=1.5) { c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();} }
export function line(c:G,x1:number,y1:number,x2:number,y2:number,color:string=C.border,width=2) {c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();}
export function txt(c:G,s:string,x:number,y:number,size=20,color:string=C.text,align:CanvasTextAlign='center') {c.fillStyle=color;c.font='600 '+size+'px system-ui, "Microsoft YaHei", sans-serif';c.textAlign=align;c.textBaseline='middle';c.fillText(s,x,y);}
export function drawScene(c:G,w:number,h:number) {c.clearRect(0,0,w,h);c.fillStyle=C.bg;c.fillRect(0,0,w,h);}
export function drawPaper(c:G,x:number,y:number,w:number,h:number) {
 rr(c,x+3,y+5,w,h,10,'#dbe3d3');rr(c,x,y,w,h,10,'#fffdf7','#d4ddcd');
 line(c,x+17,y+14,x+17,y+h-14,'#d8c6aa',1);
 for(let k=0;k<Math.floor((h-24)/16);k++){c.beginPath();c.arc(x+8,y+17+k*16,2,0,Math.PI*2);c.fillStyle='#b4c0b0';c.fill();}
 c.beginPath();c.moveTo(x+w-23,y);c.lineTo(x+w,y+23);c.lineTo(x+w-23,y+23);c.closePath();c.fillStyle='#edf1e6';c.fill();
}
export function leaf(c:G,x:number,y:number,s:number,angle=0,color:string=C.dark) {
 c.save();c.translate(x,y);c.rotate(angle);c.scale(s,s);
 c.beginPath();c.moveTo(0,0);c.bezierCurveTo(-29,-25,-28,-57,0,-76);c.bezierCurveTo(29,-53,28,-25,0,0);c.closePath();c.fillStyle=color;c.fill();c.strokeStyle='#607d5b';c.lineWidth=1.4;c.stroke();
 line(c,0,-3,0,-66,'#e0e8cc',1.6);
 for(let i=1;i<4;i++){const yy=-13-i*12;line(c,0,yy,-13,yy-8,'#a9bd95',1);line(c,0,yy,13,yy-8,'#a9bd95',1);}
 c.restore();
}
export function drawPlant(c:G,x:number,y:number,s=1,variant=0) {
 c.save();c.translate(x,y);c.scale(s,s);
 c.beginPath();c.ellipse(0,-2,39,6,0,0,Math.PI*2);c.fillStyle='#dde5d6';c.fill();
 if(variant!==2)line(c,0,-34,0,-130,'#627e57',4);
 if(variant===2) {
  for(let i=0;i<7;i++){const a=(i-3)*.12;c.save();c.translate(0,-29);c.rotate(a);c.scale(.35,1.5);leaf(c,0,0,1,0,i%2?'#9bb385':'#809f6e');c.restore();}
 } else {
  leaf(c,-2,-62,.74,-.83,C.dark);leaf(c,2,-82,.7,.82,'#a0b889');leaf(c,-1,-107,.65,-.30,'#789668');
  if(variant===1) {
   for(let j=0;j<7;j++){const a=j*Math.PI*2/7;c.beginPath();c.ellipse(Math.cos(a)*12,-136+Math.sin(a)*12,8,12,a+.5,0,Math.PI*2);c.fillStyle=j%2?'#edac6b':C.orange;c.fill();}
   c.beginPath();c.arc(0,-136,8,0,Math.PI*2);c.fillStyle='#a76f30';c.fill();c.beginPath();c.arc(-2,-138,2.5,0,Math.PI*2);c.fillStyle='#f2cf80';c.fill();
  }
 }
 c.beginPath();c.moveTo(-30,-36);c.lineTo(30,-36);c.lineTo(23,-5);c.quadraticCurveTo(0,1,-23,-5);c.closePath();c.fillStyle='#c38d66';c.fill();c.strokeStyle='#ad7956';c.lineWidth=1.5;c.stroke();
 rr(c,-33,-41,66,10,3,'#daa57d','#b9825e');
 line(c,-18,-28,-14,-10,'#e7b991',2);line(c,15,-29,13,-9,'#b17c57',1);
 c.restore();
}
export function drawPencil(c:G,x:number,y:number,angle=-.68,s=1) {
 c.save();c.translate(x,y);c.rotate(angle);c.scale(s,s);
 c.beginPath();c.moveTo(0,0);c.lineTo(20,-7);c.lineTo(20,7);c.closePath();c.fillStyle='#d8b88d';c.fill();
 c.beginPath();c.moveTo(0,0);c.lineTo(8,-3);c.lineTo(8,3);c.closePath();c.fillStyle=C.text;c.fill();
 rr(c,19,-7,75,14,2,'#d2a35c','#b28c4c');line(c,24,-3,88,-3,'#efd49c',2);line(c,24,4,88,4,'#aa803e',1);
 rr(c,92,-7,12,14,1,'#bbc6bd');rr(c,104,-7,16,14,4,'#bc7e78');c.restore();
}
export function drawMagnifier(c:G,x:number,y:number,s=1) {
 c.save();c.translate(x,y);c.scale(s,s);
 line(c,22,23,48,53,'#486459',13);line(c,26,27,47,50,'#819a88',5);
 c.beginPath();c.arc(0,0,34,0,Math.PI*2);c.fillStyle='#e7f1e722';c.fill();c.lineWidth=7;c.strokeStyle='#617e6d';c.stroke();
 c.beginPath();c.arc(0,0,26,3.4,4.9);c.lineWidth=3;c.strokeStyle='#fffdf6';c.stroke();c.restore();
}
export function drawRuler(c:G,x:number,y:number,w=220) {
 rr(c,x,y,w,28,3,'#e6d2aa','#c3ac80');
 for(let k=0;k<w-12;k+=8)line(c,x+8+k,y+2,x+8+k,y+(k%40===0?16:9),'#9f865f',1);
}
export function drawFrame(c:G,x:number,y:number,w:number,h:number,color:string=C.blue,dashed=false) {
 c.save();if(dashed)c.setLineDash([6,5]);rr(c,x,y,w,h,5,undefined,color,2.5);c.restore();
 if(!dashed)for(const [xx,yy]of[[x,y],[x+w,y],[x,y+h],[x+w,y+h]])rr(c,xx-3,yy-3,6,6,1,'#fff',color,1.5);
}
interface SceneProps extends Omit<React.CanvasHTMLAttributes<HTMLCanvasElement>,'width'|'height'> {
 draw:(ctx:G,w:number,h:number,time:number)=>void; width?:number; height?:number; animate?:boolean; label:string;
}
export function SceneCanvas({draw,width=1080,height=280,animate=false,label,style,className,...props}:SceneProps) {
 const ref=useRef<HTMLCanvasElement>(null), drawRef=useRef(draw), paintRef=useRef<()=>void>(()=>{});drawRef.current=draw;
 useLayoutEffect(()=>{
  const canvas=ref.current;if(!canvas)return;
  const ctx=setupCanvas(canvas,width,height);canvas.style.width='100%';canvas.style.height='auto';
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let raf=0,active=false,disposed=false;
  const paint=()=>{if(disposed)return;ctx.save();drawRef.current(ctx,width,height,motion.matches?1.5:performance.now()/1000);ctx.restore();canvas.classList.add('is-ready');};
  paintRef.current=paint;
  const tick=()=>{paint();if(active&&animate&&!motion.matches&&!document.hidden)raf=requestAnimationFrame(tick);};
  const start=()=>{if(active)return;active=true;tick();};
  const stop=()=>{active=false;cancelAnimationFrame(raf);};
  const refresh=()=>{cancelAnimationFrame(raf);if(active&&!document.hidden)tick();};
  paint();const disconnect=observeCanvas(canvas,start,stop);
  motion.addEventListener('change',refresh);document.addEventListener('visibilitychange',refresh);
  return()=>{disposed=true;stop();disconnect();motion.removeEventListener('change',refresh);document.removeEventListener('visibilitychange',refresh);paintRef.current=()=>{};};
 },[width,height,animate]);
 useEffect(()=>{paintRef.current();},[draw]);
 return <canvas ref={ref} aria-label={label} role="img" className={className} style={{touchAction:props.onPointerDown?'none':'auto',...style}} {...props} onKeyDown={(event)=>{props.onKeyDown?.(event);if(event.defaultPrevented)event.stopPropagation();}}/>;
}
export function canvasPoint(e:React.PointerEvent<HTMLCanvasElement>,w:number,h:number) {const r=e.currentTarget.getBoundingClientRect();return{x:(e.clientX-r.left)*w/r.width,y:(e.clientY-r.top)*h/r.height};}
export function Chips({options,value,onChange}:{options:string[];value:number;onChange:(n:number)=>void}) {return <div className="chip-row">{options.map((s,i)=><button key={s} className={'chip'+(value===i?' selected':'')} aria-pressed={value===i} onClick={()=>onChange(i)}>{s}</button>)}</div>;}
export function Feedback({children,tone='blue'}:{children:React.ReactNode;tone?:'blue'|'green'|'red'|'orange'}) {return <div className={'feedback'+(tone==='green'?' good':tone==='red'?' bad':'')} role="status" aria-live="polite" style={tone==='orange'?{borderLeftColor:C.orange}:undefined}>{children}</div>;}
export function Metrics({items}:{items:{label:string;value:string|number}[]}) {return <div className="metrics" style={{gridTemplateColumns:'repeat(auto-fit, minmax(170px,1fr))'}}>{items.map((a)=><div className="metric" key={a.label}><div className="l">{a.label}</div><div className="v" style={{fontSize:23}}>{a.value}</div></div>)}</div>;}
