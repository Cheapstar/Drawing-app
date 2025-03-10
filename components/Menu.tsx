"use client";
import { ColorPicker } from "./ColorPicker";
import { StrokeWidthSelector } from "./StrokeWidthSelector";
import { TextOptions } from "./TextOptions";

interface MenuProps{
  darkMode : boolean
}

export function Menu({darkMode} : MenuProps) {
  return (
    <div className="flex flex-col gap-2">
      <ColorPicker darkMode={darkMode}></ColorPicker>
      <StrokeWidthSelector darkMode={darkMode}></StrokeWidthSelector>
      <TextOptions darkMode={darkMode}></TextOptions>
    </div>
  );
}
