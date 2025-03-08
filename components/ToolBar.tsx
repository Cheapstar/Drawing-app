import React from "react";
import { TOOL } from "./WhiteBoard";

export function ToolBar({ selectTool }: { selectTool: (tool: TOOL) => void }) {
  return (
    <nav>
      <ul className="flex gap-2">
        {BOARD_TOOLS.map(({ value, label }, index) => (
          <li key={index}>
            <button
              onClick={() => {
                selectTool(value as TOOL);
              }}
              className="bg-gray-200 rounded-md px-4 py-2 border-1 hover:bg-gray-300"
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const BOARD_TOOLS = [
  { value: "rectangle", label: "Rectangle" },
  { value: "line", label: "Line" },
  { value: "select", label: "Select" },
  { value: "pencil", label: "Pencil" },
  { value: "text", label: "Text" },
  { value: "pan", label: "Pan" },
];
