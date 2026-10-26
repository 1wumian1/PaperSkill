import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Attention Is All You Need",
    "titleZh": "注意力机制即全部所需",
    "venue": "NIPS 2017 · Google Brain / Google Research / University of Toronto",
    "authors": "Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin",
    "affiliation": "Google Brain, Google Research, University of Toronto",
    "domain": "自然语言处理 · 机器翻译",
    "coreProblem": "循环网络把计算按位置逐步展开，一个样本内部无法并行，长距离依赖要跨越 n 步。",
    "coreInsight": "让每个位置直接与所有位置比对相关度，再用 softmax 权重加权求和，一步完成依赖建模。",
    "keywords": [
      "Transformer",
      "自注意力",
      "多头注意力",
      "位置编码",
      "机器翻译"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "循环网络：逐位接力",
      "desc": "第一个人弹完再口述给下一位，必须等前一位说完。",
      "componentId": "cover-relay"
    },
    "newMethod": {
      "title": "Transformer：同时加权听取",
      "desc": "四个人同时演奏，每位按需分配对别人的注意力音量。",
      "componentId": "cover-hear-all"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "顺序计算的代价",
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "顺序步数与信息保真",
          "desc": "拉长接力链，观察顺序步数与末位保真度如何一起恶化。",
          "componentId": "s01-order-cost"
        }
      ],
      "scenes": [
        {
          "id": "s01-order-cost",
          "title": "接力传递为什么必须排队",
          "goal": "看清顺序依赖的成本来自「必须等前一位」，而不是来自计算量本身。",
          "summary": "循环网络沿位置逐步计算隐藏状态，第 t 步必须等第 t−1 步完成，因此一个样本内部无法并行。",
          "interaction": "拖动链条长度滑块，增加参与的乐手人数。",
          "next": "既然必须排队，那么第一位的信息要走几手才能到队尾？",
          "notes": "依据 page 2 §1：循环模型沿符号位置分解计算，h_t 依赖 h_{t−1}，这种顺序性阻碍样本内并行。保真度指数衰减是教学示意，论文未给出该曲线。",
          "componentId": "s01-order-cost",
          "moduleId": "1.1"
        },
        {
          "id": "s02-path-length",
          "title": "信息路径长度：n 步与 1 步",
          "goal": "把「排队」翻译成可比较的路径长度指标。",
          "summary": "自注意力把任意两位置连成常数步；循环层需要 O(n) 步，卷积层需要 O(log_k n) 步。",
          "interaction": "点击任意小节格子选择目标位置，并切换层类型。",
          "next": "如果不等前一位，每个位置凭什么知道该听谁？",
          "notes": "数值取自 page 6 Table 1：自注意力 O(n²·d)/O(1)/O(1)，循环 O(n·d²)/O(n)/O(n)，卷积 O(k·n·d²)/O(1)/O(log_k n)。",
          "componentId": "s02-path-length"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "缩放点积注意力",
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "查询—键匹配打分",
          "desc": "选一位乐手提问，看它对每个人的匹配分数如何被算出来。",
          "componentId": "s03-qkv-score"
        }
      ],
      "scenes": [
        {
          "id": "s03-qkv-score",
          "title": "查询与键：先打分，再决定听谁",
          "goal": "区分「匹配分数」与「注意力权重」两件事。",
          "summary": "注意力把 query 与一组 key 比对，分数由兼容性函数给出；此时还只是原始分数，尚未归一化。",
          "interaction": "点击乐手切换提问者（query），再点击其他乐手查看其键向量。",
          "next": "分数有大有小，怎么变成一组加起来等于 1 的音量？",
          "notes": "依据 page 3–4 §3.2：输出是 value 的加权和，权重来自 query 与 key 的兼容性函数。页面用 3 维小向量示意点积，非论文实验数据。",
          "componentId": "s03-qkv-score",
          "moduleId": "2.1"
        },
        {
          "id": "s04-scale-softmax",
          "title": "为什么要除以 √d_k",
          "goal": "理解缩放是为了控制 softmax 的饱和程度。",
          "summary": "d_k 变大时点积的方差随之变大，softmax 被推向极端值、梯度变得极小；除以 √d_k 可以把分布拉回可用区间。",
          "interaction": "拖动 d_k 滑块，对比「不缩放」与「除以 √d_k」两条分布。",
          "next": "归一化之后，输出究竟是怎么被算出来的？",
          "notes": "依据 page 4 §3.2.1 与脚注 4：q、k 分量独立且均值 0 方差 1 时，q·k 方差为 d_k。页面把 d_k=64 处的分数作为基准按 √(d_k/64) 放大，属示意的量级模拟。",
          "componentId": "s04-scale-softmax"
        },
        {
          "id": "s05-attention-mix",
          "title": "输出是 value 的加权和",
          "goal": "亲手调整权重，看到输出向量随权重连续变化。",
          "summary": "softmax 保证权重非负且和为 1，输出向量落在各 value 的凸组合上。",
          "interaction": "拖动四个权重条之一，其余权重按比例自动重分配以保持和为 1。",
          "next": "一个头只能给出一种混合，如果两种关系需要同时听清呢？",
          "notes": "依据 page 4 式(1) 与 page 3–4 §3.2。value 取 4 维小向量作示意；权重和为 1 由 softmax 保证，页面在拖动后自动归一化。",
          "componentId": "s05-attention-mix"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "多头注意力",
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "单头与八头的分工",
          "desc": "切换头数，观察不同的关系能否被同时分辨。",
          "componentId": "s06-multihead-split"
        }
      ],
      "scenes": [
        {
          "id": "s06-multihead-split",
          "title": "多头：在不同表示子空间里同时听",
          "goal": "理解单头平均会抹掉信息，多头把它分开承担。",
          "summary": "把 Q、K、V 投影 h 次后并行做注意力，再拼接投影；不同头可以分别关注节奏型与和声进行。",
          "interaction": "切换单头 / 八头，并选择想同时听清的两类关系。",
          "next": "多头解决了子空间问题，但没有循环结构，模型怎么知道词的先后？",
          "notes": "依据 page 5 §3.2.2：h=8、d_k=d_v=d_model/h=64；单头平均会抑制不同子空间的信息。页面中的「可分辨度」为教学示意的编码，不是论文指标。",
          "componentId": "s06-multihead-split",
          "moduleId": "3.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "位置信息与掩码",
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "因果掩码与自回归",
          "desc": "关掉掩码，看未来小节如何被提前听见。",
          "componentId": "s09-causal-mask"
        }
      ],
      "scenes": [
        {
          "id": "s08-pos-encoding",
          "title": "位置编码：没有循环，也要知道第几拍",
          "goal": "理解位置编码解决的是「顺序信息从哪来」。",
          "summary": "位置编码（Positional Encoding）把位置变成与词嵌入同维的向量并直接相加，正弦余弦版波长构成从 2π 到 10000·2π 的等比数列。",
          "interaction": "拖动 pos 滑块，切换查看不同维度组的波形。",
          "next": "正弦编码算得出来，换成可学习的嵌入表，为什么反而不行？",
          "notes": "依据 page 6 §3.5；Table 3 行(E) 显示可学习位置嵌入结果几乎相同（PPL 4.92 / BLEU 25.7 对 base 的 4.92 / 25.8），作者选正弦版是为了可能外推更长序列。",
          "componentId": "s08-pos-encoding"
        },
        {
          "id": "s15-pos-extrapolate",
          "title": "正弦编码为什么能外推",
          "goal": "理解作者选正弦版而非可学习嵌入的真正理由，也看清这个理由的边界。",
          "summary": "正弦编码是 pos 的确定函数，任意长度的位置都能直接算出向量；可学习嵌入表只有训练时设定的行数，更长的序列没有对应参数。",
          "interaction": "拖动 pos 滑块越过训练长度，对比两种编码在该位置是否还有定义。",
          "next": "解码器生成时还有另一个约束：不能提前看到答案。",
          "notes": "依据 page 6 §3.5 原话：两种版本结果几乎相同，作者选正弦版是 because it may allow the model to extrapolate to sequence lengths longer than the ones encountered during training，并猜想 for any fixed offset k，PE(pos+k) 可表示为 PE(pos) 的线性函数（来自和角公式）。Table 3 行(E)：可学习 4.92 PPL / 25.7 BLEU 对 正弦 4.92 / 25.8，差距在噪声内——论文并未给出外推带来收益的实验，这只是设计动机。",
          "componentId": "s15-pos-extrapolate"
        },
        {
          "id": "s09-causal-mask",
          "title": "掩码：不许偷看后面的小节",
          "goal": "看清掩码如何保持自回归性质。",
          "summary": "解码器把对应未来连接的位置设为 −∞，softmax 后权重为 0，使位置 i 只能依赖小于 i 的已知输出。",
          "interaction": "切换掩码开关，点击注意力矩阵中的格子查看权重。",
          "next": "这些零件如何组成完整的编码器—解码器架构？",
          "notes": "依据 page 5 §3.2.3 与 page 3 §3.1：掩码配合输出嵌入右移一位。矩阵为 4×4 示意，权重由给定分数实时 softmax 计算。",
          "componentId": "s09-causal-mask",
          "moduleId": "4.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "整体架构",
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "六层堆叠里的每个零件",
          "desc": "把前面几页的机制放回完整架构，说清每层的输入从哪来、维度是多少。",
          "componentId": "s10-arch-stack"
        }
      ],
      "scenes": [
        {
          "id": "s10-arch-stack",
          "title": "六层堆叠里的每个零件",
          "goal": "把前面几页的机制放回完整架构，说清每层的输入从哪来、维度是多少。",
          "summary": "编码器与解码器各 6 层，每层子层输出为 LayerNorm(x + Sublayer(x))，base 模型 d_model=512、d_ff=2048。",
          "interaction": "点击原文架构图上的部件（自注意力、交叉注意力、前馈网络、位置编码），阅读其作用与维度。",
          "next": "训练出来到底好不好？用 BLEU 与算力一起看。",
          "notes": "图为原文 page 3 Figure 1（Google 授权在学术作品中转载表格与图）。维度取自 page 3 §3.1、page 5 §3.2.2 与 §3.3。",
          "componentId": "s10-arch-stack",
          "moduleId": "5.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "结果与边界",
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "BLEU 与训练算力",
          "desc": "在单模型与集成之间切换，逐行核对原文 Table 2。",
          "componentId": "s12-bleu-cost"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "句法分析：同一套结构的泛化",
          "desc": "换一个结构强约束、输出更长的任务，看 Transformer 还能不能打。",
          "componentId": "s14-parsing"
        },
        {
          "kind": "module",
          "id": "6.3",
          "title": "代价与边界",
          "desc": "n² 代价与「可解释性」的真正边界。",
          "componentId": "s13-limits"
        }
      ],
      "scenes": [
        {
          "id": "s12-bleu-cost",
          "title": "同样质量，少一个数量级的算力",
          "goal": "在相同协议下比较质量与成本，不把单模型和集成混为一谈。",
          "summary": "Transformer (big) 在 WMT 2014 EN-DE 达 28.4 BLEU，训练算力 2.3×10^19 FLOPs，低于多数对比模型的成本。",
          "interaction": "切换数据集（EN-DE / EN-FR）与模型类型（单模型 / 集成）。",
          "next": "翻译之外，这套结构还能做别的任务吗？",
          "notes": "数据取自 page 8 Table 2。注意论文 §6.1 正文把 EN-FR big 写作 41.0，而 Table 2 为 41.8，页面采用表格值并注明该出入。BLEU 越高越好，FLOPs 越低越好，仅比较同类型（单模型或集成）。EN-DE 的「超过集成」来自 §6.1 原话 outperforms the best previously reported models (including ensembles)。",
          "componentId": "s12-bleu-cost",
          "moduleId": "6.1"
        },
        {
          "id": "s14-parsing",
          "title": "换到句法分析：仍然能打",
          "goal": "用 Table 4 检验「通用性」这一说法，而不是只看翻译。",
          "summary": "4 层模型仅用 WSJ 4 万句达 91.3 F1，超过 BerkeleyParser；半监督 92.7 F1 只低于 RNN Grammar 的 93.3。",
          "interaction": "切换「只用 WSJ」与「半监督」，看 Transformer 在一堆专用系统里的位置。",
          "next": "既然这么好，它能用在多长的序列上？",
          "notes": "数据取自 page 10 Table 4（WSJ Section 23 的 F1），训练设置为 4 层、d_model=1024、无任务特定调参；配置与超参见 page 9–10 §6.3（词表 16K/32K、beam 21、α=0.3、输出上限输入+300）。半监督用高置信度语料与 BerkeleyParser 语料约 1700 万句。表中基线来自不同论文，训练设置不同，只在同一设置内比较。",
          "componentId": "s14-parsing",
          "moduleId": "6.2"
        },
        {
          "id": "s13-limits",
          "title": "代价：n² 与「可解释」的边界",
          "goal": "看清自注意力的适用范围，以及哪些结论只是定性观察。",
          "summary": "每层计算随 n² 增长，仅在 n 小于 d 时快于循环层；注意力可视化是定性观察，不能当作因果解释。",
          "interaction": "拖动序列长度，观察自注意力与循环层每层计算量的交叉点。",
          "next": "",
          "notes": "依据 page 6 Table 1 与 page 6–7 §4（n 小于 d 时自注意力更快）；可解释性见 page 13–15 附录，属定性观察。",
          "componentId": "s13-limits",
          "moduleId": "6.3"
        }
      ]
    }
  ]
};
