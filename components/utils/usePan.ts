import { useEffect, useState } from "react";
import { point } from "@/Geometry/utils";

export function usePan() {
  const [panOffset, setPanOffSet] = useState(point(0, 0));
  const [startPanMousePosition, setStartPanMousePosition] = useState(
    point(0, 0)
  );

  // Handle wheel events for panning
  useEffect(() => {
    const panFunction = (event: WheelEvent) => {
      setPanOffSet((prevState) => ({
        x: prevState.x - event.deltaX,
        y: prevState.y - event.deltaY,
      }));
    };

    document.addEventListener("wheel", panFunction);
    return () => {
      document.removeEventListener("wheel", panFunction);
    };
  }, []);

  return {
    panOffset,
    setPanOffSet,
    startPanMousePosition,
    setStartPanMousePosition,
  };
}
