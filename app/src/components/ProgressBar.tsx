interface Props {
  current: number; // 0-indexed
  total: number;
  unlocked: number; // highest unlocked 0-indexed
  onJump: (i: number) => void;
}

export default function ProgressBar({ current, total, unlocked, onJump }: Props) {
  const pct = total > 1 ? (current / (total - 1)) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm font-semibold">
        <span>
          Stage {current + 1} / {total}
        </span>
        <span className="text-ink/50 dark:text-white/50">{Math.round(pct)}%</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {Array.from({ length: total }).map((_, i) => {
          const isUnlocked = i <= unlocked;
          const isActive = i === current;
          return (
            <button
              key={i}
              disabled={!isUnlocked}
              onClick={() => onJump(i)}
              aria-label={`Go to stage ${i + 1}`}
              className={`touch-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                isActive
                  ? "bg-accent text-white"
                  : isUnlocked
                    ? "bg-black/5 text-ink hover:bg-black/10 dark:bg-white/10 dark:text-white"
                    : "cursor-not-allowed bg-black/5 text-ink/30 dark:bg-white/5 dark:text-white/20"
              }`}
            >
              {isUnlocked ? i + 1 : "🔒"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
