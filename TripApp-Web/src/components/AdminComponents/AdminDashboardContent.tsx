import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  Sparkles,
  TrendingUp,
  Shield,
} from "lucide-react";
import { getAdminStats } from "../../api/admin";

export default function AdminDashboardContent() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    newUsersThisMonth: 0,
  });

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(() => {});
  }, []);

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
    },
    {
      label: "Active Users",
      value: stats.activeUsers.toLocaleString(),
      icon: UserCheck,
    },
    {
      label: "Administrators",
      value: stats.adminUsers.toLocaleString(),
      icon: Shield,
    },
    {
      label: "New Users (Month)",
      value: stats.newUsersThisMonth.toLocaleString(),
      icon: Sparkles,
    },
  ];

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



        <div className="flex items-center gap-4 rounded-xl border-l-4 border-[#7CD9A6] border-r border-t border-b border-[#1B3428] bg-[#0B1511] p-6">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#7CD9A6]/10 text-[#7CD9A6]">
            <TrendingUp size={22} />
          </div>

          <div>
            <div className="text-2xl font-bold text-[#D9E5DE]">
              {stats.newUsersThisMonth.toLocaleString()}
            </div>

            <div className="text-xs text-[#9EADA5]">
              New Users This Month
            </div>
          </div>

        </div>

    </div>
  );
}