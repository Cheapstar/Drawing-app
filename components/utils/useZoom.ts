// hooks/useZoom.js
import { useCallback, useEffect, useRef, useState } from "react";
import { point } from "../utils/position";

export function useZoom() {
  const [scale, setScale] = useState(1);
  const [scaleOffset, setScaleOffset] = useState(point(0, 0));

  const lastDistance = useRef<number>(0);

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
      event.preventDefault(); // Prevent browser zoom-in

      onZoom(-0.1);
    }
  }, []);

  function getDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  const handleTouchStart = useCallback((event: TouchEvent) => {
    console.log("Touch start detected");

    if (event.touches.length === 2) {
      lastDistance.current = getDistance(event.touches);
    }
  }, []);
  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (event.touches.length === 2) {
      lastDistance.current = 0;
    }
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (event.touches.length === 2) {
      console.log("Zooming");
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyZoom);
    document.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    document.addEventListener("touchend", handleTouchEnd, { passive: false });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("keydown", handleKeyZoom);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, [handleKeyZoom]);

  return {
    scale,
    setScale,
    scaleOffset,
    setScaleOffset,
    onZoom,
  };
}
