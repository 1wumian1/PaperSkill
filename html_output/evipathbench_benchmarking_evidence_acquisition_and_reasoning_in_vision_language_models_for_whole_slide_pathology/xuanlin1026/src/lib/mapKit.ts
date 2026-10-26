// Shared scene kit for this tutorial's 地图勘察 + 放大镜 metaphor.
//
// One file owns the palette, the fonts and every drawing primitive, so all 19
// scene widgets (cover contrast, chapter analogies, interactive modules) share
// one visual grammar. Widgets keep only their own state machine and layout.
//
// Colour semantics are fixed across the whole tutorial:
//   red   #c43f52  failure / old method
//   green #228d5c  success / paper method / ground truth
//   blue  #27446e  guidance / current state
//   orange#f07e47  learner-controlled emphasis
//   purple#7c3aed  auxiliary mechanism
// Neutrals #f5f8f0 / #b8c9a7 / #76906a carry most pixels.

type Ctx = CanvasRenderingContext2D;

export const C = {
  bg: '#f5f8f0',
  paper: '#eef3e6',
  light: '#b8c9a7',
  dark: '#76906a',
  deep: '#5c7350',
  route: '#92400e',
  blue: '#27446e',
  blueSoft: '#e4ebf5',
  green: '#228d5c',
  greenSoft: '#e2f1e8',
  red: '#c43f52',
  redSoft: '#f7e4e7',
  orange: '#f07e47',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  axis: '#d7deea',
  white: '#ffffff',
};

export const FONT = '"Segoe UI","Microsoft YaHei","PingFang SC",sans-serif';
export const MONO = '"Cascadia Mono","Consolas",monospace';

