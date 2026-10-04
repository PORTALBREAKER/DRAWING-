import type { DrawingStyle } from "../types";

export interface StyleProfile {
  label: string;
  /** multiplies eye guide size */
  eyeScale: number;
  eyeDrop: number; // vertical shift of eyes relative to eye-line, lower = bigger forehead
  /** 1 = natural jaw, >1 = sharper/pointier chin, <1 = softer/rounder */
  chinSharpness: number;
  jawRoundness: number; // 0..1, higher = softer rounded jaw curve
  noseStyle: "simple" | "detailed" | "minimal";
  mouthStyle: "simple" | "detailed";
  hairVolume: number; // multiplier on hair mass size
  showFacialPlanes: boolean; // realistic mode extra construction
  headToBodyRatio: number; // used for body stages, bigger = more "chibi"/cartoon
  description: string;
}

export const STYLE_PROFILES: Record<DrawingStyle, StyleProfile> = {
  anime: {
    label: "Anime",
    eyeScale: 1.7,
    eyeDrop: 0.05,
    chinSharpness: 1.35,
    jawRoundness: 0.35,
    noseStyle: "minimal",
    mouthStyle: "simple",
    hairVolume: 1.35,
    showFacialPlanes: false,
    headToBodyRatio: 1.15,
    description: "large expressive eyes, a simplified nose, and a pointed, light jawline",
  },
  manga: {
    label: "Manga",
    eyeScale: 1.45,
    eyeDrop: 0.03,
    chinSharpness: 1.2,
    jawRoundness: 0.3,
    noseStyle: "minimal",
    mouthStyle: "simple",
    hairVolume: 1.2,
    showFacialPlanes: false,
    headToBodyRatio: 1.1,
    description: "sharper, more angular features with detailed, dynamic hair masses",
  },
  cartoon: {
    label: "Cartoon",
    eyeScale: 1.3,
    eyeDrop: 0.0,
    chinSharpness: 0.75,
    jawRoundness: 0.75,
    noseStyle: "simple",
    mouthStyle: "simple",
    hairVolume: 1.15,
    showFacialPlanes: false,
    headToBodyRatio: 1.3,
    description: "bold simplified shapes, a rounded jaw, and a strong, exaggerated silhouette",
  },
  realistic: {
    label: "Realistic",
    eyeScale: 1.0,
    eyeDrop: 0.0,
    chinSharpness: 1.0,
    jawRoundness: 0.15,
    noseStyle: "detailed",
    mouthStyle: "detailed",
    hairVolume: 1.0,
    showFacialPlanes: true,
    headToBodyRatio: 1.0,
    description: "accurate proportions, visible facial planes, and natural landmark placement",
  },
};

export function getStyleProfile(style: DrawingStyle): StyleProfile {
  return STYLE_PROFILES[style];
}
