// VTW 论文专属数据与计算（自旧版 src/data/tables.ts、src/lib/flops.ts 迁入，数值未改）。
// 表格数字逐项抄自 AAAI 2025 正式版；arXiv v3 附录、DivPrune 单独标注。

export const BENCH = ['AI2D', 'SQA_Img', 'MMMU_Val', 'MMB_EN', 'POPE', 'MME'] as const;
export type Bench = (typeof BENCH)[number];

export interface T2Row {
  key: 'base' | 'fastv' | 'rand' | 'vtwr' | 'vtw';
  label: string;
  tflops: string;
  values: number[]; // 与 BENCH 顺序一致
}
export interface T2Block {
  model: string;
  id: '7b' | '13b' | 'next';
  K: number;
  rows: T2Row[];
}

/** AAAI 表 2（第 6 页 / 页码 5339） */
export const TABLE2: T2Block[] = [
  {
    model: 'LLaVA-1.5-7B',
    id: '7b',
    K: 16,
    rows: [
      { key: 'base', label: '原模型', tflops: '8.48 (100.00%)', values: [55.21, 69.61, 35.6, 64.09, 85.83, 1866.1] },
      { key: 'fastv', label: '+ FastV', tflops: '4.91 (57.90%)', values: [55.14, 68.96, 35.8, 64.26, 82.49, 1864.35] },
      { key: 'rand', label: '+ Rand (K=16)', tflops: '4.68 (55.19%)', values: [4.4, 9.07, 29.3, 0.52, 82.22, 139.42] },
      { key: 'vtwr', label: '+ VTW† (K∈[8,24])', tflops: '≈4.68 (≈55.19%)', values: [55.36, 69.21, 36.1, 55.61, 76.05, 1741.34] },
      { key: 'vtw', label: '+ VTW (K=16)', tflops: '4.68 (55.19%)', values: [55.44, 69.66, 36.3, 64.0, 85.96, 1872.43] },
    ],
  },
  {
    model: 'LLaVA-1.5-13B',
    id: '13b',
    K: 20,
    rows: [
      { key: 'base', label: '原模型', tflops: '16.50 (100.00%)', values: [59.26, 72.83, 34.9, 68.73, 86.02, 1827.26] },
      { key: 'fastv', label: '+ FastV', tflops: '9.56 (57.94%)', values: [58.87, 73.03, 34.6, 68.3, 85.15, 1855.11] },
      { key: 'rand', label: '+ Rand (K=20)', tflops: '9.10 (55.15%)', values: [2.49, 7.93, 25.8, 0.94, 83.78, 41.74] },
      { key: 'vtwr', label: '+ VTW† (K∈[12,28])', tflops: '≈9.10 (≈55.15%)', values: [58.35, 71.99, 34.2, 62.02, 75.06, 1661.36] },
      { key: 'vtw', label: '+ VTW (K=20)', tflops: '9.10 (55.15%)', values: [59.39, 72.88, 34.9, 68.81, 85.93, 1828.79] },
    ],
  },
  {
    model: 'LLaVA-NeXT-7B',
    id: 'next',
    K: 16,
    rows: [
      { key: 'base', label: '原模型', tflops: '28.73 (100.00%)', values: [65.31, 70.15, 35.3, 67.18, 86.44, 1846.33] },
      { key: 'fastv', label: '+ FastV', tflops: '15.67 (54.54%)', values: [64.86, 68.96, 35.7, 66.84, 85.98, 1786.17] },
      { key: 'rand', label: '+ Rand (K=16)', tflops: '14.80 (51.51%)', values: [0.84, 3.37, 24.3, 0.17, 80.0, 18.97] },
      { key: 'vtwr', label: '+ VTW† (K∈[8,24])', tflops: '≈14.80 (≈51.51%)', values: [64.54, 69.86, 35.4, 59.28, 75.73, 1723.65] },
      { key: 'vtw', label: '+ VTW (K=16)', tflops: '14.80 (51.51%)', values: [65.35, 70.0, 35.7, 67.18, 86.33, 1857.35] },
    ],
  },
];

