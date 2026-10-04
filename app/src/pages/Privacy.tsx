const POINTS = [
  {
    title: "Local-first processing",
    body:
      "Your reference image is decoded and analyzed directly in your browser using on-device models (WebAssembly). It is not uploaded to any server owned by this app.",
  },
  {
    title: "No permanent storage",
    body:
      "Images live only in your browser tab's memory for the current session. Closing or refreshing the tab clears them. Nothing is written to a database.",
  },
  {
    title: "No accounts, no tracking",
    body:
      "There's no login, no analytics pixels, and no third-party trackers. The only outbound network requests are one-time, anonymous downloads of the open-source vision model files and web fonts from their public CDNs.",
  },
  {
    title: "Third-party requests, listed in full",
    body:
      "(1) cdn.jsdelivr.net - MediaPipe's WASM runtime. (2) storage.googleapis.com - MediaPipe's model weights. (3) fonts.googleapis.com / fonts.gstatic.com - the Fredoka and Inter web fonts. None of these receive your image data; they only serve static files.",
  },
  {
    title: "Exports stay on your device",
    body:
      "Downloaded stage images and the tutorial PDF are generated locally and saved straight to your device's downloads - they are never transmitted anywhere.",
  },
];

export default function Privacy() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-2xl font-semibold sm:text-3xl">Privacy</h1>
      <p className="mt-3 text-ink/70 dark:text-white/70">
        🔒 Your reference stays private and is processed locally whenever possible.
      </p>
      <div className="mt-8 flex flex-col gap-4">
        {POINTS.map((p) => (
          <div key={p.title} className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
            <h3 className="font-display font-semibold">{p.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink/70 dark:text-white/70">{p.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
