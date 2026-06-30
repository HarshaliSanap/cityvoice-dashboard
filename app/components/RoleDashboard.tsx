"use client";

import Sidebar from "./Sidebar";
import RealTimeStats from "./RealTimeStats";
import RecentReports from "./RecentReports";
import TopDashboardHighlights from "./TopDashboardHighlights";
import { useAuth } from "./AuthProvider";
import { getAdminRoleLabel, type AdminRole } from "@/lib/services/authService";
import { KeyRound, ShieldCheck, UserPlus, type LucideIcon } from "lucide-react";
import Link from "next/link";

type RoleDashboardProps = {
  role: AdminRole;
};

const roleCopy: Record<AdminRole, { title: string; description: string; actions: { href: string; label: string; icon: LucideIcon }[] }> = {
  developer: {
    title: "Developer Dashboard",
    description: "Highest access for managing Super Admin and Admin accounts plus system controls.",
    actions: [
      { href: "/signup", label: "Create Admin User", icon: UserPlus },
      { href: "/credentials", label: "Manage Admin Roles", icon: KeyRound },
    ],
  },
  super_admin: {
    title: "Super Admin Dashboard",
    description: "Operational access for managing Admin accounts, users, reports, and escalations.",
    actions: [
      { href: "/signup", label: "Create Admin", icon: UserPlus },
      { href: "/credentials", label: "Manage Admins", icon: KeyRound },
    ],
  },
  admin: {
    title: "Admin Dashboard",
    description: "Focused access for reports, posts, responses, notifications, and city operations.",
    actions: [
      { href: "/reports", label: "Review Reports", icon: ShieldCheck },
    ],
  },
};

export default function RoleDashboard({ role }: RoleDashboardProps) {
  const { adminProfile } = useAuth();
  const copy = roleCopy[role];

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{copy.title}</h1>
            <p className="mt-1 text-sm text-gray-500">{copy.description}</p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
            <ShieldCheck size={18} />
            {adminProfile ? getAdminRoleLabel(adminProfile.role) : getAdminRoleLabel(role)}
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {copy.actions.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 text-sm font-bold text-gray-800 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <Icon size={20} />
              </span>
              {label}
            </Link>
          ))}
        </div>

        <div className="mb-6">
          <RealTimeStats />
        </div>

        <div className="mb-6">
          <TopDashboardHighlights />
        </div>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <RecentReports />
        </section>
      </main>
    </div>
  );
}
