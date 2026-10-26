import './S6Synthesis.css';

const PAPER = 'https://openaccess.thecvf.com/content/CVPR2024/papers/Wu_V_Guided_Visual_Search_as_a_Core_Mechanism_in_Multimodal_CVPR_2024_paper.pdf';
const SUPPLEMENT = 'https://openaccess.thecvf.com/content/CVPR2024/supplemental/Wu_V_Guided_Visual_CVPR_2024_supplemental.pdf';

const contributions = [
  {
    question: '看不清时去哪找？',
    name: 'V* · Guided Visual Search',
    answer: '目标线索、上下文线索和 LLM 世界知识共同引导搜索，优先查看最可能包含目标的区域。',
  },
  {
    question: '搜到以后怎么重新回答？',
    name: 'Visual Working Memory + SEAL',
    answer: 'VWM 组织问题、全图、搜索目标及位置；SEAL 通过 Show → Search → Tell 把新证据交回回答模型。',
  },
  {
    question: '怎么证明这不是漂亮案例？',
    name: 'V*Bench',
    answer: '用高分辨率、视觉拥挤的图像，专项检验细粒度视觉定位与问答能力。',
  },
] as const;

export function S6Synthesis() {
  return <div className="s6-synthesis">
    <section className="s6-block" aria-labelledby="s6-change-title">
      <h3 id="s6-change-title">V* 真正改变了什么</h3>
      <div className="s6-comparison">
        <div className="s6-path">
          <h4>传统 MLLM</h4>
          <ol><li>固定视觉输入</li><li>视觉编码</li><li>语言推理</li><li>回答</li></ol>
        </div>
        <div className="s6-path s6-path-active">
          <h4>V* / SEAL</h4>
          <ol><li>全局观察</li><li>判断证据是否足够</li><li>必要时主动搜索</li><li>获取局部视觉证据</li><li>组织进 VWM</li><li>重新推理</li><li>回答</li></ol>
        </div>
      </div>
      <p className="s6-core-change">视觉输入不再只是固定前提，而可以根据任务需求被主动补充。</p>
    </section>

    <section className="s6-block" aria-labelledby="s6-contributions-title">
      <h3 id="s6-contributions-title">三个核心贡献</h3>
      <div className="s6-contributions">
        {contributions.map((item, index) => <article className="s6-contribution" key={item.name}>
          <span className="s6-index">Q{index + 1}</span>
          <h4>{item.question}</h4>
          <strong>{item.name}</strong>
          <p>{item.answer}</p>
        </article>)}
      </div>
    </section>

    <section className="s6-block" aria-labelledby="s6-limits-title">
      <h3 id="s6-limits-title">论文局限与边界</h3>
      <div className="s6-limits-grid">
        <div className="s6-limit s6-limit-author">
          <h4>作者明确讨论</h4>
          <ul>
            <li>当前搜索模型主要面向自然图像与常见物体；文档、图表、长视频及开放世界仍需额外训练和算法设计。</li>
            <li>补充材料说明，搜索阶段聚焦单个目标实例，尚未穷尽定位同一目标的所有实例。</li>
          </ul>
          <p className="s6-source"><a href={PAPER} target="_blank" rel="noreferrer">论文 §6</a> · <a href={SUPPLEMENT} target="_blank" rel="noreferrer">补充 A.4</a></p>
        </div>
        <div className="s6-limit s6-limit-analysis">
          <h4>基于方法结构的分析</h4>
          <ul>
            <li>若起初判断错了缺失目标，后续搜索方向可能偏离。</li>
            <li>异常场景关系可能误导上下文线索；主动搜索也有额外计算成本。</li>
          </ul>
          <p className="s6-source">教学分析，非作者的定量结论</p>
        </div>
      </div>
      <div className="s6-claim-boundary">
        <h4>V* 没有证明什么？</h4>
        <div><p><span aria-hidden="true">✓</span><strong>论文支持</strong>在 V*Bench 的比较设置中，SEAL 高于论文比较的 MLLM；消融支持引导式搜索的作用。</p>
          <p><span aria-hidden="true">×</span><strong>不能据此推出</strong>所有基准都最优、所有高分辨率问题已解决，或搜索过程等同完整自主智能体与人类视觉机制。</p></div>
      </div>
    </section>

  </div>;
}
