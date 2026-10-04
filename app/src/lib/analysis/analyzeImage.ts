import type { DrawingType, ImageAnalysis } from "../types";
import { getFaceLandmarker, getPoseLandmarker } from "./visionModels";
import { buildFaceLandmarks, estimateYaw } from "./faceAnalyzer";
import { buildPoseLandmarks } from "./poseAnalyzer";

/** Cheap, dependency-free brightness check so very dark/blown-out photos get a helpful nudge. */
function estimateBrightnessWarning(img: HTMLImageElement): string | null {
  try {
    const sample = document.createElement("canvas");
    const size = 48;
    sample.width = size;
    sample.height = size;
    const ctx = sample.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    const avg = sum / (data.length / 4);
    if (avg < 45) return "This photo looks quite dark. Better lighting on the subject's face will give a much more accurate construction.";
    if (avg > 235) return "This photo looks very overexposed/bright. Try a photo with more visible facial detail.";
    return null;
  } catch {
    return null;
  }
}

export class AnalysisError extends Error {
  friendly: string;
  constructor(message: string, friendly: string) {
    super(message);
    this.friendly = friendly;
  }
}

/**
 * Runs the two free, on-device MediaPipe models (face + pose) against the
 * image and distills the result into the ImageAnalysis shape the
 * construction engine understands. Never throws for "nothing detected" -
 * it instead returns a low-confidence result with warnings so the UI can
 * fall back gracefully, per the app's error-handling requirements.
 */
export async function analyzeImage(img: HTMLImageElement): Promise<ImageAnalysis> {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  const warnings: string[] = [];
  const brightnessWarning = estimateBrightnessWarning(img);
  if (brightnessWarning) warnings.push(brightnessWarning);

  let faceResult: Awaited<ReturnType<Awaited<ReturnType<typeof getFaceLandmarker>>["detect"]>> | null = null;
  let poseResult: Awaited<ReturnType<Awaited<ReturnType<typeof getPoseLandmarker>>["detect"]>> | null = null;
  let modelsFailed = false;

  try {
    const [faceLandmarker, poseLandmarker] = await Promise.all([
      getFaceLandmarker(),
      getPoseLandmarker(),
    ]);
    faceResult = faceLandmarker.detect(img);
    poseResult = poseLandmarker.detect(img);
  } catch (err) {
    modelsFailed = true;
    warnings.push(
      "The on-device vision model couldn't load (usually a connectivity issue the first time you use DrawForge). Showing a generic construction template instead - everything else still works.",
    );
    void err;
  }

  const faceCount = faceResult?.faceLandmarks?.length ?? 0;
  const faceDetected = faceCount > 0;
  const poseDetected = (poseResult?.landmarks?.length ?? 0) > 0;

  if (faceCount > 1) {
    warnings.push("Multiple faces were found - DrawForge will build the tutorial around the largest, most central face.");
  }

  let face;
  let yaw = 0;
  if (faceDetected) {
    const rawFaces = faceResult!.faceLandmarks;
    // pick the face with the largest bounding box (closest/most prominent)
    let best = rawFaces[0];
    let bestArea = -1;
    for (const f of rawFaces) {
      const xs = f.map((p) => p.x);
      const ys = f.map((p) => p.y);
      const area = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
      if (area > bestArea) {
        bestArea = area;
        best = f;
      }
    }
    face = buildFaceLandmarks(best);
    yaw = estimateYaw(face);
    if (Math.abs(yaw) > 0.55) {
      warnings.push("This looks like a strong side profile. Construction will adapt, but a 3/4 or front-facing photo usually teaches better.");
    }
  } else if (!modelsFailed) {
    warnings.push("No clear face was detected. Try a clearer, more front-facing photo with good lighting for the best construction guide.");
  }

  let pose;
  if (poseDetected) {
    pose = buildPoseLandmarks(poseResult!.landmarks[0]);
  }

  let suggestedType: DrawingType = "portrait";
  if (face && !pose?.visibleBelowHip) {
    suggestedType = "face";
  } else if (face && pose?.visibleBelowHip && !pose?.visibleLegs) {
    suggestedType = "half-body";
  } else if (pose?.visibleLegs) {
    suggestedType = "full-body";
  } else if (!face && pose) {
    suggestedType = "full-body";
  } else if (!face && !pose) {
    suggestedType = "portrait";
  }

  const confidence = modelsFailed ? 0.15 : faceDetected ? (faceCount === 1 ? 0.9 : 0.65) : poseDetected ? 0.55 : 0.2;

  return {
    imageWidth: width,
    imageHeight: height,
    faceDetected,
    faceCount,
    poseDetected,
    face,
    pose,
    yaw,
    confidence,
    suggestedType,
    warnings,
  };
}
