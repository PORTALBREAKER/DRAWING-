# DrawForge

> Turn any reference image into a beginner-friendly, step-by-step **Loomis-style
> drawing tutorial** - 100% free, no accounts, no servers, processed in your browser.

This is an original project (name, brand, UI, and code) inspired by the general
*workflow* of "upload a reference → get a construction-based drawing tutorial"
apps, but none of its logo, copy, source code, or visual design is copied from
any existing product. Everything here was built from scratch for this
repository.

Live app code: [`app/`](./app) (Vite + React + TypeScript + Tailwind CSS v4).

---

## 1. The core experience

```
Upload Image
   ↓
Analyze Image (on-device face + pose landmark detection)
   ↓
Build a Loomis / construction guide
   ↓
Generate 8-10 progressive drawing stages
   ↓
Practice each stage (zoom, pan, opacity, draw-over)
   ↓
Clean final sketch + export
```

Every step genuinely runs - this is not a clickable mockup:

- **Upload** - drag/drop, file picker, or mobile camera capture; crop & rotate.
- **Analyze** - real face/pose landmark detection (see "AI model" below), not a
  generic photo filter.
- **Construct** - a dedicated *Construction Engine* turns landmark geometry into
  Loomis primitives: head sphere, side plane, center line, eye line, jaw,
  ribcage/pelvis blocks, action line, tapered limb cylinders, etc.
- **Teach** - a *Step Generator* sequences those primitives into 8-10 stages,
  each with a title, instruction, "draw this", and "don't worry about" copy.
- **Render** - a canvas-based *Drawing Guide Renderer* draws the reference photo
  (adjustable opacity) plus the construction lines (adjustable opacity),
  letterboxed to the photo's real aspect ratio.
- **Practice** - a dedicated Practice Mode with reference + guide panels
  (stacked on mobile, side-by-side on larger screens), pinch-zoom/pan, and a
  draw-over layer with pen/eraser/clear.
- **Export** - download any stage as a PNG, or the full tutorial as a PDF.

---

## 2. Project / file structure

```
DRAWING-/
├── README.md                 ← you are here
├── NOTION_LANDING.md          ← copy-paste Notion page structure + embed guide
└── app/                       ← the actual web app
    ├── index.html
    ├── vite.config.ts
    ├── src/
    │   ├── brand.ts            ← single source of truth for the product name/tagline
    │   ├── App.tsx             ← routes (HashRouter, lazy-loaded pages)
    │   ├── pages/
    │   │   ├── Home.tsx            Landing page
    │   │   ├── Create.tsx          Upload → style/type → generate
    │   │   ├── TutorialViewer.tsx  Stage-by-stage viewer + final result
    │   │   ├── Practice.tsx        Practice Mode (zoom/pan/draw)
    │   │   ├── About.tsx
    │   │   └── Privacy.tsx
    │   ├── components/          Reusable UI (upload area, selectors, canvases…)
    │   ├── state/                Zustand stores (tutorial flow, theme)
    │   └── lib/
    │       ├── analysis/         IMAGE ANALYSIS layer
    │       │   ├── visionModels.ts     lazy-loads the free on-device ML models
    │       │   ├── faceAnalyzer.ts     face landmark → semantic groups
    │       │   ├── poseAnalyzer.ts     pose landmark → semantic groups
    │       │   └── analyzeImage.ts     orchestrator + fallbacks/warnings
    │       ├── construction/     CONSTRUCTION ENGINE + STEP GENERATOR
    │       │   ├── loomisEngine.ts     landmarks → Loomis geometry
    │       │   ├── stageGenerator.ts   geometry → 8-10 teaching stages
    │       │   └── styleProfiles.ts    anime/manga/cartoon/realistic tuning
    │       └── render/           DRAWING GUIDE RENDERER
    │           ├── canvasRenderer.ts   pure canvas-2D painter
    │           └── exportUtils.ts      PNG/PDF export
    └── scripts/
        └── testConstruction.ts  Headless regression test for the engine
```

These four layers (**Frontend / Image Analysis / Construction Engine + Step
Generator / Drawing Guide Renderer**) are intentionally decoupled, per the
project's architecture requirement - see "Swapping the AI model" below.

---

## 3. Which AI model is used, and why it's free

