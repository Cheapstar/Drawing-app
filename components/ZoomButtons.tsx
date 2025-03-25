"use client";

interface ZoomProps {
  scale: number;
  onZoom: (a: number) => void;
  darkMode: boolean;
}

export function ZoomButtons({ scale, onZoom, darkMode }: ZoomProps) {
  return (
    <nav>
      <ul
        className={`flex gap-2 ${
          darkMode ? "bg-[#232329] text-white" : "bg-white text-black"
        } rounded-md`}
      >
        <li>
          <button
            className={`pl-4 pr-2 py-2 rounded-l-md  ${
              darkMode ? "hover:bg-[#403E6A]" : "hover:bg-[#f2f2fa]"
            } `}
            onClick={() => onZoom(-0.1)}
          >
            <svg
              className="h-5 w-5"
              aria-hidden="true"
              focusable="false"
              role="img"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M5 10h10"
                strokeWidth={1.25}
              />
            </svg>
          </button>
        </li>
        <li className="">
          <button
            className="pt-[9px] text-xs w-[40px]"
            onClick={() => onZoom(0)}
          >
            {new Intl.NumberFormat("en-GB", { style: "percent" }).format(scale)}
          </button>
        </li>
        <li>
          <button
            className={`pr-4 pl-2 py-2  ${
              darkMode ? "hover:bg-[#403E6A]" : "hover:bg-[#f2f2fa]"
            } rounded-r-md`}
            onClick={() => onZoom(0.1)}
          >
            <svg
              aria-hidden="true"
              focusable="false"
              role="img"
              viewBox="0 0 20 20"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                strokeWidth={1.25}
                d="M10 4.167v11.666M4.167 10h11.666"
              />
            </svg>
          </button>
        </li>
      </ul>
    </nav>
  );
}
