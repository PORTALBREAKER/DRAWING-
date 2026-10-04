// STEP GENERATOR
// Turns a ConstructionModel into an ordered list of 8-10 teaching stages.
// Knows nothing about MediaPipe or canvases - purely sequencing + copy.
import type { ConstructionPrimitive, DrawingStyle, DrawingType, ImageAnalysis, Stage } from "../types";
import { getStyleProfile } from "./styleProfiles";
import type { ConstructionModel } from "./types";

interface StageDraft {
  title: string;
  instruction: string;
  doThis: string;
  dontWorry: string;
  groups: (ConstructionPrimitive[] | undefined)[];
  isFinal?: boolean;
}

function flat(...groups: (ConstructionPrimitive[] | undefined)[]): ConstructionPrimitive[] {
  return groups.filter(Boolean).flatMap((g) => g as ConstructionPrimitive[]);
}

export function generateStages(model: ConstructionModel, analysis: ImageAnalysis, style: DrawingStyle, type: DrawingType): Stage[] {
  const profile = getStyleProfile(style);
  const drafts: StageDraft[] = type === "face" ? faceStages(model, profile.label, profile.description) : type === "portrait" ? portraitStages(model, profile.label, profile.description) : bodyStages(model, profile.label, profile.description, type);

  const total = drafts.length;
  let acc: ConstructionPrimitive[] = [];
  const stages: Stage[] = drafts.map((d, i) => {
    const newPrimitives = d.isFinal ? flat(...d.groups) : flat(...d.groups);
    const stage: Stage = {
      number: i + 1,
      total,
      title: d.title,
      instruction: d.instruction,
      doThis: d.doThis,
      dontWorry: d.dontWorry,
      layer: { newPrimitives },
      isFinal: !!d.isFinal,
    };
    if (!d.isFinal) acc = acc.concat(newPrimitives);
    return stage;
  });

  void acc;
  void analysis;
  return stages;
}

function faceStages(m: ConstructionModel, styleLabel: string, styleDesc: string): StageDraft[] {
  return [
    {
      title: "Basic Head Sphere",
      instruction: "Every head starts life as a ball. Draw a light, even circle - this will hold all your proportions.",
      doThis: "Draw one light circle for the cranium.",
      dontWorry: "Don't worry about the jaw, ears or hair yet.",
      groups: [m.headSphere],
    },
    {
      title: "Loomis Side Plane",
      instruction: "Add the flat side-plane line that wraps around the ball. It shows which way the head is turned in space.",
      doThis: "Add the dashed plane line and the brow band around the sphere.",
      dontWorry: "Keep these lines very light - they're just scaffolding.",
      groups: [m.sidePlane],
    },
    {
      title: "Vertical Center Line",
      instruction: "Draw the center line following the direction the head is facing. It curves around the sphere with the turn.",
      doThis: "Draw one smooth line from the hairline, through the nose, to the chin.",
      dontWorry: "Don't add any features yet - this line only sets direction.",
      groups: [m.centerLine],
    },
    {
      title: "Horizontal Eye Line",
      instruction: "Add the eye line guide across the middle of the sphere, plus a lighter brow line above it.",
      doThis: "Add the eye guideline, wrapping it slightly around the curve of the head.",
      dontWorry: "Don't place the eyes themselves yet - just the guideline.",
      groups: [m.eyeLine],
    },
    {
      title: "Construct the Jaw",
      instruction: "Build the jaw underneath the head sphere, hanging from the cheekbone width down to the chin point.",
      doThis: "Draw the jawline from each cheekbone down to the chin.",
      dontWorry: "Keep it simple - fine jaw detail comes later.",
      groups: [m.jaw],
    },
    {
      title: `Place Eyes, Nose & Mouth (${styleLabel})`,
      instruction: `Place the eyes along the eye guideline, then add a simple nose and mouth. ${styleLabel} style uses ${styleDesc}.`,
      doThis: "Place the eyes on the guideline, about one eye-width apart, then add the nose and mouth guides.",
      dontWorry: "Don't render eyelashes or lip detail yet - just placement shapes.",
      groups: [m.features, m.ears],
    },
    {
      title: "Block In the Hair",
      instruction: "Block the hair as one large, simple shape sitting on top of the head sphere - not individual strands.",
      doThis: "Draw one big simplified hair mass, slightly larger than the skull.",
      dontWorry: "Don't draw individual hair strands yet.",
      groups: [m.hairMass],
    },
    {
      title: "Add Neck & Shoulders",
      instruction: "Connect the head to the body. Add a neck that's narrower than the jaw, then simple shoulder lines.",
      doThis: "Draw two neck lines from the jaw down, then a shoulder line.",
      dontWorry: "Clothing folds and collar detail can wait.",
      groups: [m.neck],
    },
    {
      title: "Refine the Details",
      instruction: "Now clean the construction lines and sharpen the features: eyebrows, pupils, and (in realistic mode) facial planes.",
      doThis: "Darken the features you're keeping and lighten everything else.",
      dontWorry: "Don't erase your construction yet - just refine over it.",
      groups: [m.refineDetails],
    },
    {
      title: "Clean Final Sketch",
      instruction: "Erase the construction lines and leave only the clean, confident linework underneath.",
      doThis: "Trace your favorite lines from the construction in a clean, final pass.",
      dontWorry: "Nothing left to worry about - this is the finished construction.",
      groups: [m.finalLines],
      isFinal: true,
    },
  ];
}

