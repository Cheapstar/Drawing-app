import { Element, Point } from "@/types/types";

export function saveElementsIntoStorage(elements: Element[]) {
  window.localStorage.setItem("elements", JSON.stringify(elements));
}

export function loadElementsFromStorage() {
  return JSON.parse((window.localStorage.getItem("elements") as string) || "");
}

export function savePanOffsetIntoStorage(panOffset: Point) {
  window.localStorage.setItem("panOffset", JSON.stringify(panOffset));
}
export function loadPanOffsetFromStorage() {
  return JSON.parse((window.localStorage.getItem("panOffset") as string) || "");
}
export function saveScaleIntoStorage(scale: number) {
  window.localStorage.setItem("scale", JSON.stringify(scale));
}
export function loadScaleFromStorage() {
  return JSON.parse((window.localStorage.getItem("scale") as string) || "");
}