/** Deterministic 0..1 sequence: scenes must be identical on every render. */
export function rand(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Pt {
  x: number;
  y: number;
}

/** 1) Quiet field. `grid` adds the fine survey grid used by map scenes. */
export function clearScene(ctx: Ctx, w: number, h: number, grid = true): void {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#fbfcf7');
  g.addColorStop(1, C.bg);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  if (!grid) return;
  ctx.strokeStyle = C.axis;
  ctx.globalAlpha = 0.32;
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/** 2) Sheet of map: base tint, contour rings, terrain patches, framing. */
export function drawMap(ctx: Ctx, rect: Rect, seed: number): { x: number; y: number; r: number }[] {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();

  ctx.fillStyle = C.paper;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  // Contour rings: concentric closed curves read as elevation on a map.
  for (let k = 0; k < 4; k++) {
    const cx = rect.x + (0.18 + 0.62 * rand(seed, k * 5 + 1)) * rect.w;
    const cy = rect.y + (0.2 + 0.6 * rand(seed, k * 5 + 2)) * rect.h;
    const base = 18 + rand(seed, k * 5 + 3) * 34;
    ctx.strokeStyle = k % 2 === 0 ? C.dark : C.light;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1;
    for (let ring = 0; ring < 3; ring++) {
      const r = base + ring * (10 + rand(seed, k * 7 + ring) * 8);
      ctx.beginPath();
      for (let a = 0; a <= 40; a++) {
        const t = (a / 40) * Math.PI * 2;
        const wobble = 1 + 0.12 * Math.sin(t * 3 + k) + 0.06 * Math.cos(t * 5 + ring);
        const px = cx + Math.cos(t) * r * wobble;
        const py = cy + Math.sin(t) * r * 0.62 * wobble;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Terrain patches.
  const blobs: { x: number; y: number; r: number }[] = [];
  for (let i = 0; i < 9; i++) {
    const bx = rect.x + 26 + rand(seed, i * 3) * (rect.w - 52);
    const by = rect.y + 22 + rand(seed, i * 3 + 1) * (rect.h - 44);
    const br = Math.min(rect.w, rect.h) * (0.07 + rand(seed, i * 3 + 2) * 0.12);
    blobs.push({ x: bx, y: by, r: br });
    ctx.fillStyle = i % 3 === 0 ? C.dark : C.light;
    ctx.globalAlpha = 0.34 - 0.08 * (i % 3);
    ctx.beginPath();
    ctx.ellipse(bx, by, br, br * 0.66, rand(seed, i * 7) * Math.PI, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Faint creases so the sheet looks folded rather than flat.
  ctx.strokeStyle = C.white;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1;
  for (let i = 1; i < 3; i++) {
    const x = rect.x + (rect.w / 3) * i;
    ctx.beginPath();
    ctx.moveTo(x, rect.y);
    ctx.lineTo(x, rect.y + rect.h);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  frame(ctx, rect, C.dark, 1.5);
  return blobs;
}

/** Plain rectangle frame (optional soft drop shadow). */
export function frame(ctx: Ctx, rect: Rect, color: string, lw = 1.5, shadow = false): void {
  ctx.save();
  if (shadow) {
    ctx.shadowColor = 'rgba(33,50,74,0.18)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

/** Dashed or solid selection box. `dash=false` gives a crisp selected region. */
export function drawBox(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  lw = 2,
  dash = true
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  if (dash) ctx.setLineDash([7, 6]);
  ctx.strokeRect(x, y, w, h);
  if (!dash) {
    // Corner ticks make a selected region readable without extra labels.
    const t = Math.min(14, w / 3, h / 3);
    ctx.lineWidth = lw + 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y + t);
    ctx.lineTo(x, y);
    ctx.lineTo(x + t, y);
    ctx.moveTo(x + w - t, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + t);
    ctx.moveTo(x + w, y + h - t);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w - t, y + h);
    ctx.moveTo(x + t, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + h - t);
    ctx.stroke();
  }
  ctx.restore();
}

/** Survey route: solid for the walked part, dashed for the abandoned part. */
export function drawRoute(ctx: Ctx, path: Pt[], dashed = false, color?: string): void {
  if (path.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color || (dashed ? C.muted : C.route);
  ctx.lineWidth = dashed ? 2 : 3.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (dashed) ctx.setLineDash([7, 6]);
  ctx.beginPath();
  path.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();
  ctx.restore();
}

/** Magnifier: glass disc, terrain detail inside, ring, handle, glass highlight. */
export function drawLoupe(
  ctx: Ctx,
  cx: number,
  cy: number,
  r: number,
  zoom: '2.5x' | '10x' | '40x',
  tone: string,
  clarity = 1
): void {
  const rings = zoom === '2.5x' ? 5 : zoom === '10x' ? 13 : 30;
  const detail = Math.max(2, Math.round(rings * (0.35 + 0.65 * clarity)));
  const alpha = 0.25 + 0.7 * clarity;
  const lw = 1 + 2.2 * (1 - clarity);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = C.white;
  ctx.globalAlpha = 0.88;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.clip();

  // Terrain inside the glass, denser at higher zoom.
  for (let i = 0; i < detail; i++) {
    const a = (i / detail) * Math.PI * 2;
    const rr = (0.12 + 0.8 * rand(31, i * 2)) * r;
    const px = cx + Math.cos(a) * rr;
    const py = cy + Math.sin(a) * rr * 0.92;
    ctx.strokeStyle = i % 3 === 0 ? C.deep : C.dark;
    ctx.globalAlpha = alpha * (0.5 + 0.5 * rand(17, i));
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(px, py, r * (0.1 + 0.16 * rand(7, i * 3)), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Glass highlight: two arcs read as a convex lens.
  ctx.strokeStyle = C.white;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = Math.max(3, r * 0.12);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.72, Math.PI * 1.05, Math.PI * 1.5);
  ctx.stroke();
  ctx.lineWidth = Math.max(2, r * 0.07);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.55, Math.PI * 1.62, Math.PI * 1.85);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();

  // Ring + handle.
  ctx.strokeStyle = tone;
  ctx.lineWidth = Math.max(3, r * 0.11);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  const hx = Math.SQRT1_2;
  ctx.strokeStyle = C.route;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(6, r * 0.22);
  ctx.beginPath();
  ctx.moveTo(cx + r * hx * 0.95, cy + r * hx * 0.95);
  ctx.lineTo(cx + r * hx * 1.5, cy + r * hx * 1.5);
  ctx.stroke();
  ctx.lineCap = 'butt';
}

/** Marker pin with a white centre dot. */
export function drawPin(ctx: Ctx, x: number, y: number, color: string, scale = 1): void {
  const head = 7 * scale;
  const tip = y;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, tip);
  ctx.quadraticCurveTo(x - head, tip - head * 1.6, x - head * 0.75, tip - head * 2.3);
  ctx.arc(x, tip - head * 2.4, head * 0.85, Math.PI * 1.2, Math.PI * -0.2);
  ctx.quadraticCurveTo(x + head, tip - head * 1.6, x, tip);
  ctx.fill();
  ctx.fillStyle = C.white;
  ctx.beginPath();
  ctx.arc(x, tip - head * 2.4, head * 0.32, 0, Math.PI * 2);
  ctx.fill();
}

/** Ground-truth target: crosshair plus ring. */
export function drawTarget(ctx: Ctx, x: number, y: number, r: number, color: string): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.moveTo(x - r * 1.7, y);
  ctx.lineTo(x - r * 0.5, y);
  ctx.moveTo(x + r * 0.5, y);
  ctx.lineTo(x + r * 1.7, y);
  ctx.moveTo(x, y - r * 1.7);
  ctx.lineTo(x, y - r * 0.5);
  ctx.moveTo(x, y + r * 0.5);
  ctx.lineTo(x, y + r * 1.7);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Red cross marking a pruned/abandoned region (shape cue, not colour alone). */
export function drawCross(ctx: Ctx, x: number, y: number, s: number, color = C.red): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - s, y - s);
  ctx.lineTo(x + s, y + s);
  ctx.moveTo(x + s, y - s);
  ctx.lineTo(x - s, y + s);
  ctx.stroke();
  ctx.restore();
}

/** Check mark (success cue independent of colour). */
export function drawCheck(ctx: Ctx, x: number, y: number, s: number, color = C.green): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - s, y);
  ctx.lineTo(x - s * 0.2, y + s * 0.8);
  ctx.lineTo(x + s, y - s * 0.7);
  ctx.stroke();
  ctx.restore();
}

/** Text label drawn on the scene. Keep to <=2 short labels per scene. */
export function drawLabel(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  opts?: { color?: string; size?: number; align?: CanvasTextAlign; bold?: boolean }
): void {
  ctx.save();
  ctx.fillStyle = opts?.color || C.text;
  ctx.font = `${opts?.bold ? '600 ' : ''}${opts?.size || 16}px ${FONT}`;
  ctx.textAlign = opts?.align || 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** Bare numeric readout, e.g. 0.086 — never prefixed with "value =". */
export function drawNumber(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  color: string,
  size = 22
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px ${MONO}`;
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** Compact legend, at most three entries. */
export function drawLegend(
  ctx: Ctx,
  items: { label: string; color: string }[],
  x: number,
  y: number,
  gap = 22
): void {
  ctx.save();
  items.slice(0, 3).forEach((it, i) => {
    const ly = y + i * gap;
    ctx.fillStyle = it.color;
    ctx.beginPath();
    ctx.roundRect(x, ly - 8, 13, 11, 3);
    ctx.fill();
    ctx.fillStyle = C.muted;
    ctx.font = `14px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(it.label, x + 20, ly + 2);
  });
  ctx.restore();
}

/** Horizontal value bar used for metrics and coverage readouts. */
export function drawValueBar(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  frac: number,
  color: string,
  track: string = C.axis
): void {
  const f = Math.max(0, Math.min(1, frac));
  ctx.save();
  ctx.fillStyle = track;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
  if (f > 0) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, Math.max(h, w * f), h, h / 2);
    ctx.fill();
  }
  ctx.restore();
}

export type CompareBar = { label: string; value: number; color: string };

/**
 * Two short horizontal bars on one shared scale, used where the learner must see
 * a gap (for example "how far the given view reaches" against "how far the
 * target is"). Values are drawn as bare numbers; no invented statistics.
 */
export function drawCompare(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  bars: CompareBar[],
  h = 12,
  gap = 20
): void {
  const max = Math.max(...bars.map((b) => b.value), 0.0001);
  bars.slice(0, 2).forEach((b, i) => {
    const by = y + i * gap;
    drawLabel(ctx, b.label, x, by + h - 1, { color: C.muted, size: 14 });
    const bx = x + 76;
    const bw = w - 76;
    drawValueBar(ctx, bx, by, bw, h, b.value / max, b.color);
    drawNumber(ctx, b.value.toFixed(1), bx + bw + 8, by + h - 1, b.color, 15);
  });
}

/** Vertical gauge used for coverage / hit-rate readouts. */
export function drawGauge(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  frac: number,
  color: string
): void {
  const f = Math.max(0, Math.min(1, frac));
  ctx.save();
  ctx.fillStyle = C.white;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (f > 0) {
    const fh = Math.max(6, h * f);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x + 3, y + h - fh - 3, w - 6, fh, 6);
    ctx.fill();
  }
  ctx.restore();
}