function portraitStages(m: ConstructionModel, styleLabel: string, styleDesc: string): StageDraft[] {
  // Portrait = face stages plus a touch more neck/shoulder emphasis; share the same list for consistency.
  return faceStages(m, styleLabel, styleDesc);
}

function bodyStages(m: ConstructionModel, styleLabel: string, styleDesc: string, type: DrawingType): StageDraft[] {
  const isFull = type === "full-body";
  return [
    {
      title: "Basic Shapes: Head, Ribcage & Pelvis",
      instruction: "Block in the three main body masses first: a ball for the head, an egg for the ribcage, and a wedge for the pelvis.",
      doThis: "Draw the head circle plus the ribcage and pelvis shapes.",
      dontWorry: "Don't worry about limbs, hands or clothing yet.",
      groups: [m.headSphere, m.bodyMasses],
    },
    {
      title: "Loomis Side Plane & Balance",
      instruction: "Add the side-plane line on the head, and notice how the ribcage and pelvis tilt opposite each other for balance.",
      doThis: "Add the head's plane line and check the tilt of your two torso shapes.",
      dontWorry: "Keep everything light - this is still scaffolding.",
      groups: [m.sidePlane],
    },
    {
      title: "Center Line & Spine",
      instruction: "Draw the face's center line, then the spine (action line) flowing from the head through the torso.",
      doThis: "Draw one flowing line from the head down through the ribcage and pelvis.",
      dontWorry: "Don't add arms or legs to this line yet.",
      groups: [m.centerLine, m.actionLine],
    },
    {
      title: "Eye Line, Shoulder Line & Hip Line",
      instruction: "Add the eye guideline on the face, then the shoulder line and hip line across the torso.",
      doThis: "Add the eye line, shoulder line, and hip line guides.",
      dontWorry: "Proportions matter more than details right now.",
      groups: [m.eyeLine, m.shoulderHipLines],
    },
    {
      title: "Construct the Jaw & Torso Connection",
      instruction: "Build the jaw under the head sphere, then connect the ribcage and pelvis with a simple waistline.",
      doThis: "Draw the jawline, then connect the ribcage and pelvis shapes at the waist.",
      dontWorry: "Keep the waist connection simple - just two lines.",
      groups: [m.jaw],
    },
    {
      title: `Place Eyes, Nose & Mouth (${styleLabel})`,
      instruction: `Place the face guides along the eye line. ${styleLabel} style uses ${styleDesc}.`,
      doThis: "Place the eyes, nose and mouth guides on the face.",
      dontWorry: "Don't add facial detail yet - just placement.",
      groups: [m.features, m.ears],
    },
    {
      title: isFull ? "Build the Arms & Legs" : "Build the Arms",
      instruction: isFull
        ? "Block in the arms and legs as simple tapered cylinders from each joint to the next."
        : "Block in the arms as simple tapered cylinders from the shoulder to the hand.",
      doThis: "Draw each limb as a tapered tube shape between its joints.",
      dontWorry: "Don't worry about muscles or fabric yet - just the tube shapes.",
      groups: [m.limbs],
    },
    {
      title: "Hands, Feet, Hair & Clothing Silhouette",
      instruction: "Add simple shapes for the hands and feet, block the hair mass, and sketch the clothing's outer silhouette.",
      doThis: "Add simplified hand/foot shapes, the hair mass, and one clothing outline.",
      dontWorry: "Skip fingers, shoelaces and fabric folds for now.",
      groups: [m.handsFeet, m.hairMass, m.clothing],
    },
    {
      title: "Refine the Details",
      instruction: "Clean up the construction and add the details that matter: eyebrows, major clothing folds, and finger/toe hints.",
      doThis: "Darken the lines you're keeping; lighten the rest.",
      dontWorry: "You still don't need to erase anything yet.",
      groups: [m.refineDetails],
    },
    {
      title: "Clean Final Sketch",
      instruction: "Erase the construction and leave a clean final line drawing of the figure.",
      doThis: "Trace your favorite lines in one confident final pass.",
      dontWorry: "Nothing left to worry about - this is the finished construction.",
      groups: [m.finalLines, m.bodyFinalLines],
      isFinal: true,
    },
  ];
}
