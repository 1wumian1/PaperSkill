import { useSyncExternalStore } from 'react';
// 6.1 论文 ↔ 代码对照条目（移植自原版 v7 的 ch6-codemap）。代码摘录逐字取自官方仓库 commit 799e2d9，
// 页面只留最关键的 2–4 行（完整摘录与上下文见 GitHub 链接和讲者备注）。第 6 章开场情节的核对清单也读这份数据。
export type CodeStatus = 'same' | 'diff' | 'unsaid' | 'missing';
export const STATUS_LABEL: Record<CodeStatus, string> = { same: '一致', diff: '有差异', unsaid: '论文未说明', missing: '公开代码缺失' };

export interface CodeEntry {
  id: string;
  title: string;
  status: CodeStatus;
  paper: string;
  file: string;
  lines: string;
  anchor: string;
  code: string;
  note: string;
}

const ARCH = 'LLaVA/llava/model/llava_arch.py';

export const CODE_ENTRIES: CodeEntry[] = [
  {
    id: 'where', title: '在哪里剪', status: 'same',
    paper: '默认在 Layer 0 剪枝：视觉 token 进入第一层解码器之前被剪掉（§4.6）。',
    file: ARCH, lines: 'L365–L367', anchor: '#L365-L367',
    code: "if os.environ['LAYER_INDEX']=='0':\n    SYS_TOKEN_LEN = 35\n    diverse_ratio = float(os.environ['SUBSET_RATIO'])",
    note: '写在拼好 LLM 输入嵌入之后、第一层解码器之前，与论文的 Layer 0 一致。',
  },
  {
    id: 'feat', title: '用哪一层的特征', status: 'same',
    paper: '在视觉 token 集合 E_v 上计算——即投影层输出（图 2），LLaVA 1.5 中为 4096 维（§4.2）。',
    file: ARCH, lines: 'L141–L144', anchor: '#L141-L144',
    code: 'image_features = self.get_model().get_vision_tower()(images)\nimage_features = self.get_model().mm_projector(image_features)',
    note: '送入 DivPrune 的是序列中的视觉段（mm_projector 输出），不是 CLIP 原始特征。',
  },
  {
    id: 'dist', title: '距离怎么算', status: 'same',
    paper: 'Eq. (4) 余弦距离；距离矩阵“通过一次矩阵乘法”得到（§3.3）。',
    file: ARCH, lines: 'L147–L155', anchor: '#L147-L155',
    code: 'norm_matrix = matrix / matrix.norm(dim=1, keepdim=True)\ncosine_similarity = torch.mm(norm_matrix, norm_matrix.t())\ncosine_matrix = 1.0 - cosine_similarity',
    note: '先按行归一化，再做一次 M×M 矩阵乘法，最后 1 − 相似度，与 Eq. (4) 等价。',
  },
  {
    id: 'first', title: '第一个 token', status: 'same',
    paper: 'Algorithm 1 第 5–10 行：对每个候选求 i ≠ j 的最近距离，取最大者。',
    file: ARCH, lines: 'L164–L165', anchor: '#L164-L165',
    code: 'if i==0:\n    scores = torch.topk(m2, 2, dim=0, largest=False).values[1,:]',
    note: '每列取“第二小”距离：最小的是自身（0），第二小即 i ≠ j 的最近邻距离。',
  },
  {
    id: 'rest', title: '后续 token 与候选集 R', status: 'diff',
    paper: 'Algorithm 1 第 11、21 行：选中的 k “从 R 移到 Ẽv”，下一轮只比较剩余候选。',
    file: ARCH, lines: 'L161–L170', anchor: '#L161-L170',
    code: 'scores = torch.min(m2, dim=0).values\nphrase_to_add_idx = torch.argmax(scores)\ns[i] = phrase_to_add_idx',
    note: '代码不维护 R：每轮对全部 M 列算到已选行的最小距离再 argmax，靠“到自身距离为 0”避免重复。',
  },
  {
    id: 'ratio', title: '保留多少个', status: 'diff',
    paper: '补充材料 §5：剪枝率 91.2%；§4.4：视频实验用与图像“相同的剪枝比例”。',
    file: 'run_Divprune.sh', lines: 'L11（及 tflops.py L66 / L70）', anchor: '#L11',
    code: "SUBSET_RATIO=0.098            # run_Divprune.sh\n'DivPrune': {'k':0, 'r':0.098}  # tflops.py 图像\n'DivPrune': {'k':0, 'r':0.1}    # tflops.py 视频",
    note: '0.098 是保留比例：留 9.8%（剪 90.2%），即 56 个；按 91.2% 只能留 51 个，TFLOPs 也对不上。视频用 0.1。',
  },
  {
    id: 'index', title: '索引与偏移', status: 'unsaid',
    paper: '论文中 i、j 是集合元素，没有给出编号方式或在序列中的位置。',
    file: ARCH, lines: 'L366、L374、L377', anchor: '#L366-L377',
    code: 'visual_tokens = new_input_embeds[0][SYS_TOKEN_LEN:SYS_TOKEN_LEN+img_feature_len]\nselected_visual_tokens += SYS_TOKEN_LEN',
    note: '选出的是视觉段内 0 起始索引，加 35 才是序列位置——依赖默认对话模板的前缀长度。',
  },
  {
    id: 'order', title: '送入 LLM 的顺序', status: 'unsaid',
    paper: '论文只说被选 token 与文本 token 一起送入 LLM（§3.3），没有说明顺序。',
    file: ARCH, lines: 'L378–L381', anchor: '#L378-L381',
    code: 'keep_indexs = keep_indexs.sort().values\nnew_input_embeds = new_input_embeds[:, keep_indexs]',
    note: '保留位置按从小到大排序：恢复原始空间顺序，选择顺序被丢弃（见 6.2）。',
  },
  {
    id: 'kv', title: 'KV cache 与剪枝时机', status: 'same',
    paper: '与 KV cache 兼容（§1）；距离计算只在预填充阶段做一次（§4.5）。',
    file: ARCH, lines: 'L178', anchor: '#L178',
    code: 'if vision_tower is None or images is None or input_ids.shape[1] == 1:\n    return input_ids, position_ids, attention_mask, past_key_values, None, labels',
    note: '解码阶段每步只输入 1 个 token，函数直接返回；KV cache 里存的就是剪枝后的序列。',
  },
  {
    id: 'batch', title: '批大小', status: 'unsaid',
    paper: '所有实验 batch size = 1（§4.1）；方法描述没有讨论批处理。',
    file: ARCH, lines: 'L374', anchor: '#L374',
    code: 'visual_tokens = new_input_embeds[0][SYS_TOKEN_LEN:SYS_TOKEN_LEN+img_feature_len]',
    note: '只用 batch 中第 0 个样本计算选择，再套用到整个 batch——批量推理需要改写。',
  },
  {
    id: 'layer', title: '层内剪枝（Table 3）', status: 'missing',
    paper: 'Table 3 测试了在第 1–3 层之后剪枝；§3.3 说方法也可用于中间层。',
    file: ARCH, lines: 'L353–L363', anchor: '#L353-L363',
    code: "if 'LAYER_INDEX' in os.environ:\n    ...\n    setattr(self.config, 'img_feature_len', img_feature_len)",
    note: 'LAYER_INDEX ≠ 0 时只记录长度；仓库里没有层内剪枝实现，Table 3 的 Layer 1–3 无法复现。',
  },
  {
    id: 'flops', title: 'TFLOPs 公式', status: 'diff',
    paper: 'Eq. (5) 印刷为 4μd² − 2μ²d + 2μdm。',
    file: 'tflops.py', lines: 'L1–L7', anchor: '#L1-L7',
    code: 'flop = T * ((4*n*(d**2)) + (2*(n**2*d)) + (2*n*d*m))',
    note: '代码为 + 号；只有 + 号能复现 Table 1 / 2 的 TFLOPs（第 9 章复算器可切换验证）。',
  },
  {
    id: 'video', title: '视频模型与效率脚本', status: 'missing',
    paper: 'Table 2：LLaVA-NeXT-Video-7B，VideoChatGPT 499 个样本测显存与延迟（§4.5）。',
    file: 'eval_time.sh', lines: 'L8–L12', anchor: '#L8-L12',
    code: 'BASELINE=OURS LAYER_INDEX=0 SUBSET_RATIO=0.098 EVAL_TIME=TRUE \\\n  --model_args pretrained="liuhaotian/llava-v1.6-vicuna-7b"',
    note: '公开效率脚本测的是 LLaVA-1.6-7B + COCO 字幕，与 Table 2 不同；视频模型的 DivPrune 修改不在仓库中。',
  },
];

