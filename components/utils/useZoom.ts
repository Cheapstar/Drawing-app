import { useCallback, useEffect, useState } from "react";
import { point } from "@/Geometry/utils";
import { loadScaleFromStorage, saveScaleIntoStorage } from "@/Geometry/storage";

export function useZoom() {
  const [scale, setScale] = useState(1);
  const [scaleOffset, setScaleOffset] = useState(point(0, 0));

  const onZoom = (delta: number) => {
    if (delta === 0) {
      setScale(1);
      return;
    }
    setScale((prevState) => Math.min(Math.max(prevState + delta, 0.1), 2));
  };

  const handleKeyZoom = useCallback((event: KeyboardEvent) => {
    if (
      (event.ctrlKey || event.metaKey) &&
      (event.key === "=" || event.key === "+")
    ) {
      event.preventDefault(); // Prevent browser zoom-in
      onZoom(0.1);
    }
    if (
      (event.ctrlKey || event.metaKey) &&
      (event.key === "_" || event.key === "-")
    ) {
      event.preventDefault(); // Prevent browser zoom-out
      onZoom(-0.1);
    }
  }, []);

  const handleWheelZoom = useCallback((event: WheelEvent) => {
    if (event.ctrlKey) {
      event.preventDefault();
      onZoom(event.deltaY < 0 ? 0.01 : -0.01);
    }
  }, []);

  const evCache: PointerEvent[] = [];
  let prevDiff = -1;

  const handlePointerDown = useCallback((ev: PointerEvent) => {
    evCache.push(ev);
  }, []);

  const handlePointerMove = useCallback((ev: PointerEvent) => {
    const index = evCache.findIndex((e) => e.pointerId === ev.pointerId);
    if (index !== -1) evCache[index] = ev;

    if (evCache.length === 2) {
      const dx = evCache[0].clientX - evCache[1].clientX;
      const dy = evCache[0].clientY - evCache[1].clientY;
      const curDiff = Math.sqrt(dx * dx + dy * dy);

      if (prevDiff > 0) {
        onZoom(curDiff > prevDiff ? 0.01 : -0.01);
      }
      prevDiff = curDiff;
    }
  }, []);

  const handlePointerUp = useCallback((ev: PointerEvent) => {
    const index = evCache.findIndex((e) => e.pointerId === ev.pointerId);
    if (index !== -1) evCache.splice(index, 1);
    if (evCache.length < 2) prevDiff = -1;
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyZoom);
    window.addEventListener("wheel", handleWheelZoom, { passive: false });
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    window.addEventListener("pointerout", handlePointerUp);
    window.addEventListener("pointerleave", handlePointerUp);

    return () => {
      window.removeEventListener("keydown", handleKeyZoom);
      window.removeEventListener("wheel", handleWheelZoom);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      window.removeEventListener("pointerout", handlePointerUp);
      window.removeEventListener("pointerleave", handlePointerUp);
    };
  }, [
    handleKeyZoom,
    handleWheelZoom,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  ]);

  useEffect(() => {
    const savedScale = loadScaleFromStorage();
    console.log("Saved Scale is", savedScale);
    if (!scale) return;

    setScale(savedScale);
  }, []);

  useEffect(() => {
    saveScaleIntoStorage(scale);
  }, [scale]);
  return {
    scale,
    setScale,
    scaleOffset,
    setScaleOffset,
    onZoom,
  };
}
