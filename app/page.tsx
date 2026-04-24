import { Users, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import Sidebar from "./components/Sidebar";
import StatsCard from "./components/StatsCards";
import ReportsOverviewChart from "./components/ReportsOverviewChart";
import UserActivityChart from "./components/UserActivityChart";
import FounderAddress from "./components/FounderAddress";
import RecentReports from "./components/RecentReports";
import AuthorityMapping from "./components/AuthorityMapping";

export default function Dashboard() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <div className="flex items-center gap-3 text-gray-500">
            <button className="hover:text-gray-800">🔔</button>
            <button className="hover:text-gray-800">⚙️</button>
            <div className="w-9 h-9 rounded-full bg-gray-300 overflow-hidden">
              <img src="https://i.pravatar.cc/36?img=11" alt="User" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <StatsCard title="Total Users"      value={12450} icon={Users}         color="bg-blue-500" />
          <StatsCard title="Active Reports"   value={320}   icon={MessageSquare} color="bg-orange-500" />
          <StatsCard title="Resolved Reports" value={890}   icon={CheckCircle}   color="bg-green-600" />
          <StatsCard title="Pending Reports"  value={145}   icon={XCircle}       color="bg-red-400" />
        </div>

        {/* Charts */}
        <div className="flex gap-4">
          <ReportsOverviewChart />
          <UserActivityChart />
        </div>

        {/* Founder */}
        <FounderAddress />

        {/* Bottom */}
        <div className="flex gap-4">
          <RecentReports />
          <AuthorityMapping />
        </div>
      </main>
    </div>
  );
}