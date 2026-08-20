import { Bell, Compass, LogOut, Search, ShieldCheck, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { clearAuth, getUserName, isAdmin } from "../api/authUtils";

const avatarUrl =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80";

export default function Navbar() {
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] =
    useState(false);
  const userName = getUserName();

  const logout = () => {
    clearAuth();
    window.location.href = "/login";
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E9E9EC] bg-white px-5 shadow-[0_2px_12px_rgba(15,31,61,0.05)] sm:px-8">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5"
          aria-label="TripPlanner home"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#E8F8F6] text-[#00BFA5]">
            <Compass size={21} strokeWidth={2.3} />
          </span>

          <span className="text-[17px] font-bold tracking-[-0.4px] text-[#0F1F3D]">
            TripPlanner
          </span>
        </Link>

        {/* Right side */}
        <nav
          className="relative flex items-center gap-1.5"
          aria-label="Account actions"
        >
          {/* Search */}
          <button
            type="button"
            onClick={() =>
              setShowSearch((current) => !current)
            }
            aria-label="Search"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#667085] transition hover:bg-[#F5F5F7] hover:text-[#0F1F3D] focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/40"
          >
            {showSearch ? (
              <X size={18} strokeWidth={1.8} />
            ) : (
              <Search size={18} strokeWidth={1.8} />
            )}
          </button>

          {/* Notifications */}
          <button
            type="button"
            onClick={() =>
              setShowNotifications((current) => !current)
            }
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#667085] transition hover:bg-[#F5F5F7] hover:text-[#0F1F3D] focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/40"
          >
            <Bell size={18} strokeWidth={1.8} />

            <span className="absolute right-[7px] top-[6px] h-1.5 w-1.5 rounded-full bg-[#FF4444]" />
          </button>

          {/* Divider */}
          <div className="ml-1 hidden h-8 w-px bg-[#E9E9EC] sm:block" />

          {/* Admin portal (admins only) */}
          {isAdmin() && (
            <Link
              to="/admin/dashboard"
              className="ml-1 hidden items-center gap-1.5 rounded-full border border-[#00BFA5]/30 bg-[#E8F8F6] px-3 py-1.5 text-[12px] font-semibold text-[#008F7C] transition hover:bg-[#00BFA5]/10 sm:flex"
              title="Admin portal"
            >
              <ShieldCheck size={14} />
              Admin
            </Link>
          )}

          {/* Profile */}
          <Link
            to="/profile"
            className="ml-1 flex items-center gap-2"
          >
            <img
              src={avatarUrl}
              alt="Portrait of Alex Johnson"
              className="h-9 w-9 rounded-full border-2 border-[#00BFA5] object-cover"
            />

            <span className="hidden pl-1 text-[13px] font-semibold text-[#0F1F3D] sm:block">
              {userName}
            </span>
          </Link>

          {/* Logout */}
          <button
            type="button"
            onClick={logout}
            aria-label="Log out"
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-full text-[#667085] transition hover:bg-[#FFF2F2] hover:text-[#FF4444] focus:outline-none focus:ring-2 focus:ring-[#FF4444]/30"
            title="Log out"
          >
            <LogOut size={18} strokeWidth={1.8} />
          </button>

          {/* Notifications popup */}
          {showNotifications && (
            <div
              role="status"
              className="absolute right-0 top-[50px] w-64 rounded-xl border border-[#E5E5E5] bg-white p-4 text-sm shadow-[0_12px_30px_rgba(15,31,61,0.12)]"
            >
              <strong className="block text-[#0F1F3D]">
                Notifications
              </strong>

              <span className="mt-1 block text-[#667085]">
                Your Yosemite trip is ready to review.
              </span>
            </div>
          )}
        </nav>
      </header>

      {/* Search bar */}
      {showSearch && (
        <div className="border-b border-[#E5E5E5] bg-white px-5 py-3 sm:px-8">
          <label className="mx-auto flex max-w-xl items-center gap-2 rounded-lg border border-[#DCDDE2] px-3 py-2 text-sm text-[#888] shadow-sm">
            <Search size={16} />

            <input
              autoFocus
              type="search"
              placeholder="Search your trips and places"
              className="w-full bg-transparent outline-none placeholder:text-[#A0A3AA]"
              aria-label="Search your trips and places"
            />
          </label>
        </div>
      )}
    </>
  );
}