"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, KeyRound, LayoutDashboard, Users, SquarePen, FileText, MessageSquare, Network, Shield, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { logoutAdmin } from "@/lib/services/authService";
import { useAuth } from "./AuthProvider";

const nav = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Notifications", icon: Bell, href: "/notifications" },
  { label: "User Management", icon: Users, href: "/users" },
  { label: "Post", icon: SquarePen, href: "/posts" },
  { label: "Reports", icon: FileText, href: "/reports" },
  { label: "Responses", icon: MessageSquare, href: "/replies" },
  { label: "Authority Mapping", icon: Network, href: "/authority" },
  { label: "Content Moderation", icon: Shield, href: "/moderation" },
  { label: "Credentials", icon: KeyRound, href: "/credentials", superAdminOnly: true },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [logoFailed, setLogoFailed] = useState(false);
  const { adminProfile, isSuperAdmin } = useAuth();

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to logout?")) return;
    await logoutAdmin();
    window.location.href = "/login";
  };

  return (
    <aside className="sticky top-0 h-screen w-56 shrink-0 overflow-y-auto bg-navy flex flex-col text-white">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3 border-b border-navy-light">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand text-xs font-bold">
          {logoFailed ? (
            "CV"
          ) : (
            <img
              src="/CityVoiceLogo.jpeg"
              alt="CityVoice logo"
              className="h-full w-full object-cover"
              onError={() => setLogoFailed(true)}
            />
          )}
        </div>
        <span className="truncate text-xl font-bold leading-none">CityVoice</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4">
        {nav.filter((item) => !item.superAdminOnly || isSuperAdmin).map(({ label, icon: Icon, href }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors hover:bg-navy-light
                ${isActive ? "bg-brand text-white" : "text-gray-300"}`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-6 py-4 border-t border-navy-light">
        <div className="mb-4 min-w-0 text-xs text-gray-300">
          <p className="truncate font-bold text-white">{adminProfile?.name || "Admin"}</p>
          <p className="truncate">{adminProfile?.role === "super_admin" ? "Super Admin" : "Admin"}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors w-full"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
