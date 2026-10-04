// Standard MediaPipe Face Mesh topology indices (open, published as part of
// the Apache-2.0 MediaPipe project). These are just numeric point indices
// into the 468/478-point face mesh - used here to pull out the semantic
// groups (eyes, brows, lips, oval...) we need for Loomis-style construction.

export const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379,
  378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127,
  162, 21, 54, 103, 67, 109,
];

export const LEFT_EYE = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
export const RIGHT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];

export const LEFT_EYEBROW = [336, 296, 334, 293, 300, 276, 283, 282, 295, 285];
export const RIGHT_EYEBROW = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];

export const LIPS_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];
export const LIPS_INNER = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191];

export const NOSE_BRIDGE = [168, 6, 197, 195, 5, 4];
export const NOSE_TIP = 4;
export const NOSE_BASE = 2;
export const CHIN = 152;
export const FOREHEAD_TOP = 10;
export const LEFT_CHEEK = 454;
export const RIGHT_CHEEK = 234;
export const LEFT_TEMPLE = 356;
export const RIGHT_TEMPLE = 127;
export const MOUTH_LEFT = 291;
export const MOUTH_RIGHT = 61;
