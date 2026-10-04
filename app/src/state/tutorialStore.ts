import { create } from "zustand";
import type { DrawingStyle, DrawingType, ImageAnalysis, Stage } from "../lib/types";
import { analyzeImage, AnalysisError } from "../lib/analysis/analyzeImage";
import { buildConstructionModel } from "../lib/construction/loomisEngine";
import { generateStages } from "../lib/construction/stageGenerator";
import { loadImageFromDataUrl, resizeToDataUrl } from "../lib/imageUtils";

export interface ImageState {
  dataUrl: string;
  width: number;
  height: number;
}

export type GenerationStatus = "idle" | "analyzing" | "ready" | "error";
export type AnalysisStatus = "idle" | "analyzing" | "done" | "error";

interface TutorialState {
  original: ImageState | null;
  edited: ImageState | null;
  style: DrawingStyle;
  type: DrawingType;
  typeManuallySet: boolean;
  autoDetectedType: DrawingType | null;
  analysis: ImageAnalysis | null;
  analysisStatus: AnalysisStatus;
  stages: Stage[];
  currentStageIndex: number;
  unlockedStageIndex: number;
  status: GenerationStatus;
  errorMessage: string | null;

  setOriginal: (img: ImageState) => void;
  setEdited: (img: ImageState) => void;
  setStyle: (style: DrawingStyle) => void;
  setType: (type: DrawingType, manual?: boolean) => void;
  resetImage: () => void;
  resetAll: () => void;
  analyzeCurrentImage: () => Promise<void>;
  generateTutorial: () => Promise<boolean>;
  goToStage: (i: number) => void;
  nextStage: () => void;
  prevStage: () => void;
}

export const useTutorialStore = create<TutorialState>((set, get) => ({
  original: null,
  edited: null,
  style: "anime",
  type: "portrait",
  typeManuallySet: false,
  autoDetectedType: null,
  analysis: null,
  analysisStatus: "idle",
  stages: [],
  currentStageIndex: 0,
  unlockedStageIndex: 0,
  status: "idle",
  errorMessage: null,

  setOriginal: (img) =>
    set({
      original: img,
      edited: img,
      analysis: null,
      analysisStatus: "idle",
      typeManuallySet: false,
      stages: [],
      status: "idle",
    }),
  setEdited: (img) => set({ edited: img, analysis: null, analysisStatus: "idle", stages: [], status: "idle" }),
  setStyle: (style) => set({ style }),
  setType: (type, manual = true) => set({ type, typeManuallySet: manual || get().typeManuallySet }),

  resetImage: () =>
    set({
      original: null,
      edited: null,
      analysis: null,
      analysisStatus: "idle",
      stages: [],
      currentStageIndex: 0,
      unlockedStageIndex: 0,
      status: "idle",
      errorMessage: null,
      typeManuallySet: false,
    }),

  resetAll: () =>
    set({
      original: null,
      edited: null,
      style: "anime",
      type: "portrait",
      typeManuallySet: false,
      autoDetectedType: null,
      analysis: null,
      analysisStatus: "idle",
      stages: [],
      currentStageIndex: 0,
      unlockedStageIndex: 0,
      status: "idle",
      errorMessage: null,
    }),

  analyzeCurrentImage: async () => {
    const { edited, typeManuallySet } = get();
    if (!edited || get().analysisStatus === "analyzing") return;
    set({ analysisStatus: "analyzing" });
    try {
      const img = await loadImageFromDataUrl(edited.dataUrl);
      const needsResize = img.naturalWidth > 1600 || img.naturalHeight > 1600;
      const analysisImg = needsResize ? await loadImageFromDataUrl(resizeToDataUrl(img, 1280).dataUrl) : img;
      const analysis = await analyzeImage(analysisImg);
      set({
        analysis,
        analysisStatus: "done",
        autoDetectedType: analysis.suggestedType,
        type: typeManuallySet ? get().type : analysis.suggestedType,
      });
    } catch {
      set({ analysisStatus: "error" });
    }
  },

  generateTutorial: async () => {
    const { edited, style, type, analysis } = get();
    if (!edited) {
      set({ status: "error", errorMessage: "Upload an image first." });
      return false;
    }
    set({ status: "analyzing", errorMessage: null });
    try {
      let finalAnalysis = analysis;
      if (!finalAnalysis) {
        const img = await loadImageFromDataUrl(edited.dataUrl);
        const needsResize = img.naturalWidth > 1600 || img.naturalHeight > 1600;
        const analysisImg = needsResize ? await loadImageFromDataUrl(resizeToDataUrl(img, 1280).dataUrl) : img;
        finalAnalysis = await analyzeImage(analysisImg);
        set({ analysis: finalAnalysis, analysisStatus: "done", autoDetectedType: finalAnalysis.suggestedType });
      }

      let effectiveType = type;
      if ((type === "half-body" || type === "full-body") && !finalAnalysis.pose) {
        effectiveType = finalAnalysis.face ? "portrait" : "face";
        finalAnalysis = {
          ...finalAnalysis,
          warnings: [
            ...finalAnalysis.warnings,
            "No body pose could be detected, so DrawForge built a face/portrait construction instead. Try a photo where the shoulders and torso are clearly visible for a full-body tutorial.",
          ],
        };
        set({ analysis: finalAnalysis, type: effectiveType });
      }

      const model = buildConstructionModel(finalAnalysis, style, effectiveType);
      const stages = generateStages(model, finalAnalysis, style, effectiveType);

      set({
        stages,
        currentStageIndex: 0,
        unlockedStageIndex: 0,
        status: "ready",
        errorMessage: null,
      });
      return true;
    } catch (err) {
      const friendly =
        err instanceof AnalysisError
          ? err.friendly
          : "Something went wrong analyzing that image. Try a clearer, well-lit photo with the subject centered.";
      set({ status: "error", errorMessage: friendly });
      return false;
    }
  },

  goToStage: (i) => {
    const { unlockedStageIndex, stages } = get();
    if (i < 0 || i >= stages.length) return;
    if (i > unlockedStageIndex) return;
    set({ currentStageIndex: i });
  },

  nextStage: () => {
    const { currentStageIndex, stages, unlockedStageIndex } = get();
    const next = Math.min(stages.length - 1, currentStageIndex + 1);
    set({ currentStageIndex: next, unlockedStageIndex: Math.max(unlockedStageIndex, next) });
  },

  prevStage: () => {
    const { currentStageIndex } = get();
    set({ currentStageIndex: Math.max(0, currentStageIndex - 1) });
  },
}));
