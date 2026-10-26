// v9 长滚动版的章节表：标题与模块顺序沿用原版十章；模块标题、说明与“出处与口径”取自
// 组装好的 tutorial.ts（v8 章节数据），各章导语 / 公式 / 要点取自 dp-intro.tsx 的 CH，
// 测绘队情节取自 dp-survey.tsx 的 SCENES，“深入阅读”取自原版 v7 的 deepDives（deep.json）。
import { tutorial } from '../data/tutorial';
import type { ModuleDef } from '../types';
import deepJson from './deep.json';

export interface V9Module {
  id: string;
  title: string;
  desc: string;
  componentId: string;
  /** 讲稿里的出处、口径与颜色说明，长滚动版折叠在模块下方 */
  notes: string;
  /** 宽画布模块（整宽一张图）不需要再按左右两栏排 */
}

export interface V9Chapter {
  id: string;
  num: number;
  key: string;
  title: string;
  badge: string;
  /** 测绘队情节名与类比边界 */
  analogy: string;
  boundary: string;
  /** 情节的呈现方式：scene = 单独的可操作画面；merged = 类比直接画进某个模块（只留文字卡并指向它）；brief = 只留一句文字 */
  analogyMode: 'scene' | 'merged' | 'brief';
  mergedInto?: string;
  modules: V9Module[];
  deep: string[];
}

interface Meta { title: string; badge: string; analogy: string; boundary: string; analogyMode?: 'scene' | 'merged' | 'brief'; mergedInto?: string }

const META: Record<string, Meta> = {
  '01': { title: '一张图 = 576 个 token', badge: '问题背景', analogy: '地图切成格，每一格都要勘测', boundary: '类比比的是工作量（计算量），不是用时；用时与实测速度见 §9。' },
  '02': { title: '按“重要性”挑 token，为什么会扎堆', badge: '研究动机', analogy: '手电只照亮一处，按亮度插旗', boundary: '亮度 = 示意分数；FastV 的真实分数来自第 K 层注意力，不一定集中在一处。' },
  '03': { title: '理想目标算不动，于是换一个', badge: '问题定义', analogy: '布点方案计数器永远转不完', boundary: '方案数是组合事实；“需要多少时间”只是量级示意。' },
  '04': { title: 'Max-Min：让最近的一对尽量远', badge: '目标函数', analogy: '罗盘只读夹角，卷尺量直线', boundary: '二维示意；真实特征为 4096 维，但“只看方向”的性质与维度无关。', analogyMode: 'merged', mergedInto: '4.1' },
  '05': { title: 'Algorithm 1：一次挑一个', badge: '算法', analogy: '每一针都落在最大的空白处', boundary: '二维欧氏示意；真实算法在 4096 维特征空间里量余弦距离。', analogyMode: 'brief' },
  '06': { title: '从伪代码到 LLaVA：逐行对照', badge: '代码实现', analogy: '把测绘图压在实地上逐项核对', boundary: '“缺失”指公开仓库里找不到对应实现，不代表作者没有做过。' },
  '07': { title: '在哪一层剪：Table 3 藏着第二个变量', badge: '消融 · 层位置', analogy: '补给固定，越晚精简装备旗越少', boundary: '旗数 56 / 39 / 21 / 2 为本页按 Eq. (5) 反推，论文没有报告。' },
  '08': { title: '尺子不重要，规则才重要', badge: '消融 · 策略', analogy: '三种测距工具量同一组旗', boundary: '7 面旗的坐标是示意数据（经搜索使三种工具结果不同）；Table 4 的分数才是论文实测。' },
  '09': { title: '理论算力 ≠ 实际速度', badge: '效率', analogy: '背包轻了 86%，全程只快两成多', boundary: '只有原模型与 DivPrune 两个端点是 Table 2 实测；9.2 的斜纹示意车道是两者之间的线性插值，不是实测。', analogyMode: 'merged', mergedInto: '9.2' },
  '10': { title: '结果很亮眼，先对口径再下结论', badge: '实验结果', analogy: '两支测绘队的成绩单，先核对补给', boundary: '补给比例由公式实时计算；“谁更好”仍以 Table 1 为准。' },
};

