"use client";

import { showShareModalAtom } from "@/store/store";
import { useAtom } from "jotai";

export function ShareButton() {
  const [, setShowShareModal] = useAtom(showShareModalAtom);

  return (
    <button
      className="text-white bg-[#0D92F4] px-3 py-1.5 rounded-md 
      font-sans text-md hover:bg-[#006BFF] transition-all cursor-pointer
      
      "
      onClick={() => {
        setShowShareModal(true);
      }}
    >
      Share
    </button>
  );
}
