"use client";

export function ZoomButtons({ scale, onZoom }) {
  return (
    <nav>
      <ul className="flex gap-2">
        <li>
          <button
            className="bg-gray-200 rounded-md px-4 py-2 border-1 hover:bg-gray-300"
            onClick={() => onZoom(-0.1)}
          >
            -
          </button>
        </li>
        <li className="">
          <p className="pt-2">
            {new Intl.NumberFormat("en-GB", { style: "percent" }).format(scale)}
          </p>
        </li>
        <li>
          <button
            className="bg-gray-200 rounded-md px-4 py-2 border-1 hover:bg-gray-300"
            onClick={() => onZoom(0.1)}
          >
            +
          </button>
        </li>
      </ul>
    </nav>
  );
}
