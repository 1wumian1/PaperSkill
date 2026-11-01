// 第 2 章用的“茶桌照片”：图 1 里的蛋糕、瓶子、叉子，加上本教程主题的茶杯。
// 画面被切成 COLS × ROWS 个图块，每个图块代表一组视觉 token（教学示意，真实模型是 24×24 = 576 个）。
import React from 'react';
import { C } from './vtw-kit';

export const COLS = 8;
export const ROWS = 5;
export type Obj = 'cake' | 'bottle' | 'fork';
/** 各物体覆盖的图块（列, 行） */
export const OBJ_CELLS: Record<Obj, [number, number][]> = {
  cake: [
    [1, 2], [2, 2], [3, 2],
    [1, 3], [2, 3], [3, 3],
  ],
  bottle: [
    [6, 0], [6, 1], [6, 2], [6, 3],
  ],
  fork: [
    [4, 3], [4, 4],
  ],
};
export const OBJ_NAME: Record<Obj, string> = { cake: '蛋糕', bottle: '瓶子', fork: '叉子' };
export const cellKey = (c: number, r: number) => `${c},${r}`;

export function TeaTable({ w, h }: { w: number; h: number }) {
  const cw = w / COLS;
  const ch = h / ROWS;
  const X = (c: number) => c * cw;
  const Y = (r: number) => r * ch;
  return (
    <g aria-hidden="true">
      <rect x={0} y={0} width={w} height={h * 0.42} fill="#f1ebdf" />
      <rect x={0} y={h * 0.42} width={w} height={h * 0.58} fill="#d9c3a0" />
      <rect x={0} y={h * 0.42} width={w} height={8} fill={C.support} opacity={0.35} />
      {/* 窗 */}
      <rect x={X(0.4)} y={Y(0.3)} width={cw * 2.6} height={ch * 1.3} rx={8} fill="#e3edf6" stroke="#c9b48f" strokeWidth={6} />
      {/* 盘子与蛋糕 */}
      <ellipse cx={X(2.5)} cy={Y(3.75)} rx={cw * 2.1} ry={ch * 0.55} fill="#fffdf8" stroke="#c9b48f" strokeWidth={4} />
      <path d={`M${X(1.25)} ${Y(3.55)} L${X(1.25)} ${Y(2.45)} L${X(3.75)} ${Y(2.45)} L${X(3.75)} ${Y(3.55)} Z`} fill="#f6d9b4" stroke="#b9875a" strokeWidth={4} />
      <rect x={X(1.25)} y={Y(2.45)} width={cw * 2.5} height={ch * 0.32} fill="#f4f0ea" stroke="#b9875a" strokeWidth={4} />
      <rect x={X(1.25)} y={Y(3.0)} width={cw * 2.5} height={ch * 0.14} fill="#e7a0a0" />
      <circle cx={X(2.5)} cy={Y(2.3)} r={cw * 0.16} fill={C.red} />
      {/* 叉子 */}
      <g stroke="#8d96a3" strokeWidth={7} strokeLinecap="round">
        <line x1={X(4.5)} y1={Y(4.75)} x2={X(4.5)} y2={Y(3.55)} />
        <line x1={X(4.38)} y1={Y(3.55)} x2={X(4.38)} y2={Y(3.2)} />
        <line x1={X(4.5)} y1={Y(3.55)} x2={X(4.5)} y2={Y(3.2)} />
        <line x1={X(4.62)} y1={Y(3.55)} x2={X(4.62)} y2={Y(3.2)} />
      </g>
      {/* 瓶子 */}
      <path d={`M${X(6.38)} ${Y(0.25)} h${cw * 0.24} v${ch * 0.6} q${cw * 0.3} ${ch * 0.25} ${cw * 0.3} ${ch * 0.75} v${ch * 2.25} h-${cw * 0.84} v-${ch * 2.25} q0 -${ch * 0.5} ${cw * 0.3} -${ch * 0.75} Z`} fill="#4f9a78" stroke="#2f6a50" strokeWidth={4} />
      <rect x={X(6.12)} y={Y(2.0)} width={cw * 0.76} height={ch * 0.7} fill="#f4efe2" />
    </g>
  );
}
