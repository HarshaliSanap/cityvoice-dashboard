"use client";
import { useState } from "react";
import Sidebar from "../components/Sidebar";

interface ContentItem {
  id: number;
  type: "Post" | "Comment" | "Report";
  content: string;
  submittedBy: string;
  location: string;
  date: string;
  status: "Pending Review" | "Approved" | "Rejected" | "Flagged";
  reason: string;
}

const initialContent: ContentItem[] = [
  { id: 1, type: "Post", content: "There is a huge pothole near the main market causing accidents daily.", submittedBy: "Shubham", location: "Navi Mumbai", date: "2024-01-15", status: "Pending Review", reason: "Infrastructure" },
  { id: 2, type: "Comment", content: "This is completely false information about the water supply.", submittedBy: "Priya", location: "Pune", date: "2024-01-14", status: "Flagged", reason: "Misinformation" },
  { id: 3, type: "Report", content: "Garbage has not been collected for 2 weeks near Station Road.", submittedBy: "Rahul", location: "Mumbai", date: "2024-01-13", status: "Approved", reason: "Sanitation" },
  { id: 4, type: "Post", content: "Streetlights are not working in our area for the past month.", submittedBy: "Sneha", location: "Thane", date: "2024-01-12", status: "Pending Review", reason: "Electricity" },
  { id: 5, type: "Comment", content: "Abusive language used against local authorities.", submittedBy: "Vikram", location: "Nashik", date: "2024-01-11", status: "Rejected", reason: "Abusive Content" },
  { id: 6, type: "Report", content: "Water supply is irregular and dirty water is coming from taps.", submittedBy: "Shubham", location: "Navi Mumbai", date: "2024-01-10", status: "Approved", reason: "Water" },
  { id: 7, type: "Post", content: "Spam promotional content about private services.", submittedBy: "Unknown", location: "Mumbai", date: "2024-01-09", status: "Flagged", reason: "Spam" },
  { id: 8, type: "Comment", content: "Road construction has been pending for 6 months with no updates.", submittedBy: "Priya", location: "Pune", date: "2024-01-08", status: "Pending Review", reason: "Infrastructure" },
];

const statusConfig = {
  "Pending Review": { color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" },
  "Approved":       { color: "bg-green-100 text-green-700",  dot: "bg-green-500"  },
  "Rejected":       { color: "bg-red-100 text-red-700",      dot: "bg-red-500"    },
  "Flagged":        { color: "bg-orange-100 text-orange-700",dot: "bg-orange-500" },
};

const typeConfig = {
  Post:    "bg-blue-100 text-blue-700",
  Comment: "bg-purple-100 text-purple-700",
  Report:  "bg-gray-100 text-gray-700",
};

export default function ContentModerationPage() {
  const [contents, setContents] = useState<ContentItem[]>(initialContent);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  const filtered = contents.filter((c) => {
    const matchSearch =
      c.content.toLowerCase().includes(search.toLowerCase()) ||
      c.submittedBy.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || c.status === filterStatus;
    const matchType = filterType === "All" || c.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const updateStatus = (id: number, status: ContentItem["status"]) => {
    setContents((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    if (selectedItem?.id === id) setSelectedItem((prev) => prev ? { ...prev, status } : null);
  };

  const deleteContent = (id: number) => {
    setContents((prev) => prev.filter((c) => c.id !== id));
    setSelectedItem(null);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Content Moderation</h1>
            <p className="text-sm text-gray-500 mt-1">Total {contents.length} items to moderate</p>
          </div>
          <input
            type="text"
            placeholder="Search content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-400 w-64"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Items",     value: contents.length,                                          color: "bg-blue-500"   },
            { label: "Pending Review",  value: contents.filter(c => c.status === "Pending Review").length, color: "bg-yellow-500" },
            { label: "Flagged",         value: contents.filter(c => c.status === "Flagged").length,       color: "bg-orange-500" },
            { label: "Approved",        value: contents.filter(c => c.status === "Approved").length,      color: "bg-green-500"  },
          ].map((s) => (
            <div key={s.label} className={`${s.color} text-white rounded-xl p-4`}>
              <p className="text-sm opacity-90">{s.label}</p>
              <p className="text-3xl font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-6 mb-4">
          {/* Status Filter */}
          <div className="flex gap-2">
            {["All", "Pending Review", "Flagged", "Approved", "Rejected"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                  ${filterStatus === status
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200"}`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex gap-2 ml-auto">
            {["All", "Post", "Comment", "Report"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                  ${filterType === type
                    ? "bg-[#1e2a3a] text-white"
                    : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200"}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Content Cards */}
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedItem(item)}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig[item.type]}`}>
                      {item.type}
                    </span>
                    <span className="text-xs text-gray-400">{item.reason}</span>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-gray-400">{item.date}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">{item.content}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-500">👤 {item.submittedBy}</span>
                    <span className="text-xs text-gray-500">📍 {item.location}</span>
                  </div>
                </div>

                {/* Right */}
                <div className="flex flex-col items-end gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[item.status].color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[item.status].dot}`}></span>
                    {item.status}
                  </span>
                  {/* Quick Actions */}
                  <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {item.status !== "Approved" && (
                      <button
                        onClick={() => updateStatus(item.id, "Approved")}
                        className="px-2.5 py-1 bg-green-50 text-green-600 rounded-lg text-xs hover:bg-green-100"
                      >
                        ✓ Approve
                      </button>
                    )}
                    {item.status !== "Rejected" && (
                      <button
                        onClick={() => updateStatus(item.id, "Rejected")}
                        className="px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-xs hover:bg-red-100"
                      >
                        ✕ Reject
                      </button>
                    )}
                    {item.status !== "Flagged" && (
                      <button
                        onClick={() => updateStatus(item.id, "Flagged")}
                        className="px-2.5 py-1 bg-orange-50 text-orange-600 rounded-lg text-xs hover:bg-orange-100"
                      >
                        🚩 Flag
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">No content found</div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-2xl w-[460px] shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Content Details</h2>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 text-gray-500"
              >
                ✕
              </button>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeConfig[selectedItem.type]}`}>
                {selectedItem.type}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[selectedItem.status].color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[selectedItem.status].dot}`}></span>
                {selectedItem.status}
              </span>
            </div>

            {/* Content */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-700 leading-relaxed">{selectedItem.content}</p>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: "Submitted By", value: selectedItem.submittedBy },
                { label: "Location",     value: selectedItem.location     },
                { label: "Date",         value: selectedItem.date         },
                { label: "Reason",       value: selectedItem.reason       },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className="text-sm font-medium text-gray-700">{value}</p>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {(["Approved", "Rejected", "Flagged"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(selectedItem.id, s)}
                  className={`py-2 rounded-xl text-xs font-medium border transition-colors
                    ${selectedItem.status === s
                      ? "bg-gray-900 text-white border-gray-900"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Delete */}
            <button
              onClick={() => deleteContent(selectedItem.id)}
              className="w-full py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100"
            >
              Delete Content
            </button>
          </div>
        </div>
      )}
    </div>
  );
}