import { buildConstructionModel } from "../src/lib/construction/loomisEngine";
import { generateStages } from "../src/lib/construction/stageGenerator";
import type { FaceLandmarks, ImageAnalysis, PoseLandmarks, Point } from "../src/lib/types";

function ring(cx: number, cy: number, rx: number, ry: number, n: number): Point[] {
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2;
    return { x: cx + Math.cos(t) * rx, y: cy + Math.sin(t) * ry };
  });
}

function makeFace(turn = 0): FaceLandmarks {
  const cx = 0.5 + turn * 0.05;
  const topY = 0.15;
  const chinY = 0.62;
  const w = 0.3;
  const eyeY = 0.33;
  return {
    faceOval: ring(cx, (topY + chinY) / 2, w / 2, (chinY - topY) / 2, 36),
    leftEye: ring(cx + w * 0.22, eyeY, 0.035, 0.018, 10),
    rightEye: ring(cx - w * 0.22, eyeY, 0.035, 0.018, 10),
    leftEyebrow: ring(cx + w * 0.22, eyeY - 0.05, 0.04, 0.012, 6).slice(0, 5),
    rightEyebrow: ring(cx - w * 0.22, eyeY - 0.05, 0.04, 0.012, 6).slice(0, 5),
    lipsOuter: ring(cx, 0.52, w * 0.18, w * 0.07, 16),
    lipsInner: ring(cx, 0.52, w * 0.12, w * 0.04, 16),
    noseBridge: [
      { x: cx + turn * 0.02, y: eyeY },
      { x: cx + turn * 0.03, y: 0.44 },
    ],
    noseTip: { x: cx + turn * 0.03, y: 0.44 },
    noseBase: { x: cx + turn * 0.03, y: 0.46 },
    chin: { x: cx, y: chinY },
    foreheadTop: { x: cx, y: topY },
    leftCheek: { x: cx + w / 2, y: 0.4 },
    rightCheek: { x: cx - w / 2, y: 0.4 },
    leftTemple: { x: cx + w / 2, y: 0.28 },
    rightTemple: { x: cx - w / 2, y: 0.28 },
    leftEyeCenter: { x: cx + w * 0.22, y: eyeY },
    rightEyeCenter: { x: cx - w * 0.22, y: eyeY },
    mouthLeft: { x: cx + w * 0.16, y: 0.52 },
    mouthRight: { x: cx - w * 0.16, y: 0.52 },
  };
}

function makePose(): PoseLandmarks {
  return {
    nose: { x: 0.5, y: 0.1 },
    leftShoulder: { x: 0.62, y: 0.22 },
    rightShoulder: { x: 0.38, y: 0.22 },
    leftElbow: { x: 0.68, y: 0.4 },
    rightElbow: { x: 0.32, y: 0.4 },
    leftWrist: { x: 0.7, y: 0.56 },
    rightWrist: { x: 0.3, y: 0.56 },
    leftHip: { x: 0.58, y: 0.55 },
    rightHip: { x: 0.42, y: 0.55 },
    leftKnee: { x: 0.58, y: 0.75 },
    rightKnee: { x: 0.42, y: 0.75 },
    leftAnkle: { x: 0.58, y: 0.95 },
    rightAnkle: { x: 0.42, y: 0.95 },
    visibleBelowHip: true,
    visibleLegs: true,
  };
}

function assertFinite(label: string, points: Point[]) {
  for (const p of points) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) {
      throw new Error(`${label}: non-finite point ${JSON.stringify(p)}`);
    }
  }
}

function checkStages(analysis: ImageAnalysis, style: "anime" | "manga" | "cartoon" | "realistic", type: "face" | "portrait" | "half-body" | "full-body") {
  const model = buildConstructionModel(analysis, style, type);
  const stages = generateStages(model, analysis, style, type);
  if (stages.length < 8 || stages.length > 10) {
    throw new Error(`${type}/${style}: expected 8-10 stages, got ${stages.length}`);
  }
  let total = 0;
  stages.forEach((s, i) => {
    if (s.number !== i + 1) throw new Error("stage numbering mismatch");
    if (i === stages.length - 1 && !s.isFinal) throw new Error("last stage should be final");
    if (i !== stages.length - 1 && s.isFinal) throw new Error("non-last stage marked final");
    total += s.layer.newPrimitives.length;
    for (const prim of s.layer.newPrimitives) {
      if (prim.points) assertFinite(`${type}/${style} stage ${s.number} points`, prim.points);
      if (prim.center) assertFinite(`${type}/${style} stage ${s.number} center`, [prim.center]);
    }
  });
  console.log(`OK  ${type.padEnd(10)} ${style.padEnd(10)} stages=${stages.length} primitives=${total}`);
}

const baseAnalysisFrontal: ImageAnalysis = {
  imageWidth: 800,
  imageHeight: 1000,
  faceDetected: true,
  faceCount: 1,
  poseDetected: false,
  face: makeFace(0),
  yaw: 0,
  confidence: 0.9,
  suggestedType: "portrait",
  warnings: [],
};

const turnedAnalysis: ImageAnalysis = { ...baseAnalysisFrontal, face: makeFace(0.6), yaw: 0.6 };

const bodyAnalysis: ImageAnalysis = {
  ...baseAnalysisFrontal,
  poseDetected: true,
  pose: makePose(),
  suggestedType: "full-body",
};

const halfBodyAnalysis: ImageAnalysis = {
  ...baseAnalysisFrontal,
  poseDetected: true,
  pose: { ...makePose(), visibleLegs: false },
  suggestedType: "half-body",
};

const noFaceAnalysis: ImageAnalysis = {
  imageWidth: 800,
  imageHeight: 1000,
  faceDetected: false,
  faceCount: 0,
  poseDetected: false,
  yaw: 0,
  confidence: 0.15,
  suggestedType: "portrait",
  warnings: ["No clear face was detected."],
};

const styles: Array<"anime" | "manga" | "cartoon" | "realistic"> = ["anime", "manga", "cartoon", "realistic"];

for (const style of styles) {
  checkStages(baseAnalysisFrontal, style, "face");
  checkStages(turnedAnalysis, style, "portrait");
}
checkStages(bodyAnalysis, "anime", "full-body");
checkStages(halfBodyAnalysis, "realistic", "half-body");
checkStages(noFaceAnalysis, "cartoon", "portrait");

console.log("\nAll construction/stage generator tests passed.");
