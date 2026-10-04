import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { Stage } from "../lib/types";
import { renderStageToCanvas } from "../lib/render/canvasRenderer";

interface Props {
  stages: Stage[];
  currentIndex: number;
  referenceEl: HTMLImageElement | null;
  referenceOpacity: number;
  guideOpacity: number;
  showGuides: boolean;
  className?: string;
  background?: string;
}

const StageCanvas = forwardRef<HTMLCanvasElement, Props>(function StageCanvas(
  { stages, currentIndex, referenceEl, referenceOpacity, guideOpacity, showGuides, className, background },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => canvasRef.current as HTMLCanvasElement);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = wrap.getBoundingClientRect();
      const size = Math.max(100, Math.min(rect.width, rect.height) || rect.width);
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;

      const sourceAspect = referenceEl ? referenceEl.naturalWidth / referenceEl.naturalHeight : 1;
      const stage = stages[currentIndex];
      if (!stage) {
        renderStageToCanvas(canvas, {
          referenceImage: referenceEl,
          sourceAspect,
          referenceOpacity: 1,
          showGuides: false,
          guideOpacity: 0,
          newPrimitives: [],
          isFinal: false,
          background,
        });
        return;
      }
      const previous = stages.slice(0, currentIndex).flatMap((s) => s.layer.newPrimitives);
      renderStageToCanvas(canvas, {
        referenceImage: referenceEl,
        sourceAspect,
        referenceOpacity,
        showGuides,
        guideOpacity,
        previousPrimitives: previous,
        newPrimitives: stage.layer.newPrimitives,
        isFinal: stage.isFinal,
        background,
      });
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [stages, currentIndex, referenceEl, referenceOpacity, guideOpacity, showGuides, background]);

  return (
    <div ref={wrapRef} className={className ?? "aspect-square w-full"}>
      <canvas ref={canvasRef} className="h-full w-full rounded-2xl" />
    </div>
  );
});

export default StageCanvas;
