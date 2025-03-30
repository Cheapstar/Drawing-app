/* eslint-disable @typescript-eslint/no-unused-vars */
import { Action, Point } from "@/types/types";
import React, { useEffect, useRef } from "react";

export function useCanvasAutoExpand(
  setPanOffset: React.Dispatch<React.SetStateAction<Point>>,
  action: Action,
  clientRef: React.RefObject<Point>,
  threshold: number = 5, // How close to the edge before expanding
  expandSpeed: number = 3, // Speed of expansion per frame
  intervalTime: number = 5 // How fast the interval triggers (ms)
) {}
