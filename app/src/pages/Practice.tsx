import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTutorialStore } from "../state/tutorialStore";
import { useImageElement } from "../lib/hooks/useImageElement";
import { useZoomPan } from "../lib/hooks/useZoomPan";
import StageCanvas from "../components/StageCanvas";
import ProgressBar from "../components/ProgressBar";
import Button from "../components/Button";
import DrawCanvas, { type DrawCanvasHandle } from "../components/practice/DrawCanvas";
import { downloadCanvasAsPng } from "../lib/render/exportUtils";

const SWATCHES = ["#1a1a1a", "#ff5d73", "#6fb7ff", "#2bb673", "#ffd166"];

export default function Practice() {
  const navigate = useNavigate();
  const { edited, stages, currentStageIndex, unlockedStageIndex, goToStage, nextStage, prevStage } = useTutorialStore();
  const referenceEl = useImageElement(edited?.dataUrl);

  const [mode, setMode] = useState<"pan" | "draw">("draw");
  const [showGuides, setShowGuides] = useState(true);
  const [guideOpacity, setGuideOpacity] = useState(1);
  const [referenceOpacity, setReferenceOpacity] = useState(0.15);
  const [color, setColor] = useState(SWATCHES[0]);
  const [size, setSize] = useState(4);
  const [eraser, setEraser] = useState(false);

  const { zoom, pan, reset: resetZoom, zoomBy, handlers } = useZoomPan(mode === "pan");
  const drawRef = useRef<DrawCanvasHandle>(null);
  const guideCanvasRef = useRef<HTMLCanvasElement>(null);

  const stage = stages[currentStageIndex];

  if (!stages.length || !stage) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-semibold">No tutorial to practice yet.</p>
        <Button className="mt-6" onClick={() => navigate("/create")}>
          Go to Create
        </Button>
      </div>
    );
  }

  const transformStyle = { transform: `translate(${pan.x}px, ${pan.y}px)` };
  const scaleStyle = { transform: `scale(${zoom})` };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-32">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold sm:text-2xl">Practice Mode</h1>
        <Button variant="ghost" onClick={() => navigate("/tutorial")}>
          Back to Tutorial
        </Button>
      </div>

      <div className="mt-4">
        <ProgressBar current={currentStageIndex} total={stages.length} unlocked={unlockedStageIndex} onJump={goToStage} />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink/50 dark:text-white/50">Reference</p>
          <div
            className="relative aspect-square touch-none overflow-hidden rounded-2xl border border-black/10 bg-black/5 dark:border-white/10"
            {...handlers}
          >
            <div className="absolute inset-0" style={transformStyle}>
              <div className="h-full w-full" style={scaleStyle}>
                {referenceEl ? (
                  <img src={edited?.dataUrl} alt="Reference" className="h-full w-full object-contain" />
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink/50 dark:text-white/50">
            Stage {stage.number} Construction
          </p>
          <div
            className="relative aspect-square touch-none overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/5"
            {...handlers}
          >
            <div className="absolute inset-0" style={transformStyle}>
              <div className="relative h-full w-full" style={scaleStyle}>
                <StageCanvas
                  ref={guideCanvasRef}
                  stages={stages}
                  currentIndex={currentStageIndex}
                  referenceEl={referenceEl}
                  referenceOpacity={referenceOpacity}
                  guideOpacity={guideOpacity}
                  showGuides={showGuides}
                  className="absolute inset-0 h-full w-full"
                />
                <DrawCanvas ref={drawRef} active={mode === "draw"} color={color} size={size} eraser={eraser} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setMode("draw")}
            className={`touch-btn rounded-xl px-4 py-2 text-sm font-semibold ${mode === "draw" ? "bg-accent text-white" : "bg-black/5 dark:bg-white/10"}`}
          >
            ✏️ Draw
          </button>
          <button
            onClick={() => setMode("pan")}
            className={`touch-btn rounded-xl px-4 py-2 text-sm font-semibold ${mode === "pan" ? "bg-accent text-white" : "bg-black/5 dark:bg-white/10"}`}
          >
            ✋ Pan / Pinch-Zoom
          </button>
          <button onClick={() => zoomBy(1.25)} className="touch-btn rounded-xl bg-black/5 px-3 py-2 text-sm font-semibold dark:bg-white/10">
            ＋ Zoom
          </button>
          <button onClick={() => zoomBy(0.8)} className="touch-btn rounded-xl bg-black/5 px-3 py-2 text-sm font-semibold dark:bg-white/10">
            － Zoom
          </button>
          <button onClick={resetZoom} className="touch-btn rounded-xl bg-black/5 px-3 py-2 text-sm font-semibold dark:bg-white/10">
            ↺ Reset View
          </button>
        </div>

        {mode === "draw" && (
          <div className="flex flex-wrap items-center gap-3">
            {SWATCHES.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  setEraser(false);
                }}
                className={`h-8 w-8 touch-btn rounded-full border-2 ${color === c && !eraser ? "border-accent" : "border-transparent"}`}
                style={{ backgroundColor: c }}
                aria-label={`Pick color ${c}`}
              />
            ))}
            <button
              onClick={() => setEraser((v) => !v)}
              className={`touch-btn rounded-xl px-3 py-2 text-sm font-semibold ${eraser ? "bg-accent text-white" : "bg-black/5 dark:bg-white/10"}`}
            >
              🧹 Eraser
            </button>
            <label className="flex items-center gap-2 text-sm">
              Size
              <input type="range" min={1} max={20} value={size} onChange={(e) => setSize(Number(e.target.value))} className="accent-accent" />
            </label>
            <button
              onClick={() => drawRef.current?.clear()}
              className="touch-btn rounded-xl bg-black/5 px-3 py-2 text-sm font-semibold dark:bg-white/10"
            >
              🗑️ Clear Drawing
            </button>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Guide Opacity
            <input type="range" min={0} max={1} step={0.05} value={guideOpacity} onChange={(e) => setGuideOpacity(Number(e.target.value))} className="accent-accent" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Reference Opacity
            <input type="range" min={0} max={1} step={0.05} value={referenceOpacity} onChange={(e) => setReferenceOpacity(Number(e.target.value))} className="accent-guide" />
          </label>
        </div>
        <button
          onClick={() => setShowGuides((v) => !v)}
          className={`touch-btn self-start rounded-xl px-4 py-2 text-sm font-semibold ${showGuides ? "bg-black/5 dark:bg-white/10" : "bg-accent/20"}`}
        >
          {showGuides ? "Hide Guides" : "Show Guides"}
        </button>

        <Button
          variant="secondary"
          onClick={() => {
            if (guideCanvasRef.current && drawRef.current?.getCanvas()) {
              const out = document.createElement("canvas");
              out.width = guideCanvasRef.current.width;
              out.height = guideCanvasRef.current.height;
              const ctx = out.getContext("2d")!;
              ctx.drawImage(guideCanvasRef.current, 0, 0, out.width, out.height);
              const drawCanvas = drawRef.current.getCanvas()!;
              ctx.drawImage(drawCanvas, 0, 0, out.width, out.height);
              downloadCanvasAsPng(out, `drawforge-practice-stage-${stage.number}.png`);
            }
          }}
        >
          ⬇️ Download My Practice (PNG)
        </Button>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-black/10 bg-paper/95 p-4 backdrop-blur dark:border-white/10 dark:bg-ink/95">
        <Button variant="secondary" className="flex-1" onClick={prevStage} disabled={currentStageIndex === 0}>
          ← Previous
        </Button>
        <Button className="flex-1" onClick={nextStage} disabled={currentStageIndex === stages.length - 1}>
          Next →
        </Button>
      </div>
    </div>
  );
}
