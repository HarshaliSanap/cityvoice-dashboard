"use client";
import { useState } from "react";
import Sidebar from "../components/Sidebar";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Profile");

  // Profile State
  const [profile, setProfile] = useState({
    name: "Abhijit Polke",
    email: "abhijit@cityvoice.in",
    phone: "+91 98765 43210",
    role: "Super Admin",
    location: "Mumbai, Maharashtra",
  });

  // Notification State
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    newReport: true,
    reportResolved: true,
    newUser: false,
    systemMaintenance: true,
    weeklyDigest: true,
  });

  // Security State
  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactor: false,
    sessionTimeout: "30",
  });

  // App Settings State
  const [appSettings, setAppSettings] = useState({
    language: "English",
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
    theme: "Light",
    autoAssign: true,
    publicReports: true,
    maintenanceMode: false,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const tabs = ["Profile", "Notifications", "Security", "App Settings"];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your account and application settings</p>
          </div>
          {saved && (
            <div className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-xl text-sm font-medium">
              ✓ Settings saved successfully!
            </div>
          )}
        </div>

        <div className="flex gap-6">
          {/* Sidebar Tabs */}
          <div className="w-48 flex-shrink-0">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`w-full px-4 py-3 text-sm font-medium text-left transition-colors border-b border-gray-100 last:border-0
                    ${activeTab === tab
                      ? "bg-[#1e2a3a] text-white"
                      : "text-gray-600 hover:bg-gray-50"}`}
                >
                  {tab === "Profile"       && "👤 "}
                  {tab === "Notifications" && "🔔 "}
                  {tab === "Security"      && "🔒 "}
                  {tab === "App Settings"  && "⚙️ "}
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">

            {/* ── PROFILE TAB ── */}
            {activeTab === "Profile" && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-5">Profile Settings</h2>

                {/* Avatar */}
                <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="w-16 h-16 rounded-2xl bg-[#1e2a3a] text-white flex items-center justify-center text-2xl font-bold">
                    A
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{profile.name}</p>
                    <p className="text-sm text-gray-500">{profile.role}</p>
                    <button className="mt-1 text-xs text-blue-600 hover:underline">Change Photo</button>
                  </div>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Full Name",    key: "name",     type: "text"  },
                    { label: "Email",        key: "email",    type: "email" },
                    { label: "Phone",        key: "phone",    type: "text"  },
                    { label: "Location",     key: "location", type: "text"  },
                  ].map(({ label, key, type }) => (
                    <div key={key}>
                      <p className="text-xs text-gray-400 mb-1">{label}</p>
                      <input
                        type={type}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                        value={profile[key as keyof typeof profile]}
                        onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
                      />
                    </div>
                  ))}
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Role</p>
                    <select
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                      value={profile.role}
                      onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                    >
                      <option>Super Admin</option>
                      <option>Admin</option>
                      <option>Moderator</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
                >
                  Save Profile
                </button>
              </div>
            )}

            {/* ── NOTIFICATIONS TAB ── */}
            {activeTab === "Notifications" && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-5">Notification Settings</h2>

                <div className="space-y-4">
                  {/* Channels */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Channels</p>
                    <div className="space-y-3">
                      {[
                        { label: "Email Alerts",    key: "emailAlerts",   desc: "Receive notifications via email" },
                        { label: "SMS Alerts",      key: "smsAlerts",     desc: "Receive notifications via SMS"   },
                      ].map(({ label, key, desc }) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div>
                            <p className="text-sm font-medium text-gray-700">{label}</p>
                            <p className="text-xs text-gray-400">{desc}</p>
                          </div>
                          <button
                            onClick={() => setNotifications({ ...notifications, [key]: !notifications[key as keyof typeof notifications] })}
                            className={`w-11 h-6 rounded-full transition-colors relative ${notifications[key as keyof typeof notifications] ? "bg-blue-600" : "bg-gray-300"}`}
                          >
                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications[key as keyof typeof notifications] ? "translate-x-5" : "translate-x-0.5"}`}></span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Events */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Events</p>
                    <div className="space-y-3">
                      {[
                        { label: "New Report",          key: "newReport",          desc: "When a new report is submitted"    },
                        { label: "Report Resolved",     key: "reportResolved",     desc: "When a report is resolved"         },
                        { label: "New User",            key: "newUser",            desc: "When a new user registers"         },
                        { label: "System Maintenance",  key: "systemMaintenance",  desc: "Maintenance alerts and updates"    },
                        { label: "Weekly Digest",       key: "weeklyDigest",       desc: "Weekly summary of all activities"  },
                      ].map(({ label, key, desc }) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div>
                            <p className="text-sm font-medium text-gray-700">{label}</p>
                            <p className="text-xs text-gray-400">{desc}</p>
                          </div>
                          <button
                            onClick={() => setNotifications({ ...notifications, [key]: !notifications[key as keyof typeof notifications] })}
                            className={`w-11 h-6 rounded-full transition-colors relative ${notifications[key as keyof typeof notifications] ? "bg-blue-600" : "bg-gray-300"}`}
                          >
                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications[key as keyof typeof notifications] ? "translate-x-5" : "translate-x-0.5"}`}></span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button onClick={handleSave} className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
                  Save Notifications
                </button>
              </div>
            )}

            {/* ── SECURITY TAB ── */}
            {activeTab === "Security" && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-5">Security Settings</h2>

                {/* Change Password */}
                <div className="mb-6">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Change Password</p>
                  <div className="space-y-3">
                    {[
                      { label: "Current Password", key: "currentPassword" },
                      { label: "New Password",     key: "newPassword"     },
                      { label: "Confirm Password", key: "confirmPassword" },
                    ].map(({ label, key }) => (
                      <div key={key}>
                        <p className="text-xs text-gray-400 mb-1">{label}</p>
                        <input
                          type="password"
                          placeholder="••••••••"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                          value={security[key as keyof typeof security] as string}
                          onChange={(e) => setSecurity({ ...security, [key]: e.target.value })}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Two Factor */}
                <div className="mb-6">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Two-Factor Authentication</p>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Enable 2FA</p>
                      <p className="text-xs text-gray-400">Add extra security to your account</p>
                    </div>
                    <button
                      onClick={() => setSecurity({ ...security, twoFactor: !security.twoFactor })}
                      className={`w-11 h-6 rounded-full transition-colors relative ${security.twoFactor ? "bg-blue-600" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${security.twoFactor ? "translate-x-5" : "translate-x-0.5"}`}></span>
                    </button>
                  </div>
                </div>

                {/* Session Timeout */}
                <div className="mb-6">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Session Timeout</p>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                    value={security.sessionTimeout}
                    onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })}
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>

                <button onClick={handleSave} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
                  Save Security Settings
                </button>
              </div>
            )}

            {/* ── APP SETTINGS TAB ── */}
            {activeTab === "App Settings" && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-5">Application Settings</h2>

                {/* General */}
                <div className="mb-6">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">General</p>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Language",    key: "language",   options: ["English", "Hindi", "Marathi"] },
                      { label: "Timezone",    key: "timezone",   options: ["Asia/Kolkata", "Asia/Dubai", "UTC"] },
                      { label: "Date Format", key: "dateFormat", options: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] },
                      { label: "Theme",       key: "theme",      options: ["Light", "Dark", "System"] },
                    ].map(({ label, key, options }) => (
                      <div key={key}>
                        <p className="text-xs text-gray-400 mb-1">{label}</p>
                        <select
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                          value={appSettings[key as keyof typeof appSettings] as string}
                          onChange={(e) => setAppSettings({ ...appSettings, [key]: e.target.value })}
                        >
                          {options.map((o) => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="mb-6">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Features</p>
                  <div className="space-y-3">
                    {[
                      { label: "Auto Assign Reports",  key: "autoAssign",       desc: "Automatically assign reports to authorities" },
                      { label: "Public Reports",       key: "publicReports",    desc: "Allow public to view submitted reports"      },
                      { label: "Maintenance Mode",     key: "maintenanceMode",  desc: "Enable maintenance mode for the platform"    },
                    ].map(({ label, key, desc }) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-gray-700">{label}</p>
                          <p className="text-xs text-gray-400">{desc}</p>
                        </div>
                        <button
                          onClick={() => setAppSettings({ ...appSettings, [key]: !appSettings[key as keyof typeof appSettings] })}
                          className={`w-11 h-6 rounded-full transition-colors relative ${appSettings[key as keyof typeof appSettings] ? "bg-blue-600" : "bg-gray-300"}`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${appSettings[key as keyof typeof appSettings] ? "translate-x-5" : "translate-x-0.5"}`}></span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={handleSave} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
                  Save App Settings
                </button>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}