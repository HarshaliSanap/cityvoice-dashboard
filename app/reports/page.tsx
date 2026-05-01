"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { subscribeToPosts } from "@/lib/services/dataService";

const statusConfig = {
  Pending: { color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" },
  Resolved: { color: "bg-green-100 text-green-700", dot: "bg-green-500" },
  New: { color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
};

const priorityConfig = {
  High: "text-red-600 bg-red-50",
  Medium: "text-orange-600 bg-orange-50",
  Low: "text-gray-600 bg-gray-100",
};

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToPosts((data) => {
      setReports(data);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  const filtered = reports.filter((r) => {
    const matchSearch =
      (r.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.location || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.name || "").toLowerCase().includes(search.toLowerCase());
    
    // Logic for status: if replies > 0 it's Resolved/Active, otherwise Pending/New
    const status = r.replies > 0 ? "Resolved" : "Pending";
    const matchStatus = filterStatus === "All" || status === filterStatus;
    
    return matchSearch && matchStatus;
  });

  const getStatus = (r: any) => r.replies > 0 ? "Resolved" : "Pending";

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
            <p className="text-sm text-gray-500 mt-1">Total {reports.length} reports submitted</p>
          </div>
          <input
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-400 w-64 shadow-sm bg-white"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Reports", value: reports.length, color: "bg-blue-600" },
            { label: "New Reports", value: reports.filter(r => r.replies === 0).length, color: "bg-blue-400" },
            { label: "Pending", value: reports.filter(r => r.replies === 0).length, color: "bg-yellow-500" },
            { label: "Resolved", value: reports.filter(r => r.replies > 0).length, color: "bg-green-600" },
          ].map((s) => (
            <div key={s.label} className={`${s.color} text-white rounded-2xl p-5 shadow-sm`}>
              <p className="text-sm opacity-90 font-medium">{s.label}</p>
              <p className="text-3xl font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {["All", "Pending", "Resolved"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all
                ${filterStatus === status
                  ? "bg-gray-900 text-white shadow-md"
                  : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200"}`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 text-left">Report</th>
                <th className="px-6 py-4 text-left">Category</th>
                <th className="px-6 py-4 text-left">Location</th>
                <th className="px-6 py-4 text-left">Reported By</th>
                <th className="px-6 py-4 text-left">Date</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((report) => (
                <tr
                  key={report.id}
                  className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedReport(report)}
                >
                  <td className="px-6 py-4 font-bold text-gray-800">{report.description?.substring(0, 30)}...</td>
                  <td className="px-6 py-4 text-gray-500">{report.category || "General"}</td>
                  <td className="px-6 py-4 text-gray-500">{report.location || "N/A"}</td>
                  <td className="px-6 py-4 text-gray-500">{report.name || "Anonymous"}</td>
                  <td className="px-6 py-4 text-gray-400">{report.timestamp ? report.timestamp.split(' ')[0] : "N/A"}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConfig[getStatus(report)].color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[getStatus(report)].dot}`}></span>
                      {getStatus(report)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedReport(report); }}
                      className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-20 text-gray-400 font-medium italic">No reports found</div>
          )}
        </div>
      </main>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Report Details</h2>
              <button
                onClick={() => setSelectedReport(null)}
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 text-gray-400 transition-colors shadow-sm"
              >
                ✕
              </button>
            </div>

            {/* Report Info */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Description</p>
                <p className="font-bold text-gray-800 text-lg leading-tight">{selectedReport.description}</p>
              </div>
              
              {selectedReport.image_url && (
                <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm max-h-48">
                  <img src={selectedReport.image_url} alt="Report attachment" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Category</p>
                  <p className="font-bold text-gray-700">{selectedReport.category || "General"}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Location</p>
                  <p className="font-bold text-gray-700">{selectedReport.location || "N/A"}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Reported By</p>
                  <p className="font-bold text-gray-700">{selectedReport.name || "Anonymous"}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Date</p>
                  <p className="font-bold text-gray-700">{selectedReport.timestamp?.split(' ')[0] || "N/A"}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Current Status</p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConfig[getStatus(selectedReport)].color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[getStatus(selectedReport)].dot}`}></span>
                  {getStatus(selectedReport)}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setSelectedReport(null)}
                className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}