const deep = (deepJson as { chapters: Record<string, { deep: string[] }> }).chapters;

/** tutorial.ts 里 chap-2 … chap-11 对应原版第 01–10 章 */
// 显式列出顺序：'10' 是整数形式的键，Object.keys 会把它排到 '01' 前面
const KEYS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];
export const CHAPTERS: V9Chapter[] = KEYS.map((key, i) => {
  const src = tutorial.chapters[i + 1];
  const modules = src.modules.map((m: ModuleDef) => {
    const scene = src.scenes.find((s) => s.moduleId === m.id);
    return { id: m.id, title: m.title, desc: m.desc, componentId: m.componentId, notes: scene?.notes ?? '' };
  });
  return {
    id: `chap-${i + 1}`,
    num: i + 1,
    key,
    ...META[key],
    analogyMode: META[key].analogyMode ?? 'scene',
    modules,
    deep: deep[`chap-${i + 1}`]?.deep ?? [],
  };
});

/** 导读里的四个数字（补全了实验条件） */
export const STATS = [
  { value: '56 / 576', label: 'LLaVA 1.5 每张图保留的视觉 token', tag: 'code' as const },
  { value: '15.63%', label: 'TFLOP 比例（LLaVA 1.5-7B，Table 1）', tag: 'paper' as const },
  { value: '0', label: '额外训练与校准：即插即用', tag: 'paper' as const },
  { value: '2.05×', label: '预填充提速（Table 2，视频 7B 模型）', tag: 'paper' as const },
];

export const ROUTES = [
  { title: '先懂原理', path: '§2 → §3 → §4 → §5', to: 2 },
  { title: '复现代码与算力', path: '§6 → §9', to: 6 },
  { title: '检查证据与边界', path: '§7 → §10 → 结论分级', to: 7 },
];

/** B 站推荐：BV 号、标题、UP 主与时长均在视频页核对过（2026-10-25）。
 *  cover 为视频页给出的封面地址（只记录了其中 3 个）；其余运行时尝试获取，拿不到时显示渐变底。 */
export const VIDEOS = [
  { bvid: 'BV12PznYuExg', title: 'LLaVA 多模态模型：LLaVA / LLaVA-1.5 / LLaVA-NeXT', up: 'RethinkFun', len: '15 分钟', why: '§1 背景：576 个视觉 token 从哪来', cover: 'https://i2.hdslb.com/bfs/archive/45255bbb4642d49acd87636b079bcbebfdc16f16.jpg' },
  { bvid: 'BV1nw4m1S7nZ', title: '多模态大模型 LLaVA 模型讲解——transformers 源码解读', up: '良睦路程序员', len: '40 分钟', why: '§6 对照：文本与图像嵌入在哪里拼接', cover: 'https://i2.hdslb.com/bfs/archive/4ccbe52f532d4e849f4ede22b8ce213c2db71a0f.jpg' },
  { bvid: 'BV1Kuua6fEf3', title: '多模态大模型又慢又贵？视觉 Token 压缩 ToMe / FastV 两招讲透', up: '古希腊掌管代码的神', len: '4 分钟', why: '§2 对手：按注意力打分的 FastV（视频说注意力随 token 数平方增长，这个长度下其实接近线性，见 §1）', cover: 'https://i0.hdslb.com/bfs/archive/d3567699049ca786d3c771752056d1942958410a.png' },
  { bvid: 'BV1cNzUYGEYK', title: 'token 剪枝串讲（ToMe、Zero-TPrune、FastV 等）', up: '取名字怎么这么麻烦呀', len: '29 分钟', why: '方法谱系：DivPrune 之前的剪枝与合并路线' },
  { bvid: 'BV1XczfYREtY', title: 'QueCC：关于 VLM 视觉 token 压缩的 scaling law', up: '以往的月', len: '23 分钟', why: '延伸：看问题再压缩，对照 DivPrune 的“不看问题”' },
  { bvid: 'BV1QZ7x6gEaQ', title: 'ECCV 2026 新作：基于先验校正的 token 剪枝', up: '图明讲算法', len: '8 分钟', why: '延伸：之后的免训练剪枝工作' },
];
