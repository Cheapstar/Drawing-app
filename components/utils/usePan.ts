import { useEffect, useState } from "react";
import { point } from "../utils/position";

export function usePan() {
  const [panOffset, setPanOffSet] = useState(point(0, 0));
  const [startPanMousePosition, setStartPanMousePosition] = useState(
    point(0, 0)
  );

  const [expand, setExpand] = useState<boolean>(false);

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
    setExpand,
  };
}
