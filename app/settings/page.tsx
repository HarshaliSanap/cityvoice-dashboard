"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { subscribeToPostsWithUsers, subscribeToSettings, subscribeToUsers, updateSetting, updateSettings } from "@/lib/services/dataService";
import { Settings, Bell, Shield, User, Globe, Moon, Save, CheckCircle, FileText, Users, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type AdminSettings = {
  darkMode: boolean;
  realTimeUpdates: boolean;
  emailAlerts: boolean;
  desktopNotifications: boolean;
  adminName: string;
  adminEmail: string;
};

type SettingToggleKey = "darkMode" | "realTimeUpdates" | "emailAlerts" | "desktopNotifications";

type SettingToggle = {
  label: string;
  desc: string;
  icon: LucideIcon;
  key: SettingToggleKey;
};

type LivePost = {
  status?: string;
  supports?: number;
};

type LiveUser = {
  blocked?: boolean;
};

export default function SettingsPage() {
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    darkMode: false,
    realTimeUpdates: true,
    emailAlerts: true,
    desktopNotifications: false,
    adminName: "Admin User",
    adminEmail: "admin@cityvoice.gov"
  });
  const [livePosts, setLivePosts] = useState<LivePost[]>([]);
  const [liveUsers, setLiveUsers] = useState<LiveUser[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [savingToggleKey, setSavingToggleKey] = useState<SettingToggleKey | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToSettings((data: Partial<AdminSettings>) => {
      window.setTimeout(() => {
        setAdminSettings((prev) => ({ ...prev, ...data }));
      }, 0);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribePosts = subscribeToPostsWithUsers((data: LivePost[]) => {
      setLivePosts(data);
    });

    const unsubscribeUsers = subscribeToUsers((data: LiveUser[]) => {
      setLiveUsers(data);
    });

    return () => {
      unsubscribePosts?.();
      unsubscribeUsers?.();
    };
  }, []);

  const settingToggles: SettingToggle[] = [
    { label: "Dark Mode", desc: "Enable obsidian & gold dark theme across the dashboard", icon: Moon, key: "darkMode" },
    { label: "Real-time Updates", desc: "Sync data automatically without refreshing the page", icon: Globe, key: "realTimeUpdates" },
    { label: "Email Alerts", desc: "Receive immediate notifications for high-priority reports", icon: Bell, key: "emailAlerts" },
    { label: "Desktop Notifications", desc: "Show browser alerts when the dashboard is in background", icon: Shield, key: "desktopNotifications" }
  ];

  const handleToggle = async (key: SettingToggleKey, value: boolean) => {
    const nextValue = !value;

    if (key === "desktopNotifications" && nextValue && "Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        await updateSetting(key, false);
        alert("Desktop notifications need browser permission before they can be enabled.");
        return;
      }
    }

    setSavingToggleKey(key);
    const saved = await updateSetting(key, nextValue);
    setSavingToggleKey(null);

    if (!saved) {
      alert("Failed to update setting. Please try again.");
    }
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    const saved = await updateSettings({
      adminName: adminSettings.adminName,
      adminEmail: adminSettings.adminEmail,
    });
    setIsSaving(false);

    if (saved) {
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
    } else {
      alert("Failed to save settings. Please try again.");
    }
  };

  const resolvedPosts = livePosts.filter((post) => post.status === "Resolved").length;
  const pendingPosts = livePosts.filter((post) => !post.status || post.status === "Pending").length;
  const activeUsers = liveUsers.filter((user) => !user.blocked).length;
  const totalSupports = livePosts.reduce((total, post) => total + (post.supports || 0), 0);

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Advanced Settings</h1>
              <p className="text-sm text-gray-500 mt-1">Configure your dashboard behavior and admin profile</p>
            </div>
            <button 
              onClick={handleManualSave}
              disabled={isSaving}
              className="inline-flex w-fit items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
            >
              {isSaving ? "Saving..." : showSaved ? <><CheckCircle size={18} /> Saved</> : <><Save size={18} /> Save All Changes</>}
            </button>
          </div>

          <div className="grid gap-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {[
                { label: "Live Posts", value: livePosts.length, icon: FileText, color: "bg-blue-600" },
                { label: "Resolved", value: resolvedPosts, icon: CheckCircle, color: "bg-green-600" },
                { label: "Pending", value: pendingPosts, icon: MessageSquare, color: "bg-orange-500" },
                { label: "Active Users", value: activeUsers, icon: Users, color: "bg-gray-900" },
              ].map((card) => (
                <div key={card.label} className={`${card.color} min-h-[112px] rounded-2xl p-5 text-white shadow-sm`}>
                  <div className="flex items-center gap-2 text-sm font-medium opacity-90">
                    <card.icon size={17} />
                    {card.label}
                  </div>
                  <p className="mt-2 text-3xl font-bold">{card.value}</p>
                </div>
              ))}
            </div>

            {/* Profile Settings */}
            <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <User size={20} />
                </div>
                <h3 className="font-bold text-gray-800 text-lg">Admin Profile</h3>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Display Name</label>
                  <input 
                    type="text" 
                    value={adminSettings.adminName || ""}
                    onChange={(e) => setAdminSettings({...adminSettings, adminName: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Email Address</label>
                  <input 
                    type="email" 
                    value={adminSettings.adminEmail || ""}
                    onChange={(e) => setAdminSettings({...adminSettings, adminEmail: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* System Settings */}
            <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Settings size={20} />
                </div>
                <h3 className="font-bold text-gray-800 text-lg">System Configuration</h3>
              </div>
              <div className="space-y-4">
                {settingToggles.map((s) => (
                  <div
                    key={s.key}
                    className="grid min-h-[76px] grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-transparent p-4 transition-colors hover:border-gray-100 hover:bg-gray-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400">
                        <s.icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800">{s.label}</p>
                      <p className="mt-0.5 truncate text-xs text-gray-400">
                        {s.key === "realTimeUpdates" ? `${s.desc} (${livePosts.length} posts, ${liveUsers.length} users, ${totalSupports} supports live)` : s.desc}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleToggle(s.key, adminSettings[s.key])}
                      disabled={savingToggleKey === s.key}
                      aria-pressed={adminSettings[s.key]}
                      className={`relative h-6 w-12 shrink-0 rounded-full transition-all duration-200 disabled:cursor-wait disabled:opacity-60 ${adminSettings[s.key] ? 'bg-blue-600' : 'bg-gray-200'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${adminSettings[s.key] ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
