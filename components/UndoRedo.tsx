export function UndoRedo({
  undo,
  redo,
}: {
  undo: () => void;
  redo: () => void;
}) {
  return (
    <nav>
      <ul className="flex gap-2">
        <li>
          <button
            className="bg-gray-200 rounded-md px-4 py-2 border-1 hover:bg-gray-300"
            onClick={() => undo()}
          >
            Undo
          </button>
        </li>
        <li>
          <button
            className="bg-gray-200 rounded-md px-4 py-2 border-1 hover:bg-gray-300"
            onClick={() => redo()}
          >
            Redo
          </button>
        </li>
      </ul>
    </nav>
  );
}
