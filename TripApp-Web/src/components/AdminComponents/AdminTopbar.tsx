import { getUserName } from "../../api/authUtils";

export default function AdminTopbar() {
  const adminName = getUserName() || "A";

  return (
    <header className="sticky top-0 z-40 flex h-20 w-full items-center justify-between border-b border-[#1B3428] bg-[#0B1511]/80 px-4 backdrop-blur-md md:px-6">

      {/* Left */}
      <div className="flex items-center gap-5">
        <h2 className="hidden text-2xl font-bold text-[#7CD9A6] md:block">
          Dashboard
        </h2>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">

        {/* Avatar */}
        <div className="ml-1 flex h-9 w-9 items-center justify-center rounded-full border border-[#1B3428] bg-[#2C3732] text-sm font-bold text-[#7CD9A6]">
          {adminName.charAt(0).toUpperCase()}
        </div>

      </div>
    </header>
  );
}