| Task | Model | License | Where it runs | Cost |
|---|---|---|---|---|
| Face detection + 68-point landmarks | **@vladmandic/face-api** (TinyFaceDetector + FaceLandmark68Net) | MIT | 100% on-device (TensorFlow.js), **self-hosted - weights ship inside this app's own build** | $0, no key, no network ever needed |
| Body pose (joint positions) | Classical **Loomis/Bridgman figure-proportion construction**, anchored on the detected face | Public-domain drawing technique | 100% on-device, pure math, zero network | $0 |
| Body pose *enhancement* (optional) | Google **MediaPipe Pose Landmarker (lite)** | Apache-2.0 | 100% on-device (WebAssembly), fetched from a public CDN on first use | $0, no key |

**Why face detection is fully self-hosted:** `@vladmandic/face-api` is an npm
package that bundles its real model weight files directly inside the
package itself (`tiny_face_detector_model.bin`, `face_landmark_68_model.bin`
- about 550KB combined). Those files are copied into `app/public/models/` and
served from this app's own origin, so face detection **never depends on any
third-party server, CDN, or API being reachable - not even on first load.**
This was verified with real headless inference against real photos during
development (`npm run test:face`, see below) - not just checked against
documentation.

**Why body pose uses a hybrid approach:** no free, npm-installable body-pose
package ships its model weights inside the package (checked
`@tensorflow-models/posenet` and others - they all fetch weights from a
remote URL at runtime, same as MediaPipe). Rather than leave body
construction unavailable offline, or silently fake a "detection" that never
happened, DrawForge uses the same proportion rules professional figure-
drawing instructors teach (adult figures are ~7.5-8 head-heights tall,
shoulders sit ~half a head below the chin, wrists hang level with the hips,
etc.), anchored on the real, detected face. This is a genuine, long-
established construction technique - not a guess - and it always works,
offline included. If a network connection *is* available, DrawForge also
attempts Google's free MediaPipe Pose Landmarker for real joint detection as
a best-effort accuracy enhancement, and is explicit in the on-screen warnings
about which method actually produced a given body construction - per this
project's "don't fake it" rule.

### Complete list of every external dependency

| Dependency | Purpose | Cost |
|---|---|---|
| `@vladmandic/face-api` (npm, self-hosted weights in `/public/models`) | Face detection + 68-point landmarks | Free, open-source, no network dependency |
| `@mediapipe/tasks-vision` (npm) + its optional WASM/model download | Best-effort body-pose enhancement only | Free, open-source |
| `react`, `react-dom`, `react-router-dom` | UI framework / routing | Free, open-source |
| `zustand` | Small state store | Free, open-source |
| `react-easy-crop` | Crop/rotate UI | Free, open-source |
| `jspdf` | Client-side PDF export | Free, open-source |
| `tailwindcss` / `@tailwindcss/vite` | Styling | Free, open-source |
| `@fontsource/fredoka`, `@fontsource/inter` (self-hosted) | Web fonts, bundled into the build | Free, open-source, no network dependency |

No paid APIs, no credit-based APIs, no trial-only services, nothing that
requires a credit card, anywhere in this stack.

### What works fully offline vs. what needs the internet

- **Always fully offline, even on first load:** image upload, crop/rotate,
  face detection + landmarks, proportion-based body construction, Loomis
  construction, stage generation, rendering, practice mode (zoom/pan/draw),
  and PNG/PDF export. Fonts and the face model are bundled into the app
  itself, not fetched from any CDN.
- **Needs internet (optional, best-effort only):** a one-time download of the
  MediaPipe Pose Landmarker (WASM + model, a few MB) purely to improve body
  *joint* accuracy for half-body/full-body tutorials. If unreachable, the app
  automatically and silently falls back to the proportion-based estimate
  above with no loss of core functionality.

### Verifying the AI actually works (not just "looks right" in code)

This isn't something you have to take on faith - `npm run test:face -- /path/to/a/photo.jpg`
runs the exact model files this app ships, against a real photo you provide,
through the real detection + landmark-mapping + construction code paths (not
mocked data), and prints pass/fail sanity checks (jaw geometry, eye
separation, anatomically-ordered body proportions, etc.). `npm run
test:construction` is a separate, faster regression test that checks the
Construction Engine/Step Generator logic against synthetic landmark data.

### Swapping the AI model later

The `lib/analysis` folder is the *only* place that talks to a vision model.
To replace it (e.g. with a future, better free/open-source model, or a
different self-hosted model):

