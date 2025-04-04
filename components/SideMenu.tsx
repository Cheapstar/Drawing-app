import { useEffect, useState } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { SetHistoryState } from "./hooks/history";

interface props {
  setElements: SetHistoryState;
}

export function SideMenu({ setElements }: props) {
  const [showSideMenu, setShowSideMenu] = useState<boolean>(false);

  useEffect(() => {
    function turnOffSideMenu() {
      setShowSideMenu(false);
    }

    window.addEventListener("click", turnOffSideMenu);

    return () => {
      window.removeEventListener("click", turnOffSideMenu);
    };
  }, []);

  return (
    <div
      className="relative"
      onClick={() => {
        setShowSideMenu(false);
      }}
    >
      <button
        className=" bg-[#0D92F4] 
      rounded-md p-2 cursor-pointer hover:bg-[#006BFF] transition-all"
        onClick={(e) => {
          e.stopPropagation();
          setShowSideMenu(!showSideMenu);
        }}
      >
        <GiHamburgerMenu className="text-xl text-white"></GiHamburgerMenu>
      </button>
      {showSideMenu && (
        <nav className="absolute top-10 left-0  border-gray-400 shadow-lg px-2 py-2 font-sans text-sm">
          <ul>
            <li>
              <button
                className="text-nowrap px-2 py-2 hover:bg-gray-200 rounded-md transition-all"
                onClick={() => {
                  setElements([]);
                }}
              >
                Reset Canvas
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
