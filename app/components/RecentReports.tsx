const reports = [
  { title: "Pothole on Main Street", status1: "Pending", status2: "Resolved", color2: "bg-green-500" },
  { title: "Garbage Dump near Station", status1: "Resolved", status2: "New", color2: "bg-green-600" },
  { title: "Broken Street Light", status1: "New", status2: "New", color2: "bg-blue-500" },
];

export default function RecentReports() {
  return (
    <div className="bg-white rounded-xl p-5 flex-1">
      <h2 className="font-semibold text-gray-800 mb-4">Recent Reports</h2>
      <div className="space-y-3">
        {reports.map((r) => (
          <div key={r.title} className="flex items-center justify-between text-sm">
            <span className="text-gray-700">{r.title}</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">{r.status1}</span>
              <span className={`${r.color2} text-white text-xs px-3 py-1 rounded-full`}>{r.status2}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}