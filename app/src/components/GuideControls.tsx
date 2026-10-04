interface Props {
  showGuides: boolean;
  onToggleGuides: (v: boolean) => void;
  guideOpacity: number;
  onGuideOpacity: (v: number) => void;
  referenceOpacity: number;
  onReferenceOpacity: (v: number) => void;
  onReset: () => void;
}

export default function GuideControls({
  showGuides,
  onToggleGuides,
  guideOpacity,
  onGuideOpacity,
  referenceOpacity,
  onReferenceOpacity,
  onReset,
}: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Show Construction Guides</span>
        <button
          onClick={() => onToggleGuides(!showGuides)}
          className={`touch-btn relative h-8 w-14 rounded-full transition ${showGuides ? "bg-accent" : "bg-black/15 dark:bg-white/15"}`}
          aria-pressed={showGuides}
          aria-label="Toggle guides"
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${showGuides ? "left-7" : "left-1"}`}
          />
        </button>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Guide Opacity
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={guideOpacity}
          onChange={(e) => onGuideOpacity(Number(e.target.value))}
          className="touch-btn w-full accent-accent"
          disabled={!showGuides}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Reference Opacity
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={referenceOpacity}
          onChange={(e) => onReferenceOpacity(Number(e.target.value))}
          className="touch-btn w-full accent-guide"
        />
      </label>

      <button
        onClick={onReset}
        className="touch-btn self-start rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold dark:border-white/15"
      >
        ↺ Reset View
      </button>
    </div>
  );
}
