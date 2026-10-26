// 论文表格数据（论文实测，逐格转录自 CVPR 2025 正式版 / 补充材料），移植自原版 v7 的 src/data/tutorial.ts。
// 页面组件只读这些数据；展示时保留数据集、指标与单位。

export const COMMIT = '799e2d950aa01ba7860907f5a6d86061f885dca6';
export const CODE = `https://github.com/vbdi/divprune/blob/${COMMIT}/`;
export const ARCH = CODE + 'LLaVA/llava/model/llava_arch.py';
export const PAPER_PDF = 'https://openaccess.thecvf.com/content/CVPR2025/papers/Alvar_DivPrune_Diversity-based_Visual_Token_Pruning_for_Large_Multimodal_Models_CVPR_2025_paper.pdf';
export const SUPP_PDF = 'https://openaccess.thecvf.com/content/CVPR2025/supplemental/Alvar_DivPrune_Diversity-based_Visual_CVPR_2025_supplemental.pdf';

export interface ResultRow {
  method: string;
  tflop: string;
  values: (number | null)[];
  group: 'orig' | 'pnp' | 'var' | 'cal' | 'ft';
  ours?: boolean;
}
export interface ResultTable {
  id: string;
  label: string;
  where: string;
  ev: string;
  cols: string[];
  metrics: string[];
  rows: ResultRow[];
}

const IMG_COLS = ['COCO', 'Flickr', 'GQA', 'MMB', 'MME', 'MMMU', 'Nocaps', 'OKVQA', 'POPE', 'SQA', 'SEEDB'];
const IMG_METRICS = ['CIDEr', 'CIDEr', 'EM', 'Acc', 'P-score', 'Acc', 'CIDEr', 'EM', 'F1', 'EM', 'Acc'];

