// Standard dlib/iBUG 68-point facial landmark scheme, as produced by
// @vladmandic/face-api's FaceLandmark68Net (self-hosted, see faceApiEngine.ts).
// This is the same, decades-old, widely published point ordering used by
// dlib, OpenFace, and most classic facial-landmark research - documented at
// https://ibug.doc.ic.ac.uk/resources/300-W/.
//
// Convention (matches the published iBUG diagrams): indices are labelled
// from the SUBJECT's own point of view, so "right eye" sits on the
// image-left side for a camera-facing subject, mirroring how MediaPipe's
// face mesh topology was labelled in the previous version of this file.
// Verified empirically against real detections in scripts/testFaceApiNode.mjs.

export const JAW = range(0, 17); // 0 = subject's right temple/ear, 8 = chin, 16 = subject's left temple/ear
export const RIGHT_EYEBROW = range(17, 22);
export const LEFT_EYEBROW = range(22, 27);
export const NOSE_BRIDGE = range(27, 31); // top (between the eyes) to bottom (tip)
export const NOSE_BASE = range(31, 36); // nostril wing-to-wing arc
export const RIGHT_EYE = range(36, 42);
export const LEFT_EYE = range(42, 48);
export const MOUTH_OUTER = range(48, 60);
export const MOUTH_INNER = range(60, 68);

export const CHIN = 8; // bottom-center of the jaw
export const NOSE_TIP = 30; // bottom of the nose bridge
export const NOSE_BASE_CENTER = 33; // bottom-center of the nose, between nostrils
export const RIGHT_TEMPLE = 0; // approximated from the jaw's ear-height endpoint
export const LEFT_TEMPLE = 16;
export const RIGHT_CHEEK = 3; // upper-jaw point, roughly cheekbone height
export const LEFT_CHEEK = 13;
export const MOUTH_RIGHT_CORNER = 48;
export const MOUTH_LEFT_CORNER = 54;

function range(start: number, endExclusive: number): number[] {
  const out: number[] = [];
  for (let i = start; i < endExclusive; i++) out.push(i);
  return out;
}