/** AAAI 表 1：LLaVA-1.5-7B，MME 总分 */
export const TABLE1 = [
  { key: 'base', label: '原模型', short: '原模型', score: 1866.1 },
  { key: 'a', label: '(a) 不给图', short: '(a) 无图', score: 970.89 },
  { key: 'b', label: '(b) 第 1–16 层给“无内容”白图', short: '(b) 白图', score: 845.39 },
  { key: 'c', label: '(c) 第 1–16 层给原图', short: '(c) 原图', score: 1872.43 },
] as const;

/** AAAI 表 3：Video-LLaVA */
export const TABLE3 = [
  { label: 'Video-LLaVA', flops: '100.00%', tgif: 0.25, vmme: 0.3, avg: 0.28 },
  { label: '+ FastV', flops: '53.13%', tgif: 0.21, vmme: 0.3, avg: 0.26 },
  { label: '+ VTW (K=16)', flops: '50.00%', tgif: 0.27, vmme: 0.3, avg: 0.29 },
];

/** AAAI 表 4：LLaVA-NeXT-7B，SQA_Image，单张 RTX 3090 */
export const TABLE4 = {
  rows: [
    { key: 'model', label: '(a) 模型显存', base: 14.1, fastv: 14.1, vtw: 14.1, unit: 'G', ratio: '1.00×' },
    { key: 'peak', label: '(b) 推理峰值显存', base: 17.1, fastv: 17.1, vtw: 16.1, unit: 'G', ratio: '0.94×' },
    { key: 'sample', label: '(b)−(a) 单样本显存', base: 3.1, fastv: 3.1, vtw: 2.0, unit: 'G', ratio: '0.65×' },
    { key: 'tflops', label: 'TFLOPs', base: 22.9, fastv: 12.9, vtw: 12.3, unit: '', ratio: '0.54×' },
    { key: 'lat', label: '每样本延迟', base: 0.52, fastv: 0.4, vtw: 0.33, unit: 's', ratio: '0.63×' },
  ],
};

/** AAAI 表 5：阈值 η → 选出的 K → SQA_Image 准确率（LLaVA-1.5-7B） */
export const TABLE5 = [
  { eta: 0.006, K: 12, acc: 69.01 },
  { eta: 0.005, K: 13, acc: 69.26 },
  { eta: 0.004, K: 14, acc: 69.46 },
  { eta: 0.003, K: 15, acc: 69.7 },
  { eta: 0.002, K: 15, acc: 69.7 },
  { eta: 0.001, K: 15, acc: 69.7 },
];

/** AAAI 表 6：位置编码处理（LLaVA-1.5-7B） */
export const TABLE6 = [
  { label: 'LLaVA-1.5-7B', sqa: 69.61, mmmu: 35.6, pope: 85.83 },
  { label: 'Rearrange（重排）', sqa: 69.56, mmmu: 35.9, pope: 85.41 },
  { label: 'Keep（保留）', sqa: 69.66, mmmu: 36.3, pope: 85.96 },
];

