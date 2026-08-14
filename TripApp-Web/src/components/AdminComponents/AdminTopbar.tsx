import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  ExternalLink,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useAuthState } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import { clearAuth } from "../../api/authUtils";

const avatarUrl =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80";

const colors = {
  bg: "#0B1511",
  border: "#1B3428",
  text: "#D9E5DE",
  muted: "#9EADA5",
  accent: "#7CD9A6",
  hover: "#132019",
};

export default function AdminTopbar() {
  const auth = useAuthState();
  const navigate = useNavigate();
  const { notifications, unread, markAllRead } =
    useNotifications(auth.loggedIn);

  const [showNotifications, setShowNotifications] =
    useState(false);

  useEffect(() => {
    document.documentElement.style.colorScheme = "dark";
    return () => {
      document.documentElement.style.colorScheme = "";
    };
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <>
      <header
        className="sticky top-0 z-30 flex h-16 items-center justify-between border-b px-5 sm:px-8"
        style={{
          backgroundColor: colors.bg,
          borderColor: colors.border,
        }}
      >
        {/* Brand / current page */}
        <Link
          to="/admin/dashboard"
          className="flex items-center gap-2.5"
          aria-label="Admin dashboard"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-[10px]"
            style={{
              backgroundColor: "#132019",
              color: colors.accent,
            }}
          >
            <ShieldCheck size={20} strokeWidth={2.2} />
          </span>

          <span
            className="text-[17px] font-bold tracking-[-0.4px]"
            style={{ color: colors.text }}
          >
            Admin Portal
          </span>
        </Link>

        {/* Right side */}
        <nav
          className="flex items-center gap-1.5"
          aria-label="Admin actions"
        >
          {/* View site */}
          <Link
            to="/"
            className="hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition hover:bg-[#132019] sm:flex"
            title="View public site"
            style={{ color: colors.text, borderColor: colors.border }}
          >
            <ExternalLink size={14} />
            View site
          </Link>

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
            className="relative flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#132019] focus:outline-none focus:ring-2 focus:ring-[#7CD9A6]/40"
            style={{ color: colors.muted }}
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

          <div
            className="mx-1 hidden h-8 w-px sm:block"
            style={{ backgroundColor: colors.border }}
          />

          {/* Admin profile */}
          <div className="flex items-center gap-2">
            <img
              src={avatarUrl}
              alt="Admin avatar"
              className="h-9 w-9 rounded-full border-2 border-[#7CD9A6]/60 object-cover"
            />

            <span
              className="hidden pl-1 text-[13px] font-semibold sm:block"
              style={{ color: colors.text }}
            >
              {auth.name}
            </span>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#3A1717] hover:text-[#FFB4AB] focus:outline-none focus:ring-2 focus:ring-[#FFB4AB]/40"
            style={{ color: colors.muted }}
          >
            <LogOut size={18} strokeWidth={1.8} />
          </button>
        </nav>

        {/* Notifications popup */}
        {showNotifications && (
          <div
            role="status"
            className="absolute right-5 top-[58px] w-72 rounded-xl border p-4 text-sm shadow-[0_12px_30px_rgba(0,0,0,0.5)] sm:right-8"
            style={{
              backgroundColor: "#0D1712",
              borderColor: colors.border,
            }}
          >
            <strong
              className="block"
              style={{ color: colors.text }}
            >
              Notifications
            </strong>

            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
              {notifications.length === 0 ? (
                <span className="block text-[13px]" style={{ color: colors.muted }}>
                  No notifications yet.
                </span>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-lg border p-2.5"
                    style={{
                      borderColor: colors.border,
                      backgroundColor: "#0B1511",
                    }}
                  >
                    <p
                      className="text-[13px] font-semibold"
                      style={{ color: colors.text }}
                    >
                      {notification.title}
                    </p>

                    <p
                      className="mt-0.5 text-[12px] leading-snug"
                      style={{ color: colors.muted }}
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
    </>
  );
}
