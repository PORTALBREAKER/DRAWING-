import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UploadArea from "../components/UploadArea";
import CropRotateEditor from "../components/CropRotateEditor";
import StyleSelector from "../components/StyleSelector";
import TypeSelector from "../components/TypeSelector";
import ErrorBanner from "../components/ErrorBanner";
import Button from "../components/Button";
import { useTutorialStore } from "../state/tutorialStore";

export default function Create() {
  const navigate = useNavigate();
  const {
    edited,
    style,
    type,
    autoDetectedType,
    analysisStatus,
    analysis,
    status,
    errorMessage,
    setOriginal,
    setEdited,
    setStyle,
    setType,
    resetImage,
    analyzeCurrentImage,
    generateTutorial,
  } = useTutorialStore();

  const [editing, setEditing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (edited && analysisStatus === "idle") {
      analyzeCurrentImage();
    }
  }, [edited, analysisStatus, analyzeCurrentImage]);

  const handleGenerate = async () => {
    setLocalError(null);
    const ok = await generateTutorial();
    if (ok) navigate("/tutorial");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-28">
      <h1 className="font-display text-2xl font-semibold sm:text-3xl">Create Your Tutorial</h1>
      <p className="mt-1 text-sm text-ink/60 dark:text-white/60">
        Everything below runs right here in your browser.
      </p>

      {(localError || (status === "error" && errorMessage)) && (
        <div className="mt-4">
          <ErrorBanner message={localError ?? errorMessage ?? ""} />
        </div>
      )}

      {!edited && (
        <div className="mt-6">
          <UploadArea onImageReady={(img) => setOriginal(img)} onError={setLocalError} />
          <p className="mt-3 text-center text-xs text-ink/50 dark:text-white/50">
            🔒 Processed locally in your browser. Nothing is uploaded to a server.
          </p>
        </div>
      )}

      {edited && editing && (
        <div className="mt-6">
          <CropRotateEditor
            dataUrl={edited.dataUrl}
            onCancel={() => setEditing(false)}
            onDone={(result) => {
              setEdited(result);
              setEditing(false);
            }}
          />
        </div>
      )}

      {edited && !editing && (
        <div className="mt-6 flex flex-col gap-8">
          <div>
            <div className="overflow-hidden rounded-3xl border border-black/10 bg-black/5 dark:border-white/10">
              <img src={edited.dataUrl} alt="Reference preview" className="max-h-[50vh] w-full object-contain" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setEditing(true)}>✂️ Crop / Rotate</Button>
              <Button variant="secondary" onClick={resetImage}>🔄 Replace Image</Button>
            </div>
          </div>

          <section>
            <h2 className="font-display text-lg font-semibold">Choose Drawing Style</h2>
            <p className="mt-0.5 text-sm text-ink/60 dark:text-white/60">
              You can change this later and regenerate.
            </p>
            <div className="mt-3">
              <StyleSelector value={style} onChange={setStyle} />
            </div>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">Drawing Type</h2>
            <p className="mt-0.5 text-sm text-ink/60 dark:text-white/60">
              {analysisStatus === "analyzing"
                ? "Analyzing your image to suggest a type…"
                : "We auto-detect the likely type - tap to override."}
            </p>
            <div className="mt-3">
              <TypeSelector value={type} onChange={(t) => setType(t, true)} suggested={autoDetectedType} />
            </div>
          </section>

          {analysisStatus === "done" && analysis && analysis.warnings.length > 0 && (
            <div className="flex flex-col gap-2">
              {analysis.warnings.map((w, i) => (
                <ErrorBanner key={i} message={w} tone="warning" />
              ))}
            </div>
          )}

          <div className="rounded-2xl bg-guide/10 p-4 text-sm text-ink/70 dark:text-white/70">
            DrawForge will build a Loomis-style construction guide and 8-10 progressive drawing stages from this
            image - not a traced copy of the photo.
          </div>
        </div>
      )}

      {edited && !editing && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-paper/95 p-4 backdrop-blur dark:border-white/10 dark:bg-ink/95">
          <div className="mx-auto max-w-2xl">
            <Button full onClick={handleGenerate} disabled={status === "analyzing"}>
              {status === "analyzing" ? "Generating your tutorial…" : "Generate Drawing Tutorial →"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
