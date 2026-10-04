import type { Stage } from "../types";
import { renderStageToCanvas } from "./canvasRenderer";

export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }, "image/png");
}

export function renderOffscreenStage(
  stage: Stage,
  previous: Stage[],
  refImage: HTMLImageElement | null,
  size = 900,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  renderStageToCanvas(canvas, {
    referenceImage: refImage,
    sourceAspect: refImage ? refImage.naturalWidth / refImage.naturalHeight : 1,
    referenceOpacity: stage.isFinal ? 0 : 0.18,
    showGuides: true,
    guideOpacity: 1,
    previousPrimitives: previous.flatMap((s) => s.layer.newPrimitives),
    newPrimitives: stage.layer.newPrimitives,
    isFinal: stage.isFinal,
    background: "#ffffff",
  });
  return canvas;
}

export function exportStageAsPng(stage: Stage, previous: Stage[], refImage: HTMLImageElement | null) {
  const canvas = renderOffscreenStage(stage, previous, refImage);
  downloadCanvasAsPng(canvas, `drawforge-stage-${stage.number}.png`);
}

export async function exportFullTutorialPdf(stages: Stage[], refImage: HTMLImageElement | null, title = "DrawForge Tutorial") {
  const { default: jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  stages.forEach((stage, idx) => {
    const previous = stages.slice(0, idx);
    const canvas = renderOffscreenStage(stage, previous, refImage, 1000);
    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    if (idx > 0) pdf.addPage();

    pdf.setFontSize(16);
    pdf.setTextColor("#141019");
    pdf.text(`${title}`, 40, 40);
    pdf.setFontSize(13);
    pdf.text(`Stage ${stage.number} / ${stage.total} - ${stage.title}`, 40, 62);

    const imgSize = pageW - 80;
    pdf.addImage(imgData, "JPEG", 40, 80, imgSize, imgSize);

    const textY = 80 + imgSize + 24;
    pdf.setFontSize(11);
    const wrapped = pdf.splitTextToSize(stage.instruction, pageW - 80);
    pdf.text(wrapped, 40, textY);
    const doWrapped = pdf.splitTextToSize(`Do this: ${stage.doThis}`, pageW - 80);
    pdf.text(doWrapped, 40, Math.min(textY + wrapped.length * 14 + 16, pageH - 60));
  });

  pdf.save("drawforge-tutorial.pdf");
}
