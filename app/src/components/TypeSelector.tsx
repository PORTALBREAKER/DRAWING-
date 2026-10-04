import type { DrawingType } from "../lib/types";

const OPTIONS: { id: DrawingType; label: string; emoji: string }[] = [
  { id: "face", label: "Face", emoji: "🙂" },
  { id: "portrait", label: "Portrait", emoji: "🧑" },
  { id: "half-body", label: "Half Body", emoji: "🧍" },
  { id: "full-body", label: "Full Body", emoji: "🚶" },
];

export default function TypeSelector({
  value,
  onChange,
  suggested,
}: {
  value: DrawingType;
  onChange: (t: DrawingType) => void;
  suggested?: DrawingType | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {OPTIONS.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`touch-btn relative flex flex-col items-center gap-1 rounded-2xl border-2 p-3 transition ${
              active
                ? "border-accent bg-accent/10"
                : "border-black/10 bg-white hover:border-black/20 dark:border-white/10 dark:bg-white/5"
            }`}
          >
            {suggested === opt.id && (
              <span className="absolute -top-2 right-1 rounded-full bg-guide px-1.5 py-0.5 text-[9px] font-bold text-white">
                SUGGESTED
              </span>
            )}
            <span className="text-xl">{opt.emoji}</span>
            <span className="text-xs font-semibold">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
