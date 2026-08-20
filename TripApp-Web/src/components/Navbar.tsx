import { Bell, Compass, LogOut, Search, ShieldCheck, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { clearAuth, getUserName, isAdmin } from "../api/authUtils";

const avatarUrl =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80";

type Destination = {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
};

type NavbarProps = {
  center?: React.ReactNode;
};

export default function Navbar({ center }: NavbarProps) {
  const [darkMode, setDarkMode] = useDarkMode();
  const auth = useAuthState();
  const navigate = useNavigate();

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
      <header
        className="sticky top-0 z-30 flex h-16 items-center justify-between border-b px-5 shadow-[0_2px_12px_rgba(15,31,61,0.05)] sm:px-8"
        style={{
          backgroundColor: bg,
          borderColor: border,
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5"
          aria-label="TripPlanner home"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-[10px]"
            style={{
              backgroundColor: darkMode
                ? "#123C3A"
                : "#E8F8F6",
              color: darkMode ? "#00BFA5" : "#00BFA5",
            }}
          >
            <Compass size={21} strokeWidth={2.3} />
          </span>

          <span
            className="text-[17px] font-bold tracking-[-0.4px]"
            style={{ color: text }}
          >
            TripPlanner
          </span>
        </Link>

        {/* Center slot (page-specific, e.g. map destination path) */}
        {center && (
          <div className="flex min-w-0 flex-1 items-center justify-center px-4">
            {center}
          </div>
        )}

        {/* Right side */}
        <nav
          className="flex items-center gap-1.5"
          aria-label="Account actions"
        >
          {/* Search */}
          <button
            type="button"
            onClick={() =>
              setShowSearch((current) => !current)
            }
            aria-label="Search"
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/40"
            style={{ color: muted }}
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
            onClick={() => {
              setShowNotifications((current) => !current);
              if (!showNotifications) {
                markAllRead();
              }
            }}
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/40"
            style={{ color: muted }}
          >
            <Bell size={18} strokeWidth={1.8} />

            {unread > 0 && (
              <span
                className="absolute right-0 top-0 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                style={{ backgroundColor: "#FF4444" }}
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
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
            {darkMode ? (
              <Sun size={18} strokeWidth={1.8} />
            ) : (
              <Moon size={18} strokeWidth={1.8} />
            )}
          </button>

          {/* Admin portal (admins only) */}
          {auth.isAdmin && (
            <Link
              to="/admin/dashboard"
              className="ml-1 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition hover:bg-[#F5F5F7]"
              title="Admin portal"
              style={{ color: text, borderColor: border }}
            >
              <ShieldCheck
                size={15}
                className="text-[#00BFA5]"
              />

              Admin
            </Link>
          )}

          <div
            className="ml-1 hidden h-8 w-px sm:block"
            style={{ backgroundColor: border }}
          />

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
              <img
                src={avatarUrl}
                alt="Portrait of Alex Johnson"
                className="h-9 w-9 rounded-full border-2 border-[#00BFA5] object-cover"
              />

              <span
                className="hidden pl-1 text-[13px] font-semibold sm:block"
                style={{ color: text }}
              >
                {auth.name}
              </span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="ml-1 rounded-full border px-4 py-1.5 text-[13px] font-semibold transition hover:bg-[#F5F5F7]"
              style={{ color: text, borderColor: border }}
            >
              Sign in
            </Link>
          )}
        </nav>

        {/* Notifications popup */}
        {showNotifications && (
          <div
            role="status"
            className="absolute right-5 top-[58px] w-72 rounded-xl border p-4 text-sm shadow-[0_12px_30px_rgba(15,31,61,0.12)] sm:right-8"
            style={{
              backgroundColor: darkMode
                ? "#161B22"
                : "#FFFFFF",
              borderColor: border,
            }}
          >
            <strong
              className="block"
              style={{ color: text }}
            >
              Notifications
            </strong>

            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
              {notifications.length === 0 ? (
                <span className="block text-[13px]" style={{ color: muted }}>
                  No notifications yet.
                </span>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-lg border p-2.5"
                    style={{
                      borderColor: border,
                      backgroundColor: darkMode
                        ? "#0D1117"
                        : "#F5F5F7",
                    }}
                  >
                    <p
                      className="text-[13px] font-semibold"
                      style={{ color: text }}
                    >
                      {notification.title}
                    </p>

                    <p
                      className="mt-0.5 text-[12px] leading-snug"
                      style={{ color: muted }}
                    >
                      {notification.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </header>

      {/* Search bar */}
      {showSearch && (
        <div
          className="border-b px-5 py-3 sm:px-8"
          style={{
            backgroundColor: darkMode
              ? "#0D1117"
              : "#FFFFFF",
            borderColor: border,
          }}
        >
          <label
            className="mx-auto flex max-w-xl items-center gap-2 rounded-lg border px-3 py-2 text-sm shadow-sm"
            style={{
              borderColor: darkMode
                ? "#2D333B"
                : "#DCDDE2",
            }}
          >
            <Search size={16} style={{ color: muted }} />

            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search destinations"
              aria-label="Search destinations"
              className="w-full bg-transparent outline-none placeholder:text-[#A0A3AA]"
              style={{ color: text }}
            />

            {searching && (
              <span
                className="text-xs"
                style={{ color: muted }}
              >
                …
              </span>
            )}
          </label>

          {results.length > 0 && (
            <ul
              className="mx-auto mt-2 max-w-xl overflow-hidden rounded-lg border shadow-lg"
              style={{
                backgroundColor: darkMode
                  ? "#161B22"
                  : "#FFFFFF",
                borderColor: border,
              }}
            >
              {results.map((dest, index) => (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() =>
                      chooseDestination(dest)
                    }
                    disabled={planning}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition hover:bg-[#F5F5F7] disabled:opacity-50"
                  >
                    <span
                      className="font-medium"
                      style={{ color: text }}
                    >
                      {dest.name}
                    </span>

                    <span
                      className="text-xs"
                      style={{ color: muted }}
                    >
                      {dest.country}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {query.trim().length >= 2 &&
            !searching &&
            results.length === 0 && (
              <p
                className="mx-auto mt-2 max-w-xl text-xs"
                style={{ color: muted }}
              >
                {planning
                  ? "Planning trip…"
                  : "No destinations found."}
              </p>
            )}
        </div>
      )}
    </>
  );
}
