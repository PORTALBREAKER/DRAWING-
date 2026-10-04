import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { PoseLandmarks, Point } from "../types";

const IDX = {
  nose: 0,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
};

function pt(landmarks: NormalizedLandmark[], i: number): Point {
  return { x: landmarks[i].x, y: landmarks[i].y };
}

function vis(landmarks: NormalizedLandmark[], i: number): number {
  return landmarks[i].visibility ?? 1;
}

export function buildPoseLandmarks(landmarks: NormalizedLandmark[]): PoseLandmarks {
  const hipVis = (vis(landmarks, IDX.leftHip) + vis(landmarks, IDX.rightHip)) / 2;
  const kneeVis = (vis(landmarks, IDX.leftKnee) + vis(landmarks, IDX.rightKnee)) / 2;
  const ankleVis = (vis(landmarks, IDX.leftAnkle) + vis(landmarks, IDX.rightAnkle)) / 2;
  return {
    nose: pt(landmarks, IDX.nose),
    leftShoulder: pt(landmarks, IDX.leftShoulder),
    rightShoulder: pt(landmarks, IDX.rightShoulder),
    leftElbow: pt(landmarks, IDX.leftElbow),
    rightElbow: pt(landmarks, IDX.rightElbow),
    leftWrist: pt(landmarks, IDX.leftWrist),
    rightWrist: pt(landmarks, IDX.rightWrist),
    leftHip: pt(landmarks, IDX.leftHip),
    rightHip: pt(landmarks, IDX.rightHip),
    leftKnee: pt(landmarks, IDX.leftKnee),
    rightKnee: pt(landmarks, IDX.rightKnee),
    leftAnkle: pt(landmarks, IDX.leftAnkle),
    rightAnkle: pt(landmarks, IDX.rightAnkle),
    visibleBelowHip: hipVis > 0.4,
    visibleLegs: kneeVis > 0.4 && ankleVis > 0.3,
  };
}