/** arXiv v3 附录表 9：MME 14 个子任务（只在 arXiv 版） */
export const MME_SUB = ['存在', '计数', '位置', '颜色', 'OCR', '海报', '名人', '场景', '地标', '艺术品', '常识推理', '数值计算', '文本翻译', '代码推理'];
export const TABLE9: { model: string; method: string; label: string; total: number; v: number[] }[] = [
  { model: '7b', method: 'base', label: 'LLaVA-1.5-7B', total: 1866.1, v: [190, 155, 128.33, 170, 140, 146.6, 137.06, 158, 163.75, 119.5, 112.86, 70, 107.5, 67.5] },
  { model: '7b', method: 'fastv', label: '+ FastV', total: 1864.35, v: [180, 155, 133.33, 180, 137.5, 142.52, 138.82, 160, 164.5, 121.25, 116.43, 55, 112.5, 67.5] },
  { model: '7b', method: 'vtw', label: '+ VTW (K=16)', total: 1872.43, v: [190, 160, 128.33, 170, 137.5, 145.58, 135.59, 135.59, 163.75, 123.25, 121.43, 65, 115, 57.5] },
  { model: '13b', method: 'base', label: 'LLaVA-1.5-13B', total: 1827.26, v: [185, 155, 133.33, 170, 125, 160.54, 152.06, 161.25, 170.5, 118.5, 128.57, 42.5, 77.5, 47.5] },
  { model: '13b', method: 'fastv', label: '+ FastV', total: 1855.11, v: [185, 155, 133.33, 175, 132.5, 159.52, 152.82, 161.75, 168.25, 117, 126.43, 42.5, 82.5, 57.5] },
  { model: '13b', method: 'vtw', label: '+ VTW（表中标 K=16）', total: 1828.79, v: [185, 155, 131.67, 175, 125, 157.48, 153.82, 161.25, 170, 118.5, 128.57, 42.5, 77.5, 47.5] },
  { model: 'next', method: 'base', label: 'LLaVA-NeXT-7B', total: 1846.33, v: [195, 135, 143.33, 170, 132.5, 159.52, 142.94, 162.25, 155.75, 123.25, 129.29, 42.5, 100, 55] },
  { model: 'next', method: 'fastv', label: '+ FastV', total: 1786.17, v: [195, 125, 136.67, 170, 117.5, 156.46, 140.29, 162.25, 156.75, 123.75, 130, 32.5, 87.5, 52.5] },
  { model: 'next', method: 'vtw', label: '+ VTW (K=16)', total: 1857.35, v: [195, 135, 133.33, 170, 132.5, 159.52, 144.71, 163, 158.75, 126.25, 129.29, 42.5, 105, 62.5] },
];

/** arXiv v3 附录表 8：其他 MLLM（只比视觉 token 成本） */
export const TABLE8 = [
  { model: 'Qwen2-VL-2B-instruct（28 层）', K: 18, cost: '64%', bench: ['AI2D', 'SQA_Img', 'MMMU_Val', 'MMB_EN', 'POPE', 'MME'], base: [72.02, 77.69, 36.0, 71.9, 87.86, 1880.74], vtw: [71.7, 77.94, 37.0, 70.03, 87.83, 1888.43] },
  { model: 'InternVL2-4B（32 层）', K: 16, cost: '50%', bench: ['AI2D', 'SQA_Img', 'MMMU_Val', 'MMB_EN', 'POPE', 'MME'], base: [78.89, 96.33, 45.77, 77.49, 84.6, 2073.49], vtw: [79.05, 96.23, 45.22, 77.49, 84.31, 2081.02] },
];

/** 官方 README 截图（固定 commit）：LLaVA-1.5-7B，scienceqa_img，2017 题，batch size 1 */
export const README_RUN = {
  n: 2017,
  base: { acc: 0.6961, stderr: 0.0102, time: '08:08', sec: 488, itps: 4.13 },
  vtw: { acc: 0.6971, stderr: 0.0102, time: '05:41', sec: 341, itps: 5.91, K: 15 },
};

/** DivPrune（CVPR 2025）表 1 中 VTW 一行（DivPrune 自己的 TFLOP 口径与指标） */
export const DIVPRUNE_VTW = [
  { model: 'LLaVA-1.5-7B', K: 4, ratio: '18.46%', mmeP: 681, mmeOrig: 1506, pope: 25.35, popeOrig: 85.84, sqa: 65.29, sqaOrig: 69.41 },
  { model: 'LLaVA-1.5-13B', K: 4, ratio: '16.16%', mmeP: 622, mmeOrig: 1522, pope: 0.4, popeOrig: 85.99, sqa: 66.24, sqaOrig: 72.88 },
  { model: 'LLaVA-1.6-7B', K: 3, ratio: '11.23%', mmeP: 606, mmeOrig: 1520, pope: 7.13, popeOrig: 86.38, sqa: 65.74, sqaOrig: 70.15 },
];

export interface ModelSpec {
  id: string;
  label: string;
  /** 隐藏维度 h */
  h: number;
  /** 解码层数 N */
  N: number;
  note: string;
}

