import type { DrawingStyle } from "../lib/types";

const OPTIONS: { id: DrawingStyle; label: string; emoji: string; blurb: string }[] = [
  { id: "anime", label: "Anime", emoji: "✨", blurb: "Big expressive eyes, simplified features" },
  { id: "manga", label: "Manga", emoji: "🖋️", blurb: "Sharper angles, dynamic hair" },
  { id: "cartoon", label: "Cartoon", emoji: "🎨", blurb: "Bold shapes, strong silhouette" },
  { id: "realistic", label: "Realistic", emoji: "🧑‍🎨", blurb: "True proportions, facial planes" },
];

export default function StyleSelector({ value, onChange }: { value: DrawingStyle; onChange: (s: DrawingStyle) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {OPTIONS.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`touch-btn flex flex-col items-start gap-1 rounded-2xl border-2 p-4 text-left transition ${
              active
                ? "border-accent bg-accent/10"
                : "border-black/10 bg-white hover:border-black/20 dark:border-white/10 dark:bg-white/5"
            }`}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <span className="font-display text-sm font-semibold">{opt.label}</span>
            <span className="text-xs text-ink/55 dark:text-white/55">{opt.blurb}</span>
          </button>
        );
      })}
    </div>
  );
}
