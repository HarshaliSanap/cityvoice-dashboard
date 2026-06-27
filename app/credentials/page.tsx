"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../components/AuthProvider";
import {
  subscribeToAdminLoginHistory,
  subscribeToAdminProfiles,
  type AdminLoginRecord,
  type AdminProfile,
} from "@/lib/services/authService";
import { CalendarClock, KeyRound, ShieldCheck, UserRound } from "lucide-react";

const formatDate = (value?: string) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleString();
};

export default function CredentialsPage() {
  const { isSuperAdmin, isLoading } = useAuth();
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [loginHistory, setLoginHistory] = useState<AdminLoginRecord[]>([]);

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
            <p className="mt-2 text-sm leading-6 text-gray-500">Admin credentials and login history are visible only to super admins.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Credentials</h1>
            <p className="mt-1 text-sm text-gray-500">Super admin view of admin accounts and login activity stored in Firebase</p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
            <KeyRound size={18} />
            {profiles.length} accounts
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-blue-600 p-5 text-white shadow-sm">
            <p className="text-sm font-medium opacity-90">Total Admins</p>
            <p className="mt-1 text-3xl font-bold">{profiles.length}</p>
          </div>
          <div className="rounded-2xl bg-cyan-600 p-5 text-white shadow-sm">
            <p className="text-sm font-medium opacity-90">Admins</p>
            <p className="mt-1 text-3xl font-bold">{profiles.filter((profile) => profile.role === "admin").length}</p>
          </div>
          <div className="rounded-2xl bg-gray-900 p-5 text-white shadow-sm">
            <p className="text-sm font-medium opacity-90">Super Admins</p>
            <p className="mt-1 text-3xl font-bold">{profiles.filter((profile) => profile.role === "super_admin").length}</p>
          </div>
          <div className="rounded-2xl bg-green-600 p-5 text-white shadow-sm">
            <p className="text-sm font-medium opacity-90">Login Records</p>
            <p className="mt-1 text-3xl font-bold">{loginHistory.length}</p>
          </div>
        </div>

        <section className="mb-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-gray-800">Admin Accounts</h2>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {profiles.map((profile) => (
              <article key={profile.uid} className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                    <UserRound size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-bold text-gray-800">{profile.name}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                        profile.role === "super_admin" ? "bg-gray-900 text-white" : "bg-blue-100 text-blue-700"
                      }`}>
                        {profile.role === "super_admin" ? "Super Admin" : "Admin"}
                      </span>
                    </div>
                    <p className="mt-1 break-all text-sm text-gray-500">{profile.email}</p>
                    <div className="mt-4 grid gap-2 text-xs text-gray-500 sm:grid-cols-2">
                      <span>Created: {formatDate(profile.createdAt)}</span>
                      <span>Last login: {formatDate(profile.lastLoginAt)}</span>
                      <span className="sm:col-span-2">UID: {profile.uid}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
            {profiles.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-400 xl:col-span-2">
                No admin profiles found
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <CalendarClock size={19} className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Login History</h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Logged At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loginHistory.slice(0, 50).map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-semibold text-gray-800">{record.name}</td>
                    <td className="px-5 py-4 text-gray-500">{record.email}</td>
                    <td className="px-5 py-4 text-gray-500">{record.role === "super_admin" ? "Super Admin" : "Admin"}</td>
                    <td className="px-5 py-4 text-gray-500">{formatDate(record.loggedAt)}</td>
                  </tr>
                ))}
                {loginHistory.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-400">No login records yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
