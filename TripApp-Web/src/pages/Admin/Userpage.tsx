import { useMemo, useState } from "react";
import AdminSidebar from "../../components/AdminComponents/AdminSidebar";
import AdminTopbar from "../../components/AdminComponents/AdminTopbar";

interface User {
  id: number;
  name: string;
  email: string;
  role: "User" | "Admin" | "Super Admin";
  status: "Active" | "Suspended" | "Pending";
  joined: string;
  lastActive: string;
  initials?: string;
}

const initialUsers: User[] = [
  {
    id: 1,
    name: "Elena Rodriguez",
    email: "elena.r@example.com",
    role: "Admin",
    status: "Active",
    joined: "Oct 12, 2023",
    lastActive: "2 hours ago",
  },
  {
    id: 2,
    name: "Marcus Chen",
    email: "m.chen@example.com",
    role: "User",
    status: "Active",
    joined: "Jan 05, 2024",
    lastActive: "1 day ago",
  },
  {
    id: 3,
    name: "Sarah Jenkins",
    email: "sarah.j@example.com",
    role: "User",
    status: "Suspended",
    joined: "Nov 22, 2023",
    lastActive: "Mar 15, 2024",
    initials: "SJ",
  },
  {
    id: 4,
    name: "David Kim",
    email: "dkim_global@example.com",
    role: "Super Admin",
    status: "Active",
    joined: "May 01, 2022",
    lastActive: "Just now",
  },
  {
    id: 5,
    name: "Alicia Patel",
    email: "alicia.patel@example.com",
    role: "User",
    status: "Pending",
    joined: "Today",
    lastActive: "Never",
    initials: "AP",
  },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return users;

    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
  }, [users, search]);

  const toggleStatus = (id: number) => {
    setUsers((current) =>
      current.map((user) => {
        if (user.id !== id) return user;

        return {
          ...user,
          status:
            user.status === "Suspended"
              ? "Active"
              : "Suspended",
        };
      })
    );
  };

  const deleteUser = (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!confirmed) return;

    setUsers((current) =>
      current.filter((user) => user.id !== id)
    );
  };

  return (
    <div className="min-h-screen bg-[#07110D] text-[#d9e5de] antialiased">
      <AdminSidebar />

      <main className="flex flex-col min-h-screen md:ml-[260px]">
        <AdminTopbar />

        <div className="flex-1 p-4 md:p-8 overflow-x-hidden">
          
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-[30px] leading-[38px] font-bold text-[#d9e5de]">
                Users
              </h2>

              <p className="text-[14px] leading-5 text-[#bec9bf] mt-1">
                Manage accounts and access across the platform.
              </p>
            </div>
          </div>

          {/* Main Panel */}
          <div className="bg-[rgba(13,26,21,0.7)] backdrop-blur-xl border border-[#1B3428] rounded-xl overflow-hidden">

            {/* Toolbar */}
            <div className="p-4 md:p-6 border-b border-[#1B3428] flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#0b1511]/50">
              
              {/* Search */}
              <div className="flex flex-1 w-full sm:w-auto items-center gap-3">
                <div className="relative flex-1 sm:max-w-xs">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#bec9bf] text-[20px]">
                    search
                  </span>

                  <input
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    className="w-full bg-[#0D1A15] border border-[#1B3428] text-[#d9e5de] rounded-lg pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-[#bec9bf]/50 focus:border-[#48B77B] focus:ring-2 focus:ring-[#48B77B]/20"
                    placeholder="Search users by name or email..."
                    type="text"
                  />
                </div>

                <button className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#1B3428] bg-[#0D1A15] text-[#bec9bf] hover:text-white hover:border-[#3f4942] transition-colors">
                  <span className="material-symbols-outlined text-[18px]">
                    filter_list
                  </span>

                  <span className="hidden sm:inline">
                    Filter
                  </span>
                </button>

                <button className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#1B3428] bg-[#0D1A15] text-[#bec9bf] hover:text-white hover:border-[#3f4942] transition-colors">
                  <span className="material-symbols-outlined text-[18px]">
                    sort
                  </span>

                  <span className="hidden sm:inline">
                    Sort
                  </span>
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#1B3428] text-[#d9e5de] hover:bg-[#2c3732]/30 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">
                    download
                  </span>

                  Export CSV
                </button>

                <button className="bg-[#2F8F62] hover:brightness-110 text-white rounded-lg py-2.5 px-5 flex items-center justify-center gap-2 transition-all font-semibold">
                  <span
                    className="material-symbols-outlined text-[18px]"
                    style={{
                      fontVariationSettings: "'FILL' 1",
                    }}
                  >
                    person_add
                  </span>

                  Add User
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-[#06100C] border-b border-[#1B3428]">
                    <th className="text-[12px] text-[#bec9bf] uppercase py-4 px-6 font-semibold">
                      User
                    </th>

                    <th className="text-[12px] text-[#bec9bf] uppercase py-4 px-6 font-semibold">
                      Email
                    </th>

                    <th className="text-[12px] text-[#bec9bf] uppercase py-4 px-6 font-semibold">
                      Role
                    </th>

                    <th className="text-[12px] text-[#bec9bf] uppercase py-4 px-6 font-semibold">
                      Status
                    </th>

                    <th className="text-[12px] text-[#bec9bf] uppercase py-4 px-6 font-semibold">
                      Joined / Last Active
                    </th>

                    <th className="text-[12px] text-[#bec9bf] uppercase py-4 px-6 font-semibold text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#1B3428]">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-[#2F8F62]/[0.04] transition-colors group"
                    >
                      {/* User */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-[#2c3732] shrink-0 border border-[#1B3428] flex items-center justify-center text-[#bec9bf] text-[11px] font-medium">
                            {user.initials ??
                              user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                          </div>

                          <span className="text-[14px] text-white font-medium truncate">
                            {user.name}
                          </span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-6 text-[13px] text-[#d9e5de]">
                        {user.email}
                      </td>

                      {/* Role */}
                      <td className="py-4 px-6">
                        <span
                          className={`
                            inline-flex items-center px-2 py-1 rounded-md
                            text-[11px] font-medium
                            ${
                              user.role === "Super Admin"
                                ? "bg-[#2F8F62]/20 border border-[#2F8F62]/30 text-[#7cd9a6]"
                                : "bg-[#2c3732]/50 border border-[#3f4942]/30 text-white"
                            }
                          `}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <StatusBadge status={user.status} />
                      </td>

                      {/* Dates */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[13px] text-white">
                            {user.joined}
                          </span>

                          <span className="text-[11px] text-[#bec9bf]">
                            {user.lastActive}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          
                          <button
                            className="p-1.5 rounded-md text-[#bec9bf] hover:text-[#7cd9a6] hover:bg-[#7cd9a6]/10 transition-colors"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              edit
                            </span>
                          </button>

                          {user.status !== "Pending" && (
                            <button
                              onClick={() =>
                                toggleStatus(user.id)
                              }
                              className="p-1.5 rounded-md text-[#bec9bf] hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-colors"
                              title={
                                user.status === "Suspended"
                                  ? "Restore"
                                  : "Suspend"
                              }
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                {user.status === "Suspended"
                                  ? "restore"
                                  : "block"}
                              </span>
                            </button>
                          )}

                          {user.status === "Pending" && (
                            <button
                              className="p-1.5 rounded-md text-[#bec9bf] hover:text-[#7cd9a6] hover:bg-[#7cd9a6]/10 transition-colors"
                              title="Resend Invite"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                mail
                              </span>
                            </button>
                          )}

                          <button
                            onClick={() =>
                              deleteUser(user.id)
                            }
                            className="p-1.5 rounded-md text-[#bec9bf] hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-colors"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              delete
                            </span>
                          </button>

                          <button className="p-1.5 rounded-md text-[#bec9bf] hover:text-white hover:bg-[#2c3732] transition-colors">
                            <span className="material-symbols-outlined text-[20px]">
                              more_vert
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#1B3428] bg-[#06100C] flex items-center justify-between text-[#bec9bf] text-[11px]">
              <span>
                Showing {filteredUsers.length} of {users.length} users
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled
                  className="p-1 rounded-md hover:bg-[#2c3732] disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    chevron_left
                  </span>
                </button>

                <button className="p-1 rounded-md hover:bg-[#2c3732] hover:text-white">
                  <span className="material-symbols-outlined text-[20px]">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: User["status"];
}) {
  if (status === "Active") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#48B77B]/15 text-[#48B77B] text-[11px]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#48B77B]" />
        Active
      </span>
    );
  }

  if (status === "Suspended") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffb4ab]/15 text-[#ffb4ab] text-[11px]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab]" />
        Suspended
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#85948d]/20 text-[#bbcac2] text-[11px]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#bbcac2]" />
      Pending
    </span>
  );
}