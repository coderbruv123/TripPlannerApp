import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  ExternalLink,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { getUserName } from "../../api/authUtils";

export default function AdminTopbar() {
  const adminName = getUserName() || "A";

  return (
    <header className="sticky top-0 z-40 flex h-20 w-full items-center justify-between border-b border-[#1B3428] bg-[#0B1511]/80 px-4 backdrop-blur-md md:px-6">

      {/* Left */}
      <div className="flex items-center gap-5">

        <button className="text-[#BEC9BF] transition-colors hover:text-[#7CD9A6] md:hidden">
          <Menu size={22} />
        </button>

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

        {/* Settings */}
        <button className="text-[#BEC9BF] transition-colors hover:text-[#7CD9A6]">
          <Settings size={20} />
        </button>

        {/* Avatar */}
        <div className="ml-1 flex h-9 w-9 items-center justify-center rounded-full border border-[#1B3428] bg-[#2C3732] text-sm font-bold text-[#7CD9A6]">
          {adminName.charAt(0).toUpperCase()}
        </div>

        {/* Add Destination */}
        <button className="ml-2 hidden items-center gap-2 rounded-[10px] bg-[#2F8F62] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#48B77B] sm:flex">
          <Plus size={17} />
          Add Destination
        </button>

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
