import {
  Menu,
  Search,
  Bell,
  Settings,
  Plus,
} from "lucide-react";

export default function AdminTopbar() {
  return (
    <header className="sticky top-0 z-40 flex h-20 w-full items-center justify-between border-b border-[#1B3428] bg-[#0B1511]/80 px-4 backdrop-blur-md md:px-6">

      {/* Left */}
      <div className="flex items-center gap-5">

        <button className="text-[#BEC9BF] transition-colors hover:text-[#7CD9A6] md:hidden">
          <Menu size={22} />
        </button>

        <h2 className="hidden text-2xl font-bold text-[#7CD9A6] md:block">
          Dashboard
        </h2>

        <div className="ml-4 hidden items-center gap-6 lg:flex">
          <button className="border-b-2 border-[#7CD9A6] pb-1 text-sm text-[#7CD9A6]">
            Overview
          </button>

          <button className="text-sm text-[#BEC9BF] transition-colors hover:text-[#7CD9A6]">
            Logs
          </button>

          <button className="text-sm text-[#BEC9BF] transition-colors hover:text-[#7CD9A6]">
            Activity
          </button>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">

        {/* Search */}
        <div className="relative hidden sm:block">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#88948A]"
          />

          <input
            type="text"
            placeholder="Search..."
            className="w-64 rounded-lg border border-[#1B3428] bg-[#0B1511] py-2 pl-10 pr-4 text-sm text-[#D9E5DE] outline-none placeholder:text-[#88948A]/60 focus:border-[#48B77B] focus:ring-1 focus:ring-[#48B77B]/40"
          />
        </div>

        {/* Notifications */}
        <button className="relative text-[#BEC9BF] transition-colors hover:text-[#7CD9A6]">
          <Bell size={20} />

          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#48B77B]" />
        </button>

        {/* Settings */}
        <button className="text-[#BEC9BF] transition-colors hover:text-[#7CD9A6]">
          <Settings size={20} />
        </button>

        {/* Avatar */}
        <button className="ml-1 h-9 w-9 overflow-hidden rounded-full border border-[#1B3428] bg-[#2C3732]">
          <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[#7CD9A6]">
            SA
          </div>
        </button>

        {/* Add Destination */}
        <button className="ml-2 hidden items-center gap-2 rounded-[10px] bg-[#2F8F62] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#48B77B] sm:flex">
          <Plus size={17} />
          Add Destination
        </button>

      </div>
    </header>
  );
}