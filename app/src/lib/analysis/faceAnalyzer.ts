import type { FaceLandmarks, Point } from "../types";
import type { RawFaceDetection } from "./faceApiEngine";
import {
  CHIN,
  JAW,
  LEFT_CHEEK,
  LEFT_EYE,
  LEFT_EYEBROW,
  LEFT_TEMPLE,
  MOUTH_INNER,
  MOUTH_LEFT_CORNER,
  MOUTH_OUTER,
  MOUTH_RIGHT_CORNER,
  NOSE_BASE_CENTER,
  NOSE_BRIDGE,
  NOSE_TIP,
  RIGHT_CHEEK,
  RIGHT_EYE,
  RIGHT_EYEBROW,
  RIGHT_TEMPLE,
} from "./landmarkIndices";

function pick(points: Point[], indices: number[]): Point[] {
  return indices.map((i) => points[i]);
}

function one(points: Point[], index: number): Point {
  return points[index];
}

function average(points: Point[]): Point {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

/** Quadratic-Bezier arc, used to synthesize a plausible skull curve above the
 * hairline, since the 68-point scheme only covers the jaw and facial
 * features (it has no forehead/scalp points to detect). */
function quadraticArc(p0: Point, control: Point, p1: Point, steps: number): Point[] {
  const pts: Point[] = [];
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * control.x + t * t * p1.x;
    const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * control.y + t * t * p1.y;
    pts.push({ x, y });
  }
  return pts;
}

/**
 * Converts a raw 68-point dlib/iBUG detection (pixel space, from
 * face-api.js) into the app's normalized, backend-agnostic FaceLandmarks
 * shape. The 68-point scheme has no forehead/temple/hairline points, so
 * those are estimated using the classical figure-drawing "equal thirds"
 * rule (hairline-to-brow ~= brow-to-nose-base ~= nose-base-to-chin) -
 * a genuine, long-established proportion rule, not a guess pulled from
 * thin air, and clearly documented here so it can be refined later.
 */
export function buildFaceLandmarks(detection: RawFaceDetection, imageWidth: number, imageHeight: number): FaceLandmarks {
  const px = detection.points;
  const norm = (p: Point): Point => ({ x: p.x / imageWidth, y: p.y / imageHeight });
  const normAll = (pts: Point[]): Point[] => pts.map(norm);

  const jaw = pick(px, JAW);
  const rightEyebrow = pick(px, RIGHT_EYEBROW);
  const leftEyebrow = pick(px, LEFT_EYEBROW);
  const chin = one(px, CHIN);
  const rightTemple = one(px, RIGHT_TEMPLE);
  const leftTemple = one(px, LEFT_TEMPLE);
  const noseBaseCenter = one(px, NOSE_BASE_CENTER);

  const browY = average([...rightEyebrow, ...leftEyebrow]).y;
  const unitLower = chin.y - noseBaseCenter.y; // nose-base to chin
  const unitMiddle = noseBaseCenter.y - browY; // brow to nose-base
  const unit = (Math.abs(unitLower) + Math.abs(unitMiddle)) / 2 || Math.abs(unitLower) || 20;
  const foreheadTopPx: Point = {
    x: (rightTemple.x + leftTemple.x) / 2,
    y: browY - unit,
  };

  // Synthesize the scalp arc (no real landmarks exist above the brow), so the
  // full head outline closes into one continuous, natural-looking loop.
  const upperRight = quadraticArc(
    leftTemple,
    { x: foreheadTopPx.x + (leftTemple.x - foreheadTopPx.x) * 0.55, y: foreheadTopPx.y - unit * 0.05 },
    foreheadTopPx,
    5,
  );
  const upperLeft = quadraticArc(
    foreheadTopPx,
    { x: foreheadTopPx.x + (rightTemple.x - foreheadTopPx.x) * 0.55, y: foreheadTopPx.y - unit * 0.05 },
    rightTemple,
    5,
  );
  const faceOvalPx: Point[] = [...jaw, ...upperRight, foreheadTopPx, ...upperLeft];

  const rightEye = pick(px, RIGHT_EYE);
  const leftEye = pick(px, LEFT_EYE);

  return {
    faceOval: normAll(faceOvalPx),
    leftEye: normAll(leftEye),
    rightEye: normAll(rightEye),
    leftEyebrow: normAll(leftEyebrow),
    rightEyebrow: normAll(rightEyebrow),
    lipsOuter: normAll(pick(px, MOUTH_OUTER)),
    lipsInner: normAll(pick(px, MOUTH_INNER)),
    noseBridge: normAll(pick(px, NOSE_BRIDGE)),
    noseTip: norm(one(px, NOSE_TIP)),
    noseBase: norm(noseBaseCenter),
    chin: norm(chin),
    foreheadTop: norm(foreheadTopPx),
    leftCheek: norm(one(px, LEFT_CHEEK)),
    rightCheek: norm(one(px, RIGHT_CHEEK)),
    leftTemple: norm(leftTemple),
    rightTemple: norm(rightTemple),
    leftEyeCenter: norm(average(leftEye)),
    rightEyeCenter: norm(average(rightEye)),
    mouthLeft: norm(one(px, MOUTH_LEFT_CORNER)),
    mouthRight: norm(one(px, MOUTH_RIGHT_CORNER)),
  };
}

/** -1 (turned toward subject's right) .. 1 (turned toward subject's left), 0 = frontal */
export function estimateYaw(face: FaceLandmarks): number {
  const faceWidth = Math.abs(face.leftTemple.x - face.rightTemple.x) || 0.001;
  const noseCenterX = (face.leftTemple.x + face.rightTemple.x) / 2;
  const offset = (face.noseTip.x - noseCenterX) / (faceWidth / 2);
  return Math.max(-1, Math.min(1, offset));
}

/** Bounding-box area in pixel space, used to pick the most prominent face
 * when several are detected. */
export function detectionArea(detection: RawFaceDetection): number {
  return detection.box.width * detection.box.height;
}
