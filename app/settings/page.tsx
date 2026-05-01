"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { subscribeToSettings, updateSetting } from "@/lib/services/dataService";
import { Settings, Bell, Shield, User, Globe, Moon, Save, CheckCircle } from "lucide-react";

export default function SettingsPage() {
  const [adminSettings, setAdminSettings] = useState<any>({
    darkMode: false,
    realTimeUpdates: true,
    emailAlerts: true,
    desktopNotifications: false,
    adminName: "Admin User",
    adminEmail: "admin@cityvoice.gov"
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToSettings((data) => {
      setAdminSettings(prev => ({ ...prev, ...data }));
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  const handleToggle = async (key: string, value: boolean) => {
    await updateSetting(key, !value);
  };

  const handleManualSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
    }, 800);
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Advanced Settings</h1>
              <p className="text-sm text-gray-500 mt-1">Configure your dashboard behavior and admin profile</p>
            </div>
            <button 
              onClick={handleManualSave}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              {isSaving ? "Saving..." : showSaved ? <><CheckCircle size={18} /> Saved</> : <><Save size={18} /> Save All Changes</>}
            </button>
          </div>

          <div className="grid gap-6">
            {/* Profile Settings */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <User size={20} />
                </div>
                <h3 className="font-bold text-gray-800 text-lg">Admin Profile</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Settings size={20} />
                </div>
                <h3 className="font-bold text-gray-800 text-lg">System Configuration</h3>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Dark Mode", desc: "Enable obsidian & gold dark theme across the dashboard", icon: Moon, key: "darkMode" },
                  { label: "Real-time Updates", desc: "Sync data automatically without refreshing the page", icon: Globe, key: "realTimeUpdates" },
                  { label: "Email Alerts", desc: "Receive immediate notifications for high-priority reports", icon: Bell, key: "emailAlerts" },
                  { label: "Desktop Notifications", desc: "Show browser alerts when the dashboard is in background", icon: Shield, key: "desktopNotifications" }
                ].map((s) => (
                  <div key={s.key} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-gray-100">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400">
                        <s.icon size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{s.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleToggle(s.key, adminSettings[s.key])}
                      className={`w-12 h-6 rounded-full relative transition-all duration-200 ${adminSettings[s.key] ? 'bg-blue-600' : 'bg-gray-200'}`}
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