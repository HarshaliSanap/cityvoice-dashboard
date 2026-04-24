"use client";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", new: 22, resolved: 5, pending: 20 },
  { month: "Feb", new: 12, resolved: 13, pending: 22 },
  { month: "Mar", new: 37, resolved: 22, pending: 18 },
  { month: "Apr", new: 15, resolved: 12, pending: 16 },
  { month: "May", new: 17, resolved: 23, pending: 33 },
  { month: "Jun", new: 18, resolved: 10, pending: 32 },
];

export default function ReportsOverviewChart() {
  return (
    <div className="bg-white rounded-xl p-5 flex-1">
      <h2 className="font-semibold text-gray-800 mb-4">Reports Overview</h2>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend iconType="square" />
          <Bar dataKey="new" name="New Reports" fill="#3b82f6" radius={[3,3,0,0]} />
          <Bar dataKey="resolved" name="Resolved" fill="#22c55e" radius={[3,3,0,0]} />
          <Line type="monotone" dataKey="pending" name="Pending" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}