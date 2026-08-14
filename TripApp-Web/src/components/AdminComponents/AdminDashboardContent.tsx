import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  MapPin,
  Sparkles,
  TrendingUp,
  UserPlus,
  Shield,
  MessageSquare,
  ArrowRight,
  Clock,
} from "lucide-react";
import api from "../../api/axiosInstance";

type AdminStats = {
  totalUsers: number;
  adminUsers: number;
  newUsersThisMonth: number;
  totalSavedTrips: number;
  totalNotifications: number;
  destinations: number;
  recommendations: number;
};

export default function AdminDashboardContent() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    api
      .get<AdminStats>("/admin/stats")
      .then((res) => {
        if (active) setStats(res.data);
      })
      .catch((error) =>
        console.error("Failed to load admin stats:", error)
      )
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const statCards = [
    {
      label: "Total Users",
      value: loading ? "…" : stats?.totalUsers ?? 0,
      icon: Users,
    },
    {
      label: "Admin Users",
      value: loading ? "…" : stats?.adminUsers ?? 0,
      icon: UserCheck,
    },
    {
      label: "Destinations",
      value: loading ? "…" : stats?.destinations ?? 0,
      icon: MapPin,
    },
    {
      label: "Recommendations",
      value: loading ? "…" : stats?.recommendations ?? 0,
      icon: Sparkles,
    },
  ];

  const totalTrips = loading ? "…" : stats?.totalSavedTrips ?? 0;
  const newUsers = loading ? "…" : stats?.newUsersThisMonth ?? 0;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-8 p-4 md:p-8">

      {/* Header */}
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-[#D9E5DE]">
          Overview
        </h1>

        <p className="mt-2 text-base text-[#BEC9BF]">
          Overview of your Trip Planner platform.
        </p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {statCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="group rounded-xl border border-[#1B3428] bg-[#0B1511] p-6 transition-colors hover:bg-[#11231B]"
            >
              <div className="mb-6 flex items-start justify-between">

                <Icon
                  size={21}
                  className="text-[#7CD9A6]/70 transition-colors group-hover:text-[#7CD9A6]"
                />

              </div>

              <div className="text-3xl font-bold text-[#7CD9A6]">
                {stat.value}
              </div>

              <div className="mt-1 text-sm font-semibold text-[#BEC9BF]">
                {stat.label}
              </div>
            </div>
          );
        })}

      </section>

      {/* Trip Activity */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        <div className="rounded-xl border border-[#1B3428] bg-[#0B1511] p-6 xl:col-span-1">

          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#D9E5DE]">
              Trip Activity
            </h3>
          </div>

          <div className="text-3xl font-bold text-[#7CD9A6]">
            {totalTrips}
          </div>

          <p className="mt-1 text-sm text-[#BEC9BF]">
            Total Trips Created (saved)
          </p>

          <p className="mt-6 rounded-lg border border-[#1B3428] bg-[#06100C] p-4 text-sm text-[#9EADA5]">
            {totalTrips === 0
              ? "No trips have been saved yet. Time-series activity will appear here once trips are recorded."
              : "Trip activity recorded."}
          </p>

        </div>

        {/* Popular Destinations */}
        <div className="rounded-xl border border-[#1B3428] bg-[#0B1511] p-6 xl:col-span-2">

          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#D9E5DE]">
              Popular Destinations
            </h3>

            <span className="rounded bg-[#2C3732] px-3 py-1 text-[11px] text-[#D9E5DE]">
              In development
            </span>
          </div>

          <p className="rounded-lg border border-dashed border-[#1B3428] bg-[#06100C] p-6 text-center text-sm text-[#9EADA5]">
            No destination analytics yet. Popular-destination ranking
            will appear here once it is tracked.
          </p>

        </div>

      </section>

      {/* Quick Actions + New Users */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        <div className="rounded-xl border border-[#1B3428] bg-[#0B1511] p-6 lg:col-span-2">

          <h3 className="mb-5 text-base font-semibold text-[#D9E5DE]">
            Quick Actions
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

            <QuickAction
              icon={<UserPlus size={18} />}
              label="Add User"
            />

            <QuickAction
              icon={<Shield size={18} />}
              label="Add Administrator"
            />

            <QuickAction
              icon={<MapPin size={18} />}
              label="Add Destination"
            />

            <QuickAction
              icon={<Sparkles size={18} />}
              label="Add Recommendation"
            />

            <QuickAction
              icon={<MessageSquare size={18} />}
              label="View Reviews"
            />

          </div>

        </div>

        <div className="flex items-center gap-4 rounded-xl border-l-4 border-[#7CD9A6] border-r border-t border-b border-[#1B3428] bg-[#0B1511] p-6">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#7CD9A6]/10 text-[#7CD9A6]">
            <TrendingUp size={22} />
          </div>

          <div>
            <div className="text-2xl font-bold text-[#D9E5DE]">
              {newUsers}
            </div>

            <div className="text-xs text-[#9EADA5]">
              New Users This Month
            </div>
          </div>

        </div>

      </section>

      {/* Activity */}
      <section className="rounded-xl border border-[#1B3428] bg-[#0B1511] p-6">

        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#D9E5DE]">
            Recent System Activity
          </h3>

          <span className="rounded bg-[#2C3732] px-3 py-1 text-[11px] text-[#D9E5DE]">
            In development
          </span>
        </div>

        <div className="rounded-lg border border-dashed border-[#1B3428] bg-[#06100C] p-6">

          <p className="flex items-center gap-2 text-sm text-[#9EADA5]">
            <Clock size={13} />
            No activity has been recorded yet. System logs will appear here.
          </p>

        </div>

      </section>

    </div>
  );
}

function QuickAction({
  icon,
  label,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
}) {
  return (
    <button className="group flex items-center justify-between rounded-[10px] border border-[#48B77B] px-4 py-3 text-left text-sm font-semibold text-[#48B77B] transition hover:bg-[#48B77B]/10">

      <span className="flex items-center gap-2">
        {icon}
        {label}

        {badge && (
          <span className="rounded-full bg-[#93000A] px-2 py-0.5 text-[10px] text-[#FFDAD6]">
            {badge}
          </span>
        )}
      </span>

      <ArrowRight
        size={16}
        className="opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100"
      />

    </button>
  );
}
