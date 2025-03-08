export function TextOptions({
  fontSize,
  fontFamily,
  fontColor,
  onFontSizeChange,
  onFontFamilyChange,
  onFontColorChange,
}: {
  fontSize: number;
  fontFamily: string;
  fontColor: string;
  onFontSizeChange: (size: number) => void;
  onFontFamilyChange: (family: string) => void;
  onFontColorChange: (color: string) => void;
}) {
  const fontFamilies = [
    "Arial",
    "Times New Roman",
    "Courier New",
    "Georgia",
    "Verdana",
    "Helvetica",
    "Comic Sans MS",
    "Impact",
  ];

  return (
    <div className="p-2 bg-white rounded shadow">
      <h3 className="font-medium text-sm mb-2">Text Options</h3>

      <div className="mb-2">
        <label className="block text-xs mb-1">Font Size</label>
        <div className="flex items-center">
          <input
            type="range"
            min="8"
            max="72"
            value={fontSize}
            onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
            className="w-full mr-2"
          />
          <span className="text-xs w-8">{fontSize}px</span>
        </div>
      </div>

      <div className="mb-2">
        <label className="block text-xs mb-1">Font Family</label>
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

      <div>
        <label className="block text-xs mb-1">Font Color</label>
        <input
          type="color"
          value={fontColor}
          onChange={(e) => onFontColorChange(e.target.value)}
          className="w-full"
        />
      </div>
    </div>
  );
}