export const MODELS: ModelSpec[] = [
  { id: 'l15-7b', label: 'LLaVA-1.5-7B', h: 4096, N: 32, note: 'Vicuna-7B：h = 4096，32 层' },
  { id: 'l15-13b', label: 'LLaVA-1.5-13B', h: 5120, N: 40, note: 'Vicuna-13B：h = 5120，40 层' },
  { id: 'next-7b', label: 'LLaVA-NeXT-7B', h: 4096, N: 32, note: 'Vicuna-7B 底座；视觉 token 数随图片分辨率变化' },
  { id: 'vllava-7b', label: 'Video-LLaVA-7B', h: 4096, N: 32, note: '表 3 只计视觉 token 的 FLOPs' },
  { id: 'qwen2vl-2b', label: 'Qwen2-VL-2B', h: 1536, N: 28, note: 'arXiv 附录表 8：28 层，只比视觉 token 成本' },
  { id: 'internvl2-4b', label: 'InternVL2-4B', h: 3072, N: 32, note: 'arXiv 附录表 8：32 层，只比视觉 token 成本' },
];

export const modelOf = (id: string) => MODELS.find((m) => m.id === id) ?? MODELS[0];

export type Method = 'base' | 'vtw' | 'fastv';
/** code：前 K 层带视觉（官方代码 layer_idx == K 时撤出，0 起计）；eq5：前 K−1 层带视觉（Eq. (5) 字面） */
export type LayerConv = 'code' | 'eq5';
/** all：全部 token 的 Eq.(1)×2；vision：只计视觉 token（表 3、附录表 8 的口径，线性近似） */
export type Scope = 'all' | 'vision';

export interface FlopsConfig {
  model: string;
  /** 平均输入长度 s（含视觉 token） */
  s: number;
  /** 视觉 token 数 V */
  V: number;
  method: Method;
  K: number;
  /** FastV 剪掉的视觉 token 比例 R */
  R: number;
  conv: LayerConv;
  scope: Scope;
}

export const omega = (s: number, h: number) => 2 * s * s * h + 12 * s * h * h;

/** 带视觉 token 的完整层数 */
export function fullLayers(cfg: FlopsConfig): number {
  const m = modelOf(cfg.model);
  if (cfg.method === 'base') return m.N;
  if (cfg.method === 'fastv') return Math.min(m.N, cfg.K);
  const k = cfg.conv === 'code' ? cfg.K : cfg.K - 1;
  return Math.max(0, Math.min(m.N, k));
}

export interface FlopsResult {
  /** 方法的 TFLOPs（scope = vision 时为 null） */
  tflops: number | null;
  /** 原模型的 TFLOPs（scope = vision 时为 null） */
  baseTflops: number | null;
  /** 比例（%） */
  ratio: number;
  full: number;
}

export function computeFlops(cfg: FlopsConfig): FlopsResult {
  const m = modelOf(cfg.model);
  const full = fullLayers(cfg);
  const V = Math.max(0, Math.min(cfg.V, cfg.s));
  if (cfg.scope === 'vision') {
    // 只计视觉 token：每层成本 ∝ 该层视觉 token 数
    let kept = 0;
    if (cfg.method === 'base') kept = m.N;
    else if (cfg.method === 'vtw') kept = full;
    else kept = full + (m.N - full) * (1 - cfg.R);
    return { tflops: null, baseTflops: null, ratio: (100 * kept) / m.N, full };
  }
  const base = 2 * m.N * omega(cfg.s, m.h);
  let tot = base;
  if (cfg.method === 'vtw') tot = 2 * (full * omega(cfg.s, m.h) + (m.N - full) * omega(cfg.s - V, m.h));
  if (cfg.method === 'fastv') tot = 2 * (full * omega(cfg.s, m.h) + (m.N - full) * omega(cfg.s - V * cfg.R, m.h));
  return { tflops: tot / 1e12, baseTflops: base / 1e12, ratio: (100 * tot) / base, full };
}

export type CheckKind = 'match' | 'mismatch' | 'anchor' | 'other' | 'none';

