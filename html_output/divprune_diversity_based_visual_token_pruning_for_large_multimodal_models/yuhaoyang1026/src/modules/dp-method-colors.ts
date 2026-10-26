// 结果类页面的方法配色：只有 DivPrune（绿）、FastV（红，旧方法）、VTW（紫，辅助对照）有语义色；
// 其他方法统一用不同深浅的灰蓝，避免和“正确 / 失败”混淆。
import { C } from './dp-kit';

const MAP: Record<string, string> = {
  原模型: '#5f6b7d',
  DivPrune: C.green,
  'DivPrune*': C.greenLight,
  FastV: C.red,
  VTW: C.purple,
  PruMerge: '#93a4bf',
  'FitPrune△': '#7d8fae',
  'M³•': '#a9b6c9',
  'PruMerge-LoRA•': '#bcc6d4',
  随机: '#9aa5b5',
};

export const methodColor = (m: string) => MAP[m] ?? '#9aa5b5';
