// CONSTRUCTION ENGINE
// Turns raw landmark analysis into named, reusable Loomis-style geometry.
// This module has no knowledge of "stages" or teaching copy - that's the
// Step Generator's job (stageGenerator.ts). Keeping them separate means
// either side (vision model vs. teaching flow) can change independently.
import type {
  ConstructionPrimitive,
  DrawingStyle,
  DrawingType,
  FaceLandmarks,
  ImageAnalysis,
  Point,
  PoseLandmarks,
} from "../types";
import { average, dist, lerpPoint, midpoint } from "./geometry";
import { getStyleProfile } from "./styleProfiles";
import type { ConstructionModel } from "./types";

const ACCENT = "#ff5d73"; // used by renderer as the default "new" color (overridable)
const GUIDE = "#6fb7ff";

function extend(a: Point, b: Point, factor: number): [Point, Point] {
  return [lerpPoint(b, a, 1 + factor), lerpPoint(a, b, 1 + factor)];
}

function line(points: Point[], opts: Partial<ConstructionPrimitive> = {}): ConstructionPrimitive {
  return { kind: "line", points, color: GUIDE, lineWidth: 2, ...opts };
}

function path(points: Point[], opts: Partial<ConstructionPrimitive> = {}): ConstructionPrimitive {
  return { kind: "path", points, color: GUIDE, lineWidth: 2, ...opts };
}

function ellipse(center: Point, radiusX: number, radiusY: number, opts: Partial<ConstructionPrimitive> = {}): ConstructionPrimitive {
  return { kind: "ellipse", center, radiusX, radiusY, color: GUIDE, lineWidth: 2, ...opts };
}

function dot(center: Point, r: number, opts: Partial<ConstructionPrimitive> = {}): ConstructionPrimitive {
  return { kind: "dot", center, radiusX: r, radiusY: r, color: GUIDE, ...opts };
}

/** tapered "cylinder" outline between two joints - the real Loomis way to block in limbs */
function tapered(a: Point, b: Point, widthA: number, widthB: number, opts: Partial<ConstructionPrimitive> = {}): ConstructionPrimitive {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 0.0001;
  const nx = -dy / len;
  const ny = dx / len;
  const pts: Point[] = [
    { x: a.x + nx * widthA, y: a.y + ny * widthA },
    { x: b.x + nx * widthB, y: b.y + ny * widthB },
    { x: b.x - nx * widthB, y: b.y - ny * widthB },
    { x: a.x - nx * widthA, y: a.y - ny * widthA },
  ];
  return { kind: "path", points: pts, closed: true, color: GUIDE, lineWidth: 2, ...opts };
}

function buildHeadGroups(face: FaceLandmarks, yaw: number, style: DrawingStyle): Pick<
  ConstructionModel,
  | "headSphere"
  | "sidePlane"
  | "centerLine"
  | "eyeLine"
  | "jaw"
  | "features"
  | "ears"
  | "hairMass"
  | "neck"
  | "refineDetails"
  | "finalLines"
