"use client";

import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Link from "next/link";

import RealTimeStats from "./components/RealTimeStats";
import ReportsOverviewChart from "./components/ReportsOverviewChart";
import UserActivityChart from "./components/UserActivityChart";
import RecentReports from "./components/RecentReports";
import AuthorityMapping from "./components/AuthorityMapping";
import TopDashboardHighlights from "./components/TopDashboardHighlights";

import { useDashboardData } from "@/lib/hooks/useDashboardData";
import {
  subscribeToAccountBlockClaims,
  subscribeToSettings,
  subscribeToUserNotifications,
  updateSetting,
} from "@/lib/services/dataService";

type AccountBlockClaim = {
  active?: boolean;
  id: string;
  description?: string;
  status?: string;
  timestamp?: string;
  userBlocked?: boolean;
  userEmail?: string;
  userId?: string;
  userName?: string;
};

type UserNotification = {
  id: string;
  createdAt?: string;
  expiresAt?: string;
  logoUrl?: string;
  message?: string;
};

type DashboardNotification = {
  desc: string;
  href: string;
  icon: string;
  imageIcon: boolean;
  time: string;
  timestamp: string;
  title: string;
};

const getClaimTimestampValue = (timestamp?: string) => {
  if (!timestamp) return 0;

  const parsed = new Date(timestamp.replace(" ", "T")).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getClaimUserKey = (claim: AccountBlockClaim) => {
  return claim.userId || claim.userEmail?.toLowerCase() || claim.userName?.toLowerCase() || claim.id;
};

const isActiveClaim = (claim: AccountBlockClaim) => {
  const status = String(claim.status || "new").toLowerCase();
  return claim.active !== false && !["closed", "resolved", "dismissed", "done"].includes(status);
};

const getLatestClaimsByUser = (claims: AccountBlockClaim[]) => {
  const claimsByUser: Record<string, { count: number; latest: AccountBlockClaim }> = {};

  claims.filter(isActiveClaim).forEach((claim) => {
    const key = getClaimUserKey(claim);
    const existing = claimsByUser[key];

    if (!existing || getClaimTimestampValue(claim.timestamp) > getClaimTimestampValue(existing.latest.timestamp)) {
      claimsByUser[key] = {
        count: existing?.count ? existing.count + 1 : 1,
        latest: claim,
      };
      return;
    }

    existing.count += 1;
  });

  return Object.values(claimsByUser)
    .sort((a, b) => getClaimTimestampValue(b.latest.timestamp) - getClaimTimestampValue(a.latest.timestamp))
    .slice(0, 5);
};

export default function Dashboard() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [accountBlockClaims, setAccountBlockClaims] = useState<AccountBlockClaim[]>([]);
  const [userNotifications, setUserNotifications] = useState<UserNotification[]>([]);

  const [adminSettings, setAdminSettings] = useState({
    darkMode: false,
    realTimeUpdates: true,
    emailAlerts: true,
    desktopNotifications: false,
  });

  const { reports } = useDashboardData();

  useEffect(() => {
    const unsubscribe = subscribeToSettings((settings) => {
      setAdminSettings(settings);
    });

    return () => unsubscribe && unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAccountBlockClaims((claims) => {
      setAccountBlockClaims(claims);
    });

    return () => unsubscribe?.();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToUserNotifications((notifications) => {
      setUserNotifications(notifications);
    });

    return () => unsubscribe?.();
  }, []);

  const handleToggleSetting = (
    key: string,
    currentValue: boolean
  ) => {
    updateSetting(key, !currentValue);
  };

  const getTimestampValue = (timestamp?: string) => {
    if (!timestamp) return 0;

    const parsed = new Date(timestamp.replace(" ", "T")).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  // Dynamic notifications
  const reportNotifications: DashboardNotification[] = (reports || [])
    .sort(
      (a, b) =>
        getTimestampValue(b.timestamp) -
        getTimestampValue(a.timestamp)
    )
    .slice(0, 5)
    .map((r) => ({
      title: `New ${r.category || "Report"}`,
      time: r.timestamp
        ? new Date(
            r.timestamp.split(" ")[0]
          ).toLocaleDateString()
        : "Just now",
      timestamp: r.timestamp || "",
      icon:
        r.category === "Roads"
          ? "🛣️"
          : r.category === "Water"
          ? "💧"
          : "📋",
      desc: `${r.name || "User"} reported: ${
        r.description?.substring(0, 40) || ""
      }...${r.authorBlocked ? " (Blocked user)" : ""}`,
      href: "/reports",
      imageIcon: false,
    }));

  const claimNotifications: DashboardNotification[] = getLatestClaimsByUser(accountBlockClaims).map(({ count, latest: claim }) => ({
    title: "Account block claim",
    time: claim.timestamp ? new Date(claim.timestamp.replace(" ", "T")).toLocaleString() : "Just now",
    timestamp: claim.timestamp || "",
    icon: "!",
    desc: `${claim.userName || "User"} says their account is blocked${
      claim.description ? `: ${claim.description.substring(0, 50)}` : ""
    }${count > 1 ? ` (${count} claims)` : ""}`,
    href: claim.userId ? `/users/${claim.userId}` : "/users?filter=claims",
    imageIcon: false,
  }));

  const adminUserNotifications: DashboardNotification[] = userNotifications.slice(0, 5).map((notification) => ({
    title: "CityVoice notification",
    time: notification.createdAt ? new Date(notification.createdAt).toLocaleString() : "Just now",
    timestamp: notification.createdAt || "",
    icon: notification.logoUrl || "/CityVoiceLogo.jpeg",
    desc: notification.message || "No message",
    href: "/notify",
    imageIcon: true,
  }));

  const notifications = [...adminUserNotifications, ...claimNotifications, ...reportNotifications]
    .sort((a, b) => getTimestampValue(b.timestamp) - getTimestampValue(a.timestamp))
    .slice(0, 8);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="relative flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          {/* Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Admin Dashboard
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Monitor reports, users, and city activities
            </p>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 relative self-end sm:self-auto">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowSettings(false);
                }}
                className={`p-2.5 rounded-xl shadow-sm border transition-all relative ${
                  showNotifications
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-500 border-gray-100 hover:border-blue-200 hover:bg-blue-50"
                }`}
              >
                🔔

                {notifications.length > 0 &&
                  !showNotifications && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
                  )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-[90vw] sm:w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">
                      Notifications
                    </h3>

                    {notifications.length > 0 && (
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                        {notifications.length} NEW
                      </span>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((n, i) => (
                        <Link
                          key={i}
                          href={n.href}
                          className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                        >
                          <div className="flex gap-3">
                            {n.imageIcon ? (
                              <img src={n.icon} alt="CityVoice logo" className="h-9 w-9 rounded-xl object-cover" />
                            ) : (
                              <span className="text-xl">
                                {n.icon}
                              </span>
                            )}

                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {n.title}
                              </p>

                              <p className="text-xs text-gray-500 mt-0.5">
                                {n.desc}
                              </p>

                              <p className="text-[10px] text-gray-400 mt-1 font-medium">
                                {n.time}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-400 text-sm italic">
                        No new notifications
                      </div>
                    )}
                  </div>

                  <Link
                    href="/notifications"
                    className="block"
                  >
                    <button className="w-full py-3 text-xs text-blue-600 font-bold bg-gray-50 hover:bg-gray-100 transition-colors">
                      View All Notifications
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSettings(!showSettings);
                  setShowNotifications(false);
                }}
                className={`p-2.5 rounded-xl shadow-sm border transition-all ${
                  showSettings
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white text-gray-500 border-gray-100 hover:border-blue-200"
                }`}
              >
                ⚙️
              </button>

              {/* Settings Dropdown */}
              {showSettings && (
                <div className="absolute right-0 mt-3 w-[90vw] sm:w-64 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-50">
                    <h3 className="font-bold text-gray-800">
                      Quick Settings
                    </h3>
                  </div>

                  <div className="p-2">
                    {[
                      {
                        label: "Dark Mode",
                        active: adminSettings.darkMode,
                        key: "darkMode",
                      },
                      {
                        label: "Real-time Updates",
                        active:
                          adminSettings.realTimeUpdates,
                        key: "realTimeUpdates",
                      },
                      {
                        label: "Email Alerts",
                        active: adminSettings.emailAlerts,
                        key: "emailAlerts",
                      },
                      {
                        label: "Desktop Notifications",
                        active:
                          adminSettings.desktopNotifications,
                        key: "desktopNotifications",
                      },
                    ].map((s, i) => (
                      <div
                        key={i}
                        onClick={() =>
                          handleToggleSetting(
                            s.key,
                            s.active
                          )
                        }
                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group"
                      >
                        <span className="text-sm text-gray-600 font-medium group-hover:text-gray-900">
                          {s.label}
                        </span>

                        <div
                          className={`w-8 h-4 rounded-full relative transition-all duration-200 ${
                            s.active
                              ? "bg-blue-600"
                              : "bg-gray-200"
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-200 ${
                              s.active
                                ? "right-0.5"
                                : "left-0.5"
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 border-t border-gray-50">
                    <button className="w-full py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors">
                      Advanced Settings
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-blue-600 overflow-hidden shadow-md border-2 border-white">
              <img
                src="https://i.pravatar.cc/40?img=11"
                alt="User"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Real Time Stats */}
        <div className="mb-6">
          <RealTimeStats />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <ReportsOverviewChart />
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <UserActivityChart />
          </div>
        </div>

        <div className="mb-6">
          <TopDashboardHighlights />
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <RecentReports />
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <AuthorityMapping />
          </div>
        </div>
      </main>
    </div>
  );
}
