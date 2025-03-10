"use client";

import { strokeWidthAtom } from "@/store/store";
import { useAtom } from "jotai";

interface StrokeProps{
  darkMode : boolean
}

export function StrokeWidthSelector({darkMode} : StrokeProps) {
  const [strokeWidth, setStrokeWidth] = useAtom(strokeWidthAtom);

  return (
    <div>
      <div>
        <p className={`py-2 text-xs ${darkMode ? "text-gray-300" : "text-gray-600"} `}>Stroke Width</p>
      </div>
      <div className="flex gap-2">
      <button
  className={`h-8 w-8 rounded-md flex justify-center items-center transition-all ${
    darkMode
      ? strokeWidth === 16
      ? "ring-2 ring-[#403E6A] ring-offset-1 bg-[#393950] hover:bg-[#403E6A]"
      : "hover:ring-1 hover:ring-[#403E6A] bg-[#393950] hover:bg-[#403E6A]"
      : strokeWidth === 16
      ? "ring-2 ring-blue-500 ring-offset-1 bg-[#CCCCFF] hover:bg-[#CCCCFF]"
      : "bg-gray-200 hover:bg-[#f2f2fa]"
    }`}
  onClick={() => setStrokeWidth(16)}
>
  <div className={`w-[40%] h-[1px] rounded-md ${darkMode ? "bg-white" : "bg-black"}`}></div>
      </button>

      <button
        className={`h-8 w-8 rounded-md flex justify-center items-center transition-all ${
          darkMode
            ? strokeWidth === 24
              ? "ring-2 ring-[#403E6A] ring-offset-1 bg-[#393950] hover:bg-[#403E6A]"
              : "hover:ring-1 hover:ring-[#403E6A] bg-[#393950] hover:bg-[#403E6A]"
            : strokeWidth === 24
            ? "ring-2 ring-blue-500 ring-offset-1 bg-[#CCCCFF] hover:bg-[#CCCCFF]"
            : "bg-gray-200 hover:bg-[#f2f2fa]"
        }`}
        onClick={() => setStrokeWidth(24)}
      >
        <div className={`w-[40%] h-[2px] rounded-md ${darkMode ? "bg-white" : "bg-black"}`}></div>
      </button>

      <button
        className={`h-8 w-8 rounded-md flex justify-center items-center transition-all ${
          darkMode
            ? strokeWidth === 32
            ? "ring-2 ring-[#403E6A] ring-offset-1 bg-[#393950] hover:bg-[#403E6A]"
            : "hover:ring-1 hover:ring-[#403E6A] bg-[#393950] hover:bg-[#403E6A]"
            : strokeWidth === 32
            ? "ring-2 ring-blue-500 ring-offset-1 bg-[#CCCCFF] hover:bg-[#CCCCFF]"
            : "bg-gray-200 hover:bg-[#f2f2fa]"
        }`}
        onClick={() => setStrokeWidth(32)}
      >
        <div className={`w-[40%] h-[4px] rounded-md ${darkMode ? "bg-white" : "bg-black"}`}></div>
      </button>

      </div>
    </div>
  );
}
