import { Compass, LogOut, Moon, ShieldCheck, Sun } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { clearAuth, getUserName, isAdmin } from "../api/authUtils";
import { revokeRefreshToken } from "../api/auth";
import { getInitials } from "../utils/userInitials";
import { toggleTheme, useTheme } from "../utils/theme";

const LINKS: { label: string; to: string; end?: boolean }[] = [
  { label: "Plan", to: "/", end: true },
  { label: "Saved trips", to: "/saved-trips" },
  { label: "Stays", to: "/stays" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const theme = useTheme();

  const userName = getUserName();
  const initials = getInitials(userName);

  const logout = () => {
    revokeRefreshToken();
    clearAuth();

    // Client-side redirect: no full reload, history stays intact.
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-6 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5" aria-label="TripPlanner home">
          <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-brand-50 text-brand">
            <Compass className="h-[21px] w-[21px]" strokeWidth={2.3} />
          </span>

          <span className="text-[16px] font-extrabold tracking-[-0.02em] text-navy">
            TripPlanner
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {LINKS.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-lg px-2.5 py-1.5 text-[13.5px] font-semibold transition ${
                  isActive
                    ? "bg-brand-50 text-brand-strong"
                    : "text-muted hover:bg-canvas hover:text-ink"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {isAdmin() && (
            <Link
              to="/admin/dashboard"
              className="hidden items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-[12px] font-semibold text-brand-strong transition hover:bg-brand-100 sm:flex"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin
            </Link>
          )}

          <button
            type="button"
            onClick={() => toggleTheme()}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            aria-pressed={theme === "dark"}
            title={theme === "dark" ? "Light theme" : "Dark theme"}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-canvas hover:text-ink"
          >
            {theme === "dark" ? (
              <Sun className="h-[17px] w-[17px]" strokeWidth={1.8} />
            ) : (
              <Moon className="h-[17px] w-[17px]" strokeWidth={1.8} />
            )}
          </button>

          <Link
            to="/profile"
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-canvas"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full border border-brand-100 bg-brand-50 text-[12px] font-extrabold text-brand-strong">
              {initials}
            </span>

            <span className="hidden max-w-[140px] truncate text-[13px] font-semibold text-ink sm:block">
              {userName}
            </span>
          </Link>

          <button
            type="button"
            onClick={logout}
            aria-label="Log out"
            title="Log out"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-danger-50 hover:text-danger"
          >
            <LogOut className="h-[17px] w-[17px]" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </header>
  );
}
