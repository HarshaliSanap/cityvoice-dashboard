"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../components/AuthProvider";
import {
  canManageAdminProfile,
  clearAdminLoginHistory,
  deleteAdminAccount,
  getAdminRoleLabel,
  subscribeToAdminLoginHistory,
  subscribeToAdminProfiles,
  updateAdminAccount,
  type AdminLoginRecord,
  type AdminProfile,
} from "@/lib/services/authService";
import { CalendarClock, KeyRound, Pencil, Save, ShieldCheck, Trash2, UserRound, X } from "lucide-react";

const formatDate = (value?: string) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleString();
};

export default function CredentialsPage() {
  const { adminProfile, isSuperAdmin, isLoading } = useAuth();
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [loginHistory, setLoginHistory] = useState<AdminLoginRecord[]>([]);
  const [editingUid, setEditingUid] = useState("");
  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState<AdminProfile["status"]>("active");
  const [historyDateFilter, setHistoryDateFilter] = useState("");
  const [historyMonthFilter, setHistoryMonthFilter] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isSuperAdmin) return;

    const unsubscribeProfiles = subscribeToAdminProfiles(setProfiles);
    const unsubscribeHistory = subscribeToAdminLoginHistory(setLoginHistory);

    return () => {
      unsubscribeProfiles?.();
      unsubscribeHistory?.();
    };
  }, [isSuperAdmin]);

  if (isLoading) return null;

  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-screen bg-[#f8fafc]">
        <Sidebar />
        <main className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-md rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <ShieldCheck className="mx-auto mb-4 text-gray-300" size={44} />
            <h1 className="text-xl font-bold text-gray-800">Super admin only</h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">Admin credentials and login history are visible only to developers and super admins.</p>
          </div>
        </main>
      </div>
    );
  }

  const visibleProfiles = profiles.filter((profile) => canManageAdminProfile(adminProfile?.role, profile.role));
  const filteredLoginHistory = loginHistory.filter((record) => {
    const date = new Date(record.loggedAt);
    if (Number.isNaN(date.getTime())) return !historyDateFilter && !historyMonthFilter;

    const recordDate = date.toISOString().slice(0, 10);
    const recordMonth = recordDate.slice(0, 7);

    if (historyDateFilter && recordDate !== historyDateFilter) return false;
    if (historyMonthFilter && recordMonth !== historyMonthFilter) return false;
    return true;
  });

  const beginEdit = (profile: AdminProfile) => {
    setEditingUid(profile.uid);
    setEditName(profile.name);
    setEditStatus(profile.status);
    setMessage("");
  };

  const handleUpdate = async (profile: AdminProfile) => {
    setMessage("");
    if (!canManageAdminProfile(adminProfile?.role, profile.role)) {
      setMessage("You do not have permission to update this account.");
      return;
    }

    try {
      await updateAdminAccount(profile.uid, {
        name: editName.trim() || profile.name,
        role: profile.role,
        status: editStatus,
      });
      setEditingUid("");
      setMessage("Account updated successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update account.");
    }
  };

  const handleDelete = async (profile: AdminProfile) => {
    setMessage("");
    if (!canManageAdminProfile(adminProfile?.role, profile.role)) {
      setMessage("You do not have permission to delete this account.");
      return;
    }

    if (!confirm(`Disable ${profile.name}'s ${getAdminRoleLabel(profile.role)} account?`)) return;

    try {
      await deleteAdminAccount(profile.uid);
      setMessage("Account disabled successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete account.");
    }
  };

  const handleClearLoginHistory = async () => {
    setMessage("");
    if (!confirm("Delete all admin login history? This cannot be undone.")) return;

    try {
      await clearAdminLoginHistory();
      setMessage("Login history deleted successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete login history.");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Credentials</h1>
            <p className="mt-1 text-sm text-gray-500">Developer and super admin view of admin accounts and login activity stored in Firebase</p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
            <KeyRound size={18} />
            {visibleProfiles.length} managed accounts
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="rounded-2xl bg-blue-600 p-5 text-white shadow-sm">
            <p className="text-sm font-medium opacity-90">Total Accounts</p>
            <p className="mt-1 text-3xl font-bold">{visibleProfiles.length}</p>
          </div>
          <div className="rounded-2xl bg-violet-600 p-5 text-white shadow-sm">
            <p className="text-sm font-medium opacity-90">Developers</p>
            <p className="mt-1 text-3xl font-bold">{visibleProfiles.filter((profile) => profile.role === "developer").length}</p>
          </div>
          <div className="rounded-2xl bg-cyan-600 p-5 text-white shadow-sm">
            <p className="text-sm font-medium opacity-90">Admins</p>
            <p className="mt-1 text-3xl font-bold">{visibleProfiles.filter((profile) => profile.role === "admin").length}</p>
          </div>
          <div className="rounded-2xl bg-gray-900 p-5 text-white shadow-sm">
            <p className="text-sm font-medium opacity-90">Super Admins</p>
            <p className="mt-1 text-3xl font-bold">{visibleProfiles.filter((profile) => profile.role === "super_admin").length}</p>
          </div>
          <div className="rounded-2xl bg-green-600 p-5 text-white shadow-sm">
            <p className="text-sm font-medium opacity-90">Login Records</p>
            <p className="mt-1 text-3xl font-bold">{loginHistory.length}</p>
          </div>
        </div>

        {message && (
          <p className={`mb-6 rounded-2xl px-4 py-3 text-sm font-semibold ${
            message.includes("successfully") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
          }`}>
            {message}
          </p>
        )}

        <section className="mb-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-gray-800">Admin Accounts</h2>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {visibleProfiles.map((profile) => (
              <article key={profile.uid} className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                    <UserRound size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {editingUid === profile.uid ? (
                        <input
                          value={editName}
                          onChange={(event) => setEditName(event.target.value)}
                          className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-800 outline-none focus:border-blue-400"
                        />
                      ) : (
                        <h3 className="truncate font-bold text-gray-800">{profile.name}</h3>
                      )}
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                        profile.role === "developer"
                          ? "bg-violet-100 text-violet-700"
                          : profile.role === "super_admin"
                            ? "bg-gray-900 text-white"
                            : "bg-blue-100 text-blue-700"
                      }`}>
                        {getAdminRoleLabel(profile.role)}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                        profile.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {profile.status}
                      </span>
                    </div>
                    <p className="mt-1 break-all text-sm text-gray-500">{profile.email}</p>
                    {editingUid === profile.uid && (
                      <div className="mt-4">
                        <span className="mb-2 block text-xs font-bold uppercase text-gray-400">Status</span>
                        <select
                          value={editStatus}
                          onChange={(event) => setEditStatus(event.target.value as AdminProfile["status"])}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 outline-none focus:border-blue-400"
                        >
                          <option value="active">Active</option>
                          <option value="disabled">Disabled</option>
                        </select>
                      </div>
                    )}
                    <div className="mt-4 grid gap-2 text-xs text-gray-500 sm:grid-cols-2">
                      <span>Created: {formatDate(profile.createdAt)}</span>
                      <span>Updated: {formatDate(profile.updatedAt)}</span>
                      <span>Last login: {formatDate(profile.lastLoginAt)}</span>
                      <span className="sm:col-span-2">UID: {profile.uid}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {editingUid === profile.uid ? (
                        <>
                          <button
                            onClick={() => handleUpdate(profile)}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
                          >
                            <Save size={14} />
                            Save
                          </button>
                          <button
                            onClick={() => setEditingUid("")}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
                          >
                            <X size={14} />
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => beginEdit(profile)}
                            className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(profile)}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
            {visibleProfiles.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-400 xl:col-span-2">
                No admin profiles found
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock size={19} className="text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800">Login History</h2>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-500">
                {filteredLoginHistory.length} shown
              </span>
            </div>
            <button
              onClick={handleClearLoginHistory}
              disabled={loginHistory.length === 0}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={14} />
              Clear Login History
            </button>
          </div>

          <div className="mb-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase text-gray-400">Search by Date</span>
              <input
                type="date"
                value={historyDateFilter}
                onChange={(event) => setHistoryDateFilter(event.target.value)}
                className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none transition-colors focus:border-blue-400 focus:bg-white"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase text-gray-400">Search by Month</span>
              <input
                type="month"
                value={historyMonthFilter}
                onChange={(event) => setHistoryMonthFilter(event.target.value)}
                className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none transition-colors focus:border-blue-400 focus:bg-white"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setHistoryDateFilter("");
                setHistoryMonthFilter("");
              }}
              disabled={!historyDateFilter && !historyMonthFilter}
              className="self-end rounded-2xl border border-gray-100 bg-white px-5 py-3 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-100">
            <div className="max-h-[440px] overflow-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Logged At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLoginHistory.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-semibold text-gray-800">{record.name}</td>
                    <td className="px-5 py-4 text-gray-500">{record.email}</td>
                    <td className="px-5 py-4 text-gray-500">{getAdminRoleLabel(record.role)}</td>
                    <td className="px-5 py-4 text-gray-500">{formatDate(record.loggedAt)}</td>
                  </tr>
                ))}
                {filteredLoginHistory.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-400">
                      {loginHistory.length === 0 ? "No login records yet" : "No login records match this search"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
