import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  MapPin,
  Sparkles,
  MessageSquareText,
  BarChart3,
  History,
  Settings,
  Building2,
  Moon,
  LogOut,
  Home,
} from "lucide-react";
import { clearAuth } from "../../api/authUtils";

const navigation = [
  {
    name: "Dashboard",
    path: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Users",
    path: "/admin/users",
    icon: Users,
  },
  {
    name: "Administrators",
    path: "/admin/administrators",
    icon: ShieldCheck,
  },
  {
    name: "Destinations",
    path: "/admin/destinations",
    icon: MapPin,
  },
  {
    name: "Recommendations",
    path: "/admin/recommendations",
    icon: Sparkles,
  },
  {
    name: "Hotels",
    path: "/admin/hotels",
    icon: Building2,
  },
  {
    name: "Reviews & Feedback",
    path: "/admin/reviews",
    icon: MessageSquareText,
  },
  {
    name: "Analytics",
    path: "/admin/analytics",
    icon: BarChart3,
  },
  {
    name: "Activity Logs",
    path: "/admin/activity",
    icon: History,
  },
  {
    name: "Settings",
    path: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminSidebar() {
  const navigate = useNavigate();

  const logout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[260px] flex-col border-r border-[#1B3428] bg-[#06100C] p-4 md:flex">

      {/* Brand */}
      <div className="mb-8 mt-2 flex items-center gap-3 px-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2C3732]">
          <span className="text-xl font-bold text-[#7CD9A6]">
            T
          </span>
        </div>

        <div>
          <h1 className="font-['Manrope'] text-xl font-bold text-[#7CD9A6]">
            TripPlanner
          </h1>

          <p className="text-[11px] font-medium text-[#9EADA5]">
            Admin Portal
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">

        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-[#2C3732]/40 text-[#7CD9A6]"
                    : "text-[#BEC9BF] hover:bg-[#2C3732]/20 hover:text-[#7CD9A6]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />

                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}

      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto flex flex-col gap-1 border-t border-[#1B3428] pt-4">

        <NavLink
          to="/"
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-[#BEC9BF] transition-colors hover:bg-[#2C3732]/20 hover:text-[#7CD9A6]"
        >
          <Home size={20} />
          <span>Back to App</span>
        </NavLink>

        <button className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-[#BEC9BF] transition-colors hover:bg-[#2C3732]/20 hover:text-[#7CD9A6]">
          <Moon size={20} />
          <span>Dark mode</span>
          <span className="ml-auto rounded-full bg-[#2C3732]/60 px-2 py-0.5 text-[11px] font-bold text-[#7CD9A6]">
            On
          </span>
        </button>

        <button
          onClick={logout}
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-[#BEC9BF] transition-colors hover:bg-[#3A1717] hover:text-[#FFB4AB]"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>

      </div>
    </aside>
  );
}