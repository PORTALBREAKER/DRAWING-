import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import WorkflowStrip from "../components/WorkflowStrip";
import { BRAND } from "../brand";

const STYLES = ["Anime", "Manga", "Cartoon", "Realistic"];
const SUBJECTS = ["Portraits", "Faces", "Half-Body", "Full-Body Characters"];

const PIPELINE = [
  { title: "Upload", desc: "Drop in a photo or reference art - it never leaves your device." },
  { title: "Analyze", desc: "Free on-device vision models find the head, face landmarks and pose." },
  { title: "Construct", desc: "A Loomis-style guide is built: sphere, center line, eye line, jaw." },
  { title: "Practice", desc: "Work through 8-10 stages side-by-side with your reference." },
  { title: "Finish", desc: "Land on a clean final sketch, ready to download." },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div>
      <section className="relative overflow-hidden px-4 pb-14 pt-12 sm:pt-20">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(255,93,115,0.12),transparent_55%),radial-gradient(circle_at_85%_15%,rgba(111,183,255,0.14),transparent_50%)]" />
        <div className="mx-auto max-w-3xl text-center">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink/60 dark:bg-white/10 dark:text-white/60">
            100% free · runs in your browser
          </span>
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {BRAND.tagline}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-ink/70 dark:text-white/70 sm:text-lg">
            {BRAND.subtitle}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button full className="sm:w-auto sm:px-8" onClick={() => navigate("/create")}>
              📤 Upload Image
            </Button>
            <Button
              variant="secondary"
              full
              className="sm:w-auto sm:px-8"
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
            >
              How It Works
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-3xl overflow-x-auto no-scrollbar">
          <WorkflowStrip />
        </div>
        <p className="mx-auto mt-6 max-w-lg text-center text-sm text-ink/60 dark:text-white/60">
          Start with basic forms, add structure, build details, and finish with clean lines.
        </p>
      </section>

      <section id="how-it-works" className="scroll-mt-16 bg-white px-4 py-14 dark:bg-white/[0.03]">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-center text-2xl font-semibold sm:text-3xl">How {BRAND.shortName} works</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-5">
            {PIPELINE.map((p, i) => (
              <div key={p.title} className="rounded-2xl border border-black/5 bg-paper p-4 dark:border-white/10 dark:bg-ink">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="font-display text-sm font-semibold">{p.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink/60 dark:text-white/60">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2">
          <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <h3 className="font-display text-lg font-semibold">Any drawing style</h3>
            <p className="mt-1 text-sm text-ink/60 dark:text-white/60">
              Construction adapts to how you want to draw it.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <span key={s} className="rounded-full bg-guide/15 px-3 py-1.5 text-sm font-medium text-ink dark:text-white">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <h3 className="font-display text-lg font-semibold">Any subject</h3>
            <p className="mt-1 text-sm text-ink/60 dark:text-white/60">
              From a single face to a full-body figure.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SUBJECTS.map((s) => (
                <span key={s} className="rounded-full bg-sunny/25 px-3 py-1.5 text-sm font-medium text-ink dark:text-white">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-4xl rounded-3xl bg-ink px-6 py-10 text-center text-white dark:bg-white/10">
          <h3 className="font-display text-xl font-semibold sm:text-2xl">Ready to learn to draw your reference?</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/70">
            No account, no uploads to a server, no cost - just you, a photo, and a step-by-step guide.
          </p>
          <Button className="mt-6" onClick={() => navigate("/create")}>
            Start a Tutorial
          </Button>
        </div>
      </section>
    </div>
  );
}
