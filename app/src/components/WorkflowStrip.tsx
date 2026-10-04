const STEPS = [
  {
    label: "Reference",
    svg: (
      <>
        <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
        <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="2 5" />
      </>
    ),
  },
  {
    label: "Construction",
    svg: (
      <>
        <circle cx="32" cy="30" r="16" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M32 14 V46" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 3" />
        <path d="M16 28 H48" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 3" />
        <path d="M20 44 Q32 54 44 44" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </>
    ),
  },
  {
    label: "Features",
    svg: (
      <>
        <circle cx="32" cy="30" r="16" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4" />
        <ellipse cx="25" cy="28" rx="3.2" ry="2.4" fill="none" stroke="currentColor" strokeWidth="2" />
        <ellipse cx="39" cy="28" rx="3.2" ry="2.4" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M30 36 H34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 44 Q32 52 44 44" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </>
    ),
  },
  {
    label: "Details",
    svg: (
      <>
        <path d="M18 24 Q32 10 46 24" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="32" cy="30" r="16" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <ellipse cx="25" cy="29" rx="3" ry="3.4" fill="none" stroke="currentColor" strokeWidth="2" />
        <ellipse cx="39" cy="29" rx="3" ry="3.4" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M29 37 Q32 39 35 37" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M18 44 Q32 54 46 44" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </>
    ),
  },
  {
    label: "Final Drawing",
    svg: (
      <>
        <path d="M17 23 Q32 8 47 23 Q49 34 44 45 Q32 56 20 45 Q15 34 17 23 Z" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <ellipse cx="25" cy="29" rx="3" ry="3.6" fill="currentColor" />
        <ellipse cx="39" cy="29" rx="3" ry="3.6" fill="currentColor" />
        <path d="M28 38 Q32 41 36 38" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </>
    ),
  },
];

export default function WorkflowStrip() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
      {STEPS.map((s, i) => (
        <div key={s.label} className="flex items-center gap-1 sm:gap-2">
          <div className="flex w-20 flex-col items-center gap-2 sm:w-24">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-ink shadow-sm ring-1 ring-black/5 dark:bg-white/5 dark:text-white dark:ring-white/10 sm:h-20 sm:w-20">
              <svg viewBox="0 0 64 64" width="40" height="40">
                {s.svg}
              </svg>
            </div>
            <span className="text-center text-[11px] font-medium leading-tight text-ink/70 dark:text-white/70 sm:text-xs">
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && <span className="mb-5 text-ink/30 dark:text-white/30">→</span>}
        </div>
      ))}
    </div>
  );
}
