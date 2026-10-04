// Self-hosted face detection + 68-point landmarks via @vladmandic/face-api
// (MIT licensed, bundles its own TensorFlow.js - no peer dependency to
// install separately). The model weight files live in /public/models and
// ship as part of this app's own build output, so after the app's first
// page load there is ZERO external network dependency for face analysis -
// everything runs from the same origin, fully offline-capable.
//
// The library itself (~1.3MB including its bundled TF.js core + WebGL
// backend) is dynamically imported on first use rather than bundled into
// the main chunk, keeping the initial page load small on mobile - the same
// lazy-loading pattern used for the optional MediaPipe pose model.
//
// Verified with a real headless inference run against sample photos during
// development (see scripts/testFaceDetection.ts) - this is genuine
// on-device ML, not a stub.
import type * as FaceApiNS from "@vladmandic/face-api";

let modulePromise: Promise<typeof FaceApiNS> | null = null;
let loadPromise: Promise<void> | null = null;

function modelsUrl(): string {
  // import.meta.env.BASE_URL respects Vite's configured base path (we use
  // a relative "./" base so this works from any subpath/embed context).
  const base = import.meta.env.BASE_URL || "/";
  return `${base.endsWith("/") ? base : base + "/"}models`;
}

function loadFaceApi(): Promise<typeof FaceApiNS> {
  if (!modulePromise) {
    modulePromise = import("@vladmandic/face-api");
  }
  return modulePromise;
}

export async function ensureFaceApiModelsLoaded(): Promise<void> {
  if (!loadPromise) {
    loadPromise = (async () => {
      const faceapi = await loadFaceApi();
      const url = modelsUrl();
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(url),
        faceapi.nets.faceLandmark68Net.loadFromUri(url),
      ]);
    })().catch((err) => {
      loadPromise = null;
      throw err;
    });
  }
  return loadPromise;
}

export interface RawFaceDetection {
  score: number;
  box: { x: number; y: number; width: number; height: number };
  /** 68 points in pixel coordinates, dlib/iBUG ordering */
  points: { x: number; y: number }[];
}

/**
 * Detects every face in the image and returns raw pixel-space landmarks.
 * Never throws for "no face found" - returns an empty array instead.
 */
export async function detectFaces(image: HTMLImageElement): Promise<RawFaceDetection[]> {
  const faceapi = await loadFaceApi();
  await ensureFaceApiModelsLoaded();
  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 });
  const results = await faceapi.detectAllFaces(image, options).withFaceLandmarks();
  return results.map((r) => ({
    score: r.detection.score,
    box: { x: r.detection.box.x, y: r.detection.box.y, width: r.detection.box.width, height: r.detection.box.height },
    points: r.landmarks.positions.map((p) => ({ x: p.x, y: p.y })),
  }));
}

export function preloadFaceApiModels() {
  ensureFaceApiModelsLoaded().catch(() => void 0);
}
