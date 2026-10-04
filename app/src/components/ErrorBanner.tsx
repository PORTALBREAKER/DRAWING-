export default function ErrorBanner({ message, tone = "error" }: { message: string; tone?: "error" | "warning" }) {
  const styles =
    tone === "error"
      ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
      : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return (
    <div className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm ${styles}`}>
      <span className="mt-0.5">{tone === "error" ? "⚠️" : "💡"}</span>
      <span>{message}</span>
    </div>
  );
}
