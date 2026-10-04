import { useEffect, useState } from "react";

export function useImageElement(dataUrl: string | null | undefined): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!dataUrl) {
      setImg(null);
      return;
    }
    let cancelled = false;
    const el = new Image();
    el.onload = () => {
      if (!cancelled) setImg(el);
    };
    el.src = dataUrl;
    return () => {
      cancelled = true;
    };
  }, [dataUrl]);

  return img;
}
