"use client";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useDashboardData } from "@/lib/hooks/useDashboardData";

export default function ReportsOverviewChart() {
  const { chartData } = useDashboardData();

  return (
    <div className="min-w-0 bg-white rounded-xl p-5 flex-1 shadow-sm border border-gray-100">
      <h2 className="font-semibold text-gray-800 mb-4">Reports Overview</h2>
      <div className="h-[220px] min-h-[220px] min-w-0 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="pending" name="Pending" fill="#f97316" radius={[4, 4, 0, 0]} barSize={14} />
              <Bar dataKey="inReview" name="In Review" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={14} />
              <Bar dataKey="escalated" name="Escalated" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={14} />
              <Bar dataKey="rejected" name="Rejected" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={14} />
              <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: '#22c55e' }} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm italic">
            Gathering live data...
          </div>
        )}
      </div>
    </div>
  );
}
