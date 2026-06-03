"use client";

import { useEffect, useState } from "react";
import { Heart, MapPin, MessageSquare, UserRound } from "lucide-react";
import { subscribeToPostsWithUsers } from "@/lib/services/dataService";

type RecentReport = {
  id: string;
  authorBlocked?: boolean;
  category?: string;
  description?: string;
  location?: string;
  name?: string;
  replies?: number;
  status?: string;
  supports?: number;
  timestamp?: string;
};

const getReportTime = (timestamp?: string) => {
  if (!timestamp) return 0;

  const parsed = new Date(timestamp.replace(" ", "T")).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatReportDate = (timestamp?: string) => {
  const parsed = getReportTime(timestamp);
  if (!parsed) return "No date";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(parsed));
};

export default function RecentReports() {
  const [reports, setReports] = useState<RecentReport[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToPostsWithUsers((fetchedPosts) => {
      setReports(fetchedPosts);
    });

    return () => unsubscribe?.();
  }, []);

  const recentReports = [...reports]
    .sort((a, b) => getReportTime(b.timestamp) - getReportTime(a.timestamp))
    .slice(0, 8);

  return (
    <div className="flex-1 rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark-readable-panel">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-800 dark-readable-title">Recent Reports</h2>
          <p className="mt-1 text-xs text-gray-400 dark-readable-muted">Latest citizen posts with reporter details</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase text-blue-600 dark-readable-blue-pill">
          Latest
        </span>
      </div>

      <div className="space-y-3">
        {recentReports.length > 0 ? (
          recentReports.map((report) => (
            <div
              key={report.id}
              className="rounded-xl border border-gray-100 p-3 text-sm transition-colors hover:bg-gray-50 dark-readable-row"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600 dark-readable-avatar">
                    {(report.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-gray-800 dark-readable-title">{report.name || "Anonymous"}</p>
                      {report.authorBlocked && (
                        <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">
                          Blocked
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-gray-400 dark-readable-muted">
                      {report.category || "General"} report
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-xs font-medium text-gray-400 dark-readable-muted">
                  {formatReportDate(report.timestamp)}
                </span>
              </div>

              <p className="line-clamp-2 text-sm font-medium leading-6 text-gray-700 dark-readable-body">
                {report.description || "No content"}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 pt-3 text-xs text-gray-500 dark-readable-meta">
                <span className="inline-flex min-w-0 items-center gap-1">
                  <MapPin size={13} className="shrink-0 text-gray-400 dark-readable-muted" />
                  <span className="truncate">{report.location || "Unknown location"}</span>
                </span>
                <span className="rounded-full bg-gray-50 px-2 py-1 font-semibold text-gray-600 dark-readable-chip">
                  {report.category || "General"}
                </span>
                <span className="rounded-full bg-orange-50 px-2 py-1 font-semibold text-orange-600 dark-readable-orange-pill">
                  {report.status || "Pending"}
                </span>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 font-bold text-blue-600 dark-readable-blue-pill">
                  <Heart size={13} />
                  {report.supports || 0} voices
                </span>
                <span className="inline-flex items-center gap-1 font-medium text-gray-500 dark-readable-meta">
                  <MessageSquare size={13} />
                  {report.replies || 0} {(report.replies || 0) === 1 ? "response" : "responses"}
                </span>
                <span className="inline-flex min-w-0 items-center gap-1 font-medium text-gray-500 dark-readable-meta">
                  <UserRound size={13} className="shrink-0" />
                  <span className="truncate">Posted by {report.name || "Anonymous"}</span>
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400 dark-readable-empty">
            No reports found
          </div>
        )}
      </div>
    </div>
  );
}
