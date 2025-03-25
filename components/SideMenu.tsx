import { GiHamburgerMenu } from "react-icons/gi";

export function SideMenu() {
  return (
    <div>
      <button className="bg-[#0D92F4] rounded-md p-2 cursor-pointer hover:bg-[#006BFF] transition-all">
        <GiHamburgerMenu className="text-xl text-white"></GiHamburgerMenu>
      </button>
    </div>
  );
}