export const RESULT_TABLES: ResultTable[] = [
  {
    id: 'l15-7b',
    label: 'LLaVA 1.5-7B',
    where: 'Table 1 上段',
    ev: 'tab1',
    cols: IMG_COLS,
    metrics: IMG_METRICS,
    rows: [
      { method: '原模型', tflop: '3.228 (100.00)', group: 'orig', values: [1.1, 0.75, 61.96, 64.09, 1506, 36.44, 1.06, 53.39, 85.84, 69.41, 66.17] },
      { method: 'VTW', tflop: '0.603 (18.46)', group: 'pnp', values: [0.05, 0.03, 38.94, 21.31, 681, 32.6, 0.03, 18.64, 25.35, 65.29, 36.13] },
      { method: 'FastV', tflop: '0.514 (15.69)', group: 'pnp', values: [0.06, 0.03, 38.73, 20.62, 696, 32.0, 0.04, 18.32, 32.84, 65.15, 35.69] },
      { method: 'DivPrune', tflop: '0.512 (15.63)', group: 'pnp', ours: true, values: [0.96, 0.62, 56.85, 59.19, 1328, 35.89, 0.92, 46.98, 86.02, 68.27, 59.47] },
      { method: 'PruMerge', tflop: 'Variable', group: 'var', values: [0.77, 0.5, 51.3, 54.47, 1259, 35.11, 0.73, 41.74, 66.89, 68.91, 53.26] },
      { method: 'DivPrune*', tflop: 'Variable', group: 'var', ours: true, values: [0.91, 0.56, 55.25, 58.16, 1330, 35.44, 0.87, 44.38, 83.06, 67.87, 57.88] },
      { method: 'FitPrune△', tflop: '0.513 (15.65)', group: 'cal', values: [0.9, 0.56, 52.39, 57.65, 1197, 36.0, 0.86, 42.53, 60.89, 68.02, 54.84] },
      { method: 'M³•', tflop: '0.512 (15.63)', group: 'ft', values: [1.0, 0.67, 60.81, 65.81, 1391, 31.8, 0.95, 55.12, 86.33, 64.65, 64.93] },
      { method: 'PruMerge-LoRA•', tflop: 'Variable', group: 'ft', values: [0.96, 0.63, 55.96, 59.88, 1334, 34.89, 0.9, 47.99, 77.13, 68.32, 57.93] },
    ],
  },
  {
    id: 'l15-13b',
    label: 'LLaVA 1.5-13B',
    where: 'Table 1 中段',
    ev: 'tab1',
    cols: IMG_COLS,
    metrics: IMG_METRICS,
    rows: [
      { method: '原模型', tflop: '6.281 (100.00)', group: 'orig', values: [1.16, 0.8, 63.33, 68.64, 1522, 35.67, 1.09, 58.28, 85.99, 72.88, 66.82] },
      { method: 'VTW', tflop: '1.030 (16.16)', group: 'pnp', values: [0.08, 0.05, 39.71, 21.91, 622, 32.1, 0.05, 22.49, 0.4, 66.24, 38.59] },
      { method: 'FastV', tflop: '1.003 (15.73)', group: 'pnp', values: [0.38, 0.18, 44.98, 37.8, 942, 35.11, 0.33, 32.14, 30.02, 69.96, 44.95] },
      { method: 'DivPrune', tflop: '1.002 (15.71)', group: 'pnp', ours: true, values: [1.0, 0.66, 57.29, 63.4, 1407, 34.89, 0.95, 53.29, 83.43, 72.34, 62.04] },
      { method: 'PruMerge△', tflop: 'Variable', group: 'var', values: [0.8, 0.53, 52.01, 58.93, 1256, 36.56, 0.77, 49.15, 64.36, 72.53, 56.1] },
      { method: 'DivPrune*', tflop: 'Variable', group: 'var', ours: true, values: [0.94, 0.59, 56.09, 61.77, 1344, 34.89, 0.91, 50.86, 79.6, 71.34, 60.0] },
    ],
  },
  {
    id: 'l16-7b',
    label: 'LLaVA 1.6-7B',
    where: 'Table 1 下段',
    ev: 'tab1',
    cols: IMG_COLS,
    metrics: IMG_METRICS,
    rows: [
      { method: '原模型', tflop: '11.849 (100.00)', group: 'orig', values: [1.0, 0.68, 64.28, 67.01, 1520, 36.44, 0.88, 44.2, 86.38, 70.15, 70.16] },
      { method: 'VTW', tflop: '1.318 (11.23)', group: 'pnp', values: [0.06, 0.03, 38.62, 19.76, 606, 31.3, 0.03, 8.66, 7.13, 65.74, 37.48] },
      { method: 'FastV', tflop: '1.327 (11.30)', group: 'pnp', values: [0.06, 0.03, 38.79, 20.36, 619, 32.56, 0.04, 8.8, 7.78, 65.49, 37.62] },
      { method: 'DivPrune', tflop: '1.266 (10.79)', group: 'pnp', ours: true, values: [0.89, 0.61, 58.69, 63.49, 1362, 37.11, 0.76, 41.92, 82.97, 68.57, 64.11] },
      { method: 'M³•', tflop: '1.266 (10.79)', group: 'ft', values: [1.01, 0.67, 62.97, 69.16, 1490, 35.0, 0.85, 57.49, 87.44, 69.51, 68.49] },
    ],
  },
  {
    id: 'video',
    label: 'LLaVA-NeXT-Video-7B',
    where: 'Table 2 左侧',
    ev: 'tab2',
    cols: ['ActivityNet 分数', 'ActivityNet 准确率', 'SeedBench', 'VChatGPT', 'NextQA', 'EgoSchema'],
    metrics: ['GPT 分', 'Acc', 'Acc', 'GPT 分', 'WUPS', 'Acc'],
    rows: [
      { method: '原模型', tflop: '6.539 (100)', group: 'orig', values: [2.67, 48.1, 38.7, 2.16, 26.05, 41.8] },
      { method: 'VTW', tflop: '1.124 (16.97)', group: 'pnp', values: [1.61, 26.84, 29.39, 1.19, 18.66, 25.42] },
      { method: 'FastV', tflop: '0.943 (14.20)', group: 'pnp', values: [1.95, 33.91, 32.98, 1.44, 22.51, 29.14] },
      { method: 'DivPrune', tflop: '0.937 (14.10)', group: 'pnp', ours: true, values: [2.56, 45.9, 37.0, 1.92, 24.48, 39.76] },
    ],
  },
  {
    id: 'supp',
    label: '补充材料 · 3 个额外数据集',
    where: 'supp Table 1',
    ev: 'supp-tab1',
    cols: ['TextVQA', 'VizWiz', 'VQAv2'],
    metrics: ['EM', 'EM', 'EM'],
    rows: [
      { method: '原模型', tflop: '3.13 (100.00)', group: 'orig', values: [46.08, 54.24, 76.65] },
      { method: 'VTW', tflop: '0.507 (16.20)', group: 'pnp', values: [8.22, 50.13, 42.13] },
      { method: 'FastV', tflop: '0.418 (13.35)', group: 'pnp', values: [8.21, 50.48, 41.71] },
      { method: 'DivPrune', tflop: '0.416 (13.29)', group: 'pnp', ours: true, values: [35.97, 57.41, 71.55] },
      { method: 'PruMerge', tflop: 'Variable', group: 'var', values: [37.7, 56.31, 65.01] },
      { method: 'DivPrune*', tflop: 'Variable', group: 'var', ours: true, values: [35.0, 57.43, 69.59] },
      { method: 'FitPrune△', tflop: '0.417 (13.32)', group: 'cal', values: [30.1, 54.62, 64.86] },
      { method: 'M³•', tflop: '0.416 (13.29)', group: 'ft', values: [44.31, 52.98, 75.87] },
    ],
  },
];