/** Darken (or clear) a region: the visible cost of pruning. */
export function dimRect(ctx: Ctx, rect: Rect, alpha = 0.55, color = C.text): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

/** Soft contact shadow under a framed object (loupe, card, sheet). */
export function dropShadow(ctx: Ctx, rect: Rect, blur = 10, alpha = 0.16): void {
  ctx.save();
  ctx.fillStyle = `rgba(33,50,74,${alpha})`;
  ctx.filter = `blur(${blur}px)`;
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y + 4, rect.w, rect.h, 10);
  ctx.fill();
  ctx.restore();
}

export type TileState = 'base' | 'kept' | 'kept-positive' | 'dropped' | 'positive' | 'current';

export interface TileGridSpec {
  rect: Rect;
  cols: number;
  rows: number;
  /** index -> state; indices are row-major from the top-left tile. */
  states: Record<number, TileState>;
  gap?: number;
  seed?: number;
}

/**
 * Grid of candidate tiles, used wherever the learner decides which parts of a
 * slide to keep looking at. Each state has its own shape cue so meaning never
 * depends on colour alone:
 *   base     flat neutral tile
 *   positive ground-truth tile (green, thicker border)
 *   kept     retained by the learner/model (orange fill, check mark)
 *   kept-positive  retained AND ground truth (orange fill + green border + check)
 *   current  the tile under inspection (blue, thick border)
 *   dropped  pruned (dimmed + red cross)
 */
