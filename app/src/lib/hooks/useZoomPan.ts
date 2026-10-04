import { useCallback, useRef, useState } from "react";

export interface ZoomPanState {
  zoom: number;
  pan: { x: number; y: number };
}

/**
 * Minimal, dependency-free pinch-zoom + drag-pan handler. Designed for
 * touch-first use (Practice Mode) but also works with mouse drag.
 */
export function useZoomPan(enabled: boolean) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lastDist = useRef<number | null>(null);
  const lastPan = useRef<{ x: number; y: number } | null>(null);
  const lastSingle = useRef<{ x: number; y: number } | null>(null);

  const reset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      lastSingle.current = { x: e.clientX, y: e.clientY };
      lastPan.current = { ...pan };
    } else if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values());
      lastDist.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pan]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled || !pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.current.size === 2) {
        const pts = Array.from(pointers.current.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (lastDist.current) {
          const delta = dist / lastDist.current;
          setZoom((z) => Math.min(5, Math.max(1, z * delta)));
        }
        lastDist.current = dist;
      } else if (pointers.current.size === 1 && lastSingle.current && lastPan.current) {
        const dx = e.clientX - lastSingle.current.x;
        const dy = e.clientY - lastSingle.current.y;
        setPan({ x: lastPan.current.x + dx, y: lastPan.current.y + dy });
      }
    },
    [enabled],
  );

  const endPointer = useCallback((e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    lastDist.current = null;
    if (pointers.current.size === 1) {
      const [[, p]] = Array.from(pointers.current.entries());
      lastSingle.current = p;
      lastPan.current = { ...pan };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pan]);

  const zoomBy = useCallback((factor: number) => setZoom((z) => Math.min(5, Math.max(1, z * factor))), []);

  return {
    zoom,
    pan,
    reset,
    zoomBy,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endPointer,
      onPointerCancel: endPointer,
      onPointerLeave: endPointer,
    },
  };
}
