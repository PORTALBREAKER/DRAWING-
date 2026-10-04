// Classical Loomis/Bridgman figure-proportion construction, anchored on a
// detected face. There is no free, npm-installable, self-hostable body-pose
// model with bundled weights (checked @tensorflow-models/posenet and
// others - see README "AI model" section), so rather than silently
// skipping body construction (or faking a "detection" that never ran),
// this synthesizes body landmarks from the same proportion rules art
// instructors have taught for decades:
//
//   - an adult figure is ~7.5-8 head-heights tall (fewer for stylised/
//     "chibi" proportions, governed by the style's headToBodyRatio)
//   - shoulders sit about half a head below the chin
//   - elbows sit at ~2 head-heights below the chin
//   - wrists hang level with the hips when arms rest naturally (the
//     classic "wrists at the crotch" rule)
//   - knees sit at ~5 head-heights below the chin
//
// This produces the exact same PoseLandmarks shape the construction engine
// already consumes, so buildBodyGroups() in loomisEngine.ts needs no
// changes at all - swapping in a real pose model later only means
// replacing the call site in analyzeImage.ts.
import type { DrawingStyle, DrawingType, FaceLandmarks, Point, PoseLandmarks } from "../types";
import { getStyleProfile } from "../construction/styleProfiles";

const BASE_ADULT_HEADS = 7.5;

function at(x: number, y: number): Point {
  return { x, y };
}

export function estimateProportionalPose(face: FaceLandmarks, style: DrawingStyle, type: DrawingType): PoseLandmarks {
  const profile = getStyleProfile(style);
  const totalHeads = BASE_ADULT_HEADS / profile.headToBodyRatio;

  const chinY = face.chin.y;
  const unit = Math.abs(chinY - face.foreheadTop.y) || 0.08;
  const centerX = (face.foreheadTop.x + face.chin.x) / 2;
  const headWidth = Math.abs(face.leftTemple.x - face.rightTemple.x) || unit * 0.8;

  const shoulderY = chinY + unit * 0.5;
  const elbowY = chinY + unit * 2.0;
  const hipY = chinY + unit * 3.0;
  const wristY = hipY; // arms hanging naturally
  const kneeY = chinY + unit * 5.0;
  const ankleY = chinY + unit * (totalHeads - 1);

  const shoulderHalf = headWidth * 1.1;
  const elbowHalf = headWidth * 1.05;
  const wristHalf = headWidth * 0.95;
  const hipHalf = headWidth * 0.8;
  const kneeHalf = headWidth * 0.55;
  const ankleHalf = headWidth * 0.4;

  const visibleBelowHip = type === "half-body" || type === "full-body";
  const visibleLegs = type === "full-body";

  return {
    nose: face.noseTip,
    leftShoulder: at(centerX + shoulderHalf, shoulderY),
    rightShoulder: at(centerX - shoulderHalf, shoulderY),
    leftElbow: at(centerX + elbowHalf, elbowY),
    rightElbow: at(centerX - elbowHalf, elbowY),
    leftWrist: at(centerX + wristHalf, wristY),
    rightWrist: at(centerX - wristHalf, wristY),
    leftHip: at(centerX + hipHalf, hipY),
    rightHip: at(centerX - hipHalf, hipY),
    leftKnee: at(centerX + kneeHalf, kneeY),
    rightKnee: at(centerX - kneeHalf, kneeY),
    leftAnkle: at(centerX + ankleHalf, ankleY),
    rightAnkle: at(centerX - ankleHalf, ankleY),
    visibleBelowHip,
    visibleLegs,
  };
}

/** True if the estimated pose extends meaningfully below the visible photo
 * frame (normalized y > 1) - a useful real signal that the chosen "type"
 * (e.g. full-body) probably shows more of the figure than the source photo
 * actually contains. */
export function proportionalPoseOverflowsFrame(pose: PoseLandmarks): boolean {
  const points = [pose.leftAnkle, pose.rightAnkle, pose.leftKnee, pose.rightKnee, pose.leftWrist, pose.rightWrist];
  return points.some((p) => p.y > 1.06);
}
