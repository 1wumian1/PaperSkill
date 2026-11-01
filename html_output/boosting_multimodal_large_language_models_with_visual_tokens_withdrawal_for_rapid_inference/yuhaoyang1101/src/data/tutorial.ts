import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Boosting Multimodal Large Language Models with Visual Tokens Withdrawal for Rapid Inference",
    "titleZh": "基于视觉 Token 撤出的多模态大模型快速推理",
    "venue": "AAAI 2025 · Vol. 39 No. 5 · pp. 5334–5342 · Zhihang Lin, Mingbao Lin, Luxi Lin, Rongrong Ji",
    "authors": "Zhihang Lin, Mingbao Lin, Luxi Lin, Rongrong Ji",
    "affiliation": "厦门大学 · 上海创智学院 · 昆仑万维 Skywork AI",
    "domain": "多模态大模型推理加速",
    "coreProblem": "",
    "coreInsight": "视觉信息在浅层已迁入文字 token：前 K 层完整处理图文，在第 K+1 层入口撤走全部视觉 token。",
    "keywords": [
      "MLLM",
      "visual token",
      "attention sink",
      "information migration",
      "KV Cache",
      "KL divergence"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "原模型（LLaVA-1.5-7B）",
      "desc": "32 层都带着视觉 token 计算",
      "componentId": "vtw-cover"
    },
    "newMethod": {
      "title": "VTW（K = 16）",
      "desc": "第 17 层入口撤走视觉 token",
      "componentId": "vtw-cover"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "01 · 视觉 Token 的计算账单",
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "视觉 token 在计算量中的占比",
          "desc": "改视觉 token 数与指令长度，观察输入序列、每层 Ω(s) 与可省下的比例。",
          "componentId": "vtw-token-bill"
        }
      ],
      "scenes": [
        {
          "id": "token-bill",
          "title": "视觉 Token 在 Eq. (1) 计算量中的占比",
          "goal": "一杯茶里茶叶占了几成？拖动视觉 token 数，看每层计算有多少因它而起。",
          "summary": "LLaVA-1.5 的 576 个视觉 token 约占输入九成，每层计算约九成因它而起",
          "interaction": "切换模型或拖动视觉 token 数、指令长度，观察输入序列、每层 Ω(s) 拆分与反馈",
          "next": "旧方法按“重要性”剪掉部分视觉 token，会遇到什么问题",
          "notes": "【这一页讲什么】多模态大模型的推理成本主要花在哪里。Eq. (2)：第 1 层输入是系统 token、视觉 token、指令 token、输出 token 首尾相接（AAAI 第 3 页 Eq. (2)、图 3）。LLaVA 对 336×336 的图像使用 576 个视觉 token（AAAI 第 2 页 Related Work）；LLaVA-1.5 的系统 token 为 35 个（官方代码 VTW.py 第 15–29 行默认值）。Eq. (1)：一个解码层复杂度 Ω = 2s²h + 12sh²（AAAI 第 3 页），视觉编码器（约 0.3B）远小于 LLM（7B/13B），论文把它排除。\n【数字口径】指令 token 默认 30 是本页设定；s ≈ 641 是本页由表 2 原模型 8.48 TFLOPs 反推（只有把 Eq. (1) 乘以 2，即 1 次乘加记 2 次浮点运算时才落在 641），论文没有写明，属于公式外推。LLaVA-NeXT 的 ≈1990 个视觉 token 由表 2 的两个 TFLOPs 联立反推，论文未给出。“撤掉视觉 token 每层能省多少” = 1 − Ω(s−V)/Ω(s)，按 Eq. (1) 外推。\n【易误解】在 s ≈ 641、h = 4096 时线性项 12sh² 占 97% 以上，“平方增长”的直觉在这里不准；所以省下的计算几乎与撤掉的 token 数成正比。Eq. (1) 是理论计数，不是实测时间（见第 8 章）。Vicuna 实际用 SwiGLU（中间维 11008，约 8.06sh²），与 Eq. (1) 的 4 倍假设几乎相同。\n【类比边界】茶叶在杯中的体积只用来直观表示 token 数量占比；计算量由 Eq. (1) 给出，不是体积。",
          "componentId": "vtw-token-bill",
          "moduleId": "1.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "02 · 按重要性剪枝的局限",
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "问题相关的重要性",
          "desc": "点照片里的物体换问题，比较三种保留规则留下的图块。",
          "componentId": "vtw-question-pruning"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "旧方法的四个短板",
          "desc": "选择一个短板，查看它的机制与 VTW 的绕开方式。",
          "componentId": "vtw-old-hurdles"
        }
      ],
      "scenes": [
        {
          "id": "question-pruning",
          "title": "问题相关的视觉 Token 重要性",
          "goal": "同一桌茶点，问的东西不同，该留的图块也不同。点物体换问题，再换保留规则。",
          "summary": "与问题无关的压缩或不完整的重要性打分，会提前丢掉答题需要的图块",
          "interaction": "点照片中的蛋糕、瓶子或叉子换问题；切换固定压缩、注意力 Top-50%、VTW 前 K 层三种规则，看虚线框里的图块是否留下",
          "next": "四个短板逐一对照：为什么还会影响 KV Cache 与 FlashAttention",
          "notes": "【这一页讲什么】VTW 的出发点不是“更好的打分”。作者在引言中认为“按重要性挑出要保留的视觉 token”这条路本身有短板（AAAI 第 1–2 页 Introduction）。图 1(a)：POPE 中同一张图的多个问题各自关注不同区域；图 1(b)：FastV 剪掉了“bottle”等真正重要的 token，却保留了“cake”等不重要的 token（AAAI 第 1 页 Figure 1）。\n【页面设定】茶桌照片被切成 8×5 = 40 个图块，每块代表一组视觉 token（真实 LLaVA-1.5 是 24×24 = 576 个）。三种规则的保留集合是教学示意：固定压缩对应 PruMerge 这类与问题无关的方法；注意力 Top-50% 按图 1(b) 的失败模式（保留蛋糕、剪掉瓶子）构造；VTW 前 K 层不剪任何图块。它们不是对 PruMerge 或 FastV 实际输出的复现。\n【证据边界】图 1(b) 是论文挑出的单个示例，不代表 FastV 在统计上总是丢掉关键物体。\n【类比边界】茶桌只是承载图 1 物体的画面；“答题需要的图块”由本页设定，不是模型内部可观测的量。",
          "componentId": "vtw-question-pruning",
          "moduleId": "2.1"
        },
        {
          "id": "old-hurdles",
          "title": "旧方法的四个短板与 VTW 的绕开方式",
          "goal": "选一个短板：按“重要性”挑 token 到底卡在哪里？第 3 条可拖动解码步。",
          "summary": "灵活性、指标、KV Cache、FlashAttention 四个短板；VTW 只问“到第几层为止需要视觉 token”",
          "interaction": "点选四个短板之一；在 KV Cache 一项拖动解码步，比较每步重选 token 与 VTW 的缓存能否复用",
          "next": "VTW 换了一个问题：深层的输出 token 到底还在看图吗",
          "notes": "【这一页讲什么】作者概括的四个短板（AAAI 第 1–2 页）：(1) 缺乏灵活性：PruMerge 对不同问题用同一组视觉 token，引言称其 MME 下降 160.4（引述，本页未核对原始实验）；(2) 重要性指标不完整：低分不等于不重要（图 1(b)）；(3) 与 KV Cache 不兼容：FastV 每个解码步保留的视觉 token 不同，需在首次预测时保存全部视觉 token 的 KV；(4) 与 FlashAttention 不一致：FastV 需要注意力分数。表 4：KV Cache 原模型 / FastV / VTW 均 ✓；FlashAttention FastV ✗（AAAI 第 7 页 Table 4）。\n【VTW 为什么能绕开】VTW 在预填充时就决定哪些层有视觉 token，之后每个解码步都不再改变，缓存可以原样复用（官方代码 VTW.py 第 308–314 行，固定 commit b9cb126）。FlashAttention 不把完整注意力矩阵写回显存；VTW 不读注意力分数，所以没有这个问题。代码中是否启用 FlashAttention 由 use_flash_attn 控制（llava/model/builder.py 第 45–46 行）。\n【证据边界】四个短板是 VTW 作者对 FastV、PruMerge 的描述；“FastV 每个解码步保留的视觉 token 不同”本页没有核对 FastV 官方实现。“与 FlashAttention 兼容”是机制层面的说法，论文没有单独报告开启 FlashAttention 时的延迟。KV Cache 一项的解码步方块与注意力分数条形是教学示意。\n【背景】FastV（arXiv 2403.06764）早于 VTW 发表，全文没有 VTW；是 VTW 把 FastV 作为对比基线。",
          "componentId": "vtw-old-hurdles",
          "moduleId": "2.2"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "03 · 观察一：深层注意力",
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "注意力随层的流向",
          "desc": "拖动层索引，观察输出位置把注意力分给四类 token 的光束与曲线。",
          "componentId": "vtw-attention-layers"
        }
      ],
      "scenes": [
        {
          "id": "attention-layers",
          "title": "深层注意力流向系统 Token（图 4）",
          "goal": "正在预测下一个词的位置，到了深层还在看图吗？拖动层索引，或先猜再看。",
          "summary": "浅层看图，深层大部分注意力停在 35 个系统 token 上，视觉 token 只剩约 5%",
          "interaction": "拖动层索引、切换 7B/13B 与“按每个 token 平均”；或进入先猜模式回答三道题",
          "next": "注意力少不等于信息没用：图像信息去哪了",
          "notes": "【这一页讲什么】Eq. (3)：CSA(Q, K, V) = A·V，A = Softmax((QKᵀ + Λ)/√d)，取 A 的最后一行作为注意力分数（AAAI 第 3 页）。图 4：输出 token 对各类输入 token 的注意力随层变化；AI2D、MMMU_Val、MME、POPE 各 100 个样本，对所有注意力头和输出 token 取平均。正文：浅层对系统 token 的注意力急升、对视觉 token 急降；中深层几乎全部注意力（80% 以上）给 35 个系统 token，576 个视觉 token 只得到 5%（AAAI 第 4 页）。\n【数字口径】光束与曲线按图 4 的形状手绘，是教学示意，不是原始数据，所以页面上不标百分比读数。“约 260 倍”按正文两个约数计算：0.80/35 ≈ 2.3%，0.05/576 ≈ 0.0087%，属公式外推。目测图 4，7B 在第 10–16 层系统 token 只有约 0.5，低于“80% 以上”；这句话更接近约第 20 层以后和 13B 的曲线（本页目测）。\n【解释与边界】作者借用 StreamingLLM 的 attention sink：深层输出 token 已有足够信息，但 softmax 不能给任何 token 赋 0，于是把注意力停放在语义很少的系统 token 上（AAAI 第 4 页）。这是解释，没有因果干预。注意力权重小 ≠ 信息不重要：Value 向量大小、残差连接都会影响实际贡献。图 5（AAAI 第 5 页）还显示回答越长，对视觉 token 的注意力越少（对层取平均，约 0.10 降到约 0.03），这一点放到第 10 章的边界讨论。\n【术语】系统 token：固定系统提示，LLaVA-1.5 中 35 个。注意力汇聚（attention sink）：softmax 必须把注意力分出去，于是停在开头几个信息很少的 token 上。\n【类比边界】“下一词”圆点代表注意力矩阵最后一行（正在预测下一个词的位置）；光束粗细只表示相对比例。",
          "componentId": "vtw-attention-layers",
          "moduleId": "3.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "04 · 观察二：信息迁移",
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "因果注意力下的信息迁移",
          "desc": "调节 K 与观察层，观察问题 token 吸收图像信息的过程。",
          "componentId": "vtw-info-migration"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "表 1 消融",
          "desc": "先猜三种条件的高低，再点茶杯解读 MME 总分。",
          "componentId": "vtw-table1-ablation"
        }
      ],
      "scenes": [
        {
          "id": "info-migration",
          "title": "因果注意力下的信息迁移",
          "goal": "茶包泡几分钟，茶味就溶进水里。拖动 K 和观察层，看问题 token 怎样吸收图像信息。",
          "summary": "因果掩码让图像信息只能流向排在后面的文字 token，撤出前已吸收的信息会保留",
          "interaction": "拖动撤出层 K 与观察层；点“让视觉 token 读问题？”查看因果掩码的限制",
          "next": "实验证据：给错图比不给图更糟（表 1）",
          "notes": "【这一页讲什么】信息迁移（AAAI 第 4 页正文）：因果自注意力只允许 token 关注前面的 token；指令和输出 token 能关注全部视觉 token，视觉 token 不能关注指令和输出 token。经过多层变换，指令和输出 token 吸收了视觉和文字信息。Eq. (3) 的掩码 Λ：上三角为 −inf、对角线为 0（本页写成逐元素的分段形式，含义相同）。\n【页面设定】8 层小模型、5 个视觉 token、3 个问题 token 都是教学示意；“每层吸收 42%”和问题 token 的染色深浅是本页设定，不是模型里真实存在的量。\n【类比映射】茶包 = 视觉 token；茶汤 = 问题（指令）token；泡的层数 = 撤出前完整处理的层数 K；把茶包拿出 = 在第 K+1 层入口撤出。类比边界：真实模型里信息并不像溶质那样单向扩散到饱和，迁移是否在 K 层内完成要靠表 1、图 8 和 KL 校准检验。\n【术语】因果自注意力：每个 token 只能看自己和前面的 token。信息迁移：图像信息逐层流进排在后面的文字 token，是 VTW 的核心假设。",
          "componentId": "vtw-info-migration",
          "moduleId": "4.1"
        },
        {
          "id": "table1-ablation",
          "title": "表 1 消融：白图比不给图更低",
          "goal": "放一包假茶包泡 16 层再拿出，怪味还在吗？先猜哪种做法得分最低。",
          "summary": "前 16 层给白图再撤出得 845.39，低于不给图的 970.89；给原图得 1872.43",
          "interaction": "先猜得分最低的条件；揭晓后点三只茶杯切换解读，柱状图为论文原值",
          "next": "两个观察合在一起：在第 K+1 层入口撤走视觉 token",
          "notes": "【这一页讲什么】表 1（AAAI 第 4 页）：LLaVA-1.5-7B 在 MME 上：原模型 1866.10；(a) 不给图 970.89；(b) 第 1–16 层给无内容白图 845.39；(c) 第 1–16 层给原图 1872.43；(b)(c) 均在第 16 层之后去掉视觉 token。MME 满分 2800。\n【能说明什么】只在前 16 层提供原图就能拿到与原模型相近的总分；白图比完全不给图更差，说明前 16 层写进文字 token 的内容会一直影响后面的预测——这是信息迁移最有力的证据。\n【不能说明什么】(c) 比原模型高 6.33 分是否超出评测波动——论文只有单次运行，没有逐题结果和置信区间，现有材料无法判断。白图同时引入“错误信息”和“分布外输入”两个因素，(b) 的下降也可能部分来自后者。只有一个模型、一个基准、一个撤出层。\n【层号】表 1 写“第 1–16 层给图”，与官方代码 layer_idx == 16 时撤出（0 起计，前 16 层带图）一致；Eq. (5) 字面是前 K−1 层，差一层，见下一页。\n【类比边界】假茶包对应白图；茶杯颜色只是示意，柱状图是论文实测，从零起画。",
          "componentId": "vtw-table1-ablation",
          "moduleId": "4.2"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "05 · Visual Tokens Withdrawal",
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "在第 K+1 层入口撤出视觉 token",
          "desc": "调节 K、观察层与层号口径，观察每层 token 与累计计算量。",
          "componentId": "vtw-withdraw-tower"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "预填充撤出与解码缓存",
          "desc": "逐步走完一次推理，查看代码切片与解码时读取的缓存。",
          "componentId": "vtw-prefill-decode"
        }
      ],
      "scenes": [
        {
          "id": "withdraw-tower",
          "title": "在第 K+1 层入口撤出视觉 Token",
          "goal": "前 K 层完整处理图文，第 K+1 层入口拿出茶包。拖动 K 与观察层，看计算量怎么变。",
          "summary": "前 K 层带视觉 token，之后只算系统与文字 token；K = 16 时总计算量约 55%",
          "interaction": "拖动撤出层 K 与观察层 ℓ，切换“代码 / Eq. (5)”层号口径，观察塔、累计计算量与总比例",
          "next": "放慢一次推理：预填充时切掉，解码时怎样读缓存",
          "notes": "【这一页讲什么】Eq. (4)：标准推理 X_{N+1} = D_{1:N}(X_1)。Eq. (5)（AAAI 第 5 页）：X_K = D_{1:K−1}(X_1)；𝒳_K = X_K − 𝒱_K；𝒳_{N+1} = D_{K:N}(𝒳_K)。正文：在第 K 层之前照常计算，之后只有文字 token 参与深层计算。图 2 为方法框架（AAAI 第 2 页）。\n【层号相差一层】Eq. (5) 字面是前 K−1 层带视觉 token；表 1 写“第 1–16 层给图”、官方代码在 layer_idx == k（0 起计）时撤出，即前 K 层带视觉 token（VTW.py 第 308–314 行）。本教程正文统一按代码口径：前 K 层完整处理图文，在第 K+1 层入口撤走视觉 token。按 Eq. (1) 复算，表 2 的 55.19% 与“前 16 层”（54.98%）更接近，与“前 15 层”（52.17%）相差更远（本页外推）。\n【数字口径】累计计算量按 Eq. (1) 外推：s ≈ 641（由表 2 原模型 8.48 TFLOPs 反推）、V = 576、h = 4096、N = 32；撤出后每层成本约为原来的 10%。塔中的 9 列视觉方块是示意（代表 576 个视觉 token）；茶杯颜色是教学示意。\n【术语】撤出层 K：从哪一层开始不再带视觉 token。预填充：把整段输入一次送进模型、算出第一个词的阶段。",
          "componentId": "vtw-withdraw-tower",
          "moduleId": "5.1"
        },
        {
          "id": "prefill-decode",
          "title": "预填充撤出与解码缓存",
          "goal": "一步步走完一次推理：在哪里切掉视觉 token？新词解码时读到哪些缓存？",
          "summary": "撤出只在预填充时做一次；解码时浅层缓存有视觉 token，深层没有",
          "interaction": "点“下一步 / 上一步”走完 7 步；在第 5、6 步先猜再揭晓；代码行随步骤高亮",
          "next": "撤出后的缓存与位置编号怎样处理",
          "notes": "【这一页讲什么】撤出发生在 VTWLlamaModel.forward 的层循环里：当 decoder_layer.self_attn.layer_idx == temp_cache.k 且 seq_length > 1（预填充）时，把 hidden_states 与 position_ids 中 [系统 token 之后, 系统 + 视觉] 这一段切掉（VTW.py 第 308–314 行，固定 commit b9cb126）。页面代码是节选，h 表示 hidden_states，p 表示 position_ids。sys 与 img 由 llava_arch.py 第 261–266 行为每个样本写入，所以视觉 token 数随图片变化的 LLaVA-NeXT 也能处理。\n【解码】解码时每步只有一个新 token，seq_length = 1，撤出条件不成立；浅层缓存是撤出前写下的，含视觉 token，深层缓存没有（VTW.py 第 330–342 行）。所以撤出后解码并不是“完全不看图”。\n【其他代码分支】mode == \"random\" 是表 2 的 Rand：在同一层随机丢同样多的 token（第 315–321 行）；--random_drop_layer 让 k 在 [8, 24] 内随机，对应 7B 与 NeXT 的 VTW†；13B 的 [12, 28] 在这个 commit 中没有对应代码。训练路径也会把 labels 中视觉 token 一段切掉（第 113–114 行），但论文只做了推理实验，训练阶段应用 VTW 列为未来工作。\n【页面设定】8 层、K = 4 的小模型是教学示意。",
          "componentId": "vtw-prefill-decode",
          "moduleId": "5.2"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "06 · KV Cache 与位置编号",
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "撤出后的 KV Cache",
          "desc": "调节 K 与已生成词数，观察每层缓存长度与总占用。",
          "componentId": "vtw-kv-cache"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "位置编号 Keep 与 Rearrange",
          "desc": "切换两种编号方式，比较浅层与深层的相对距离并对照表 6。",
          "componentId": "vtw-position-ids"
        }
      ],
      "scenes": [
        {
          "id": "kv-cache",
          "title": "撤出后每层 KV Cache 的长度",
          "goal": "泡好的茶汤留着下一口直接喝。拖动 K 和已生成的词数，看缓存省下多少。",
          "summary": "第 K+1 层起缓存不含视觉 token；回答越长，节省的比例越小",
          "interaction": "拖动撤出层 K 与已生成词数 t，观察 32 根缓存柱、总占用与反馈",
          "next": "剩下的 token 要不要重新编号",
          "notes": "【这一页讲什么】KV Cache 把每层算过的 Key 与 Value 存起来，下一步不用重算。VTW 让第 K+1 层起的缓存不含视觉 token（VTW.py 第 330–342 行：每层调用时写入本层缓存）。\n【公式口径】M_KV = 2·b·h·Σ L_ℓ，L_ℓ = s + t（ℓ ≤ K），s − V + t（ℓ > K）；fp16 b = 2，h = 4096，未用分组查询注意力。这是标准 Transformer 的计数，论文没有给出这个公式，本页按代码口径写出，属公式外推；s = 641 为本页反推。\n【不要混淆】表 4 的显存是 LLaVA-NeXT-7B 在 SQA 上的实测：单样本显存 3.1 → 2.0 G（0.65×），推理峰值 17.1 → 16.1 G（0.94×），模型权重 14.1 G 不变（AAAI 第 7 页），包含激活值等，不只是 KV Cache，不能与本页估算直接比较。论文称 FastV 需在首次前向中保存全部图像 token 的 KV Cache，所以峰值显存和原模型一样（AAAI 第 6 页 Cost Analysis）。\n【代码隐含条件】非检查点分支只切了 hidden_states 和 position_ids，没有切 attention_mask；本页推断这依赖 batch size 为 1、无填充、使用 SDPA 或 FlashAttention 时 mask 为 None（lmms-eval 封装默认 batch size 1，lmms_eval/models/llava.py 第 55 行）。这是对代码的推论，未实际运行验证。\n【类比边界】“泡好的茶汤留着喝”只提示缓存可复用；缓存大小由上式计算。",
          "componentId": "vtw-kv-cache",
          "moduleId": "6.1"
        },
        {
          "id": "position-ids",
          "title": "位置编号：Keep 与 Rearrange（表 6）",
          "goal": "客人离场后，留下的人坐原座位还是全部往前挪？切换两种编号看相对距离。",
          "summary": "Keep 让深层的相对距离与浅层一致；表 6 中两者差距只有 0.05–0.55",
          "interaction": "切换 Keep / Rearrange，观察问题词到系统 token 的距离在浅层与深层是否一致，并对照表 6",
          "next": "撤出层 K 该选多大",
          "notes": "【这一页讲什么】表 6（AAAI 第 7 页，SQA_Image / MMMU_Val / POPE）：原模型 69.61 / 35.60 / 85.83；Rearrange 69.56 / 35.90 / 85.41；Keep 69.66 / 36.30 / 85.96。论文与代码默认 Keep（VTW.py 第 15–29 行 pe_type = \"keep\"）。\n【代码】Rearrange 分支（第 322–328 行）在预填充时把 position_ids 截成连续编号，解码时把撤出层的位置编号改为该层 KV Cache 的长度。Keep 时新 token 的位置编号由 HuggingFace 按第 0 层的缓存长度生成——第 0 层带视觉 token，所以编号延续原序列。\n【页面设定】编号按 LLaVA-1.5-7B 的布局：系统 0–34、视觉 35–610、问题 611–640；“问题词 620 与系统 token 34 的距离”是本页举的例子：浅层 586，Rearrange 时深层变为 10。\n【解释与边界】“距离一致”是对 Keep 更好的一种解释（旋转位置编码给出的相对距离与浅层一致），不是论文的证明；表 6 的差距是单次运行的差值，现有材料无法判断是否超出评测波动。这里保留表格，因为教学目标是精确查数。\n【类比边界】茶杯与座位号只用来提示“保留原编号”；位置编码的作用由旋转位置编码的相对距离决定。",
          "componentId": "vtw-position-ids",
          "moduleId": "6.2"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "07 · 用 KL 校准选择 K",
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "K 的取舍",
          "desc": "拖动 K 或点三个预设，观察计算量曲线与论文实测准确率。",
          "componentId": "vtw-k-tradeoff"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "KL 准则选层",
          "desc": "调节阈值 η，观察从 K = 5 往后扫描停在哪一层。",
          "componentId": "vtw-kl-scan"
        }
      ],
      "scenes": [
        {
          "id": "k-tradeoff",
          "title": "撤出层 K 的取舍：计算量与准确率",
          "goal": "茶泡太短味淡，泡太久费燃气。拖动 K，比较计算量曲线与论文实测的准确率。",
          "summary": "K 太小准确率明显下降，K 在 KL 收敛附近时准确率与原模型相当、计算量约一半",
          "interaction": "点“过早 / 合理 / 过晚”或拖动 K，观察计算量、表 5 实测点与反馈",
          "next": "论文怎样自动选出 K",
          "notes": "【这一页讲什么】图 8（AAAI 第 7 页）：(a) 准确率随 K 变化，K 小时下降，超过某层后接近原模型；(b) KL 散度随 K 变化，K 小时大，超过某层后收敛到接近 0。消融均在 LLaVA-1.5-7B、SQA_Image 上进行。\n【数字口径】上面板计算量按 Eq. (1) 外推（s ≈ 641、V = 576）。下面板只画论文实测点：表 5 的 K = 12/13/14/15 对应准确率 69.01/69.26/69.46/69.70；原模型 69.61 来自表 2。图 8(a) 没有给出逐点数值，本页对 K < 12 只标注“明显下降”的定性结论，不编造数值；其他 K 显示“论文未报告”。两个面板量纲不同，分开绘制。\n【类比映射】泡茶时长 = 撤出前完整处理的层数 K；茶味淡 = 信息尚未迁移完；多费燃气 = 多算了不必要的层。类比边界：真实的准确率要看实测，不是茶色深浅。\n【易误解】表 2 里的 K（16、20、16）是为对齐 FastV 的 FLOPs 手动设定的，不是 KL 校准结果（AAAI 第 6 页表注）。",
          "componentId": "vtw-k-tradeoff",
          "moduleId": "7.1"
        },
        {
          "id": "kl-scan",
          "title": "KL 准则 Eq. (6)：第一个低于 η 的层",
          "goal": "厨师从早往晚试味：两杯差别小于 η 就停。调节 η，看扫描停在哪一层。",
          "summary": "从 K = 5 往后试，停在第一个 KL 低于 η 的层；η ≤ 0.003 时都选 K = 15",
          "interaction": "切换阈值 η，观察扫描从 K = 5 往后走、停下的层与表 5 的准确率",
          "next": "撤出后到底省了多少：复算论文的 TFLOPs",
          "notes": "【这一页讲什么】Eq. (6)（AAAI 第 5 页）：KL(lm_head(X_{N+1}), lm_head(𝒳_{N+1})) < η。因图 4 显示第 5 层后视觉 token 注意力很小，K 从 5 枚举到 N，选第一个满足条件的层。实验设置：小子集大小 20，阈值 η = 0.003（AAAI 第 5 页 Experimental Setting）。表 5：η = 0.006/0.005/0.004/0.003/0.002/0.001 → K = 12/13/14/15/15/15 → 准确率 69.01/69.26/69.46/69.70/69.70/69.70。\n【数字口径】KL 曲线是教学示意，按表 5 的选层结果构造（η → K 一致），不是论文给出的 KL 数值；准确率是表 5 实测。\n【论文与代码不一致】论文写 KL(·, ·) < η，没有说明方向；代码算的是 KL(P_VTW ‖ P_原模型)，并且用 ≤ η（VTW.py 第 102–107 行；lmms_eval 入口第 386–400 行）。代码按模型名设阈值：7B 0.003、13B 0.0005、NeXT 0.0001。候选层循环硬编码 35:611（第 234–265 行），只适合 LLaVA-1.5 的输入布局。KL 只比较第一个输出 token 的分布，预填充结束时就算完了。\n【完整流程】加 --findk 跑 20 个样本，每个样本对 27 个候选层各跑一遍完整前向；取第一个平均 KL ≤ η 的候选，k = 索引 + 5；再用 --use_vtw --k=… 评测（README 第 31–66 行）。arXiv 附录算法 1 给出同样流程。校准本身每个样本约 27 次前向，论文没有报告这部分时间。\n【术语】KL 散度：衡量两个概率分布差多少，0 表示相同。lm_head：把最后一层表示映射成词表上每个词的分数。阈值 η：“差多少以内算一样”的界线。\n【类比边界】“尝第一口”对应只比较第一个输出词的分布；舌头的分辨力对应 η。",
          "componentId": "vtw-kl-scan",
          "moduleId": "7.2"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "08 · 计算量、延迟与显存",
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "TFLOPs 复算",
          "desc": "选择论文配置，按 Eq. (1) 复算并与论文数字比较。",
          "componentId": "vtw-flops-check"
        }
      ],
      "scenes": [
        {
          "id": "flops-check",
          "title": "TFLOPs 复算：Eq. (1) 与论文表格",
          "goal": "账要按同一口径算。选一个论文配置，看本页能否复算出论文的计算量比例。",
          "summary": "表 3 与附录表 8 精确复算；表 2 的 VTW 差 0.1–0.2 个百分点、FastV 差 0.6–1.7，原因未知",
          "interaction": "点选 11 个论文配置之一；拖动 K 变成自定义配置（公式外推，不与论文比较）",
          "next": "理论计算量减半，速度就翻倍吗",
          "notes": "【这一页讲什么】r(K) = [K·Ω(s) + (N−K)·Ω(s−V)] / [N·Ω(s)]：前 K 层按完整长度计费，后 N−K 层按去掉视觉 token 后的长度计费。论文没有写出这个比例公式；本页由 Eq. (1) 与代码口径推出，用来核对表 2–4 与附录表 8，属公式外推。\n【口径】表 2 的 TFLOPs 用 MME 的平均输入长度计算（AAAI 第 6 页表注）。本页先用原模型 TFLOPs 反推长度：7B s ≈ 641.4，13B s ≈ 642.2；本页推断表中 TFLOPs ≈ Eq. (1) × 2（论文未说明）。FastV 按“第 2 层后剪掉一半视觉 token”计算（FastV 默认配置，VTW 论文没有写明）。LLaVA-NeXT 的视觉 token 数论文没有给出，本页用原模型与 VTW 两个数联立反推 s ≈ 2057.5、V ≈ 1990.2，所以 NeXT VTW 一行的“吻合”是构造出来的，只有 FastV 那一行算独立核对。表 3 与附录表 8 只计视觉 token 的 FLOPs：16/32 = 50%，18/28 ≈ 64%，FastV (2 + 30×0.5)/32 = 53.125%。\n【结果】表 3 的 50.00% / 53.13% 与附录表 8 的 64% / 50% 精确一致；表 2 VTW 7B 本页 54.98%，论文 55.19%；FastV 相差 0.6–1.7 个百分点，与本页复算不一致，原因未知（论文未说明平均输入长度、是否计入输出 token 等细节）。DivPrune 用自己的 TFLOP 公式与数据集报告 VTW K = 4 为 18.46%，与本页口径不可直接比较。",
          "componentId": "vtw-flops-check",
          "moduleId": "8.1"
        },
        {
          "id": "latency-memory",
          "title": "理论计算量与实测延迟、显存（表 4）",
          "goal": "茶叶少了一半，烧水的时间却照旧。点一行，看五个倍数为什么不一样。",
          "summary": "TFLOPs 0.54×、延迟 0.63×、单样本显存 0.65×、峰值显存 0.94×、权重 1.00×",
          "interaction": "点击点图中的任一指标，查看原始数值与解释",
          "next": "回到准确率：VTW 与几种对照方法的结果",
          "notes": "【这一页讲什么】表 4（AAAI 第 7 页）：LLaVA-NeXT-7B，SQA_Image，单张 RTX 3090。模型显存 14.1 / 14.1 / 14.1 G；推理峰值 17.1 / 17.1 / 16.1 G；单样本 3.1 / 3.1 / 2.0 G；TFLOPs 22.9 / 12.9 / 12.3；每样本延迟 0.52 / 0.40 / 0.33 s（原模型 / FastV / VTW）。成本分析：VTW 每个样本的显存开销减少 35%，FLOPs 约减半，每样本延迟约为原模型的 0.63×（AAAI 第 6 页）。\n【为什么不一样】没被撤掉的部分（视觉编码器、浅层、逐词解码、调度开销）不会跟着变少，所以理论比例只是速度的上限，不是实测加速。模型权重 14.1 G 占峰值显存的大头。\n【证据边界】只有一个模型、一个数据集、一块 GPU、单次测量；没有分别报告预填充与解码的延迟。官方 README 截图：scienceqa_img 2017 题，原模型 08:08（4.13 it/s），VTW K = 15 05:41（5.91 it/s）。\n【易误解】把 45% 的 FLOPs 节省说成“速度提升 45%”；把表 2（MME）与表 4（SQA）的 TFLOPs 直接比较——两者输入长度不同。\n【类比边界】“烧水时间照旧”只提示存在不随 token 数减少的固定开销，具体比例以表 4 为准。",
          "componentId": "vtw-latency-memory"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "09 · 实验结果与对照",
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "表 2 的相对变化",
          "desc": "切换模型与方法，或先猜，观察六个基准的相对变化。",
          "componentId": "vtw-table2-results"
        }
      ],
      "scenes": [
        {
          "id": "table2-results",
          "title": "表 2：VTW、FastV、Rand 与 VTW† 的对照",
          "goal": "同样只泡一半的茶，随手乱捞茶叶会怎样？切换方法，看六个基准的变化。",
          "summary": "VTW 与原模型差值很小；Rand 几乎全面崩溃，VTW† 在 MMB、POPE 明显下降",
          "interaction": "切换模型（7B/13B/NeXT）与方法（VTW/VTW†/Rand/FastV），或进入先猜模式",
          "next": "什么时候不该这样撤",
          "notes": "【这一页讲什么】表 2（AAAI 第 6 页）：三种模型 × 6 个基准（AI2D、SQA_Img、MMMU_Val、MMB_EN、POPE、MME）。表注：为公平比较，手动把 K 设为 16（13B 为 20），使 VTW 的 FLOPs 低于 FastV；TFLOPs 用 MME 的平均输入长度计算；VTW† 在随机深层撤出（7B/NeXT K ∈ [8, 24]，13B K ∈ [12, 28]）；Rand 随机丢弃与视觉 token 数量相同的输入 token（代码与 VTW 撤出在同一层，VTW.py 第 315–321 行）。\n【读法】所有条形共用 −100% 到 +10% 的刻度，数值是相对原模型的变化，由论文原值现场计算。VTW 在五个百分制基准上的差值为 −0.15 到 +0.70 个百分点，MME 为 +1.53 到 +11.02 分（满分 2800）。论文是单次运行、没有逐题结果和置信区间，这些小差值现有材料无法判断是否超出评测波动。作为量级参考，官方 README 截图中 SQA_Img（2017 题）单个模型的标准误为 ±0.0102，但它不能用来判断两个模型的差值是否显著。\n【解释与边界】论文称 VTW 超过原模型是因为避免关注噪声；FastV 在第 2 层后移除视觉 token 加剧幻觉（AAAI 第 6 页）。这些是解释：FastV 与 VTW 的撤出位置、比例、选择规则同时不同，无法单独归因于“过早”。\n【其他结果】表 3（Video-LLaVA，只计视觉 token）：FastV 53.13%、VTW 50.00%，TGIF 0.25 → 0.27，VideoMME 0.30 → 0.30。arXiv 附录表 8：Qwen2-VL-2B（K = 18，视觉 token 成本 64%）、InternVL2-4B（K = 16，50%），平均变化 +0.1% / −0.2%。arXiv 附录表 7：ReasonSeg 上 LISA + VTW 与原模型的 gIoU / cIoU 相同。\n【术语】VTW†：在随机深层撤出视觉 token 的对照组。Rand：在同一层随机丢掉与视觉 token 同样多的 token。\n【类比边界】右下角茶杯的颜色只提示“乱捞茶叶味道会变”，结果以条形数值为准。",
          "componentId": "vtw-table2-results",
          "moduleId": "9.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "10 · 适用边界与结论分级",
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "适用边界",
          "desc": "切换场景、拖动 K，观察哪些输出词需要的视觉信息已被撤走。",
          "componentId": "vtw-boundary-cases"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "结论分级",
          "desc": "把每条说法分到三个等级之一，揭晓依据。",
          "componentId": "vtw-verdict-sort"
        }
      ],
      "scenes": [
        {
          "id": "boundary-cases",
          "title": "适用边界：KL 校准只检查第一个输出词",
          "goal": "第一口茶味道对，不代表整壶都对。切换场景、拖动 K，看哪些词失败。",
          "summary": "K 太早、随机层撤出会让第一个词就出错；长回答后段与细粒度任务不在 KL 检查范围内",
          "interaction": "切换五个场景；可调场景拖动 K，随机层场景点“换一个样本”，观察红色失败格与反馈",
          "next": "细看 MME 子任务与论文承认的局限",
          "notes": "【这一页讲什么】VTW 的前提是视觉信息在前 K 层里已经迁移完毕。这个前提由第一个输出词的 KL 来检验：官方代码校准 K 时只比较第一个输出 token 的分布 D₁ = KL(p_VTW(y₁) ‖ p(y₁))（VTW.py 第 102–107 行）；第 2 个及以后的词，校准时没有检查。\n【场景出处】格子里“这个词在哪些层还需要直接读取视觉 token”是本页设定的教学示意。是非题：表 2 POPE VTW 85.96 vs 原模型 85.83（7B，K = 16）。K 太早：DivPrune（CVPR 2025）关闭 VTW 的校准，LLaVA-1.5 用 K = 4、LLaVA-1.6 用 K = 3（补充材料 §5），表 1 中 7B 的 MME 感知分 681（原模型 1506），POPE F1 25.35（85.84）——这不是 VTW 原文推荐的配置；DivPrune §4.5 对基线延迟的解释（基线的剪枝计算需在每个解码步重复）与 VTW 官方代码只在预填充撤出不符。VTW 图 8(a) 也显示 K 小时准确率下降。随机层：表 2 VTW† 7B MMB 55.61（64.09）、POPE 76.05（85.83）。长回答：论文没有测，长文本只有图 6 与附录中的定性对话示例；图 5 显示回答越长对视觉 token 的注意力越少，但这是平均注意力，不能说明后段完全不需要视觉信息。细粒度：arXiv 附录表 9 NeXT 位置 143.33 → 133.33，7B OCR 140.00 → 137.50，子任务题量小，无法区分方法效应与评测波动。\n【论文承认的局限】更复杂的任务可能需要更多层完成信息迁移，FLOPs 节省相对有限；未来可在训练阶段应用 VTW 或研究其他模态（AAAI 第 7 页 Limitations）。\n【类比边界】“第一口茶”对应第一个输出词的 KL 检查；整壶茶的味道不能由第一口推出。",
          "componentId": "vtw-boundary-cases",
          "moduleId": "10.1"
        },
        {
          "id": "mme-subtasks",
          "title": "MME 子任务与论文承认的局限",
          "goal": "茶味整体相近，单项口味有没有走样？切换模型，看 14 个子任务的分差。",
          "summary": "位置、海报、OCR 等子任务略降；7B 一行子项之和与总分相差 23.91，原因未知",
          "interaction": "切换 7B / 13B / NeXT，观察 14 个子任务的分差与子项之和核对",
          "next": "把全部结论按证据强弱分级",
          "notes": "【这一页讲什么】arXiv v3 附录表 9（只见于 arXiv 版，AAAI 正式版没有附录）：MME 14 个子任务得分。附录正文称 VTW 在位置、海报、OCR 等任务上略有下降。7B：OCR 140.00 → 137.50、海报 146.60 → 145.58，但代码推理 67.50 → 57.50、计数 155 → 160；NeXT：位置 143.33 → 133.33。\n【核对】7B VTW 一行 14 个子项相加为 1848.52，与总分 1872.43 相差 23.91；“名人”与“场景”两列都是 135.59，疑为误抄（本页核对）。13B 的 VTW 标为 K = 16，但 TFLOPs（9.10）和总分（1828.79）都与表 2 的 K = 20 一行相同，疑为标注笔误。LISA 分支代码把撤出层硬编码为 20，而附录表 7 写 LISA-7B 用 K = 16（LISA-VTW/my_modeling_llama.py 第 695–697 行）。\n【证据边界】子任务题量远小于整套基准，单次运行的涨跌无法区分方法效应与评测波动。论文局限见上一页备注。",
          "componentId": "vtw-mme-subtasks"
        },
        {
          "id": "verdict-sort",
          "title": "结论分级：已证明、有解释与仍未知",
          "goal": "给每条说法分级：有实测撑腰，只是解释，还是论文根本没测？",
          "summary": "已证明的只在论文测试条件内成立；信息迁移、attention sink 等是解释；长回答等仍未知",
          "interaction": "逐条把说法放进三个等级之一，揭晓依据；可上一条、下一条与重新分",
          "next": "",
          "notes": "【这一页讲什么】把全教程的结论按证据强弱分级。已证明（在论文测试条件内，单次运行）：表 2 的 TFLOPs 与分数；Rand 与 VTW† 的下降；表 4 的延迟与显存；代码中只在预填充撤出。有解释但未证实：信息迁移在前几层完成（表 1 只有 1 个模型、1 个基准、1 个层号）；attention sink 解释（无因果干预）；KL 是好的选层准则（只在 7B、SQA 上验证）；VTW 超过原模型是因为避免噪声。仍然未知：长回答与多轮对话后段；13B 与 NeXT 用论文 η 会选出的 K；TFLOPs 的精确统计口径（本页复算与表 2 相差 0.1–1.7 个百分点）；预填充与解码延迟各降多少；零点几分的差值是否超出评测波动。\n【复述练习】读完应能回答：① 多模态大模型推理为什么慢？（576 个视觉 token 约占输入九成，32 层每层都要计算）② 凭什么认为深层可以不要视觉 token？（图 4 深层注意力约 5% 给视觉 token；表 1 白图比无图更低）③ VTW 具体做了什么，解码时还看图吗？（前 K 层完整处理，第 K+1 层入口撤出，只在预填充做一次；解码时浅层仍可读视觉缓存）④ K 怎么选，选错会怎样？（20 个样本从 K = 5 往后试，第一个 KL < η 的层；太小掉分，太大省得少）⑤ 省了多少，哪些情况要小心？（7B 理论计算量 55.19%，NeXT 每样本延迟 0.63×；撤得太早、随机层撤出会掉分，长回答没有充分检验）。\n【资料来源】AAAI 2025 正式版 PDF（第一依据，9 页，页码 5334–5342，DOI 10.1609/aaai.v39i5.32567）；arXiv 2405.05803 v3（辅助，附录单独标注）；官方代码 github.com/lzhxmu/VTW 固定 commit b9cb1266c31f3be9b477e011f35e1c8597d36579；DivPrune（CVPR 2025）正文与补充材料（仅用于核对基线配置）；FastV（arXiv 2403.06764，核对：其中没有 VTW）。",
          "componentId": "vtw-verdict-sort",
          "moduleId": "10.2"
        }
      ]
    }
  ],
  "thumbnails": {
    "attention-layers": "./thumbnails/attention-layers.jpg",
    "boundary-cases": "./thumbnails/boundary-cases.jpg",
    "cover": "./thumbnails/cover.jpg",
    "flops-check": "./thumbnails/flops-check.jpg",
    "info-migration": "./thumbnails/info-migration.jpg",
    "k-tradeoff": "./thumbnails/k-tradeoff.jpg",
    "kl-scan": "./thumbnails/kl-scan.jpg",
    "kv-cache": "./thumbnails/kv-cache.jpg",
    "latency-memory": "./thumbnails/latency-memory.jpg",
    "mme-subtasks": "./thumbnails/mme-subtasks.jpg",
    "old-hurdles": "./thumbnails/old-hurdles.jpg",
    "position-ids": "./thumbnails/position-ids.jpg",
    "prefill-decode": "./thumbnails/prefill-decode.jpg",
    "question-pruning": "./thumbnails/question-pruning.jpg",
    "table1-ablation": "./thumbnails/table1-ablation.jpg",
    "table2-results": "./thumbnails/table2-results.jpg",
    "token-bill": "./thumbnails/token-bill.jpg",
    "verdict-sort": "./thumbnails/verdict-sort.jpg",
    "withdraw-tower": "./thumbnails/withdraw-tower.jpg"
  }
};
