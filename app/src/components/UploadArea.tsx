import { useCallback, useRef, useState } from "react";
import { fileSizeLabel, isSupportedImage, loadImageFromDataUrl, readFileAsDataUrl, resizeToDataUrl } from "../lib/imageUtils";

interface Props {
  onImageReady: (data: { dataUrl: string; width: number; height: number }) => void;
  onError: (message: string) => void;
}

const MAX_FILE_BYTES = 30 * 1024 * 1024; // 30MB raw upload guard

export default function UploadArea({ onImageReady, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleFile = useCallback(
    async (file: File | undefined | null) => {
      if (!file) return;
      if (file.size > MAX_FILE_BYTES) {
        onError(`That image is ${fileSizeLabel(file.size)} - try something under 30 MB.`);
        return;
      }
      if (!isSupportedImage(file)) {
        onError("Unsupported file type. Please use JPG, JPEG, PNG, or WEBP.");
        return;
      }
      setBusy(true);
      try {
        const raw = await readFileAsDataUrl(file);
        const img = await loadImageFromDataUrl(raw);
        if (img.naturalWidth < 80 || img.naturalHeight < 80) {
          onError("That image is too small to analyze. Try a larger photo.");
          return;
        }
        const { dataUrl, width, height } = resizeToDataUrl(img);
        onImageReady({ dataUrl, width, height });
      } catch {
        onError("That file looks corrupted or isn't a readable image. Try a different photo.");
      } finally {
        setBusy(false);
      }
    },
    [onImageReady, onError],
  );

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex min-h-[260px] cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragOver
            ? "border-accent bg-accent/5"
            : "border-black/15 bg-white hover:border-accent/50 dark:border-white/15 dark:bg-white/5"
        }`}
      >
        <div className="text-5xl">{busy ? "⏳" : "🖼️"}</div>
        <p className="font-display text-lg font-semibold">
          {busy ? "Preparing your image…" : "Upload your reference image"}
        </p>
        <p className="max-w-xs text-sm text-ink/60 dark:text-white/60">
          Drag and drop, or tap to choose a file. JPG, JPEG, PNG and WEBP are supported.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <span className="touch-btn inline-flex items-center rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-ink">
            Choose File
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cameraRef.current?.click();
            }}
            className="touch-btn inline-flex items-center rounded-2xl border border-black/15 px-5 py-3 text-sm font-semibold dark:border-white/20"
          >
            📷 Use Camera
          </button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
