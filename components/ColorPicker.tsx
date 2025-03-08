"use client";
import { colorAtom } from "@/store/store";
import { useAtom } from "jotai";

export function ColorPicker() {
  // Excalidraw-like color palette
  const colors = [
    { value: "#ffffff", label: "White" },
    { value: "#1e1e1e", label: "Black" },
    { value: "#d4d4d8", label: "Gray" },
    { value: "#e03131", label: "Red" },
    { value: "#f08c00", label: "Orange" },
    { value: "#eab308", label: "Yellow" },
    { value: "#2e8b57", label: "Green" },
    { value: "#1971c2", label: "Blue" },
    { value: "#7048e8", label: "Purple" },
  ];

  const [color, setColor] = useAtom(colorAtom);

  const onSelectColor = (value: string) => {
    setColor(value);
  };

  return (
    <div className=" bg-white ">
      <div>
        <p className="py-2 text-xs text-gray-600">Stroke</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-2 max-w-[200px]">
        {colors.map((c) => (
          <button
            key={c.value}
            className={`w-8 h-8 rounded-md border ${
              c.value === color
                ? "ring-2 ring-blue-500 ring-offset-1"
                : "hover:ring-1 hover:ring-gray-300"
            }`}
            style={{
              backgroundColor: c.value,
              borderColor: c.value === "#ffffff" ? "#d4d4d8" : c.value,
            }}
            onClick={() => onSelectColor(c.value)}
            title={c.label}
            aria-label={`Select color ${c.label}`}
          />
        ))}
      </div>
      <input
        type="color"
        value={color}
        onChange={(e) => onSelectColor(e.target.value)}
        className="w-full h-6 cursor-pointer"
        aria-label="Custom color picker"
      />
    </div>
  );
}
