// DRAWING GUIDE RENDERER
// Pure canvas-2D drawing code. Receives normalized (0..1) geometry from the
// construction engine/step generator and paints it at whatever resolution
// the on-screen canvas happens to be - keeping this decoupled means the
// same stage data can be rendered small in a stage list or large in
// practice mode without re-computing geometry.
import type { ConstructionPrimitive, Point } from "../types";

export interface RenderOptions {
  referenceImage?: CanvasImageSource | null;
  /** natural width/height of the reference image, used to letterbox it without distortion */
  sourceAspect?: number;
  referenceOpacity: number; // 0..1
  showGuides: boolean;
  guideOpacity: number; // 0..1
  previousPrimitives?: ConstructionPrimitive[];
  newPrimitives: ConstructionPrimitive[];
  isFinal: boolean;
  background?: string;
  accentColor?: string;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

function computeBox(canvasW: number, canvasH: number, aspect: number | undefined): Box {
  const ar = aspect && aspect > 0 ? aspect : 1;
  const canvasAr = canvasW / canvasH;
  let w: number;
  let h: number;
  if (ar > canvasAr) {
    w = canvasW;
    h = canvasW / ar;
  } else {
    h = canvasH;
    w = canvasH * ar;
  }
  return { x: (canvasW - w) / 2, y: (canvasH - h) / 2, w, h };
}

function mapPoint(p: Point, box: Box) {
  return { x: box.x + p.x * box.w, y: box.y + p.y * box.h };
}

function strokePrimitive(ctx: CanvasRenderingContext2D, prim: ConstructionPrimitive, box: Box, overrideColor?: string) {
  ctx.save();
  ctx.strokeStyle = overrideColor ?? prim.color ?? "#6fb7ff";
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = prim.lineWidth ?? 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (prim.dashed) ctx.setLineDash([Math.max(4, (prim.lineWidth ?? 2) * 3), Math.max(4, (prim.lineWidth ?? 2) * 2.5)]);
  else ctx.setLineDash([]);

  switch (prim.kind) {
    case "line":
    case "path": {
      if (!prim.points || prim.points.length < 2) break;
      ctx.beginPath();
      const pts = prim.points.map((p) => mapPoint(p, box));
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      if (prim.closed) ctx.closePath();
      ctx.stroke();
      break;
    }
    case "curve": {
      if (!prim.points || prim.points.length < 2) break;
      const pts = prim.points.map((p) => mapPoint(p, box));
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2;
        const my = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      ctx.stroke();
      break;
    }
    case "circle":
    case "ellipse": {
      if (!prim.center) break;
      const c = mapPoint(prim.center, box);
      const rx = (prim.radiusX ?? 0.05) * box.w;
      const ry = (prim.radiusY ?? prim.radiusX ?? 0.05) * box.h;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, Math.max(0.5, rx), Math.max(0.5, ry), prim.rotation ?? 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "dot": {
      if (!prim.center) break;
      const c = mapPoint(prim.center, box);
      const r = Math.max(1.5, (prim.radiusX ?? 0.006) * box.w);
      ctx.beginPath();
      ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "rect": {
      if (!prim.center) break;
      const c = mapPoint(prim.center, box);
      const rw = (prim.width ?? 0.1) * box.w;
      const rh = (prim.height ?? 0.1) * box.h;
      ctx.strokeRect(c.x - rw / 2, c.y - rh / 2, rw, rh);
      break;
    }
    case "label": {
      if (!prim.center || !prim.text) break;
      const c = mapPoint(prim.center, box);
      ctx.font = "600 13px Fredoka, system-ui, sans-serif";
      ctx.fillText(prim.text, c.x, c.y);
      break;
    }
  }
  ctx.restore();
}

export function renderStageToCanvas(canvas: HTMLCanvasElement, opts: RenderOptions) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = opts.background ?? "#fffdf8";
  ctx.fillRect(0, 0, w, h);

  const box = computeBox(w, h, opts.sourceAspect);

  if (opts.referenceImage && opts.referenceOpacity > 0) {
    ctx.save();
    ctx.globalAlpha = opts.referenceOpacity;
    try {
      ctx.drawImage(opts.referenceImage, box.x, box.y, box.w, box.h);
    } catch {
      /* image not ready */
    }
    ctx.restore();
  }

  if (opts.showGuides) {
    ctx.save();
    ctx.globalAlpha = opts.isFinal ? 1 : opts.guideOpacity * 0.55;
    for (const prim of opts.previousPrimitives ?? []) {
      strokePrimitive(ctx, prim, box, opts.isFinal ? undefined : "#9aa5b1");
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = opts.isFinal ? 1 : opts.guideOpacity;
    for (const prim of opts.newPrimitives) {
      strokePrimitive(ctx, prim, box, opts.isFinal ? prim.color : (opts.accentColor ?? "#ff5d73"));
    }
    ctx.restore();
  }

  ctx.restore();
}
