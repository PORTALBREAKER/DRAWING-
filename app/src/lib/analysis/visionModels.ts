// Optional, best-effort BODY POSE enhancement.
//
// Face analysis (the app's core, always-available feature) is handled by
// the fully self-hosted @vladmandic/face-api pipeline in faceApiEngine.ts -
// its model weights ship inside this app's own /models folder, so it never
// needs the network after the first page load.
//
// No free, npm-installable pose-detection package ships its model weights
// in the package itself (checked @tensorflow-models/posenet and others);
// real body-joint detection remains only available through Google's
// MediaPipe Tasks runtime, which fetches its WASM runtime and ~5-10MB model
// file from a public CDN/bucket at first use (Apache-2.0, free, no API key,
// no quota - see https://ai.google.dev/edge/mediapipe). We still attempt it
// because it IS a genuinely free, real model and meaningfully improves body
// construction accuracy when a network connection is available - but it is
// treated purely as an enhancement. If it fails to load (offline, blocked
// network, slow connection) analyzeImage.ts transparently falls back to the
// classical Loomis proportion estimate in proportionalPose.ts, which always
// works with zero network dependency. Per this app's "don't fake it" rule,
// that fallback is explicitly surfaced to the user via a warning, never
// silently presented as a real detection.
import type { PoseLandmarker } from "@mediapipe/tasks-vision";

const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const POSE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

let poseLandmarkerPromise: Promise<PoseLandmarker> | null = null;

export async function getPoseLandmarker(): Promise<PoseLandmarker> {
  if (!poseLandmarkerPromise) {
    poseLandmarkerPromise = (async () => {
      const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
      const files = await FilesetResolver.forVisionTasks(WASM_BASE);
      try {
        return await PoseLandmarker.createFromOptions(files, {
          baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: "GPU" },
          runningMode: "IMAGE",
          numPoses: 1,
          minPoseDetectionConfidence: 0.4,
          minPosePresenceConfidence: 0.4,
        });
      } catch {
        // Some low-end/older Android GPUs reject the WebGL delegate - retry on CPU.
        return await PoseLandmarker.createFromOptions(files, {
          baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: "CPU" },
          runningMode: "IMAGE",
          numPoses: 1,
          minPoseDetectionConfidence: 0.4,
          minPosePresenceConfidence: 0.4,
        });
      }
    })().catch((err) => {
      poseLandmarkerPromise = null;
      throw err;
    });
  }
  return poseLandmarkerPromise;
}

/** Warm the pose model up in the background without blocking the UI thread flow.
 * Safe to call even if offline - failures are swallowed, the proportional
 * fallback handles that case when analysis actually runs. */
export function preloadPoseModel() {
  getPoseLandmarker().catch(() => void 0);
}