export interface Preset {
  id: string;
  label: string;
  where: string;
  cfg: FlopsConfig;
  /** 论文报告的 TFLOPs 与比例 */
  paperTf?: number;
  paperRatio?: number;
  /** 这一行是否被用来反推 s / V（反推锚点，不能算独立核对） */
  anchor?: string;
  /** 口径与 VTW 原文不同，只做外推、不做核对 */
  foreign?: string;
}

// 反推值（公式外推）：
// LLaVA-1.5-7B：2·32·Ω(s) = 8.48e12 → s ≈ 641.4；LLaVA-1.5-13B：2·40·Ω(s) = 16.50e12 → s ≈ 642.2；
// LLaVA-NeXT-7B（表 2，MME）：28.73 与 14.80 两个数联立 → s ≈ 2057.5，V ≈ 1990.2；
// LLaVA-NeXT-7B（表 4，SQA）：22.9 与 12.3 联立 → s ≈ 1664.5，V ≈ 1533.3。
export const PRESETS: Preset[] = [
  {
    id: 't2-7b-vtw',
    label: '表 2 · 7B · VTW K=16',
    where: 'AAAI 表 2',
    cfg: { model: 'l15-7b', s: 641.4, V: 576, method: 'vtw', K: 16, R: 0.5, conv: 'code', scope: 'all' },
    paperTf: 4.68,
    paperRatio: 55.19,
    anchor: 's = 641.4 由同表原模型 8.48 TFLOPs 反推；本行比例是独立核对',
  },
  {
    id: 't2-7b-fastv',
    label: '表 2 · 7B · FastV',
    where: 'AAAI 表 2',
    cfg: { model: 'l15-7b', s: 641.4, V: 576, method: 'fastv', K: 2, R: 0.5, conv: 'code', scope: 'all' },
    paperTf: 4.91,
    paperRatio: 57.9,
  },
  {
    id: 't2-13b-vtw',
    label: '表 2 · 13B · VTW K=20',
    where: 'AAAI 表 2',
    cfg: { model: 'l15-13b', s: 642.2, V: 576, method: 'vtw', K: 20, R: 0.5, conv: 'code', scope: 'all' },
    paperTf: 9.1,
    paperRatio: 55.15,
    anchor: 's = 642.2 由同表原模型 16.50 TFLOPs 反推；本行比例是独立核对',
  },
  {
    id: 't2-13b-fastv',
    label: '表 2 · 13B · FastV',
    where: 'AAAI 表 2',
    cfg: { model: 'l15-13b', s: 642.2, V: 576, method: 'fastv', K: 2, R: 0.5, conv: 'code', scope: 'all' },
    paperTf: 9.56,
    paperRatio: 57.94,
  },
  {
    id: 't2-next-vtw',
    label: '表 2 · NeXT · VTW K=16',
    where: 'AAAI 表 2',
    cfg: { model: 'next-7b', s: 2057.5, V: 1990.2, method: 'vtw', K: 16, R: 0.5, conv: 'code', scope: 'all' },
    paperTf: 14.8,
    paperRatio: 51.51,
    anchor: 's、V 都由本行与原模型 28.73 联立反推，因此本行“吻合”是构造出来的，不算核对',
  },
  {
    id: 't2-next-fastv',
    label: '表 2 · NeXT · FastV',
    where: 'AAAI 表 2',
    cfg: { model: 'next-7b', s: 2057.5, V: 1990.2, method: 'fastv', K: 2, R: 0.5, conv: 'code', scope: 'all' },
    paperTf: 15.67,
    paperRatio: 54.54,
  },
  {
    id: 't4-next-vtw',
    label: '表 4 · NeXT · SQA · VTW',
    where: 'AAAI 表 4',
    cfg: { model: 'next-7b', s: 1664.5, V: 1533.3, method: 'vtw', K: 16, R: 0.5, conv: 'code', scope: 'all' },
    paperTf: 12.3,
    paperRatio: 53.71,
    anchor: 's、V 由本行（12.3）与原模型（22.9）联立反推，不算核对；论文写作 0.54×',
  },
  {
    id: 't4-next-fastv',
    label: '表 4 · NeXT · SQA · FastV',
    where: 'AAAI 表 4',
    cfg: { model: 'next-7b', s: 1664.5, V: 1533.3, method: 'fastv', K: 2, R: 0.5, conv: 'code', scope: 'all' },
    paperTf: 12.9,
    paperRatio: 56.33,
  },
  {
    id: 't3-video-vtw',
    label: '表 3 · 视频 · VTW K=16',
    where: 'AAAI 表 3（只计视觉 token）',
    cfg: { model: 'vllava-7b', s: 2048, V: 2048, method: 'vtw', K: 16, R: 0.5, conv: 'code', scope: 'vision' },
    paperRatio: 50.0,
  },
  {
    id: 't3-video-fastv',
    label: '表 3 · 视频 · FastV',
    where: 'AAAI 表 3（只计视觉 token）',
    cfg: { model: 'vllava-7b', s: 2048, V: 2048, method: 'fastv', K: 2, R: 0.5, conv: 'code', scope: 'vision' },
    paperRatio: 53.13,
  },
  {
    id: 'ax8-qwen',
    label: '附录表 8 · Qwen2-VL-2B K=18',
    where: 'arXiv v3 附录表 8',
    cfg: { model: 'qwen2vl-2b', s: 1000, V: 1000, method: 'vtw', K: 18, R: 0.5, conv: 'code', scope: 'vision' },
    paperRatio: 64,
  },
  {
    id: 'ax8-intern',
    label: '附录表 8 · InternVL2-4B K=16',
    where: 'arXiv v3 附录表 8',
    cfg: { model: 'internvl2-4b', s: 1000, V: 1000, method: 'vtw', K: 16, R: 0.5, conv: 'code', scope: 'vision' },
    paperRatio: 50,
  },
  {
    id: 'dp-vtw-7b',
    label: 'DivPrune 里的 VTW · 7B K=4',
    where: 'DivPrune（CVPR 2025）表 1 + 补充材料 §5',
    cfg: { model: 'l15-7b', s: 641.4, V: 576, method: 'vtw', K: 4, R: 0.5, conv: 'code', scope: 'all' },
    foreign: 'DivPrune 用自己的 TFLOP 公式和数据集，报告 18.46%；与本页按 VTW 口径算出的数字不可直接比较',
  },
];

