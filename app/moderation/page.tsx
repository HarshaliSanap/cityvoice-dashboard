"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { subscribeToPostsWithUsers, deletePost } from "@/lib/services/dataService";
import { Trash2, Search, Filter, AlertCircle } from "lucide-react";

type ModerationStatus = "Pending" | "In Review" | "Escalated to Authority" | "Rejected" | "Resolved";
type ModerationFilter = "All" | ModerationStatus;

type ModerationReport = {
  id: string;
  authorBlocked?: boolean;
  category?: string;
  description?: string;
  location?: string;
  name?: string;
  replies?: number;
  status?: string;
  supports?: number;
  authorityEmail?: string;
  authorityName?: string;
};

const statusOptions: ModerationStatus[] = ["Pending", "In Review", "Escalated to Authority", "Rejected", "Resolved"];

const statusStyles: Record<ModerationStatus, string> = {
  Pending: "bg-orange-50 text-orange-600",
  "In Review": "bg-blue-50 text-blue-600",
  "Escalated to Authority": "bg-purple-50 text-purple-600",
  Rejected: "bg-red-50 text-red-600",
  Resolved: "bg-green-50 text-green-600",
};

export default function ModerationPage() {
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ModerationFilter>("All");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToPostsWithUsers((data: ModerationReport[]) => {
      setReports(data);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  const getStatus = (report: ModerationReport): ModerationStatus => {
    return statusOptions.includes(report.status as ModerationStatus) ? (report.status as ModerationStatus) : "Pending";
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to PERMANENTLY delete this report and all its responses? This action cannot be undone.")) return;
    
    setIsDeleting(id);
    const success = await deletePost(id);
    setIsDeleting(null);
    
    if (!success) {
      alert("Failed to delete report. Please try again.");
    }
  };

  const filtered = reports.filter((r) => {
    const query = search.toLowerCase();
    const matchesSearch =
      (r.description || "").toLowerCase().includes(query) ||
      (r.category || "").toLowerCase().includes(query) ||
      (r.location || "").toLowerCase().includes(query) ||
      (r.name || "").toLowerCase().includes(query);
    const matchesStatus = filterStatus === "All" || getStatus(r) === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Content Moderation</h1>
            <p className="text-sm text-gray-500 mt-1">Review and manage reported citizen content</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search reports..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm outline-none focus:border-blue-400 w-64 shadow-sm"
              />
            </div>
            <button className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-500 hover:bg-gray-50 shadow-sm transition-all">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {(["All", ...statusOptions] as ModerationFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                filterStatus === status
                  ? "bg-gray-900 text-white shadow-md"
                  : "border border-gray-200 bg-white text-gray-500 hover:bg-gray-100"
              }`}
            >
              {status}
              <span className={`ml-2 text-xs ${filterStatus === status ? "text-gray-200" : "text-gray-400"}`}>
                {status === "All" ? reports.length : reports.filter((report) => getStatus(report) === status).length}
              </span>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-5 text-left">Report Description</th>
                <th className="px-6 py-5 text-left">Citizen</th>
                <th className="px-6 py-5 text-left">Status</th>
                <th className="px-6 py-5 text-right">Moderation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length > 0 ? (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800 line-clamp-1">{r.description}</span>
                        <span className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">{r.category}</span>
                        {r.authorityEmail && (
                          <span className="mt-1 text-[10px] font-semibold text-blue-600">
                            Sent to {r.authorityName || r.authorityEmail}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                          {r.name?.charAt(0) || "A"}
                        </div>
                        <span className="text-gray-600 font-medium">{r.name || "Anonymous"}</span>
                        {r.authorBlocked && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">
                            Blocked
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        title={getStatus(r)}
                        className={`inline-flex min-w-[150px] justify-center whitespace-nowrap rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${statusStyles[getStatus(r)]}`}
                      >
                        {getStatus(r)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(r.id)}
                        disabled={isDeleting === r.id}
                        className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                        title="Delete Post"
                      >
                        {isDeleting === r.id ? "..." : <Trash2 size={18} />}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <div className="flex flex-col items-center">
                      <AlertCircle className="text-gray-200 mb-4" size={48} />
                      <p className="text-gray-400 font-medium">No reports found for moderation</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
