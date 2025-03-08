"use client";

import { strokeWidthAtom } from "@/store/store";
import { useAtom } from "jotai";

export function StrokeWidthSelector() {
  const [strokeWidth, setStrokeWidth] = useAtom(strokeWidthAtom);

  return (
    <div>
      <div>
        <p className="py-2 text-xs text-gray-600">Stroke Width</p>
      </div>
      <div className="flex gap-2">
        <button
          className={`h-8 w-8  rounded-md flex justify-center items-center transition-all   ${
            strokeWidth === 16
              ? "bg-[#CCCCFF] hover:bg-[#CCCCFF]"
              : "bg-gray-200 hover:bg-[#f2f2fa] "
          }`}
          onClick={() => setStrokeWidth(16)}
        >
          <div className=" w-[40%] h-[1px] bg-black rounded-md"></div>
        </button>
        <button
          className={`h-8 w-8  rounded-md flex justify-center items-center transition-all  ${
            strokeWidth === 24
              ? "bg-[#CCCCFF] hover:bg-[#CCCCFF]"
              : "bg-gray-200 hover:bg-[#f2f2fa] "
          }`}
          onClick={() => setStrokeWidth(24)}
        >
          <div className="w-[40%] h-[2px] bg-black rounded-md"></div>
        </button>
        <button
          className={`h-8 w-8  rounded-md flex justify-center items-center transition-all  ${
            strokeWidth === 32
              ? "bg-[#CCCCFF] hover:bg-[#CCCCFF]"
              : "bg-gray-200 hover:bg-[#f2f2fa] "
          }`}
          onClick={() => setStrokeWidth(32)}
        >
          <div className="w-[40%] h-[4px] bg-black rounded-md"></div>
        </button>
      </div>
    </div>
  );
}
