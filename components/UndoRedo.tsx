export function UndoRedo({
  undo,
  redo,
}: {
  undo: () => void;
  redo: () => void;
}) {
  return (
    <nav>
      <ul className="flex gap-2 bg-gray-200 rounded-md">
        <li>
          <button
            className="pl-4 pr-2 py-2 rounded-l-md hover:bg-[#f2f2fa] "
            onClick={() => undo()}
          >
            <svg
              className="h-5 w-5"
              aria-hidden="true"
              focusable="false"
              role="img"
              viewBox="0 0 22 20"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M7.5 10.833 4.167 7.5 7.5 4.167M4.167 7.5h9.166a3.333 3.333 0 0 1 0 6.667H12.5"
                strokeWidth={1.25}
              />
            </svg>
          </button>
        </li>
        <li>
          <button
            className="pr-4 pl-2 py-2 hover:bg-[#f2f2fa] rounded-r-md"
            onClick={() => redo()}
          >
            <svg
              className="h-5 w-5"
              aria-hidden="true"
              focusable="false"
              role="img"
              viewBox="0 0 22 20"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M12.5 10.833 15.833 7.5 12.5 4.167M15.833 7.5H6.667a3.333 3.333 0 1 0 0 6.667H7.5"
                strokeWidth={1.25}
              />
            </svg>
          </button>
        </li>
      </ul>
    </nav>
  );
}
