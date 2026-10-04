/**
 * Central brand configuration.
 *
 * Everything the UI shows for the product's name/tagline reads from here,
 * so re-branding the whole app later is a one-file change.
 */
export const BRAND = {
  name: "DrawForge",
  shortName: "DrawForge",
  tagline: "Turn Any Image Into a Drawing Lesson",
  subtitle: "Upload a reference and learn to draw it step by step.",
  description:
    "DrawForge analyzes a reference photo in your browser and builds an original, Loomis-style construction tutorial so you can learn to draw it stage by stage.",
} as const;

export type BrandConfig = typeof BRAND;
