import { useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { C, SceneCanvas, Feedback, Metrics, canvasPoint, drawScene, drawPaper, drawPlant, drawFrame, line, txt } from './PlantKit';

const WIDTH = 1080;
const HEIGHT = 280;
const GRID_SIZE = 208;
const GRID_Y = 48;
const GRID_X = [196, 704];
const UNIT = GRID_SIZE / 16;
const presets: { label: string; cell: [number, number] }[] = [
  { label: '左上', cell: [0, 0] },
  { label: '中心', cell: [7, 7] },
  { label: '右下', cell: [15, 15] },
];
const clampCell = (value: number) => Math.max(0, Math.min(15, value));

export function Chapter3Main() {
  const [cell, setCell] = useState<[number, number]>([7, 7]);
  const [compared, setCompared] = useState(false);
  const [row, col] = cell;
  const windowRow = Math.floor(row / 8) * 8;
  const windowCol = Math.floor(col / 8) * 8;
  const initial = row === 7 && col === 7 && !compared;
  const feedback = initial
    ? '只盯一个局部窗口，单层无法直接覆盖整幅图。'
    : compared
      ? `当前位置是第 ${row + 1} 行、第 ${col + 1} 列：窗口层可见 64 个 patch，全局层可见 256 个 patch。这里显示范围，不是真实注意力权重。`
      : `已选第 ${row + 1} 行、第 ${col + 1} 列，蓝色范围随位置落入对应的 8×8 窗口。点击“比较范围”，查看全局层。`;

  function chooseFromCanvas(event: PointerEvent<HTMLCanvasElement>) {
    const point = canvasPoint(event, WIDTH, HEIGHT);
    for (const x of GRID_X) {
      if (point.x >= x && point.x < x + GRID_SIZE && point.y >= GRID_Y && point.y < GRID_Y + GRID_SIZE) {
        setCell([Math.floor((point.y - GRID_Y) / UNIT), Math.floor((point.x - x) / UNIT)]);
        event.currentTarget.focus();
        return;
      }
    }
  }

  function moveQuery(event: KeyboardEvent<HTMLCanvasElement>) {
    const moves: Record<string, [number, number]> = {
      ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
    };
    const delta = moves[event.key];
    if (!delta) return;
    event.preventDefault();
    setCell(([r, c]) => [clampCell(r + delta[0]), clampCell(c + delta[1])]);
  }

  return <div>
    <SceneCanvas width={WIDTH} height={HEIGHT} animate={false} tabIndex={0}
      label={`窗口层与全局层的同步网格，第${row + 1}行第${col + 1}列为查询位置；可以点选网格或用方向键移动`}
      onPointerDown={chooseFromCanvas} onKeyDown={moveQuery}
      draw={(ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        drawScene(ctx, w, h);
        for (let panel = 0; panel < 2; panel++) {
          const x = GRID_X[panel];
          drawPaper(ctx, panel === 0 ? 54 : 562, 36, 464, 228);
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, GRID_Y, GRID_SIZE, GRID_SIZE);
          ctx.clip();
          drawPlant(ctx, x + GRID_SIZE / 2, GRID_Y + GRID_SIZE - 8, 1.15, 0);
          ctx.fillStyle = C.blue;
          ctx.globalAlpha = panel === 0 ? 0.18 : 0.11;
          if (panel === 0) ctx.fillRect(x + windowCol * UNIT, GRID_Y + windowRow * UNIT, 8 * UNIT, 8 * UNIT);
          else if (compared) ctx.fillRect(x, GRID_Y, GRID_SIZE, GRID_SIZE);
          ctx.restore();
          for (let i = 0; i <= 16; i++) {
            line(ctx, x + i * UNIT, GRID_Y, x + i * UNIT, GRID_Y + GRID_SIZE, C.border, 0.7);
            line(ctx, x, GRID_Y + i * UNIT, x + GRID_SIZE, GRID_Y + i * UNIT, C.border, 0.7);
          }
          if (panel === 0) drawFrame(ctx, x + windowCol * UNIT, GRID_Y + windowRow * UNIT, 8 * UNIT, 8 * UNIT, C.blue);
          else if (compared) drawFrame(ctx, x, GRID_Y, GRID_SIZE, GRID_SIZE, C.blue);
          ctx.fillStyle = C.orange;
          ctx.fillRect(x + col * UNIT + 2, GRID_Y + row * UNIT + 2, UNIT - 4, UNIT - 4);
          drawFrame(ctx, x + col * UNIT, GRID_Y + row * UNIT, UNIT, UNIT, C.support);
        }
        txt(ctx, '窗口层', 300, 26, 20, C.text, 'center');
        txt(ctx, '全局层', 808, 26, 20, C.text, 'center');
      }} />
    <div className="controls ctrl" aria-label="查询位置与范围比较">
      {presets.map(preset => <button type="button" key={preset.label}
        className={`chip ${row === preset.cell[0] && col === preset.cell[1] ? 'selected' : ''}`}
        aria-pressed={row === preset.cell[0] && col === preset.cell[1]}
        onClick={() => setCell(preset.cell)}>{preset.label}</button>)}
      <label htmlFor="ch3-row">行
        <input id="ch3-row" type="number" min={1} max={16} step={1} value={row + 1}
          style={{ width: 64 }} aria-label="查询位置的行，从1到16"
          onKeyDown={event => event.stopPropagation()}
          onChange={event => { const n = Number(event.currentTarget.value); if (Number.isFinite(n)) setCell([clampCell(Math.round(n) - 1), col]); }} />
      </label>
      <label htmlFor="ch3-col">列
        <input id="ch3-col" type="number" min={1} max={16} step={1} value={col + 1}
          style={{ width: 64 }} aria-label="查询位置的列，从1到16"
          onKeyDown={event => event.stopPropagation()}
          onChange={event => { const n = Number(event.currentTarget.value); if (Number.isFinite(n)) setCell([row, clampCell(Math.round(n) - 1)]); }} />
      </label>
      <button type="button" className="btn tiny" disabled={compared} onClick={() => setCompared(true)}>
        {compared ? '已显示对照' : '比较范围'}
      </button>
    </div>
    <Metrics items={[
      { label: '查询位置（行，列；从 1 起）', value: `(${row + 1}, ${col + 1})` },
      { label: '窗口层直接可见的 patch', value: '64 / 256' },
      { label: '全局层直接可见的 patch', value: compared ? '256 / 256' : '等待比较' },
    ]} />
    <Feedback tone="blue">{feedback}</Feedback>
  </div>;
}
