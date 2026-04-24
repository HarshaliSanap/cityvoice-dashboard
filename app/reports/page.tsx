"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { subscribeToPosts, sendReply } from "@/lib/services/dataService";
import { MessageSquare, MapPin, Calendar, User, Tag, X, Send } from "lucide-react";

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToPosts((data) => {
      setReports(data);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedReport) return;
    
    setIsSending(true);
    const success = await sendReply(selectedReport.id, replyText);
    setIsSending(false);
    
    if (success) {
      setReplyText("");
      setSelectedReport(null);
      alert("Reply sent successfully!");
    } else {
      alert("Failed to send reply. Please try again.");
    }
  };

  const filtered = reports.filter(r => 
    (r.description || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.category || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">All Reports</h1>
            <p className="text-sm text-gray-500 mt-1">Total {reports.length} issues reported by citizens</p>
          </div>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 w-64 shadow-sm"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {filtered.length > 0 ? (
            filtered.map((r, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">
                      {r.category === "Roads" ? "🛣️" : r.category === "Water" ? "💧" : "📋"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase tracking-wider">
                          {r.category || "General"}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${r.replies > 0 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                          {r.replies > 0 ? 'Active' : 'Pending'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">{r.description}</h3>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <User size={14} className="text-gray-400" />
                          <span className="font-medium text-gray-700">{r.name || "Anonymous"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-gray-400" />
                          <span>{r.location || "Unknown"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-gray-400" />
                          <span>{r.timestamp ? new Date(r.timestamp.split(' ')[0]).toLocaleDateString() : "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MessageSquare size={14} className="text-gray-400" />
                          <span className="font-bold text-blue-600">{r.replies || 0} Replies</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setSelectedReport(r)}
                    className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors"
                  >
                    Take Action
                  </button>
                </div>
                
                {r.image_url && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-gray-100 max-w-xs">
                    <img src={r.image_url} alt="Report attachment" className="w-full h-auto object-cover shadow-sm" />
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-gray-500 font-medium">No reports found matching your search</p>
            </div>
          )}
        </div>
      </main>

      {/* Take Action Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedReport(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Take Action</h3>
                <p className="text-xs text-gray-500 mt-1">Responding to: {selectedReport.description?.substring(0, 40)}...</p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">Your Reply</label>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your response to the citizen here..."
                  className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={handleSendReply}
                  disabled={isSending || !replyText.trim()}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? "Sending..." : <><Send size={18} /> Send Reply</>}
                </button>
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-blue-50/50 text-[10px] text-blue-600 font-medium">
              Note: This reply will be visible to the user and all other citizens on the mobile app.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