> {
  const profile = getStyleProfile(style);
  const faceWidth = dist(face.leftTemple, face.rightTemple);
  const faceHeight = dist(face.foreheadTop, face.chin);
  const craniumCenter: Point = {
    x: midpoint(face.leftTemple, face.rightTemple).x,
    y: face.foreheadTop.y + faceHeight * 0.3,
  };
  const craniumRadius = (faceWidth / 2) * 1.08;
  const eyeLineY = average([face.leftEyeCenter, face.rightEyeCenter]).y;
  const browY = average([...face.leftEyebrow, ...face.rightEyebrow]).y;

  // --- 1. Head sphere ---
  const headSphere: ConstructionPrimitive[] = [
    ellipse(craniumCenter, craniumRadius, craniumRadius * 1.02, { lineWidth: 2.5 }),
  ];

  // --- 2. Loomis side plane (flat plane showing which way the head turns) ---
  const turnSide = yaw >= 0 ? face.leftTemple : face.rightTemple;
  const planeX = craniumCenter.x + (turnSide.x - craniumCenter.x) * (0.55 + Math.min(0.4, Math.abs(yaw) * 0.5));
  const sidePlane: ConstructionPrimitive[] = [
    path(
      [
        { x: planeX, y: craniumCenter.y - craniumRadius * 0.75 },
        { x: planeX, y: craniumCenter.y + craniumRadius * 0.2 },
      ],
      { color: GUIDE, dashed: true },
    ),
    // brow-level band wrapping the sphere, hints at the 3D ball
    path(
      [
        { x: craniumCenter.x - craniumRadius * 0.85, y: craniumCenter.y + craniumRadius * 0.05 },
        { x: craniumCenter.x, y: craniumCenter.y + craniumRadius * 0.2 },
        { x: craniumCenter.x + craniumRadius * 0.85, y: craniumCenter.y + craniumRadius * 0.05 },
      ],
      { color: GUIDE, dashed: true },
    ),
  ];

  // --- 3. Vertical center line (follows the direction the head is turned) ---
  const centerPts = [face.foreheadTop, ...face.noseBridge, face.noseBase, face.chin];
  const centerLine: ConstructionPrimitive[] = [path(centerPts, { color: GUIDE, lineWidth: 2.5 })];

  // --- 4. Horizontal eye line + brow line ---
  const [eyeA, eyeB] = extend(face.leftEyeCenter, face.rightEyeCenter, 0.35);
  const eyeLine: ConstructionPrimitive[] = [
    line([eyeA, eyeB], { lineWidth: 2.5 }),
    line(
      [
        { x: eyeA.x, y: browY },
        { x: eyeB.x, y: browY },
      ],
      { dashed: true },
    ),
  ];

  // --- 5. Jaw construction (lower half of the face oval = the jaw) ---
  const lowerOval = face.faceOval.filter((p) => p.y > eyeLineY + (faceHeight * 0.12));
  const jawCurve = lowerOval.length > 3 ? lowerOval : [face.leftCheek, face.chin, face.rightCheek];
  const jawRounded = profile.jawRoundness > 0.5;
  const jaw: ConstructionPrimitive[] = [
    path(jawCurve, { lineWidth: 2.5, dashed: jawRounded }),
    line([face.leftCheek, face.rightCheek], { dashed: true, lineWidth: 1.5 }),
  ];

  // --- 6. Features: eyes, nose, mouth ---
  const eyeW = dist(face.leftEye[0], face.leftEye[8] ?? face.leftEye[0]) || faceWidth * 0.12;
  const features: ConstructionPrimitive[] = [];
  for (const center of [face.leftEyeCenter, face.rightEyeCenter]) {
    features.push(
      ellipse(
        { x: center.x, y: center.y - faceHeight * profile.eyeDrop },
        (eyeW / 2) * profile.eyeScale,
        (eyeW / 2) * profile.eyeScale * 0.75,
        { lineWidth: 2.5 },
      ),
    );
  }
  if (profile.noseStyle === "minimal") {
    features.push(dot(face.noseBase, faceWidth * 0.012, { lineWidth: 2 }));
  } else if (profile.noseStyle === "simple") {
    features.push(
      path([face.noseBridge[0], face.noseBase], { lineWidth: 2 }),
      line(
        [
          { x: face.noseBase.x - faceWidth * 0.045, y: face.noseBase.y },
          { x: face.noseBase.x + faceWidth * 0.045, y: face.noseBase.y },
        ],
        { lineWidth: 2 },
      ),
    );
  } else {
    features.push(
      path(face.noseBridge, { lineWidth: 2 }),
      ellipse({ x: face.noseBase.x - faceWidth * 0.04, y: face.noseBase.y }, faceWidth * 0.02, faceWidth * 0.015),
      ellipse({ x: face.noseBase.x + faceWidth * 0.04, y: face.noseBase.y }, faceWidth * 0.02, faceWidth * 0.015),
    );
  }
  features.push(line([face.mouthLeft, face.mouthRight], { lineWidth: 2.5 }));
  if (profile.mouthStyle === "detailed") {
    features.push(path(face.lipsOuter, { closed: true, lineWidth: 1.5 }));
  }

  // --- ears: sit between the brow line and the nose base ---
  const earHeight = (face.noseBase.y - browY) || faceHeight * 0.3;
  const ears: ConstructionPrimitive[] = [
    ellipse({ x: face.leftCheek.x, y: browY + earHeight / 2 }, faceWidth * 0.055, earHeight / 2, {}),
    ellipse({ x: face.rightCheek.x, y: browY + earHeight / 2 }, faceWidth * 0.055, earHeight / 2, {}),
  ];

  // --- 7. Hair mass: one big simplified shape, not individual strands ---
  const hairCenter: Point = { x: craniumCenter.x, y: face.foreheadTop.y - faceHeight * 0.08 * profile.hairVolume };
  const hairRX = craniumRadius * 1.18 * profile.hairVolume;
  const hairRY = craniumRadius * 0.95 * profile.hairVolume;
  const sway = yaw * faceWidth * 0.12;
  const hairMass: ConstructionPrimitive[] = [
    ellipse(hairCenter, hairRX, hairRY, { lineWidth: 2.5 }),
    // direction strokes hinting at major locks, swept with head turn
    path([
      { x: hairCenter.x - hairRX * 0.6 + sway, y: hairCenter.y },
      { x: hairCenter.x - hairRX * 0.3 + sway, y: hairCenter.y + hairRY * 0.9 },
    ]),
    path([
      { x: hairCenter.x + hairRX * 0.6 + sway, y: hairCenter.y },
      { x: hairCenter.x + hairRX * 0.3 + sway, y: hairCenter.y + hairRY * 0.9 },
    ]),
  ];

  // --- 8. Neck ---
  const neckWidth = faceWidth * 0.32;
  const neckBottom: Point = { x: face.chin.x, y: face.chin.y + faceHeight * 0.55 };
  const neck: ConstructionPrimitive[] = [
    line([
      { x: face.chin.x - neckWidth / 2, y: face.chin.y },
      { x: neckBottom.x - neckWidth * 0.7, y: neckBottom.y },
    ]),
    line([
      { x: face.chin.x + neckWidth / 2, y: face.chin.y },
      { x: neckBottom.x + neckWidth * 0.7, y: neckBottom.y },
    ]),
    line([
      { x: neckBottom.x - neckWidth * 1.9, y: neckBottom.y },
      { x: neckBottom.x - neckWidth * 0.7, y: neckBottom.y },
    ]),
    line([
      { x: neckBottom.x + neckWidth * 0.7, y: neckBottom.y },
      { x: neckBottom.x + neckWidth * 1.9, y: neckBottom.y },
    ]),
  ];

  // --- 9. Refine: brows + pupils + extra planes for realistic mode ---
  const refineDetails: ConstructionPrimitive[] = [
    path(face.leftEyebrow, { lineWidth: 2 }),
    path(face.rightEyebrow, { lineWidth: 2 }),
    dot(face.leftEyeCenter, faceWidth * 0.012),
    dot(face.rightEyeCenter, faceWidth * 0.012),
  ];
  if (profile.showFacialPlanes) {
    refineDetails.push(
      line([face.leftCheek, face.noseBase], { dashed: true, lineWidth: 1.5 }),
      line([face.rightCheek, face.noseBase], { dashed: true, lineWidth: 1.5 }),
      line(
        [
          { x: eyeA.x, y: browY - faceHeight * 0.03 },
          { x: eyeB.x, y: browY - faceHeight * 0.03 },
        ],
        { dashed: true, lineWidth: 1.5 },
      ),
    );
  }

  // --- 10. Final clean line art, built straight from the same landmarks ---
  const finalLines: ConstructionPrimitive[] = [
    path(face.faceOval, { closed: true, color: "#1a1a1a", lineWidth: 2.5 }),
    path(hairOutline(hairCenter, hairRX, hairRY), { closed: true, color: "#1a1a1a", lineWidth: 2.5 }),
    path(face.leftEyebrow, { color: "#1a1a1a", lineWidth: 2 }),
    path(face.rightEyebrow, { color: "#1a1a1a", lineWidth: 2 }),
    path(face.lipsOuter, { closed: true, color: "#1a1a1a", lineWidth: 2 }),
  ];
  for (const [center, eye] of [
    [face.leftEyeCenter, face.leftEye],
    [face.rightEyeCenter, face.rightEye],
  ] as [Point, Point[]][]) {
    finalLines.push(
      ellipse(
        { x: center.x, y: center.y - faceHeight * profile.eyeDrop },
        (eyeW / 2) * profile.eyeScale,
        (eyeW / 2) * profile.eyeScale * 0.8,
        { color: "#1a1a1a", lineWidth: 2.2 },
      ),
      dot(center, faceWidth * 0.018, { color: "#1a1a1a" }),
    );
    void eye;
  }
  if (profile.noseStyle !== "minimal") {
    finalLines.push(path([face.noseBridge[0], face.noseBase], { color: "#1a1a1a", lineWidth: 2 }));
  } else {
    finalLines.push(dot(face.noseBase, faceWidth * 0.012, { color: "#1a1a1a" }));
  }
  finalLines.push(
    ellipse({ x: face.leftCheek.x, y: browY + earHeight / 2 }, faceWidth * 0.05, earHeight / 2, { color: "#1a1a1a", lineWidth: 2 }),
    ellipse({ x: face.rightCheek.x, y: browY + earHeight / 2 }, faceWidth * 0.05, earHeight / 2, { color: "#1a1a1a", lineWidth: 2 }),
    ...neck.map((p) => ({ ...p, color: "#1a1a1a" })),
  );

  return { headSphere, sidePlane, centerLine, eyeLine, jaw, features, ears, hairMass, neck, refineDetails, finalLines };
}

