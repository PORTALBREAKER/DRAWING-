import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { FaceLandmarks, Point } from "../types";
import {
  CHIN,
  FOREHEAD_TOP,
  LEFT_CHEEK,
  LEFT_EYE,
  LEFT_EYEBROW,
  LEFT_TEMPLE,
  LIPS_INNER,
  LIPS_OUTER,
  MOUTH_LEFT,
  MOUTH_RIGHT,
  NOSE_BASE,
  NOSE_BRIDGE,
  NOSE_TIP,
  RIGHT_CHEEK,
  RIGHT_EYE,
  RIGHT_EYEBROW,
  RIGHT_TEMPLE,
} from "./landmarkIndices";

function pick(landmarks: NormalizedLandmark[], indices: number[]): Point[] {
  return indices.map((i) => ({ x: landmarks[i].x, y: landmarks[i].y }));
}

function one(landmarks: NormalizedLandmark[], index: number): Point {
  return { x: landmarks[index].x, y: landmarks[index].y };
}

function average(points: Point[]): Point {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

export function buildFaceLandmarks(landmarks: NormalizedLandmark[]): FaceLandmarks {
  const leftEye = pick(landmarks, LEFT_EYE);
  const rightEye = pick(landmarks, RIGHT_EYE);
  return {
    faceOval: pick(landmarks, [
      10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365,
      379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93,
      234, 127, 162, 21, 54, 103, 67, 109,
    ]),
    leftEye,
    rightEye,
    leftEyebrow: pick(landmarks, LEFT_EYEBROW),
    rightEyebrow: pick(landmarks, RIGHT_EYEBROW),
    lipsOuter: pick(landmarks, LIPS_OUTER),
    lipsInner: pick(landmarks, LIPS_INNER),
    noseBridge: pick(landmarks, NOSE_BRIDGE),
    noseTip: one(landmarks, NOSE_TIP),
    noseBase: one(landmarks, NOSE_BASE),
    chin: one(landmarks, CHIN),
    foreheadTop: one(landmarks, FOREHEAD_TOP),
    leftCheek: one(landmarks, LEFT_CHEEK),
    rightCheek: one(landmarks, RIGHT_CHEEK),
    leftTemple: one(landmarks, LEFT_TEMPLE),
    rightTemple: one(landmarks, RIGHT_TEMPLE),
    leftEyeCenter: average(leftEye),
    rightEyeCenter: average(rightEye),
    mouthLeft: one(landmarks, MOUTH_LEFT),
    mouthRight: one(landmarks, MOUTH_RIGHT),
  };
}

/** -1 (turned toward subject's right) .. 1 (turned toward subject's left), 0 = frontal */
export function estimateYaw(face: FaceLandmarks): number {
  const faceWidth = Math.abs(face.leftTemple.x - face.rightTemple.x) || 0.001;
  const noseCenterX = (face.leftTemple.x + face.rightTemple.x) / 2;
  const offset = (face.noseTip.x - noseCenterX) / (faceWidth / 2);
  return Math.max(-1, Math.min(1, offset));
}