export function drawTileGrid(ctx: Ctx, spec: TileGridSpec): Rect[] {
  const { rect, cols, rows, states, gap = 6, seed = 20261012 } = spec;
  const tw = (rect.w - gap * (cols - 1)) / cols;
  const th = (rect.h - gap * (rows - 1)) / rows;
  const out: Rect[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const t: Rect = { x: rect.x + c * (tw + gap), y: rect.y + r * (th + gap), w: tw, h: th };
      out.push(t);
      const st = states[i] || 'base';
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(t.x, t.y, t.w, t.h, 4);
      if (st === 'dropped') {
        ctx.fillStyle = 'rgba(33,50,74,0.16)';
        ctx.fill();
        ctx.strokeStyle = C.muted;
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (st === 'kept') {
        ctx.fillStyle = C.orange;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = C.route;
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (st === 'kept-positive') {
        // 既被保留、又是阳性：橙色实心 + 绿色粗边 + 对勾，三种线索同时出现。
        ctx.fillStyle = C.orange;
        ctx.globalAlpha = 0.9;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (st === 'positive') {
        ctx.fillStyle = C.greenSoft;
        ctx.fill();
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      } else if (st === 'current') {
        ctx.fillStyle = C.blueSoft;
        ctx.fill();
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 3;
        ctx.stroke();
      } else {
        ctx.fillStyle = '#e7ece0';
        ctx.fill();
        ctx.strokeStyle = C.axis;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // Faint tissue texture so a tile reads as a piece of slide, not a box.
      ctx.clip();
      ctx.strokeStyle = C.dark;
      ctx.globalAlpha = st === 'dropped' ? 0.18 : 0.3;
      ctx.lineWidth = 1;
      for (let k = 0; k < 3; k++) {
        const cx = t.x + (0.2 + 0.6 * rand(seed, i * 3 + k)) * t.w;
        const cy = t.y + (0.2 + 0.6 * rand(seed, i * 5 + k)) * t.h;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.min(t.w, t.h) * (0.1 + 0.12 * rand(seed, i + k)), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      if (st === 'dropped') drawCross(ctx, t.x + t.w / 2, t.y + t.h / 2, Math.min(t.w, t.h) * 0.22);
      if (st === 'kept' || st === 'kept-positive')
        drawCheck(ctx, t.x + t.w / 2, t.y + t.h / 2, Math.min(t.w, t.h) * 0.26, C.white);
    }
  }
  return out;
}

