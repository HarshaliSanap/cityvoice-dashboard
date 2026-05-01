"use client";
import { useState, useEffect } from "react";
import { Users, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import Sidebar from "./components/Sidebar";
import Link from "next/link";
import RealTimeStats from "./components/RealTimeStats";
import ReportsOverviewChart from "./components/ReportsOverviewChart";
import UserActivityChart from "./components/UserActivityChart";
import FounderAddress from "./components/FounderAddress";
import RecentReports from "./components/RecentReports";
import AuthorityMapping from "./components/AuthorityMapping";

import { useDashboardData } from "@/lib/hooks/useDashboardData";
import { subscribeToSettings, updateSetting } from "@/lib/services/dataService";

export default function Dashboard() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [adminSettings, setAdminSettings] = useState({
    darkMode: false,
    realTimeUpdates: true,
    emailAlerts: true,
    desktopNotifications: false
  });
  const { reports } = useDashboardData();

  useEffect(() => {
    // Sync settings with Firebase
    const unsubscribe = subscribeToSettings((settings) => {
      setAdminSettings(settings);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  const handleToggleSetting = (key: string, currentValue: boolean) => {
    updateSetting(key, !currentValue);
  };

  // Create dynamic notifications from real posts (Sorted by newest first)
  const notifications = (reports || [])
    .sort((a, b) => new Date(b.timestamp?.replace(' ', 'T')).getTime() - new Date(a.timestamp?.replace(' ', 'T')).getTime())
    .slice(0, 5)
    .map(r => ({
      title: `New ${r.category || 'Report'}`,
      time: r.timestamp ? new Date(r.timestamp.split(' ')[0]).toLocaleDateString() : "Just now",
      icon: r.category === "Roads" ? "🛣️" : r.category === "Water" ? "💧" : "📋",
      desc: `${r.name || 'User'} reported: ${r.description?.substring(0, 30)}...`
    }));

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 p-8 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <div className="flex items-center gap-4 relative">
            {/* Notifications Button */}
            <div className="relative">
              <button 
                onClick={() => { setShowNotifications(!showNotifications); setShowSettings(false); }}
                className={`p-2.5 rounded-xl shadow-sm border transition-all relative ${showNotifications ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-100 hover:border-blue-200 hover:bg-blue-50'}`}
              >
                🔔
                {notifications.length > 0 && !showNotifications && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Notifications</h3>
                    {notifications.length > 0 && (
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">{notifications.length} NEW</span>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((n, i) => (
                        <div key={i} className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors">
                          <div className="flex gap-3">
                            <span className="text-xl">{n.icon}</span>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{n.desc}</p>
                              <p className="text-[10px] text-gray-400 mt-1 font-medium">{n.time}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-400 text-sm italic">
                        No new notifications
                      </div>
                    )}
                  </div>
                  <Link href="/reports" className="block">
                    <button className="w-full py-3 text-xs text-blue-600 font-bold bg-gray-50 hover:bg-gray-100 transition-colors">
                      View All Notifications
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* Settings Button */}
            <div className="relative">
              <button 
                onClick={() => { setShowSettings(!showSettings); setShowNotifications(false); }}
                className={`p-2 rounded-xl shadow-sm border transition-all ${showSettings ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-100 hover:border-blue-200'}`}
              >
                ⚙️
              </button>

              {showSettings && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 border-b border-gray-50">
                    <h3 className="font-bold text-gray-800">Quick Settings</h3>
                  </div>
                  <div className="p-2">
                    {[
                      { label: "Dark Mode", active: adminSettings.darkMode, key: "darkMode" },
                      { label: "Real-time Updates", active: adminSettings.realTimeUpdates, key: "realTimeUpdates" },
                      { label: "Email Alerts", active: adminSettings.emailAlerts, key: "emailAlerts" },
                      { label: "Desktop Notifications", active: adminSettings.desktopNotifications, key: "desktopNotifications" }
                    ].map((s, i) => (
                      <div 
                        key={i} 
                        onClick={() => handleToggleSetting(s.key, s.active)}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group"
                      >
                        <span className="text-sm text-gray-600 font-medium group-hover:text-gray-900">{s.label}</span>
                        <div className={`w-8 h-4 rounded-full relative transition-all duration-200 ${s.active ? 'bg-blue-600' : 'bg-gray-200'}`}>
                          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-200 ${s.active ? 'right-0.5' : 'left-0.5'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-gray-50">
                    <button className="w-full py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors">Advanced Settings</button>
                  </div>
                </div>
              )}
            </div>

            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-blue-600 overflow-hidden shadow-md border-2 border-white">
              <img src="https://i.pravatar.cc/40?img=11" alt="User" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        <RealTimeStats />

        <div className="flex gap-4">
          <ReportsOverviewChart />
          <UserActivityChart />
        </div>

        <FounderAddress />

        <div className="flex gap-4">
          <RecentReports />
          <AuthorityMapping />
        </div>
      </main>
    </div>
  );
}