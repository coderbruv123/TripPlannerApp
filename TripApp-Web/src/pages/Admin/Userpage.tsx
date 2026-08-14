import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/AdminComponents/AdminSidebar";
import AdminTopbar from "../../components/AdminComponents/AdminTopbar";
import api from "../../api/axiosInstance";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  joined: string;
}

interface ApiUser {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    api
      .get<ApiUser[]>(
        "/admin/GetUsers"
      )
      .then((response) => {
        if (!active) return;

        setUsers(
          (response.data || []).map((u) => ({
            id: u.id,
            name: u.username,
            email: u.email,
            role: u.role,
            joined: u.createdAt
              ? new Date(u.createdAt).toLocaleDateString()
              : "—",
          }))
        );
      })
      .catch((error) =>
        console.error("Failed to load users:", error)
      )
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return users;

    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
  }, [users, search]);

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
                      Joined
                    </th>

                    <th className="text-[12px] text-[#bec9bf] uppercase py-4 px-6 font-semibold text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#1B3428]">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-[#bec9bf]">
                        Loading users…
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-[#bec9bf]">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-[#2F8F62]/[0.04] transition-colors group"
                      >
                        {/* User */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#2c3732] shrink-0 border border-[#1B3428] flex items-center justify-center text-[#bec9bf] text-[11px] font-medium">
                              {user.name
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
                            className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium ${
                              user.role === "Admin"
                                ? "bg-[#2F8F62]/20 border border-[#2F8F62]/30 text-[#7cd9a6]"
                                : "bg-[#2c3732]/50 border border-[#3f4942]/30 text-white"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>

                        {/* Joined */}
                        <td className="py-4 px-6">
                          <span className="text-[13px] text-white">
                            {user.joined}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <span className="text-[11px] text-[#bec9bf]">
                            In development
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#1B3428] bg-[#06100C] flex items-center justify-between text-[#bec9bf] text-[11px]">
              <span>
                Showing {filteredUsers.length} of {users.length} users
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
