import { useCallback, useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/AdminComponents/AdminSidebar";
import AdminTopbar from "../../components/AdminComponents/AdminTopbar";
import {
  deleteUser,
  getUsers,
  searchUsers,
  setUserStatus,
  updateUserRole,
  type UserDto,
} from "../../api/admin";
import { getUserId } from "../../api/authUtils";

export default function UsersPage() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const currentUserId = getUserId();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getUsers();
      setUsers(data);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const data = search.trim()
          ? await searchUsers(search.trim())
          : await getUsers();
        setUsers(data);
      } catch {
        // keep current list
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const filteredUsers = useMemo(() => users, [users]);

  const toggleStatus = async (user: UserDto) => {
    setBusy(true);
    try {
      const result = await setUserStatus(user.id, !user.isActive);
      if (result.success) {
        setUsers((current) =>
          current.map((u) =>
            u.id === user.id
              ? { ...u, isActive: result.data?.isActive ?? !user.isActive }
              : u
          )
        );
      }
    } catch {
      alert("Could not update status.");
    } finally {
      setBusy(false);
    }
  };

  const changeRole = async (user: UserDto, role: string) => {
    setBusy(true);
    try {
      const result = await updateUserRole(user.id, role);
      if (result.success) {
        setUsers((current) =>
          current.map((u) =>
            u.id === user.id ? { ...u, role } : u
          )
        );
      } else {
        alert(result.message || "Could not update role.");
      }
    } catch {
      alert("Could not update role.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (user: UserDto) => {
    if (user.id === currentUserId) {
      alert("You cannot delete your own account.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.username}?`
    );
    if (!confirmed) return;

    setBusy(true);
    try {
      const result = await deleteUser(user.id);
      if (result.success) {
        setUsers((current) => current.filter((u) => u.id !== user.id));
      } else {
        alert(result.message || "Could not delete user.");
      }
    } catch {
      alert("Could not delete user.");
    } finally {
      setBusy(false);
    }
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

          {error && (
            <div className="mb-4 rounded-lg border border-[#ffb4ab]/40 bg-[#3A1717] px-4 py-3 text-sm text-[#FFB4AB]">
              {error}
            </div>
          )}

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
                    onChange={(e) => setSearch(e.target.value)}
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
                      Status
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
                      <td colSpan={6} className="py-10 text-center text-[#bec9bf]">
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-[#bec9bf]">
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
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#2c3732] shrink-0 border border-[#1B3428] flex items-center justify-center text-[#bec9bf] text-[11px] font-medium uppercase">
                              {user.username.charAt(0) || "U"}
                            </div>

                            <span className="text-[14px] text-white font-medium truncate">
                              {user.username}
                              {user.id === currentUserId && (
                                <span className="ml-2 text-[11px] text-[#7CD9A6]">
                                  (you)
                                </span>
                              )}
                            </span>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-4 px-6 text-[13px] text-[#d9e5de]">
                          {user.email}
                        </td>

                        {/* Role */}
                        <td className="py-4 px-6">
                          <select
                            value={user.role}
                            disabled={user.id === currentUserId || busy}
                            onChange={(e) => changeRole(user, e.target.value)}
                            className="rounded-md border border-[#1B3428] bg-[#0D1A15] px-2 py-1.5 text-[12px] font-medium text-white outline-none focus:border-[#48B77B] disabled:opacity-50"
                          >
                            <option value="User">User</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6">
                          <StatusBadge active={user.isActive} />
                        </td>

                        {/* Joined */}
                        <td className="py-4 px-6">
                          <span className="text-[13px] text-[#d9e5de]">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => toggleStatus(user)}
                              disabled={user.id === currentUserId || busy}
                              className="p-1.5 rounded-md text-[#bec9bf] hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-colors disabled:opacity-40"
                              title={user.isActive ? "Suspend" : "Restore"}
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                {user.isActive ? "block" : "restore"}
                              </span>
                            </button>

                            <button
                              onClick={() => handleDelete(user)}
                              disabled={user.id === currentUserId || busy}
                              className="p-1.5 rounded-md text-[#bec9bf] hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-colors disabled:opacity-40"
                              title="Delete"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                delete
                              </span>
                            </button>
                          </div>
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
                Showing {filteredUsers.length} users
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#48B77B]/15 text-[#48B77B] text-[11px]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#48B77B]" />
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffb4ab]/15 text-[#ffb4ab] text-[11px]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab]" />
      Suspended
    </span>
  );
}
