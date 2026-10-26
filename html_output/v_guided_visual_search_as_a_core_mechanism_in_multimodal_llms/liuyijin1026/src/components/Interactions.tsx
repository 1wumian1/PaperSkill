import { useRef, useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { results } from '../content';
import { Module } from './Module';
const note = <span className="demo-note">教学示意 · 非模型实时输出</span>;

const searchSteps = [
  ['先尝试直接定位', '问题需要杯子的细节。搜索模型先在整图上定位杯子；这个示例假定定位置信度不足。', '需要的对象：杯子'],
  ['用什么线索引导？', '先计算 target-specific cue；本例假定它不足以定位杯子，于是借助 LLM world knowledge 生成“桌面附近”的 contextual cue。两种线索形成 search cue heatmap。', '本例采用：上下文线索'],
  ['先检查哪里？', '图像分为 patch，按热图计算 priority score 并加入优先队列。本例先检查右下区域，再由粗到细搜索。', '优先检查：右下 patch'],
  ['在子图像上再次定位', '若仍未定位，就重复线索引导与分块搜索。找到目标时返回坐标；达到最小图块等停止条件后仍可能无结果。', '本例：在局部找到杯子'],
  ['从原图裁取目标', '局部证据现在显示绿色液体。目标 crop 与原图位置加入 VWM；热图本身不是液体颜色的证据。', '新增证据：crop + 位置'],
] as const;
export function SearchLab() {
  const [step,setStep] = useState(0);
  const [strategy,setStrategy] = useState<'random'|'sequential'|'guided'>('guided');
  return <Module number="3.1" title="跟随同一个杯子，观察搜索怎样推进" className="search-lab" note={note}>
    <p className="module-description">问题：桌上杯中液体是什么颜色？</p>
    <div className="strategy-selector" aria-label="搜索策略对照"><span>如果换一种搜索顺序：</span><div>{([['random','随机'],['sequential','顺序'],['guided','V* 引导']] as const).map(([value,label])=><button key={value} type="button" aria-pressed={strategy===value} className={strategy===value?'selected':''} onClick={()=>setStrategy(value)}>{label}</button>)}</div><div className="strategy-path"><div className={`strategy-map ${strategy}`} role="img" aria-label={strategy==='guided'?'示意路径：根据线索先检查右下目标区域':strategy==='sequential'?'示意路径：按左上、右上、左下、右下顺序检查':'示意路径：随机先检查右上、左下、左上、最后右下'}><span>{strategy==='random'?'3':strategy==='sequential'?'1':'·'}</span><span>{strategy==='random'?'1':strategy==='sequential'?'2':'·'}</span><span>{strategy==='random'?'2':strategy==='sequential'?'3':'·'}</span><span>{strategy==='guided'?'1':'4'}</span></div><p role="status">{strategy==='random'?'随机：示意路径先检查右上等无关区域，最后才到目标。':strategy==='sequential'?'顺序：示意路径按固定次序逐块查看，最后才到目标。':'V* 引导：目标或上下文线索使右下目标区获得较高优先级；下方演示此路径。'}<small>四格编号仅比较选择顺序，非论文实测轨迹。</small></p></div></div>
    <div className="lab-grid"><div className="search-visual"><div className={`lab-scene search-step-${step}`} role="img" aria-label={step>=4?'已找到桌上杯子，局部观察显示绿色液体':'桌面教学场景；杯子位于右下区域'}><div className="lab-window"/><div className="lab-art"/><div className="lab-lamp"/><div className="lab-table"><div className="lab-cup"/></div><div className="lab-grid-lines"/><div className="lab-heat"/><div className="selected-region"/><span className="scene-label">{step<2?'全局图像':step<4?'检查优先子图像':'目标已定位'}</span></div><div className={`crop-evidence ${step>=4?'available':''}`}><span>局部观察</span>{step>=4?<><div className="drawn-cup"/><strong>绿色液体</strong></>:<p>定位后，从原图裁取目标</p>}</div></div>
      <div className="lab-right"><span className="eyebrow">步骤 {step+1} / {searchSteps.length}</span><div aria-live="polite" aria-atomic="true"><h3>{searchSteps[step][0]}</h3><p>{searchSteps[step][1]}</p><p className="search-status">{searchSteps[step][2]}</p></div><div className="controls"><button className="button-ghost" disabled={step===0} onClick={()=>setStep(step-1)}>上一步</button><button className="button-primary" onClick={()=>setStep((step+1)%searchSteps.length)}>{step===searchSteps.length-1?'重新搜索':'下一步'}<ArrowRight size={16}/></button></div><button className="button-ghost module-reset" onClick={()=>setStep(0)}><RotateCcw size={15}/>重置实验</button></div>
    </div><p className="source-caption">流程依据 CVPR §3.3.3 / Algorithm 2；策略文案、画面与区域顺序均为教学示意。真实搜索可能需要更多步，也可能找不到目标；论文策略步数对比见 Table 3。</p>
  </Module>;
}
export function Results() {
  const [tab,setTab] = useState(0);
  const tabs = useRef<(HTMLButtonElement|null)[]>([]);
  const result = results[tab];
  return <Module number="5.1" title="三个实验问题，一组证据" className="results-panel">
    <div className="tab-row" role="tablist" aria-label="实验结果">{results.map((item,i)=><button ref={el=>{tabs.current[i]=el;}} key={item.label} id={`result-tab-${i}`} role="tab" aria-controls={`result-panel-${i}`} aria-selected={tab===i} tabIndex={tab===i?0:-1} onClick={()=>setTab(i)} onKeyDown={event=>{const next=event.key==='ArrowRight'?(i+1)%3:event.key==='ArrowLeft'?(i+2)%3:event.key==='Home'?0:event.key==='End'?2:-1;if(next>=0){event.preventDefault();setTab(next);tabs.current[next]?.focus();}}}>{item.label}</button>)}</div>
    <div id={`result-panel-${tab}`} role="tabpanel" aria-labelledby={`result-tab-${tab}`} tabIndex={0}><h3>{result.title}</h3><div className="results-table-wrap"><table className="results-table"><caption>{result.source}</caption><thead><tr><th scope="col">方法 / 设置</th><th scope="col">{result.metric}</th></tr></thead><tbody>{result.rows.map(([label,value])=><tr key={label} className={label==='V*'||label.includes('SEAL')||label==='VWM + V*'?'paper-method':''}><th scope="row">{label}</th><td>{value.toFixed(2)}</td></tr>)}</tbody></table></div><p className="result-caption">{result.caption}</p></div>
    <p className="source-caption">原论文数值。Table 5 的通用基准并非全部提升；这些结果不代表任意任务上的普遍优势。</p>
  </Module>;
}

