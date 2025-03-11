import { Drawable } from "roughjs/bin/core";

// Core position and selection types
export type Point = {
  x: number;
  y: number;
};

export type SelectedPosition =
  | "inside"
  | "tl"
  | "tr"
  | "bl"
  | "br"
  | "start"
  | "end"
  | "b"
  | "t"
  | "l"
  | "r"
  | null;

// Tool and action enums for better type safety
export type TOOL =
  | "rectangle"
  | "line"
  | "move"
  | "select"
  | "freehand"
  | "text"
  | "pan"
  | "eraser";

export type Action =
  | "drawing"
  | "selecting"
  | "moving"
  | "resizing"
  | "writing"
  | "panning"
  | "erasing"
  | "none";

export enum Shapes {
  Rectangle = "rectangle",
  Line = "line",
  Text = "text",
  Freehand = "freehand",
  Ellipse = "ellipse",
  Arrow = "arrow",
}

// Base element properties shared by all shapes
export interface BaseElement {
  id: string;
  type: string;
  color?: string;
  strokeWidth?: number;
  opacity?: number;
  status?: string;
  selectedPosition?: SelectedPosition;
  offsetX?: number[];
  offsetY?: number[];
}

// Common properties for elements with x1, y1, x2, y2 coordinates
export interface GeometricElement extends BaseElement {
  x1: number;
  y1: number;
  x2?: number;
  y2?: number;
  drawnShape?: Drawable;
}

// Rectangle specific properties
export interface RectangleElement extends GeometricElement {
  type: "rectangle";
  x2: number;
  y2: number;
}

// Line specific properties
export interface LineElement extends GeometricElement {
  type: "line";
  x2: number;
  y2: number;
}

// Text specific properties
export interface TextElement extends GeometricElement {
  type: "text";
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  x2?: number;
  y2?: number;
}

// Freehand specific properties
export interface FreehandElement extends BaseElement {
  type: "freehand";
  x1: number;
  y1: number;
  x2?: number;
  y2?: number;
  stroke: number[][];
  path?: Path2D;
  drawnShape?: Drawable;
}

// Ellipse specific properties
export interface EllipseElement extends GeometricElement {
  type: "ellipse";
  x2: number;
  y2: number;
}

// Arrow specific properties
export interface ArrowElement extends GeometricElement {
  type: "arrow";
  x2: number;
  y2: number;
}

// Union type of all possible elements
export type Element =
  | RectangleElement
  | LineElement
  | TextElement
  | FreehandElement
  | EllipseElement
  | ArrowElement;
