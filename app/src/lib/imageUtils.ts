// Client-side only image helpers. Nothing here ever leaves the browser.

export const MAX_DIMENSION = 1280; // keep analysis + canvases light on low-end phones

export interface LoadedImage {
  bitmap: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
  dataUrl: string;
}

export function isSupportedImage(file: File): boolean {
  return ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
    file.type.toLowerCase(),
  );
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

export function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image appears to be corrupt or unsupported."));
    img.src = dataUrl;
  });
}

/**
 * Downscale very large photos before any analysis/rendering happens so
 * weaker Android phones don't choke on huge camera images.
 */
export function resizeToDataUrl(
  img: HTMLImageElement,
  maxDim = MAX_DIMENSION,
): { dataUrl: string; width: number; height: number } {
  let { naturalWidth: w, naturalHeight: h } = img;
  if (w === 0 || h === 0) {
    w = img.width;
    h = img.height;
  }
  const scale = Math.min(1, maxDim / Math.max(w, h));
  const outW = Math.max(1, Math.round(w * scale));
  const outH = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  ctx.drawImage(img, 0, 0, outW, outH);
  return { dataUrl: canvas.toDataURL("image/jpeg", 0.92), width: outW, height: outH };
}

export function rotateImage(
  dataUrl: string,
  degrees: number,
): Promise<{ dataUrl: string; width: number; height: number }> {
  return loadImageFromDataUrl(dataUrl).then((img) => {
    const rad = (degrees * Math.PI) / 180;
    const swap = Math.abs(degrees % 180) === 90;
    const w = swap ? img.naturalHeight : img.naturalWidth;
    const h = swap ? img.naturalWidth : img.naturalHeight;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.translate(w / 2, h / 2);
    ctx.rotate(rad);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    return { dataUrl: canvas.toDataURL("image/jpeg", 0.95), width: w, height: h };
  });
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function cropImage(dataUrl: string, crop: CropRect): Promise<{ dataUrl: string; width: number; height: number }> {
  return loadImageFromDataUrl(dataUrl).then((img) => {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(crop.width));
    canvas.height = Math.max(1, Math.round(crop.height));
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(
      img,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    return { dataUrl: canvas.toDataURL("image/jpeg", 0.95), width: canvas.width, height: canvas.height };
  });
}

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Crops + rotates a source image to a flattened output, used by the
 * crop/rotate editor (react-easy-crop gives us rotation in degrees and a
 * pixel crop rectangle already expressed in the *rotated* image's space).
 */
export async function getCroppedRotatedImage(
  dataUrl: string,
  cropPixels: PixelCrop,
  rotationDeg: number,
): Promise<{ dataUrl: string; width: number; height: number }> {
  const img = await loadImageFromDataUrl(dataUrl);
  const rad = (rotationDeg * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const rotatedW = img.naturalWidth * cos + img.naturalHeight * sin;
  const rotatedH = img.naturalWidth * sin + img.naturalHeight * cos;

  const rotateCanvas = document.createElement("canvas");
  rotateCanvas.width = rotatedW;
  rotateCanvas.height = rotatedH;
  const rctx = rotateCanvas.getContext("2d")!;
  rctx.translate(rotatedW / 2, rotatedH / 2);
  rctx.rotate(rad);
  rctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(cropPixels.width));
  out.height = Math.max(1, Math.round(cropPixels.height));
  const octx = out.getContext("2d")!;
  octx.drawImage(
    rotateCanvas,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    out.width,
    out.height,
  );
  return { dataUrl: out.toDataURL("image/jpeg", 0.95), width: out.width, height: out.height };
}

export function fileSizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
