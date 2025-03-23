// hooks/useZoom.js
import { useCallback, useEffect, useState } from "react";
import { point } from "../utils/position";

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
    event.stopPropagation();

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

  useEffect(() => {
    window.addEventListener("keydown", handleKeyZoom);

    return () => {
      window.removeEventListener("keydown", handleKeyZoom);
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
