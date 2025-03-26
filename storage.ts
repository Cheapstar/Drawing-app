import { Element, Point } from "@/types/types";

export function saveElementsIntoStorage(elements: Element[]) {
  window.localStorage.setItem("elements", JSON.stringify(elements));
}

export function loadElementsFromStorage(): Element[] {
  try {
    const data = window.localStorage.getItem("elements");
    return data ? JSON.parse(data) : [];
  } catch {
    return []; // Return empty array if JSON is corrupted
  }
}

export function savePanOffsetIntoStorage(panOffset: Point) {
  window.localStorage.setItem("panOffset", JSON.stringify(panOffset));
}

export function loadPanOffsetFromStorage(): Point {
  try {
    const data = window.localStorage.getItem("panOffset");
    return data ? JSON.parse(data) : { x: 0, y: 0 };
  } catch {
    return { x: 0, y: 0 }; // Default pan offset if JSON is corrupted
  }
}

export function saveScaleIntoStorage(scale: number) {
  window.localStorage.setItem("scale", JSON.stringify(scale));
}

export function loadScaleFromStorage(): number {
  try {
    const data = window.localStorage.getItem("scale");
    return data ? JSON.parse(data) : 1;
  } catch {
    return 1; // Default scale to 1 if JSON is corrupted
  }
}
