"use client";

import { useEffect, useState } from "react";
import { subscribeToPosts } from "@/lib/services/dataService";

export default function RecentReports() {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    subscribeToPosts((fetchedPosts) => {
      setReports(fetchedPosts);
    });
  }, []);

  return (
    <div className="bg-white rounded-xl p-5 flex-1 shadow-sm border border-gray-100">
      <h2 className="font-semibold text-gray-800 mb-4">Recent Reports</h2>
      <div className="space-y-3">
        {reports.length > 0 ? (
          reports.map((r) => (
            <div key={r.id} className="flex items-center justify-between text-sm p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0">
              <div className="flex flex-col gap-1 overflow-hidden">
                <span className="text-gray-700 font-medium truncate pr-4">
                  {r.description || "No content"}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  📍 {r.location || "Unknown"} • {r.category || "General"}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex flex-col items-end gap-1">
                  <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-md uppercase whitespace-nowrap">
                    {r.supports || 0} Voices
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">
                    💬 {r.replies || 0} Replies
                  </span>
                </div>
                <span className="text-[10px] text-gray-400">
                  {r.timestamp ? new Date(r.timestamp.split(' ')[0]).toLocaleDateString() : ""}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-400 text-sm text-center py-4 italic">No reports found</div>
        )}
      </div>
    </div>
  );
}