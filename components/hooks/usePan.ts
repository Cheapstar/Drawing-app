import { useEffect, useState } from "react";
import { point } from "@/Geometry/utils";
import { loadPanOffsetFromStorage, savePanOffsetIntoStorage } from "@/storage";

export function usePan() {
  const [panOffset, setPanOffset] = useState(point(0, 0));
  const [startPanMousePosition, setStartPanMousePosition] = useState(
    point(0, 0)
  );

  // Handle wheel events for panning
  useEffect(() => {
    const panFunction = (event: WheelEvent) => {
      setPanOffset((prevState) => ({
        x: prevState.x - event.deltaX,
        y: prevState.y - event.deltaY,
      }));
    };

    document.addEventListener("wheel", panFunction);
    return () => {
      document.removeEventListener("wheel", panFunction);
    };
  }, []);

  useEffect(() => {
    const savdPanOffset = loadPanOffsetFromStorage();
    if (!savdPanOffset) return;

    setPanOffset(savdPanOffset);
  }, []);

  useEffect(() => {
    savePanOffsetIntoStorage(panOffset);
  }, [panOffset]);

  return {
    panOffset,
    setPanOffset,
    startPanMousePosition,
    setStartPanMousePosition,
  };
}
