"use client";
import React from "react";
import { TOOL } from "../types/types";
import { darkModeAtom, toolAtom } from "@/store/store";
import { useAtom } from "jotai";

export function ToolBar() {
  const [activeTool, setActiveTool] = useAtom(toolAtom);
  const [darkMode] = useAtom(darkModeAtom);

  return (
    <nav
      className={`${
        darkMode ? "bg-[#232329] text-white" : "bg-white text-black"
      } shadow-md rounded-lg p-2 flex gap-1 border border-gray-300`}
    >
      {BOARD_TOOLS.map(({ value, label, svg }) => (
        <button
          key={value}
          onClick={() => {
            setActiveTool(value as TOOL);
          }}
          className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors ${
            activeTool === value
              ? darkMode
                ? "bg-[#403E6A] hover:bg-[#393950]"
                : "bg-gray-300 hover:bg-gray-200"
              : ""
          }`}
          title={label} // Tooltip on hover
        >
          {svg}
        </button>
      ))}
    </nav>
  );
}

const BOARD_TOOLS = [
  {
    value: "pan",
    label: "Pan",
    svg: (
      <svg
        viewBox="0 0 24 24"
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 13v-7.5a1.5 1.5 0 0 1 3 0v6.5" />
        <path d="M11 5.5v-2a1.5 1.5 0 1 1 3 0v8.5" />
        <path d="M14 5.5a1.5 1.5 0 0 1 3 0v6.5" />
        <path d="M17 7.5a1.5 1.5 0 0 1 3 0v8.5a6 6 0 0 1 -6 6h-2" />
      </svg>
    ),
  },
  {
    value: "select",
    label: "Select",
    svg: (
      <svg
        viewBox="0 0 22 22"
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 6l4.153 11.793a0.365 .365 0 0 0 .331 .207l2.184 -4.793l4.787 -1.994" />
        <path d="M13.5 13.5l4.5 4.5" />
      </svg>
    ),
  },
  {
    value: "rectangle",
    label: "Rectangle",
    svg: (
      <svg
        viewBox="0 0 24 24"
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect
          x={4}
          y={4}
          width={16}
          height={16}
          rx={2}
        />
      </svg>
    ),
  },
  {
    value: "line",
    label: "Line",
    svg: (
      <svg
        viewBox="0 0 20 20"
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4.167 10h11.666" />
      </svg>
    ),
  },
  {
    value: "freehand",
    label: "Freehand",
    svg: (
      <svg
        viewBox="0 0 20 20"
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m7.643 15.69 7.774-7.773a2.357 2.357 0 1 0-3.334-3.334L4.31 12.357a3.333 3.333 0 0 0-.977 2.357v1.953" />
        <path d="m11.25 5.417 3.333 3.333" />
      </svg>
    ),
  },
  {
    value: "text",
    label: "Text",
    svg: (
      <svg
        viewBox="0 0 24 24"
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line
          x1={4}
          y1={20}
          x2={7}
          y2={20}
        />
        <line
          x1={14}
          y1={20}
          x2={21}
          y2={20}
        />
        <line
          x1={6.9}
          y1={15}
          x2={13.8}
          y2={15}
        />
        <polyline points="5 20 11 4 13 4 20 20" />
      </svg>
    ),
  },
  {
    value: "eraser",
    label: "Eraser",
    svg: (
      <svg
        viewBox="0 0 24 24"
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 20h-10.5l-4.21 -4.3a1 1 0 0 1 0 -1.41l10 -10a1 1 0 0 1 1.41 0l5 5" />
        <path d="M18 13.3l-6.3 -6.3" />
      </svg>
    ),
  },
  {
    value: "laser",
    label: "Laser",
    svg: (
      <svg
        aria-hidden="true"
        focusable="false"
        role="img"
        viewBox="0 0 20 20"
        className="w-6 h-6"
      >
        <g
          fill="none"
          stroke="currentColor"
          stroke-width="1.25"
          stroke-linecap="round"
          stroke-linejoin="round"
          transform="rotate(90 10 10)"
        >
          <path
            clip-rule="evenodd"
            d="m9.644 13.69 7.774-7.773a2.357 2.357 0 0 0-3.334-3.334l-7.773 7.774L8 12l1.643 1.69Z"
          ></path>
          <path d="m13.25 3.417 3.333 3.333M10 10l2-2M5 15l3-3M2.156 17.894l1-1M5.453 19.029l-.144-1.407M2.377 11.887l.866 1.118M8.354 17.273l-1.194-.758M.953 14.652l1.408.13"></path>
        </g>
      </svg>
    ),
  },
];
