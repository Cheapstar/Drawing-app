import { useState } from "react";
import { point } from "../utils/position";

export function usePan() {
  const [panOffset, setPanOffSet] = useState(point(0, 0));
  const [startPanMousePosition, setStartPanMousePosition] = useState(
    point(0, 0)
  );

  return {
    panOffset,
    setPanOffSet,
    startPanMousePosition,
    setStartPanMousePosition,
  };
}
