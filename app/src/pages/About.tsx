import { BRAND } from "../brand";

const FAQ = [
  {
    q: "What AI/vision model does this use?",
    a: "Face detection and the 68-point facial landmarks are powered by @vladmandic/face-api (MIT licensed), a self-hosted TensorFlow.js model whose weight files ship as part of this app itself - there's no external AI service call, no API key, and no per-request cost. Body construction uses the same classical Loomis/Bridgman figure-proportion rules professional art instructors teach, anchored on the detected face; if a network connection is available, DrawForge also attempts Google MediaPipe's free Pose Landmarker as a best-effort enhancement for more accurate joint positions, and is upfront in its warnings about which method produced a given result.",
  },
  {
    q: "Does it work offline?",
    a: "Yes, for the core face/portrait experience: the face-detection model files are bundled into this app's own build (served from the same origin as everything else), so face analysis and construction work with zero network calls, even on first use. The only part that benefits from a connection is the optional body-pose enhancement, which gracefully falls back to proportion-based construction when offline.",
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
    a: "Yes - the app is split into independent layers (Image Analysis → Construction Engine → Step Generator → Renderer). Replacing lib/analysis/faceApiEngine.ts or lib/analysis/visionModels.ts with a different model doesn't require touching the construction or rendering code, as long as it produces the same FaceLandmarks/PoseLandmarks shape.",
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
        design, since the goal is teaching construction, not tracing. When the optional body-pose model can't be
        reached, body joints are estimated from standard figure-drawing proportions rather than detected from the
        photo - DrawForge always tells you in the warnings panel when this happens, rather than presenting an
        estimate as if it were a real detection.
      </div>
    </div>
  );
}