export const presetOf = (id: string) => PRESETS.find((p) => p.id === id);

/** 与论文数字比较：比例差 ≤ 0.01 个百分点、TFLOPs 差 ≤ 0.005 视为一致（舍入范围内） */
export function checkAgainst(p: Preset | undefined, r: FlopsResult, cfg: FlopsConfig): { kind: CheckKind; text: string } {
  if (!p) return { kind: 'none', text: '自定义配置：论文没有报告这个配置，结果属于公式外推。' };
  const same = JSON.stringify(p.cfg) === JSON.stringify(cfg);
  if (!same) return { kind: 'none', text: '已偏离论文配置：结果属于公式外推，不与论文数字比较。' };
  if (p.foreign) return { kind: 'other', text: p.foreign };
  if (p.paperRatio === undefined) return { kind: 'none', text: '论文没有报告这一配置。' };
  const dr = r.ratio - p.paperRatio;
  const roundTol = p.paperRatio % 1 === 0 ? 0.5 : 0.01; // 论文只给到整数百分比时按整数舍入比较
  const okRatio = Math.abs(dr) <= roundTol + 1e-9;
  const okTf = p.paperTf === undefined || r.tflops === null || Math.abs(r.tflops - p.paperTf) <= 0.005 + 1e-9;
  const sign = dr >= 0 ? '+' : '−';
  if (p.anchor && /不算核对/.test(p.anchor)) {
    return { kind: 'anchor', text: `反推锚点：${p.anchor}。` };
  }
  if (okRatio && okTf) return { kind: 'match', text: `与论文一致（舍入范围内）：本页 ${r.ratio.toFixed(2)}%，论文 ${p.paperRatio}%。` };
  return {
    kind: 'mismatch',
    text: `与本页复算不一致，原因未知：本页 ${r.ratio.toFixed(2)}%，论文 ${p.paperRatio}%（差 ${sign}${Math.abs(dr).toFixed(2)} 个百分点）。`,
  };
}
