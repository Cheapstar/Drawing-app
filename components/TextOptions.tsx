"use client";
import { fontSizeAtom, fontFamilyAtom } from "@/store/store";
import { useAtom } from "jotai";

export function TextOptions() {
  const fontFamilies = [
    "Arial",
    "Times New Roman",
    "Courier New",
    "Georgia",
    "Verdana",
    "Helvetica",
    "Comic Sans MS",
    "Impact",
    "virgilFont",
  ];

  const [fontSize, setFontSize] = useAtom(fontSizeAtom);
  const [fontFamily, setFontFamily] = useAtom(fontFamilyAtom);

  const onFontSizeChange = (size: number) => {
    setFontSize(size);
  };

  const onFontFamilyChange = (family: string) => {
    setFontFamily(family);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="mb-2">
        <label className="block text-xs text-gray-600 mb-1">Font Size</label>
        <div className="flex items-center gap-2.5 pt-2">
          {FONT_SIZE_SVG.map(({ label, size, svg }) => {
            return (
              <div
                key={label}
                onClick={() => onFontSizeChange(size as number)}
              >
                <button
                  className={`p-2 rounded-md hover:bg-[#f2f2fa] flex justify-center items-center transition-all   ${
                    fontSize === size
                      ? "ring-2 ring-blue-500 ring-offset-1 bg-[#CCCCFF] hover:bg-[#CCCCFF]"
                      : "hover:ring-1 hover:ring-gray-300 bg-gray-200 hover:bg-[#f2f2fa]"
                  }`}
                >
                  {svg}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="">
        <label className="block text-xs text-gray-600 mb-1">Font Family</label>
        <select
          value={fontFamily}
          onChange={(e) => onFontFamilyChange(e.target.value)}
          className="w-full text-sm p-1 border rounded"
        >
          {fontFamilies.map((family) => (
            <option
              key={family}
              value={family}
            >
              {family}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

const FONT_SIZE_SVG = [
  {
    size: 32,
    label: "small",
    svg: (
      <svg
        aria-hidden="true"
        focusable="false"
        role="img"
        viewBox="0 0 20 20"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g clipPath="url(#a)">
          <path
            d="M14.167 6.667a3.333 3.333 0 0 0-3.334-3.334H9.167a3.333 3.333 0 0 0 0 6.667h1.666a3.333 3.333 0 0 1 0 6.667H9.167a3.333 3.333 0 0 1-3.334-3.334"
            stroke="currentColor"
            strokeWidth={1.25}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <defs>
          <clipPath id="a">
            <path
              fill="#fff"
              d="M0 0h20v20H0z"
            />
          </clipPath>
        </defs>
      </svg>
    ),
  },
  {
    label: "medium",
    size: 48,
    svg: (
      <svg
        aria-hidden="true"
        focusable="false"
        role="img"
        viewBox="0 0 20 20"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g clipPath="url(#a)">
          <path
            d="M5 16.667V3.333L10 15l5-11.667v13.334"
            stroke="currentColor"
            strokeWidth={1.25}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <defs>
          <clipPath id="a">
            <path
              fill="#fff"
              d="M0 0h20v20H0z"
            />
          </clipPath>
        </defs>
      </svg>
    ),
  },
  {
    label: "large",
    size: 60,
    svg: (
      <svg
        aria-hidden="true"
        focusable="false"
        role="img"
        viewBox="0 0 20 20"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g clipPath="url(#a)">
          <path
            d="M5.833 3.333v13.334h8.334"
            stroke="currentColor"
            strokeWidth={1.25}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <defs>
          <clipPath id="a">
            <path
              fill="#fff"
              d="M0 0h20v20H0z"
            />
          </clipPath>
        </defs>
      </svg>
    ),
  },
  {
    label: "extraLarge",
    size: 72,
    svg: (
      <svg
        aria-hidden="true"
        focusable="false"
        role="img"
        viewBox="0 0 20 20"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="m1.667 3.333 6.666 13.334M8.333 3.333 1.667 16.667M11.667 3.333v13.334h6.666"
          stroke="currentColor"
          strokeWidth={1.25}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];
