import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTutorialStore } from "../state/tutorialStore";
import { useImageElement } from "../lib/hooks/useImageElement";
import StageCanvas from "../components/StageCanvas";
import ProgressBar from "../components/ProgressBar";
import GuideControls from "../components/GuideControls";
import ComparisonSlider from "../components/ComparisonSlider";
import Button from "../components/Button";
import { exportFullTutorialPdf, exportStageAsPng, renderOffscreenStage } from "../lib/render/exportUtils";
import ErrorBanner from "../components/ErrorBanner";

export default function TutorialViewer() {
  const navigate = useNavigate();
  const { edited, stages, currentStageIndex, unlockedStageIndex, goToStage, nextStage, prevStage, resetAll, type, analysis } =
    useTutorialStore();
  const referenceEl = useImageElement(edited?.dataUrl);

  const [showGuides, setShowGuides] = useState(true);
  const [guideOpacity, setGuideOpacity] = useState(1);
  const [referenceOpacity, setReferenceOpacity] = useState(0.25);
  const [showControls, setShowControls] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stage = stages[currentStageIndex];
  const isLast = currentStageIndex === stages.length - 1;
  const allDone = unlockedStageIndex === stages.length - 1;

  const compareAfterSrc = useMemo(() => {
    if (!compareOpen || !stage) return "";
    const previous = stages.slice(0, currentStageIndex);
    const canvas = renderOffscreenStage(stage, previous, null, 700);
    return canvas.toDataURL("image/png");
  }, [compareOpen, stage, stages, currentStageIndex]);

  if (!stages.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-semibold">No tutorial yet.</p>
        <p className="mt-1 text-sm text-ink/60 dark:text-white/60">Upload an image to generate one.</p>
        <Button className="mt-6" onClick={() => navigate("/create")}>
          Go to Create
        </Button>
      </div>
    );
  }

  const downloadStage = () => {
    exportStageAsPng(stage, stages.slice(0, currentStageIndex), referenceEl);
  };

  const downloadTutorial = () => exportFullTutorialPdf(stages, referenceEl);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-28">
      {analysis && (analysis.confidence < 0.4 || analysis.warnings.length > 0) && (
        <div className="mb-4 flex flex-col gap-2">
          {analysis.confidence < 0.4 && (
            <ErrorBanner
              tone="warning"
              message="Detection confidence was low for this image, so DrawForge is using a generic construction template. The stages still teach the same technique, but won't track your specific photo as closely."
            />
          )}
          {analysis.warnings.map((w, i) => (
            <ErrorBanner key={i} tone="warning" message={w} />
          ))}
        </div>
      )}

      <ProgressBar current={currentStageIndex} total={stages.length} unlocked={unlockedStageIndex} onJump={goToStage} />

      <div className="mt-5 grid gap-5 sm:grid-cols-[1.1fr_0.9fr]">
        <div>
          {compareOpen ? (
            <ComparisonSlider beforeSrc={edited!.dataUrl} afterSrc={compareAfterSrc} afterLabel={stage.isFinal ? "Final Sketch" : "Construction"} />
          ) : (
            <StageCanvas
              ref={canvasRef}
              stages={stages}
              currentIndex={currentStageIndex}
              referenceEl={referenceEl}
              referenceOpacity={referenceOpacity}
              guideOpacity={guideOpacity}
              showGuides={showGuides}
            />
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setCompareOpen((v) => !v)}>
              {compareOpen ? "✕ Close Compare" : "⇄ Compare"}
            </Button>
            <Button variant="secondary" onClick={() => setShowControls((v) => !v)}>
              🎚️ Guide Controls
            </Button>
            <Button variant="secondary" onClick={() => navigate("/practice")}>
              ✏️ Practice This Stage
            </Button>
          </div>
          {showControls && (
            <div className="mt-3">
              <GuideControls
                showGuides={showGuides}
                onToggleGuides={setShowGuides}
                guideOpacity={guideOpacity}
                onGuideOpacity={setGuideOpacity}
                referenceOpacity={referenceOpacity}
                onReferenceOpacity={setReferenceOpacity}
                onReset={() => {
                  setShowGuides(true);
                  setGuideOpacity(1);
                  setReferenceOpacity(0.25);
                }}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
            <span className="text-xs font-bold uppercase tracking-wide text-accent">Stage {stage.number}</span>
            <h1 className="font-display mt-0.5 text-xl font-semibold">{stage.title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink/75 dark:text-white/75">{stage.instruction}</p>

            <div className="mt-4 flex flex-col gap-2">
              <div className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
                <strong className="font-semibold">Draw this: </strong>
                {stage.doThis}
              </div>
              <div className="rounded-xl bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                <strong className="font-semibold">Don't worry about: </strong>
                {stage.dontWorry}
              </div>
            </div>
          </div>

          <Button variant="secondary" onClick={downloadStage}>
            ⬇️ Download This Stage (PNG)
          </Button>
        </div>
      </div>

      {allDone && isLast && (
        <FinalResult referenceSrc={edited!.dataUrl} onDownloadTutorial={downloadTutorial} onStartAgain={() => { resetAll(); navigate("/create"); }} type={type} />
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-black/10 bg-paper/95 p-4 backdrop-blur dark:border-white/10 dark:bg-ink/95">
        <Button variant="secondary" className="flex-1" onClick={prevStage} disabled={currentStageIndex === 0}>
          ← Previous
        </Button>
        <Button className="flex-1" onClick={nextStage} disabled={isLast}>
          {isLast ? "Final Stage" : "Next →"}
        </Button>
      </div>
    </div>
  );
}

function FinalResult({
  referenceSrc,
  onDownloadTutorial,
  onStartAgain,
  type,
}: {
  referenceSrc: string;
  onDownloadTutorial: () => void;
  onStartAgain: () => void;
  type: string;
}) {
  const navigate = useNavigate();
  return (
    <div className="mt-10 rounded-3xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/5">
      <h2 className="font-display text-xl font-semibold">🎉 Tutorial Complete</h2>
      <p className="mt-1 text-sm text-ink/60 dark:text-white/60">
        You've worked through the full {type.replace("-", " ")} construction. Here's your reference next to the final
        clean sketch.
      </p>
      <div className="mt-4 overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
        <img src={referenceSrc} alt="Reference" className="max-h-72 w-full object-contain bg-black/5" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Button variant="secondary" onClick={onStartAgain}>🔁 Start Again</Button>
        <Button variant="secondary" onClick={() => navigate("/practice")}>✏️ Practice Again</Button>
        <Button onClick={onDownloadTutorial}>⬇️ Download Full Tutorial (PDF)</Button>
      </div>
    </div>
  );
}
