// Lazy-loaded, free, on-device computer vision models.
//
// These come from Google's MediaPipe Tasks runtime (Apache-2.0 license,
// no API key, no quota, no account). The WASM runtime is fetched from the
// public jsDelivr CDN and the model weights from Google's public model
// storage bucket, exactly as documented at https://ai.google.dev/edge/mediapipe.
// Everything below only ever runs *in the user's browser* - no image data
// is ever sent to any server.
import type { FaceLandmarker, PoseLandmarker } from "@mediapipe/tasks-vision";

const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const FACE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const POSE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

let faceLandmarkerPromise: Promise<FaceLandmarker> | null = null;
let poseLandmarkerPromise: Promise<PoseLandmarker> | null = null;

async function createFileset() {
  const { FilesetResolver } = await import("@mediapipe/tasks-vision");
  return FilesetResolver.forVisionTasks(WASM_BASE);
}

export async function getFaceLandmarker(): Promise<FaceLandmarker> {
  if (!faceLandmarkerPromise) {
    faceLandmarkerPromise = (async () => {
      const { FaceLandmarker } = await import("@mediapipe/tasks-vision");
      const files = await createFileset();
      try {
        return await FaceLandmarker.createFromOptions(files, {
          baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate: "GPU" },
          runningMode: "IMAGE",
          numFaces: 2,
          minFaceDetectionConfidence: 0.4,
          minFacePresenceConfidence: 0.4,
          outputFaceBlendshapes: false,
        });
      } catch {
        // Some low-end/older Android GPUs reject the WebGL delegate - retry on CPU.
        return await FaceLandmarker.createFromOptions(files, {
          baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate: "CPU" },
          runningMode: "IMAGE",
          numFaces: 2,
          minFaceDetectionConfidence: 0.4,
          minFacePresenceConfidence: 0.4,
          outputFaceBlendshapes: false,
        });
      }
    })().catch((err) => {
      faceLandmarkerPromise = null;
      throw err;
    });
  }
  return faceLandmarkerPromise;
}

export async function getPoseLandmarker(): Promise<PoseLandmarker> {
  if (!poseLandmarkerPromise) {
    poseLandmarkerPromise = (async () => {
      const { PoseLandmarker } = await import("@mediapipe/tasks-vision");
      const files = await createFileset();
      try {
        return await PoseLandmarker.createFromOptions(files, {
          baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: "GPU" },
          runningMode: "IMAGE",
          numPoses: 1,
          minPoseDetectionConfidence: 0.4,
          minPosePresenceConfidence: 0.4,
        });
      } catch {
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

/** Warm the models up in the background without blocking the UI thread flow. */
export function preloadVisionModels() {
  getFaceLandmarker().catch(() => void 0);
  getPoseLandmarker().catch(() => void 0);
}
