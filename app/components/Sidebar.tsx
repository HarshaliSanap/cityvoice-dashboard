"use client";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, MessageSquare, Network, Shield, Settings, LogOut } from "lucide-react";
import Link from "next/link";

const nav = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "User Management", icon: Users, href: "/users" },
  { label: "Reports", icon: FileText, href: "/reports" },
  { label: "Replies", icon: MessageSquare, href: "/replies" },
  { label: "Authority Mapping", icon: Network, href: "/authority" },
  { label: "Content Moderation", icon: Shield, href: "/moderation" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 min-h-screen bg-navy flex flex-col text-white">
      {/* Logo */}
      <div className="px-6 py-5 flex items-center gap-2 border-b border-navy-light">
        <div className="w-8 h-8 bg-brand rounded-md flex items-center justify-center text-xs font-bold">CV</div>
        <span className="text-xl font-bold">CityVoice</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4">
        {nav.map(({ label, icon: Icon, href }) => {
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
        <button 
          onClick={() => {
            if(confirm("Are you sure you want to logout?")) {
              window.location.href = "/login"; // Or your login route
            }
          }}
          className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors w-full"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}