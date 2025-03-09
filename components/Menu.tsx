"use client";
import { ColorPicker } from "./ColorPicker";
import { StrokeWidthSelector } from "./StrokeWidthSelector";
import { TextOptions } from "./TextOptions";

export function Menu() {
  return (
    <div className="flex flex-col gap-2">
      <ColorPicker></ColorPicker>
      <StrokeWidthSelector></StrokeWidthSelector>
      <TextOptions></TextOptions>
    </div>
  );
}
