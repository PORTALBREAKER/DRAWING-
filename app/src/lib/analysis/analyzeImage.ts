import type { DrawingType, ImageAnalysis } from "../types";
import { getPoseLandmarker } from "./visionModels";
import { detectFaces, type RawFaceDetection } from "./faceApiEngine";
import { buildFaceLandmarks, estimateYaw, detectionArea } from "./faceAnalyzer";
import { buildPoseLandmarks } from "./poseAnalyzer";
import { estimateProportionalPose, proportionalPoseOverflowsFrame } from "./proportionalPose";

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

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timed out")), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/**
 * Runs the app's on-device vision pipeline against the image:
 *
 *  1. Face detection + 68-point landmarks via the fully self-hosted
 *     @vladmandic/face-api models (see faceApiEngine.ts) - these ship as
 *     part of this app's own build, so they always work, offline included.
 *  2. Body pose, attempted via Google's MediaPipe Pose Landmarker as a
 *     best-effort enhancement (needs a network connection the first time).
 *     If it is unavailable, body construction instead uses classical
 *     Loomis/Bridgman figure proportions anchored on the detected face
 *     (see proportionalPose.ts) - a real, long-established construction
 *     technique, not a guess, and the UI is told which path was used so it
 *     can disclose that honestly rather than pretend it was "detected".
 *
 * Never throws for "nothing detected" - it returns a low-confidence result
 * with warnings instead, so the UI can fall back gracefully.
 */
export async function analyzeImage(img: HTMLImageElement): Promise<ImageAnalysis> {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  const warnings: string[] = [];
  const brightnessWarning = estimateBrightnessWarning(img);
  if (brightnessWarning) warnings.push(brightnessWarning);

  let detections: RawFaceDetection[] = [];
  let faceModelFailed = false;
  try {
    detections = await detectFaces(img);
  } catch (err) {
    faceModelFailed = true;
    warnings.push(
      "The on-device face model couldn't load in this browser. Showing a generic construction template instead - everything else still works.",
    );
    void err;
  }

  const faceCount = detections.length;
  const faceDetected = faceCount > 0;
  if (faceCount > 1) {
    warnings.push("Multiple faces were found - DrawForge will build the tutorial around the largest, most central face.");
  }

  let face;
  let yaw = 0;
  if (faceDetected) {
    let best = detections[0];
    let bestArea = -1;
    for (const d of detections) {
      const area = detectionArea(d);
      if (area > bestArea) {
        bestArea = area;
        best = d;
      }
    }
    face = buildFaceLandmarks(best, width, height);
    yaw = estimateYaw(face);
    if (Math.abs(yaw) > 0.55) {
      warnings.push("This looks like a strong side profile. Construction will adapt, but a 3/4 or front-facing photo usually teaches better.");
    }
  } else if (!faceModelFailed) {
    warnings.push("No clear face was detected. Try a clearer, more front-facing photo with good lighting for the best construction guide.");
  }

  // Body pose: try the real MediaPipe model first (best-effort, needs network
  // on first use), then fall back to proportion-based estimation.
  let pose;
  let poseDetected = false;
  let poseEstimated = false;
  try {
    const poseLandmarker = await withTimeout(getPoseLandmarker(), 8000);
    const result = poseLandmarker.detect(img);
    if (result.landmarks.length > 0) {
      pose = buildPoseLandmarks(result.landmarks[0]);
      poseDetected = true;
    }
  } catch {
    // No network / model unavailable / timed out - this is expected offline
    // and is not treated as an error; we fall back below.
  }

  if (!pose && face) {
    const faceHeightFrac = Math.abs(face.chin.y - face.foreheadTop.y);
    let heuristicType: DrawingType;
    if (faceHeightFrac > 0.33) heuristicType = "face";
    else if (faceHeightFrac > 0.16) heuristicType = "half-body";
    else heuristicType = "full-body";

    if (heuristicType !== "face") {
      pose = estimateProportionalPose(face, "realistic", heuristicType);
      poseEstimated = true;
      warnings.push(
        "No body-pose model could be reached, so the body construction uses standard figure-drawing proportions anchored on the detected face rather than real joint detection. It will be re-fitted once you pick a style.",
      );
      if (proportionalPoseOverflowsFrame(pose)) {
        warnings.push("The estimated body construction extends past the edges of this photo - a wider, full-length photo will teach better for full-body construction.");
      }
    }
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

  const confidence = faceModelFailed ? 0.15 : faceDetected ? (faceCount === 1 ? 0.9 : 0.65) : poseDetected ? 0.55 : 0.2;

  return {
    imageWidth: width,
    imageHeight: height,
    faceDetected,
    faceCount,
    poseDetected,
    poseEstimated,
    face,
    pose,
    yaw,
    confidence,
    suggestedType,
    warnings,
  };
}