// ---- 第 6 章核对清单与 6.1 对照面板共用的“筛选 + 选中”状态 ----
// 不变式：选中的条目一定属于当前筛选结果。两处界面都只按选中 id 展示，不再各自回退到列表第一项。
// - selectCode(id)：选中一条；若当前筛选不包含它，筛选自动切回“全部”。
// - setCodeFilter(f)：切换筛选；若原选中项不在新结果里，改为选中新结果的第一项。
export type CodeFilter = 'all' | CodeStatus;
interface CodeView { filter: CodeFilter; selected: string }
let view: CodeView = { filter: 'all', selected: CODE_ENTRIES[0].id };
const listeners = new Set<() => void>();
const statusOf = (id: string) => CODE_ENTRIES.find((e) => e.id === id)?.status;
const commit = (next: CodeView) => {
  if (next.filter === view.filter && next.selected === view.selected) return;
  view = next;
  listeners.forEach((fn) => fn());
};
export function selectCode(id: string) {
  const st = statusOf(id);
  if (!st) return;
  commit({ selected: id, filter: view.filter === 'all' || view.filter === st ? view.filter : 'all' });
}
export function setCodeFilter(filter: CodeFilter) {
  const inNew = filter === 'all' || statusOf(view.selected) === filter;
  const first = CODE_ENTRIES.find((e) => filter === 'all' || e.status === filter);
  commit({ filter, selected: inNew || !first ? view.selected : first.id });
}
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export function useCodeView(): CodeView {
  return useSyncExternalStore(subscribe, () => view);
}
/** 只关心选中项的地方（第 6 章核对清单）用这个 */
export function useCodeSel(): [string, (id: string) => void] {
  return [useCodeView().selected, selectCode];
}
