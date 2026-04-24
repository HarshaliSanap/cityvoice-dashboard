"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { subscribeToPosts, deletePost } from "@/lib/services/dataService";
import { Shield, Trash2, Search, Filter, AlertCircle } from "lucide-react";

export default function ModerationPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToPosts((data) => {
      setReports(data);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to PERMANENTLY delete this report and all its replies? This action cannot be undone.")) return;
    
    setIsDeleting(id);
    const success = await deletePost(id);
    setIsDeleting(null);
    
    if (!success) {
      alert("Failed to delete report. Please try again.");
    }
  };

  const filtered = reports.filter(r => 
    (r.description || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.name || "").toLowerCase().includes(search.toLowerCase())
  );

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
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                          {r.name?.charAt(0) || "A"}
                        </div>
                        <span className="text-gray-600 font-medium">{r.name || "Anonymous"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${r.replies > 0 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                        {r.replies > 0 ? 'Active' : 'Pending'}
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