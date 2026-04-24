"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const data = [
  { month: "Jan", newUsers: 12, activeUsers: 10 },
  { month: "Feb", newUsers: 21, activeUsers: 18 },
  { month: "Mar", newUsers: 19, activeUsers: 22 },
  { month: "Apr", newUsers: 17, activeUsers: 25 },
  { month: "May", newUsers: 20, activeUsers: 28 },
  { month: "Jun", newUsers: 25, activeUsers: 38 },
];

export default function UserActivityChart() {
  return (
    <div className="bg-white rounded-xl p-5 flex-1">
      <h2 className="font-semibold text-gray-800 mb-4">User Activity</h2>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="newUsers" name="New Users" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="activeUsers" name="Active Users" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}