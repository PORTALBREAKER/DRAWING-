// Shared domain types for the DrawForge construction pipeline.
// Keep these decoupled from any specific ML backend so the vision
// model powering ImageAnalysis can be swapped later (see README).

export type DrawingStyle = "anime" | "manga" | "cartoon" | "realistic";

export type DrawingType = "face" | "portrait" | "half-body" | "full-body";

export interface Point {
  x: number; // normalized 0..1 relative to the source image width
  y: number; // normalized 0..1 relative to the source image height
}

export interface FaceLandmarks {
  faceOval: Point[];
  leftEye: Point[];
  rightEye: Point[];
  leftEyebrow: Point[];
  rightEyebrow: Point[];
  lipsOuter: Point[];
  lipsInner: Point[];
  noseBridge: Point[];
  noseTip: Point;
  noseBase: Point;
  chin: Point;
  foreheadTop: Point;
  leftCheek: Point;
  rightCheek: Point;
  leftTemple: Point;
  rightTemple: Point;
  leftEyeCenter: Point;
  rightEyeCenter: Point;
  mouthLeft: Point;
  mouthRight: Point;
}

export interface PoseLandmarks {
  nose: Point;
  leftShoulder: Point;
  rightShoulder: Point;
  leftElbow: Point;
  rightElbow: Point;
  leftWrist: Point;
  rightWrist: Point;
  leftHip: Point;
  rightHip: Point;
  leftKnee: Point;
  rightKnee: Point;
  leftAnkle: Point;
  rightAnkle: Point;
  visibleBelowHip: boolean;
  visibleLegs: boolean;
}

export interface ImageAnalysis {
  imageWidth: number;
  imageHeight: number;
  faceDetected: boolean;
  faceCount: number;
  poseDetected: boolean;
  face?: FaceLandmarks;
  pose?: PoseLandmarks;
  /** -1 (turned left) .. 1 (turned right), 0 = frontal */
  yaw: number;
  /** rough confidence 0..1 used to drive warnings */
  confidence: number;
  suggestedType: DrawingType;
  warnings: string[];
}

export interface ConstructionPrimitive {
  kind: "circle" | "ellipse" | "line" | "path" | "curve" | "rect" | "dot" | "label";
  points?: Point[]; // for path/curve/line
  center?: Point; // for circle/ellipse/dot
  radiusX?: number;
  radiusY?: number;
  rotation?: number;
  width?: number;
  height?: number;
  color?: string;
  lineWidth?: number;
  dashed?: boolean;
  closed?: boolean;
  text?: string;
}

export interface StageLayer {
  /** Primitives introduced for the first time on this stage (drawn bold/accented) */
  newPrimitives: ConstructionPrimitive[];
}

export interface Stage {
  number: number;
  total: number;
  title: string;
  instruction: string;
  doThis: string;
  dontWorry: string;
  layer: StageLayer;
  /** true on the last stage: render clean line art instead of construction guides */
  isFinal: boolean;
}

export interface Tutorial {
  id: string;
  createdAt: number;
  style: DrawingStyle;
  type: DrawingType;
  analysis: ImageAnalysis;
  stages: Stage[];
}
