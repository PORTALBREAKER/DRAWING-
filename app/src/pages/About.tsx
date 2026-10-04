import { BRAND } from "../brand";

const FAQ = [
  {
    q: "What AI/vision model does this use?",
    a: "DrawForge uses Google MediaPipe's free, open-source (Apache-2.0) Face Landmarker and Pose Landmarker models. They run entirely on-device via WebAssembly - no API key, no account, no per-request cost, and no image data ever leaves your browser.",
  },
  {
    q: "Does it work offline?",
    a: "Once the vision models have been downloaded by your browser (the first time you generate a tutorial), image analysis runs fully offline. The very first load needs an internet connection to fetch the model files (a few megabytes) from Google's public CDN; everything afterwards - rendering, practice mode, exports - works without a network connection.",
  },
  {
    q: "Is my photo uploaded anywhere?",
    a: "No. There is no backend server in this app. Your image is decoded and analyzed with on-device JavaScript/WASM only, and is kept in memory for your current session - it's never written to a database or sent over the network.",
  },
  {
    q: "What if no face is detected?",
    a: "DrawForge falls back to a generic, clearly-labeled construction template so the tutorial flow still works, and shows a message suggesting a clearer or more front-facing photo for best results.",
  },
  {
    q: "Can the vision model be swapped later?",
    a: "Yes - the app is split into independent layers (Image Analysis → Construction Engine → Step Generator → Renderer). Replacing lib/analysis/visionModels.ts with a different model (e.g. a future open-source body/face model) doesn't require touching the construction or rendering code, as long as it returns the same landmark shape.",
  },
];

export default function About() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-2xl font-semibold sm:text-3xl">About {BRAND.shortName}</h1>
      <p className="mt-3 text-ink/70 dark:text-white/70">{BRAND.description}</p>

      <div className="mt-8 flex flex-col gap-4">
        {FAQ.map((f) => (
          <div key={f.q} className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
            <h3 className="font-display font-semibold">{f.q}</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink/70 dark:text-white/70">{f.a}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
        <strong>Limitations:</strong> landmark detection can struggle with extreme angles, heavy occlusion, poor
        lighting, or multiple overlapping subjects. Hair and clothing are approximated as simplified construction
        shapes (as a real drawing teacher would sketch them) rather than pixel-traced from the photo - this is by
        design, since the goal is teaching construction, not tracing.
      </div>
    </div>
  );
}
