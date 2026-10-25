import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Visual Instruction Tuning",
    "titleZh": "LLaVA：视觉指令微调",
    "venue": "NeurIPS 2023",
    "authors": "Haotian Liu · Chunyuan Li · Qingyang Wu · Yong Jae Lee",
    "affiliation": "威斯康星大学麦迪逊分校 · 微软研究院 · 哥伦比亚大学",
    "domain": "视觉语言与指令微调",
    "coreProblem": "把图像作为证据，让回答真正围绕问题展开。",
    "coreInsight": "图像如何接入语言模型？模型又怎样学会按问题作答？<br/>从<b>视觉投影、指令数据到两阶段训练</b>，亲手拆解原版 LLaVA。<br/><a href=\"https://papers.neurips.cc/paper_files/paper/2023/file/6dcf277ea32ce3288914faf369fe6de0-Paper-Conference.pdf\" target=\"_blank\" rel=\"noreferrer\">阅读论文原文 ↗</a> · NeurIPS 2023 原版",
    "keywords": [
      "视觉连接",
      "两阶段训练",
      "指令数据",
      "能力边界"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "<b>描述画面</b><br/>“杯子里有三支铅笔。”<br/>识别了物品，还没有回答它的用途。",
      "componentId": "llava-hero-old"
    },
    "newMethod": {
      "desc": "<b>围绕问题解释</b><br/>“杯子被当作笔筒，用来收纳铅笔。”<br/>同一幅教学插画，回答随问题改变。",
      "componentId": "llava-hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "看见物体，为什么还不够？",
      "badge": "inf",
      "badgeLabel": "理解与推理",
      "bridge": "同一张图片，可以问“有什么”，也可以问“用来做什么”。LLaVA 要解决的是：让模型把视觉证据与用户的问题结合起来，组织相应的回答。",
      "analogy": {
        "title": "先看证据，再回应问题",
        "text": "写一份看图说明，先揭开参考图片，再按问题选择需要讲的内容。<b>图片决定证据，问题决定任务。</b>",
        "componentId": "llava-analogy-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "一张图，三种提问",
          "desc": "先选问题，再比较固定描述与按指令组织的回答。图与答案为教学示例，用于解释原文第1节的问题设定。",
          "componentId": "llava-c1"
        }
      ],
      "insight": "认出图中的物体，只是起点；还要按问题组织证据，并识别信息不足。",
      "takeaways": [
        {
          "icon": "◉",
          "title": "以图为据",
          "desc": "答案需要来自画面中可观察的证据。"
        },
        {
          "icon": "↔",
          "title": "按问题作答",
          "desc": "同一图像可以支持描述、用途解释等不同任务。"
        },
        {
          "icon": "◎",
          "title": "识别边界",
          "desc": "不知道物品主人时应承认信息不足；流畅回答不等于事实可靠。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "图像怎样变成一串特征？",
      "badge": "inf",
      "badgeLabel": "理解与推理",
      "bridge": "语言模型接收向量序列。LLaVA 先用 CLIP 编码图像，得到视觉特征，再考虑如何把它接入语言模型。",
      "analogy": {
        "title": "放大细节，不急着命名",
        "text": "放大镜能让杯口和铅笔的细节更清楚，却不会自动把它变成一句话。<b>观察与语言表达是两件事。</b>",
        "componentId": "llava-analogy-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "选一个位置，看局部与向量",
          "desc": "点击图像网格或区域按钮，检查同一位置的局部放大图。3×3网格与六维坐标是教学简化；原版使用 CLIP ViT-L/14 网格特征（第4页，§4.1）。",
          "componentId": "llava-c2"
        }
      ],
      "insight": "视觉 token 是一个位置的特征向量；它既不是检测框，也不是预先写好的物体名称。",
      "takeaways": [
        {
          "icon": "◫",
          "title": "先编码",
          "desc": "CLIP 将图像变为可供后续计算的视觉特征。"
        },
        {
          "icon": "≋",
          "title": "保留序列",
          "desc": "一个物体可能跨多个位置，一个位置也未必对应完整物体。"
        },
        {
          "icon": "↔",
          "title": "结合上下文",
          "desc": "局部放大图只展示像素；编码后的网格特征还会利用其他位置的信息。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "视觉特征怎样接入语言模型？",
      "badge": "inf",
      "badgeLabel": "理解与推理",
      "bridge": "两种表示的维度并不天然一致。原版 LLaVA 使用一个可训练的线性投影，将视觉特征转换到语言模型的词嵌入维度。",
      "analogy": {
        "title": "先把记录规格对齐",
        "text": "尺规让记录的规格一致，内容是否有用还要继续检查。模型也先解决<b>接口兼容</b>，再通过训练学习语义对应。",
        "componentId": "llava-analogy-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "把 3 个坐标映射成 4 个坐标",
          "desc": "拖动矩阵卡片，或用按钮切换连接方式，检查输出形状与数值。3→4维及矩阵均为教学示例；机制依据原文第4页公式（1）。",
          "componentId": "llava-c3"
        }
      ],
      "insight": "线性投影真正改变了特征坐标与维度；维度兼容并不自动意味着语义已经对齐。",
      "takeaways": [
        {
          "icon": "↔",
          "title": "线性连接",
          "desc": "原版连接器是单层线性投影 W，而非后续版本的多层连接器。"
        },
        {
          "icon": "≡",
          "title": "对齐维度",
          "desc": "W 将 dᵥ 维视觉特征映射到 dₗ 维语言输入，保留 N 个视觉位置。"
        },
        {
          "icon": "◎",
          "title": "还需学习",
          "desc": "这里演示矩阵运算；真实 W 的参数需要从训练数据中学习。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "一层投影，究竟改变了什么",
      "badge": "both",
      "badgeLabel": "原理与判断",
      "bridge": "投影把视觉特征接入语言模型。先用一个二维例子看清它怎样改变向量，再回到原版 LLaVA 的线性连接层。",
      "analogy": {
        "title": "改刻度，不改观察对象",
        "text": "尺规能改变记录的尺度，但不会替我们理解记录的内容。线性投影也是可学习的表达转换。",
        "componentId": "llava-analogy-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "同一个向量，三种投影结果",
          "desc": "固定输入 z=(1, 0.5)，只改变矩阵中的 a。观察压缩、保持和反转时，橙色输出怎样变化。原文机制：第 4 页 §4.1，式（1）。",
          "componentId": "llava-c4"
        }
      ],
      "insight": "投影解决表示如何转换；转换后的表示是否有用，取决于训练。",
      "formula": {
        "lead": "将每个视觉 token 按列排列，线性层改变特征维度，但保留视觉序列长度 N。",
        "unicode": "Hᵥ = W Zᵥ，Zᵥ = g(Xᵥ)",
        "symbols": [
          {
            "sym": "Hᵥ",
            "desc": "投影后的视觉特征，形状为 dₗ × N；dₗ 与语言模型词嵌入的维度一致。"
          },
          {
            "sym": "W",
            "desc": "可训练投影矩阵，形状为 dₗ × dᵥ。对每个视觉位置使用同一个矩阵。"
          },
          {
            "sym": "Zᵥ",
            "desc": "CLIP 提取的视觉特征，形状为 dᵥ × N。这里按列存放 token；代码采用行向量时可等价转置。"
          },
          {
            "sym": "g",
            "desc": "预训练视觉编码器。原文采用 CLIP ViT-L/14，在两个训练阶段都保持冻结。"
          },
          {
            "sym": "Xᵥ",
            "desc": "输入图像；N 是其视觉特征序列中的位置数，不是回答的词数。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "↔",
          "title": "逐位置映射",
          "desc": "同一个 W 作用于所有视觉位置，改变特征维度，保留序列长度。"
        },
        {
          "icon": "▦",
          "title": "连续向量",
          "desc": "投影输出仍是向量，不会把每个 patch 自动翻译成一个词。"
        },
        {
          "icon": "◇",
          "title": "运算与语义",
          "desc": "二维例子解释矩阵乘法；语义质量不能从箭头的长短读出。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "让纯文本教师生成视觉指令",
      "badge": "both",
      "badgeLabel": "原理与判断",
      "bridge": "只有连接层，模型还不知道用户会提出哪些问题。论文用已有图像标注，让纯文本教师生成更丰富的问答。",
      "analogy": {
        "title": "同一份证据，换一种任务",
        "text": "同一页观察记录，可以用于提问、详细说明或解释原因。任务改变，证据仍要保留。",
        "componentId": "llava-analogy-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "教师看文字，学生看图像",
          "desc": "切换指令类型，比较问题、答案及其在数据集中的占比。方法与规模依据原文第 3–4 页 §3、表 1。",
          "componentId": "llava-c5"
        }
      ],
      "insight": "生成数据时，GPT-4 读的是描述与框信息；训练 LLaVA 时，学生接收图像与指令。",
      "takeaways": [
        {
          "icon": "▤",
          "title": "符号化视觉证据",
          "desc": "教师靠文字描述与框信息了解画面，不是直接调用视觉版 GPT-4。"
        },
        {
          "icon": "▧",
          "title": "图像与指令配对",
          "desc": "学生实际读图，并学习生成与当前问题对应的答案。"
        },
        {
          "icon": "＋",
          "title": "三类任务互补",
          "desc": "对话、详细描述、复杂推理共约 15.8 万条样本，不等于图片数。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "答案是怎样逐词生成的",
      "badge": "inf",
      "badgeLabel": "理解与推理",
      "bridge": "看图和理解问题之后，答案仍要逐步生成。每次只能利用已知条件预测下一部分，不能提前读取未来答案。",
      "analogy": {
        "title": "写出的内容，成为下一步依据",
        "text": "继续写笔记时，可以参考已经写下的内容；后面还没写出的部分，不能反过来充当依据。",
        "componentId": "llava-analogy-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "这一刻，模型到底能读到什么？",
          "desc": "每点击一次，就展开一个教学片段。对照“本步之前的答案”和“本步新增”，检查因果顺序。依据原文第 4–5 页式（2）–（3）、表 2。",
          "componentId": "llava-c6"
        }
      ],
      "insight": "本步生成的内容，要等生成完成后，才会成为下一步的输入。",
      "formula": {
        "lead": "下面将论文公式 (3) 的历史下标改写成“已有指令”和“已有答案”，强调每一步能读取的条件。",
        "unicode": "p(Xₐ | Xᵥ, 指令) = ∏ᵢ pθ(xᵢ | Xᵥ, 已有指令, 已有答案)",
        "symbols": [
          {
            "sym": "Xₐ",
            "desc": "需要生成的答案序列。训练时只对助手答案及停止符计算预测损失。"
          },
          {
            "sym": "Xᵥ",
            "desc": "图像条件；不是每生成一个词就重新获取一张图像。"
          },
          {
            "sym": "∏ᵢ",
            "desc": "对各预测位置的条件概率连乘；这里描述自回归分解，不是在展示测得的概率值。"
          },
          {
            "sym": "pθ",
            "desc": "由模型参数 θ 决定的条件概率。推理时权重固定。"
          },
          {
            "sym": "xᵢ",
            "desc": "当前需要预测的 token；已有答案仅包括该位置之前出现的内容。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "→",
          "title": "只读已有内容",
          "desc": "推理依据图像、问题和过去的答案，不读取未来 token。"
        },
        {
          "icon": "▧",
          "title": "图像持续提供条件",
          "desc": "视觉表示属于回答的上下文，不是先输出一个类别就完成任务。"
        },
        {
          "icon": "↺",
          "title": "后续对话继续积累",
          "desc": "新问题可利用已有对话；原文训练的后续轮次输入文本问题。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "训练在监督哪些位置",
      "badge": "trn",
      "badgeLabel": "训练机制",
      "bridge": "同一段对话里，图像、问题和答案都参与计算，但并非每一部分都要计入损失。先分清“模型能读取什么”和“模型要预测什么”。",
      "analogy": {
        "title": "批改答案，保留题目",
        "text": "批改笔记时，题目是参考条件，答案才是需要修正的部分。没有给题目打分，不代表回答时忽略了题目。",
        "componentId": "llava-analogy-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "有上下文，不一定有答案损失",
          "desc": "选择一个片段，看它在序列中的位置和监督掩码。0 表示不计入答案损失，1 表示计入（原文第 5 页表 2、式 3）。",
          "componentId": "llava-c7"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "把正确词的概率变成损失",
          "desc": "固定一个正确的目标 token，调节它的预测概率。曲线严格按 −ln p 计算，使用自然对数；这是数学示例。",
          "componentId": "llava-loss"
        }
      ],
      "insight": "监督掩码决定在哪里计算损失，不负责删除模型需要读取的上下文。",
      "formula": {
        "lead": "把原文式（3）的概率连乘取负对数，可写成下面的掩码求和形式；这里没有除以 token 数。",
        "unicode": "ℒ = −Σᵢ mᵢ log pθ(xᵢ | 上下文)",
        "symbols": [
          {
            "sym": "ℒ",
            "desc": "参与监督位置的负对数似然之和，越低表示这些正确 token 被赋予的概率越高。"
          },
          {
            "sym": "mᵢ",
            "desc": "监督掩码，取 0 或 1。助手答案与停止符为 1；用户问题等条件输入为 0。"
          },
          {
            "sym": "pθ",
            "desc": "给定图像与此前对话，参数 θ 所定义的下一个 token 条件概率。"
          },
          {
            "sym": "xᵢ",
            "desc": "当前参与预测的答案 token。训练时此前的答案 token 来自真实训练序列。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "◉",
          "title": "监督掩码",
          "desc": "不计算某段输入的答案损失，不等于阻止模型读取它。"
        },
        {
          "icon": "↘",
          "title": "损失方向",
          "desc": "对固定正确目标，提高其概率会降低负对数似然。"
        },
        {
          "icon": "↔",
          "title": "训练与推理",
          "desc": "训练可使用真实历史答案；实际生成时依赖已经生成的答案。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "两阶段训练，哪些参数更新",
      "badge": "trn",
      "badgeLabel": "训练机制",
      "bridge": "原版 LLaVA 的连接很简单：CLIP、一个线性层和 Vicuna。关键还在于训练顺序——先训练连接层，再让语言模型一起学习响应指令。",
      "analogy": {
        "title": "固定参考，修改讲解",
        "text": "写讲解时，可以固定参考材料，先调整记录方式，再改进表达。冻结只是参数不更新，模块仍参与前向计算。",
        "componentId": "llava-analogy-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "切换阶段，看更新范围与信息路径",
          "desc": "上方切换训练阶段，下方点选组件。锁代表冻结，笔代表更新；无论是否冻结，前向连线都保留。依据原文第 4 页图 1、第 5 页 §4.2。",
          "componentId": "llava-c8"
        }
      ],
      "insight": "冻结的是参数更新，不是前向计算；CLIP 在两个训练阶段都保持固定。",
      "formula": {
        "lead": "θ 只指当前允许更新的参数集合；前向计算仍会使用那些被冻结的模块。",
        "unicode": "阶段一：θ = {W}　　阶段二：θ = {W, φ}",
        "symbols": [
          {
            "sym": "θ",
            "desc": "当前阶段参与优化的参数，不等同于整个网络全部参数。"
          },
          {
            "sym": "W",
            "desc": "把视觉特征映射到语言嵌入空间的线性投影。"
          },
          {
            "sym": "φ",
            "desc": "Vicuna 语言模型的参数；阶段一冻结，阶段二更新。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "1",
          "title": "特征对齐",
          "desc": "筛选后的 59.5 万图文对用于训练连接层，视觉与语言两端均冻结。"
        },
        {
          "icon": "2",
          "title": "指令微调",
          "desc": "聊天分支用 15.8 万条指令数据更新投影与语言模型，ScienceQA 是另一分支。"
        },
        {
          "icon": "▣",
          "title": "冻结边界",
          "desc": "原文的“端到端”不表示全部参数解冻；视觉编码器始终固定。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "用消融检查设计选择",
      "badge": "trn",
      "badgeLabel": "证据与判断",
      "bridge": "结构是否合理，要回到同一任务上的证据。以 ScienceQA 的 90.92% 为参照，分别检查视觉特征、对齐预训练和模型规模带来的差异。",
      "analogy": {
        "title": "逐项核对，而非凭印象",
        "text": "对照笔记与参考时，每次只核对一个明确问题。解释实验差异，也必须看清改变了什么、保持了什么。",
        "componentId": "llava-analogy-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "同时看分数差异和实验条件",
          "desc": "选一个配置，观察准确率与改变的条件。图表使用完整的 0–100 尺度，差值以百分点单独呈现。数字来自原文第 9 页表 8。",
          "componentId": "llava-c9"
        }
      ],
      "insight": "分数告诉我们发生了什么；实验条件限定了我们能解释到哪一步。",
      "takeaways": [
        {
          "icon": "✓",
          "title": "对齐有用",
          "desc": "跳过对齐预训练降至 85.81%；这仍保留了预训练 CLIP 与语言模型。"
        },
        {
          "icon": "◈",
          "title": "特征有条件",
          "desc": "倒数第二层在该实验更好；“更关注局部细节”是作者提出的解释。"
        },
        {
          "icon": "↔",
          "title": "解释要克制",
          "desc": "容量、特征和训练配置都需要核对；这里不把多个条件同时改变的结果当成单变量因果证据。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果能证明什么，不能证明什么",
      "badge": "both",
      "badgeLabel": "结果与边界",
      "bridge": "聊天评分、科学选择题准确率和细粒度感知，衡量的是不同能力。先按评测协议读结果，再用一个属性绑定案例检查结论的边界。",
      "analogy": {
        "title": "合格的是哪一项任务",
        "text": "一份讲解可以表达流畅，却仍把细节说错。验收需要对应具体任务，不能把一项成绩当成所有能力的通行证。",
        "componentId": "llava-analogy-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "先选评测协议，再看结果",
          "desc": "选择协议并开始对比。条形共享 0–100 尺度，旁边保留论文原始数值；动画只呈现结果，不运行模型。",
          "componentId": "llava-c10"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "草莓与酸奶，能说明酸奶的口味吗？",
          "desc": "流畅的回答也可能错误绑定属性。下面用重绘的教学场景，检验一个看似自然的推断。",
          "componentId": "llava-binding"
        }
      ],
      "insight": "按指令组织回答，是 LLaVA 的重要进步；可靠的属性绑定和精确定位仍需要分别验证。",
      "takeaways": [
        {
          "icon": "≠",
          "title": "协议不同",
          "desc": "85.1 是 COCO 相对评分；90.92% 是 ScienceQA 单模型准确率；92.53% 属于联合判断。"
        },
        {
          "icon": "!",
          "title": "共现不等于绑定",
          "desc": "原文第 7–8 页记录了将“草莓＋酸奶”误判为“草莓味酸奶”的失败案例。"
        },
        {
          "icon": "◎",
          "title": "衔接定位研究",
          "desc": "本论文没有用指代表达定位的 IoU 指标证明精确选框能力；这需要额外的带框标注评测。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1n14y1k7B9",
      "title": "LLaVA：Visual Instruction Tuning 论文速览",
      "reason": "聚焦原始论文，辅助回顾视觉连接和指令数据。",
      "cover": "https://i2.hdslb.com/bfs/archive/e70f51855bd470691b72d85181c90bd4742e9107.jpg",
      "views": "1.9万播放"
    },
    {
      "bvid": "BV1HDmmYcEox",
      "title": "LLAVA 论文讲解",
      "reason": "直接讲解本篇原始论文，虽播放量较低，仍可作为结构与训练的补充复习。",
      "cover": "https://i2.hdslb.com/bfs/archive/7b41c79f01a8353874e70770c92afc146562b714.jpg",
      "views": "4341播放"
    }
  ]
};