function hairOutline(center: Point, rx: number, ry: number): Point[] {
  const pts: Point[] = [];
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const t = Math.PI + (i / steps) * Math.PI; // top half only (dome)
    pts.push({ x: center.x + Math.cos(t) * rx, y: center.y + Math.sin(t) * ry });
  }
  return pts;
}

function buildBodyGroups(
  pose: PoseLandmarks,
  face: FaceLandmarks | undefined,
  type: DrawingType,
): Pick<ConstructionModel, "bodyMasses" | "actionLine" | "shoulderHipLines" | "limbs" | "handsFeet" | "clothing" | "bodyFinalLines"> {
  const shoulderMid = midpoint(pose.leftShoulder, pose.rightShoulder);
  const hipMid = midpoint(pose.leftHip, pose.rightHip);
  const torsoLen = dist(shoulderMid, hipMid) || 0.2;
  const shoulderW = dist(pose.leftShoulder, pose.rightShoulder) || 0.2;
  const hipW = dist(pose.leftHip, pose.rightHip) || shoulderW * 0.9;

  const ribCenter = lerpPoint(shoulderMid, hipMid, 0.3);
  const pelvisCenter = lerpPoint(shoulderMid, hipMid, 0.82);

  const bodyMasses: ConstructionPrimitive[] = [
    ellipse(ribCenter, shoulderW * 0.52, torsoLen * 0.34, { lineWidth: 2.5 }),
    ellipse(pelvisCenter, hipW * 0.62, torsoLen * 0.24, { lineWidth: 2.5 }),
  ];

  const headPoint = face ? midpoint(face.foreheadTop, face.chin) : pose.nose;
  const actionPts: Point[] = [headPoint, shoulderMid, lerpPoint(shoulderMid, hipMid, 0.55), hipMid];
  if (pose.visibleLegs) {
    actionPts.push(midpoint(pose.leftKnee, pose.rightKnee), midpoint(pose.leftAnkle, pose.rightAnkle));
  }
  const actionLine: ConstructionPrimitive[] = [path(actionPts, { lineWidth: 2.5 })];

  const shoulderHipLines: ConstructionPrimitive[] = [
    line([pose.leftShoulder, pose.rightShoulder], { lineWidth: 2.5 }),
    line([pose.leftHip, pose.rightHip], { lineWidth: 2.5, dashed: true }),
  ];

  const limbWidth = shoulderW * 0.14;
  const limbs: ConstructionPrimitive[] = [
    tapered(pose.leftShoulder, pose.leftElbow, limbWidth, limbWidth * 0.8),
    tapered(pose.leftElbow, pose.leftWrist, limbWidth * 0.8, limbWidth * 0.55),
    tapered(pose.rightShoulder, pose.rightElbow, limbWidth, limbWidth * 0.8),
    tapered(pose.rightElbow, pose.rightWrist, limbWidth * 0.8, limbWidth * 0.55),
  ];
  if (pose.visibleLegs && (type === "full-body" || type === "half-body")) {
    const legWidth = hipW * 0.18;
    limbs.push(
      tapered(pose.leftHip, pose.leftKnee, legWidth, legWidth * 0.75),
      tapered(pose.leftKnee, pose.leftAnkle, legWidth * 0.75, legWidth * 0.45),
      tapered(pose.rightHip, pose.rightKnee, legWidth, legWidth * 0.75),
      tapered(pose.rightKnee, pose.rightAnkle, legWidth * 0.75, legWidth * 0.45),
    );
  }

  const handR = shoulderW * 0.09;
  const handsFeet: ConstructionPrimitive[] = [
    ellipse(pose.leftWrist, handR, handR * 1.2),
    ellipse(pose.rightWrist, handR, handR * 1.2),
  ];
  if (pose.visibleLegs) {
    const footR = hipW * 0.1;
    handsFeet.push(ellipse(pose.leftAnkle, footR * 1.3, footR * 0.8), ellipse(pose.rightAnkle, footR * 1.3, footR * 0.8));
  }

  const clothing: ConstructionPrimitive[] = [
    path(
      [
        { x: pose.leftShoulder.x, y: pose.leftShoulder.y },
        { x: pose.leftHip.x, y: pose.leftHip.y },
        { x: pose.rightHip.x, y: pose.rightHip.y },
        { x: pose.rightShoulder.x, y: pose.rightShoulder.y },
      ],
      { closed: true, dashed: true, lineWidth: 1.5 },
    ),
    line([pelvisCenter, { x: pelvisCenter.x, y: pelvisCenter.y + torsoLen * 0.05 }], { dashed: true, lineWidth: 1.5 }),
  ];

  const bodyFinalLines: ConstructionPrimitive[] = [
    ...limbs.map((p) => ({ ...p, color: "#1a1a1a" })),
    path(
      [pose.leftShoulder, pose.leftHip, pose.rightHip, pose.rightShoulder],
      { closed: true, color: "#1a1a1a", lineWidth: 2.2 },
    ),
    ...handsFeet.map((p) => ({ ...p, color: "#1a1a1a" })),
  ];

  return { bodyMasses, actionLine, shoulderHipLines, limbs, handsFeet, clothing, bodyFinalLines };
}

