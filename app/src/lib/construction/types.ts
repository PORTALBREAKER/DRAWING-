import type { ConstructionPrimitive } from "../types";

/**
 * A named set of construction groups extracted from the image analysis.
 * The Step Generator consumes this to decide what appears on each stage -
 * the Loomis Engine itself knows nothing about stages/ordering/teaching
 * copy, keeping the two concerns decoupled (see README architecture notes).
 */
export interface ConstructionModel {
  hasHead: boolean;
  hasBody: boolean;
  headSphere?: ConstructionPrimitive[];
  sidePlane?: ConstructionPrimitive[];
  centerLine?: ConstructionPrimitive[];
  eyeLine?: ConstructionPrimitive[];
  jaw?: ConstructionPrimitive[];
  features?: ConstructionPrimitive[];
  ears?: ConstructionPrimitive[];
  hairMass?: ConstructionPrimitive[];
  neck?: ConstructionPrimitive[];
  refineDetails?: ConstructionPrimitive[];
  finalLines?: ConstructionPrimitive[];

  // body-only groups
  bodyMasses?: ConstructionPrimitive[]; // ribcage + pelvis blocks
  actionLine?: ConstructionPrimitive[];
  shoulderHipLines?: ConstructionPrimitive[];
  limbs?: ConstructionPrimitive[];
  handsFeet?: ConstructionPrimitive[];
  clothing?: ConstructionPrimitive[];
  bodyFinalLines?: ConstructionPrimitive[];
}
