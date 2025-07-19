export interface AppState {
  elements: XDrawElement[] | null;
  scale: {
    value: number;
    offSet: number;
  };
  pan: {
    offset: number;
    startPos: number;
  };
  mouse: GlobalPoint;
  visibleElements: XDrawElement[] | null;
  selectedElement: XDrawElement | null;
  multiSelectedElement: XDrawElement[] | null;
  tool: Tool;
  action: Action;
  drawingElement: XDrawElement | null;
  color: string;
  font: string;
  edge: string;
  strokeWidth: number;
  fill: string;
}

export type Action = "Selection" | "Pan" | "Drawing" | "Svg" | "Image";
export type Tool =
  | "Pointer"
  | "Pan"
  | "Rectangle"
  | "Circle"
  | "Line"
  | "Laser"
  | "Eraser"
  | "Image";

export interface XDrawElement {
  x: number;
  y: number;
  color: string;
  strokeWidth: number;
}

export type GlobalPoint = {
  x: number;
  y: number;
};

export type Point = {
  x: number;
  y: number;
};

export interface XDrawRectangleElement extends XDrawElement {
  width: number;
  height: number;
  fill: string | null;
}

export interface XDrawCircleElement extends XDrawElement {
  radius: number;
  fill: string | null;
  center: Point;
}

export interface XDrawLineElement extends XDrawElement {
  endPoints: Point;
}
