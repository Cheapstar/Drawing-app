import { AppState } from "./types";
import { TOOL } from "./types/types";

export const DEFAULT_STROKE_OPTIONS = {
  size: 16,
  smoothing: 0.5,
  thinning: 0.5,
  streamline: 0.5,
  easing: (t: number) => t,
  start: {
    taper: 0,
    cap: true,
  },
  end: {
    taper: 0,
    cap: true,
  },
};

export const PADDING = {
  line: 0,
  rectangle: 10,
  freehand: 10,
};

export const CURSOR_RANGE = 10;

// Tools configuration
export const TOOLS: Record<TOOL | string, { cursor: string }> = {
  rectangle: { cursor: "crosshair" },
  line: { cursor: "crosshair" },
  move: { cursor: "move" },
  select: { cursor: "default" },
  freehand: { cursor: "crosshair" },
  text: { cursor: "text" },
  pan: { cursor: "grab" },
  eraser: {
    cursor: `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAANlJREFUOE9jZKAyYKSyeQzDw0AfBgYGPWjQXGJgYNiCL5jwedmHj49vtrq6OoejoyMvyJD9+/d/vnnz5o9Pnz6l4jIYl4E+7Ozsa1evXs3m6+uL4qDNmzczhIaG/vr582cwNkOxGsjHx/d8yZIlEuiGwUwGGRoTE/Pi06dPkujex2agj6mp6eJTp04J4AsrMzOzD6dPn45FdyU2A6vKysqaOjs7mfEZWF5e/rerq6uOgYGhDVkdXQykupcZqB0poCChbrKBBjJVEzZyxFEt65FVsg2P4oskrwMAC4ZwFWmZPgcAAAAASUVORK5CYII="), auto`,
  },
};

export const defaultAppState: AppState = {
  elements: null,
  scale: {
    value: 1,
    offSet: 0,
  },
  pan: {
    offset: 0,
    startPos: 0,
  },
  mouse: {
    x: 0,
    y: 0,
  },
  visibleElements: null,
  selectedElement: null,
  multiSelectedElement: null,
  tool: "Pointer",
  action: "Selection",
  drawingElement: null,
  color: "#000000",
  font: "16px Arial",
  edge: "sharp", // assuming this is a string-based config, you can update this as per usage
  strokeWidth: 1, // likely a typo; see note below
  fill: "transparent",
};
