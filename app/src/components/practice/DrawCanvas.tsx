import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export interface DrawCanvasHandle {
  clear: () => void;
  getCanvas: () => HTMLCanvasElement | null;
}

interface Props {
  active: boolean;
  color: string;
  size: number;
  eraser: boolean;
}

function getPos(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * canvas.width,
    y: ((clientY - rect.top) / rect.height) * canvas.height,
  };
}

const DrawCanvas = forwardRef<DrawCanvasHandle, Props>(function DrawCanvas({ active, color, size, eraser }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  useImperativeHandle(ref, () => ({
    clear: () => {
      const c = canvasRef.current;
      const ctx = c?.getContext("2d");
      if (c && ctx) ctx.clearRect(0, 0, c.width, c.height);
    },
    getCanvas: () => canvasRef.current,
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = canvas?.parentElement;
    if (!canvas || !wrap) return;
    const resize = () => {
      const data = canvas.toDataURL();
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        img.src = data;
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  if (!active) {
    return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />;
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full touch-none"
      onPointerDown={(e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        drawing.current = true;
        last.current = getPos(canvas, e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx || !drawing.current || !last.current) return;
        const pos = getPos(canvas, e.clientX, e.clientY);
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        if (eraser) {
          ctx.globalCompositeOperation = "destination-out";
          ctx.lineWidth = size * 2.2;
        } else {
          ctx.globalCompositeOperation = "source-over";
          ctx.strokeStyle = color;
          ctx.lineWidth = size;
        }
        ctx.beginPath();
        ctx.moveTo(last.current.x, last.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.restore();
        last.current = pos;
      }}
      onPointerUp={() => {
        drawing.current = false;
        last.current = null;
      }}
      onPointerCancel={() => {
        drawing.current = false;
        last.current = null;
      }}
    />
  );
});

export default DrawCanvas;