1. Implement a function that returns the same `ImageAnalysis` shape defined in
   `src/lib/types.ts` (face/pose landmarks as normalized `{x, y}` points).
2. Swap the implementation inside `analyzeImage()` in
   `src/lib/analysis/analyzeImage.ts` - everything downstream (the
   Construction Engine, Step Generator, and Renderer) is written against that
   type, not against face-api or MediaPipe directly, so nothing else needs to
   change.

---

## 4. Running locally

Requirements: Node.js 18+ (20+ recommended) and npm.

```bash
cd app
npm install
npm run dev
```

Open the printed `http://localhost:5173` URL. The dev server binds to
`0.0.0.0`, so it also works if you open it from another device on your LAN or
through a sandboxed preview proxy.

Other scripts:

```bash
npm run build             # type-check + production build into app/dist
npm run preview           # serve the production build locally
npm run test:construction # headless regression test for the construction/step engine (synthetic data)
npm run test:face -- photo.jpg # real-inference regression test against an actual photo
npm run lint               # oxlint
```

---

## 5. Deploying for free

The app is a static site after `npm run build` (output in `app/dist`) - any
free static host works. A few genuinely free options:

- **Cloudflare Pages / Netlify / Vercel (free tier):** connect the repo,
  set the base directory to `app`, build command `npm run build`, output
  directory `dist`.
- **GitHub Pages:** build locally (`npm run build`) and publish `app/dist` to
  a `gh-pages` branch, or use GitHub's "Pages" GitHub Action with the same
  build command/output directory. `vite.config.ts` already uses relative
  asset paths (`base: "./"`), so it works from a project subpath like
  `username.github.io/DRAWING-/` without extra config.

No server, database, or paid add-on is required for any of these - the whole
app is static files plus client-side JavaScript.

---

## 6. Embedding in Notion

The app is built to be iframe-friendly:

- It never calls the Fullscreen API.
- Routing uses a hash-based router (`/#/create`, `/#/tutorial`, …) so it works
  from any embedded path without server-side rewrite rules.
- No restrictive frame headers are set by the dev/preview server or by any of
  the recommended static hosts above (don't add an `X-Frame-Options: DENY` or
  a restrictive `frame-ancestors` CSP if you self-host).

To embed:

1. Deploy the app (see above) to get a public HTTPS URL.
2. In Notion, type `/embed` and paste that URL.
3. Resize the embed block - the app is mobile-first and adapts down to small
   embed widths.

See [`NOTION_LANDING.md`](./NOTION_LANDING.md) for a ready-to-paste Notion
landing page structure (Hero / How It Works / Upload / Drawing Styles /
Examples / Open App / Feedback) that links out to the embedded app.

---

## 7. Limitations (be honest about these with users)

- Landmark detection can struggle with extreme head angles, strong occlusion
  (e.g. hands over the face), very poor lighting, or multiple overlapping
  subjects. The app detects these cases where it can and shows a specific,
  friendly warning instead of silently producing a bad result.
- When no face or body pose is detected at all, DrawForge falls back to a
  clearly-generic construction template so the learning flow still completes -
  it does not fabricate landmark data.
- Hair and clothing are intentionally rendered as simplified construction
  shapes (as a drawing teacher would sketch them), not pixel-traced from the
  photo - this is a deliberate teaching choice, not a shortcut.
- Body-pose joints are estimated from classical figure-drawing proportions
  anchored on the detected face unless the optional MediaPipe enhancement is
  reachable; the proportion estimate assumes a natural standing pose and may
  not match an unusual pose exactly - the app discloses in its warnings
  whenever this estimate (rather than real detection) was used.
- The optional pose model (`pose_landmarker_lite`) is the free, lightweight
  MediaPipe variant tuned for speed on weaker devices; it is slightly less
  precise than the heavier variants Google also publishes.
- Images are downscaled before analysis (max ~1280px) to keep things fast on
  low-end Android phones; this is a deliberate performance trade-off.

## 8. Error handling built in

Unsupported file types, corrupt files, tiny/huge images, no-face, multiple
faces (largest/most central is used), full-body photos, low-confidence
detections, dark/overexposed photos, strong side profiles, and vision-model
load failures (e.g. no internet on first run) all show a specific, actionable
message instead of crashing - see `src/lib/analysis/analyzeImage.ts` and the
warning banners in `Create.tsx` / `TutorialViewer.tsx`.
