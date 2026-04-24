"use client";
import { useState } from "react";
import Sidebar from "../components/Sidebar";

interface Report {
  id: number;
  title: string;
  category: string;
  location: string;
  reportedBy: string;
  date: string;
  status: "Pending" | "Resolved" | "New";
  priority: "High" | "Medium" | "Low";
}

const reports: Report[] = [
  { id: 1, title: "Pothole on Main Street", category: "Road", location: "Navi Mumbai", reportedBy: "Shubham", date: "2024-01-15", status: "Pending", priority: "High" },
  { id: 2, title: "Garbage Dump near Station", category: "Sanitation", location: "Pune", reportedBy: "Priya", date: "2024-01-14", status: "Resolved", priority: "Medium" },
  { id: 3, title: "Broken Street Light", category: "Electricity", location: "Mumbai", reportedBy: "Rahul", date: "2024-01-13", status: "New", priority: "Low" },
  { id: 4, title: "Water Supply Issue", category: "Water", location: "Thane", reportedBy: "Sneha", date: "2024-01-12", status: "Pending", priority: "High" },
  { id: 5, title: "Road Waterlogging", category: "Road", location: "Nashik", reportedBy: "Vikram", date: "2024-01-11", status: "New", priority: "Medium" },
  { id: 6, title: "Illegal Parking", category: "Traffic", location: "Pune", reportedBy: "Priya", date: "2024-01-10", status: "Resolved", priority: "Low" },
  { id: 7, title: "Broken Footpath", category: "Road", location: "Mumbai", reportedBy: "Rahul", date: "2024-01-09", status: "Pending", priority: "High" },
  { id: 8, title: "Noise Pollution", category: "Environment", location: "Navi Mumbai", reportedBy: "Shubham", date: "2024-01-08", status: "New", priority: "Medium" },
];

const statusConfig = {
  Pending:  { color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" },
  Resolved: { color: "bg-green-100 text-green-700",  dot: "bg-green-500"  },
  New:      { color: "bg-blue-100 text-blue-700",    dot: "bg-blue-500"   },
};

const priorityConfig = {
  High:   "text-red-600 bg-red-50",
  Medium: "text-orange-600 bg-orange-50",
  Low:    "text-gray-600 bg-gray-100",
};

export default function ReportsPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const filtered = reports.filter((r) => {
    const matchSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.location.toLowerCase().includes(search.toLowerCase()) ||
      r.reportedBy.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
            <p className="text-sm text-gray-500 mt-1">Total {reports.length} reports submitted</p>
          </div>
          <input
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-400 w-64"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Reports", value: reports.length, color: "bg-blue-500" },
            { label: "New Reports", value: reports.filter(r => r.status === "New").length, color: "bg-blue-400" },
            { label: "Pending", value: reports.filter(r => r.status === "Pending").length, color: "bg-yellow-500" },
            { label: "Resolved", value: reports.filter(r => r.status === "Resolved").length, color: "bg-green-500" },
          ].map((s) => (
            <div key={s.label} className={`${s.color} text-white rounded-xl p-4`}>
              <p className="text-sm opacity-90">{s.label}</p>
              <p className="text-3xl font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          {["All", "New", "Pending", "Resolved"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                ${filterStatus === status
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200"}`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Report</th>
                <th className="px-6 py-3 text-left">Category</th>
                <th className="px-6 py-3 text-left">Location</th>
                <th className="px-6 py-3 text-left">Reported By</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-center">Priority</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((report) => (
                <tr
                  key={report.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedReport(report)}
                >
                  <td className="px-6 py-4 font-medium text-gray-800">{report.title}</td>
                  <td className="px-6 py-4 text-gray-500">{report.category}</td>
                  <td className="px-6 py-4 text-gray-500">{report.location}</td>
                  <td className="px-6 py-4 text-gray-500">{report.reportedBy}</td>
                  <td className="px-6 py-4 text-gray-400">{report.date}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityConfig[report.priority]}`}>
                      {report.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[report.status].color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[report.status].dot}`}></span>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedReport(report); }}
                      className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400">No reports found</div>
          )}
        </div>
      </main>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="bg-white rounded-2xl w-[420px] shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Report Details</h2>
              <button
                onClick={() => setSelectedReport(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 text-gray-500"
              >
                ✕
              </button>
            </div>

            {/* Report Info */}
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Title</p>
                <p className="font-semibold text-gray-800">{selectedReport.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Category</p>
                  <p className="font-medium text-gray-700">{selectedReport.category}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Location</p>
                  <p className="font-medium text-gray-700">{selectedReport.location}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Reported By</p>
                  <p className="font-medium text-gray-700">{selectedReport.reportedBy}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Date</p>
                  <p className="font-medium text-gray-700">{selectedReport.date}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Priority</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityConfig[selectedReport.priority]}`}>
                    {selectedReport.priority}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[selectedReport.status].color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[selectedReport.status].dot}`}></span>
                    {selectedReport.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Update */}
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-2">Update Status</p>
              <div className="flex gap-2">
                {(["New", "Pending", "Resolved"] as const).map((s) => (
                  <button
                    key={s}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors
                      ${selectedReport.status === s
                        ? "bg-gray-900 text-white border-gray-900"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}