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

const stats = [
  {
    label: "Total Users",
    value: "2,481",
    change: "+12.4%",
    icon: Users,
  },
  {
    label: "Active Users",
    value: "1,842",
    icon: UserCheck,
  },
  {
    label: "Destinations",
    value: "1,204",
    icon: MapPin,
  },
  {
    label: "Recommendations",
    value: "6,892",
    icon: Sparkles,
  },
];

const destinations = [
  { name: "Tokyo", value: "1,240", width: "85%" },
  { name: "Paris", value: "982", width: "70%" },
  { name: "Kathmandu", value: "754", width: "55%" },
  { name: "London", value: "612", width: "45%" },
  { name: "Bali", value: "490", width: "30%" },
];

const activities = [
  {
    text: "Admin Sarah added a destination",
    time: "10 minutes ago",
  },
  {
    text: "System backup completed successfully",
    time: "45 minutes ago",
  },
  {
    text: "New user registered via Google Auth",
    time: "2 hours ago",
  },
  {
    text: "API rate limit warning triggered for weather service",
    time: "3 hours ago",
    warning: true,
  },
];

export default function AdminDashboardContent() {
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

        {stats.map((stat) => {
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

                {stat.change && (
                  <span className="rounded-full bg-[#7CD9A6]/10 px-2 py-1 text-[11px] font-medium text-[#7CD9A6]">
                    {stat.change}
                  </span>
                )}

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

            <button className="text-[#88948A] hover:text-[#7CD9A6]">
              •••
            </button>
          </div>

          <div className="text-3xl font-bold text-[#7CD9A6]">
            18,432
          </div>

          <p className="mt-1 text-sm text-[#BEC9BF]">
            Total Trips Created
          </p>

          <div className="mt-6 flex h-40 items-end gap-2 rounded-lg border border-[#1B3428] bg-[#06100C] p-4">

            {[35, 48, 42, 65, 55, 78, 63, 88, 72, 95].map(
              (height, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-t bg-[#2F8F62]/70 transition hover:bg-[#48B77B]"
                  style={{ height: `${height}%` }}
                />
              )
            )}

          </div>

        </div>

        {/* Popular Destinations */}
        <div className="rounded-xl border border-[#1B3428] bg-[#0B1511] p-6 xl:col-span-2">

          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#D9E5DE]">
              Popular Destinations
            </h3>

            <span className="rounded bg-[#2C3732] px-3 py-1 text-[11px] text-[#D9E5DE]">
              This Week
            </span>
          </div>

          <div className="space-y-5">

            {destinations.map((destination) => (
              <div key={destination.name}>

                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-[#D9E5DE]">
                    {destination.name}
                  </span>

                  <span className="font-bold text-[#7CD9A6]">
                    {destination.value}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-[#06100C]">
                  <div
                    className="h-full rounded-full bg-[#7CD9A6]"
                    style={{ width: destination.width }}
                  />
                </div>

              </div>
            ))}

          </div>
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
              badge="12 Pending"
            />

          </div>

        </div>

        <div className="flex items-center gap-4 rounded-xl border-l-4 border-[#7CD9A6] border-r border-t border-b border-[#1B3428] bg-[#0B1511] p-6">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#7CD9A6]/10 text-[#7CD9A6]">
            <TrendingUp size={22} />
          </div>

          <div>
            <div className="text-2xl font-bold text-[#D9E5DE]">
              327
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

          <a
            href="/admin/activity"
            className="text-xs font-medium text-[#7CD9A6] hover:underline"
          >
            View All Logs
          </a>
        </div>

        <div className="space-y-6">

          {activities.map((activity, index) => (
            <div
              key={index}
              className="relative flex gap-4"
            >

              <div
                className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${
                  activity.warning
                    ? "border-[#FFB4AB]"
                    : "border-[#7CD9A6]"
                } bg-[#0B1511]`}
              />

              <div>

                <div className="text-sm font-semibold text-[#D9E5DE]">
                  {activity.text}
                </div>

                <div className="mt-1 flex items-center gap-2 text-xs text-[#88948A]">
                  <Clock size={13} />
                  {activity.time}
                </div>

              </div>

            </div>
          ))}

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