/** Table 2 右侧：效率（LLaVA-NeXT-Video-7B，VideoChatGPT 499 个样本） */
export const EFFICIENCY = [
  { method: '原模型', ratio: 100, tflop: 6.539, mem: 14.06, prefill: 0.33, e2e: 4.37 },
  { method: 'VTW', ratio: 16.97, tflop: 1.124, mem: 13.63, prefill: 0.15, e2e: 3.43 },
  { method: 'FastV', ratio: 14.2, tflop: 0.943, mem: 13.57, prefill: 0.15, e2e: 3.63 },
  { method: 'DivPrune', ratio: 14.1, tflop: 0.937, mem: 13.51, prefill: 0.161, e2e: 3.39 },
];

/** Table 3：剪枝层位置消融（LLaVA 1.5-7B） */
export const TABLE3 = [
  { layer: 0, ratio: 19.61, mmb: 59.19, mmmu: 35.89, pope: 86.02, sqa: 68.27, avg: 62.34 },
  { layer: 1, ratio: 19.65, mmb: 59.02, mmmu: 34.89, pope: 80.67, sqa: 67.18, avg: 60.44 },
  { layer: 2, ratio: 19.7, mmb: 54.9, mmmu: 34.22, pope: 69.27, sqa: 69.56, avg: 56.99 },
  { layer: 3, ratio: 19.8, mmb: 23.97, mmmu: 32.67, pope: 31.82, sqa: 65.94, avg: 38.6 },
];

/** Table 4：距离度量与选择策略消融（LLaVA 1.5-7B，TFLOP 19.61%） */
export const TABLE4 = [
  { id: 'cos', label: '余弦（默认）', mmb: 59.19, mmmu: 35.89, pope: 86.02, sqa: 68.27, avg: 62.34 },
  { id: 'l1', label: 'ℓ1', mmb: 59.71, mmmu: 34.67, pope: 85.4, sqa: 67.97, avg: 61.94 },
  { id: 'l2', label: 'ℓ2', mmb: 59.97, mmmu: 35.0, pope: 85.64, sqa: 68.27, avg: 62.22 },
  { id: 'random', label: '随机', mmb: 52.66, mmmu: 34.56, pope: 72.78, sqa: 66.63, avg: 56.66 },
  { id: 'minmax', label: 'Min-Max', mmb: 38.57, mmmu: 33.11, pope: 49.26, sqa: 65.2, avg: 46.53 },
];

/** Fig. 1 纵轴所用四个数据集在 IMG_COLS 中的下标：COCO、OKVQA、POPE、MMB */
export const FIG1_COLS = [0, 7, 8, 3];
