"use client";

import { darkModeAtom } from "@/store/store";
import { useAtom } from "jotai";

export function DarkModeButton() {
  const [darkMode, setDarkMode] = useAtom(darkModeAtom);

  const handleDark = () => {
    setDarkMode(!darkMode);
  };

  return (
    <button
      onClick={handleDark}
      className={` ${
        darkMode ? "bg-[#232329] text-white" : "bg-white text-black"
      } shadow-md rounded-lg p-4 flex gap-1 border border-gray-300`}
    >
      <svg
        stroke="currentColor"
        fill="currentColor"
        strokeWidth="0"
        viewBox="0 0 24 24"
        className="w-6 h-6"
        height="1em"
        width="1em"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="none"
          d="M0 0h24v24H0z"
        ></path>
        <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"></path>
      </svg>
    </button>
  );
}