export function buildConstructionModel(analysis: ImageAnalysis, style: DrawingStyle, type: DrawingType): ConstructionModel {
  const hasHead = !!analysis.face;
  const hasBody = !!analysis.pose && (type === "half-body" || type === "full-body");

  const model: ConstructionModel = { hasHead, hasBody };

  if (hasHead) {
    Object.assign(model, buildHeadGroups(analysis.face!, analysis.yaw, style));
  } else {
    Object.assign(model, buildFallbackHeadGroups(style));
  }

  if (hasBody) {
    Object.assign(model, buildBodyGroups(analysis.pose!, analysis.face, type));
  } else if (!hasHead && analysis.pose) {
    Object.assign(model, buildBodyGroups(analysis.pose, undefined, type));
  }

  return model;
}

/** Generic centered template used when no face could be detected, so the app never dead-ends. */
function buildFallbackHeadGroups(style: DrawingStyle) {
  const fakeFace: FaceLandmarks = synthesizeGenericFace();
  return buildHeadGroups(fakeFace, 0, style);
}

function synthesizeGenericFace(): FaceLandmarks {
  const cx = 0.5;
  const topY = 0.18;
  const chinY = 0.62;
  const w = 0.32;
  const ring = (rx: number, ry: number, cy: number, n = 24): Point[] =>
    Array.from({ length: n }, (_, i) => {
      const t = (i / n) * Math.PI * 2;
      return { x: cx + Math.cos(t) * rx, y: cy + Math.sin(t) * ry };
    });
  const eyeY = topY + (chinY - topY) * 0.5;
  return {
    faceOval: ring(w / 2, (chinY - topY) / 2, (topY + chinY) / 2, 36),
    leftEye: ring(0.035, 0.018, eyeY, 10).map((p) => ({ x: p.x + w * 0.22, y: p.y })),
    rightEye: ring(0.035, 0.018, eyeY, 10).map((p) => ({ x: p.x - w * 0.22, y: p.y })),
    leftEyebrow: Array.from({ length: 5 }, (_, i) => ({ x: cx + w * 0.1 + (i / 4) * w * 0.25, y: eyeY - 0.045 })),
    rightEyebrow: Array.from({ length: 5 }, (_, i) => ({ x: cx - w * 0.1 - (i / 4) * w * 0.25, y: eyeY - 0.045 })),
    lipsOuter: ring(w * 0.18, w * 0.07, topY + (chinY - topY) * 0.82, 16),
    lipsInner: ring(w * 0.12, w * 0.04, topY + (chinY - topY) * 0.82, 16),
    noseBridge: [
      { x: cx, y: eyeY },
      { x: cx, y: topY + (chinY - topY) * 0.68 },
    ],
    noseTip: { x: cx, y: topY + (chinY - topY) * 0.68 },
    noseBase: { x: cx, y: topY + (chinY - topY) * 0.7 },
    chin: { x: cx, y: chinY },
    foreheadTop: { x: cx, y: topY },
    leftCheek: { x: cx + w / 2, y: topY + (chinY - topY) * 0.55 },
    rightCheek: { x: cx - w / 2, y: topY + (chinY - topY) * 0.55 },
    leftTemple: { x: cx + w / 2, y: topY + (chinY - topY) * 0.32 },
    rightTemple: { x: cx - w / 2, y: topY + (chinY - topY) * 0.32 },
    leftEyeCenter: { x: cx + w * 0.22, y: eyeY },
    rightEyeCenter: { x: cx - w * 0.22, y: eyeY },
    mouthLeft: { x: cx + w * 0.16, y: topY + (chinY - topY) * 0.82 },
    mouthRight: { x: cx - w * 0.16, y: topY + (chinY - topY) * 0.82 },
  };
}

export const COLORS = { accent: ACCENT, guide: GUIDE };
