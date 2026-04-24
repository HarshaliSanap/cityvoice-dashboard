"use client";
import { useState } from "react";
import Sidebar from "../components/Sidebar";

interface Authority {
  id: number;
  name: string;
  zone: string;
  contact: string;
  email: string;
  category: string;
  assignedReports: number;
  resolvedReports: number;
  status: "Active" | "Inactive";
}

const initialAuthorities: Authority[] = [
  { id: 1, name: "Ward A BMC", zone: "Navi Mumbai", contact: "+91 98765 43210", email: "warda@bmc.gov.in", category: "Municipal", assignedReports: 12, resolvedReports: 8, status: "Active" },
  { id: 2, name: "Ward C-1 BMC", zone: "Mumbai", contact: "+91 98765 43211", email: "wardc1@bmc.gov.in", category: "Municipal", assignedReports: 7, resolvedReports: 5, status: "Active" },
  { id: 3, name: "Mumbai Police Zone 3", zone: "Mumbai", contact: "+91 98765 43212", email: "zone3@mumbaipolice.gov.in", category: "Police", assignedReports: 15, resolvedReports: 10, status: "Active" },
  { id: 4, name: "Pune Municipal Corp", zone: "Pune", contact: "+91 98765 43213", email: "pmc@pune.gov.in", category: "Municipal", assignedReports: 9, resolvedReports: 6, status: "Active" },
  { id: 5, name: "Thane Traffic Police", zone: "Thane", contact: "+91 98765 43214", email: "traffic@thane.gov.in", category: "Traffic", assignedReports: 4, resolvedReports: 4, status: "Inactive" },
  { id: 6, name: "Nashik Water Dept", zone: "Nashik", contact: "+91 98765 43215", email: "water@nashik.gov.in", category: "Water", assignedReports: 6, resolvedReports: 2, status: "Active" },
];

const categoryColors: Record<string, string> = {
  Municipal: "bg-blue-100 text-blue-700",
  Police:    "bg-red-100 text-red-700",
  Traffic:   "bg-orange-100 text-orange-700",
  Water:     "bg-cyan-100 text-cyan-700",
};

export default function AuthorityMappingPage() {
  const [authorities, setAuthorities] = useState<Authority[]>(initialAuthorities);
  const [search, setSearch] = useState("");
  const [selectedAuthority, setSelectedAuthority] = useState<Authority | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Authority | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAuthority, setNewAuthority] = useState({
    name: "", zone: "", contact: "", email: "", category: "Municipal",
  });

  const filtered = authorities.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.zone.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (authority: Authority) => {
    setEditData({ ...authority });
    setIsEditing(true);
    setSelectedAuthority(authority);
  };

  const handleSaveEdit = () => {
    if (!editData) return;
    setAuthorities((prev) => prev.map((a) => (a.id === editData.id ? editData : a)));
    setSelectedAuthority(editData);
    setIsEditing(false);
  };

  const handleDelete = (id: number) => {
    setAuthorities((prev) => prev.filter((a) => a.id !== id));
    setSelectedAuthority(null);
  };

  const handleAddAuthority = () => {
    const newEntry: Authority = {
      id: authorities.length + 1,
      ...newAuthority,
      assignedReports: 0,
      resolvedReports: 0,
      status: "Active",
    };
    setAuthorities((prev) => [...prev, newEntry]);
    setShowAddModal(false);
    setNewAuthority({ name: "", zone: "", contact: "", email: "", category: "Municipal" });
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Authority Mapping</h1>
            <p className="text-sm text-gray-500 mt-1">Total {authorities.length} authorities mapped</p>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search authority..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-400 w-56"
            />
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              + Add Authority
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Authorities", value: authorities.length, color: "bg-blue-500" },
            { label: "Active", value: authorities.filter(a => a.status === "Active").length, color: "bg-green-500" },
            { label: "Total Assigned", value: authorities.reduce((s, a) => s + a.assignedReports, 0), color: "bg-orange-500" },
            { label: "Total Resolved", value: authorities.reduce((s, a) => s + a.resolvedReports, 0), color: "bg-purple-500" },
          ].map((s) => (
            <div key={s.label} className={`${s.color} text-white rounded-xl p-4`}>
              <p className="text-sm opacity-90">{s.label}</p>
              <p className="text-3xl font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Authority</th>
                <th className="px-6 py-3 text-left">Zone</th>
                <th className="px-6 py-3 text-left">Category</th>
                <th className="px-6 py-3 text-left">Contact</th>
                <th className="px-6 py-3 text-center">Assigned</th>
                <th className="px-6 py-3 text-center">Resolved</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((authority) => (
                <tr
                  key={authority.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => { setSelectedAuthority(authority); setIsEditing(false); }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#1e2a3a] text-white flex items-center justify-center font-bold text-sm">
                        {authority.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{authority.name}</p>
                        <p className="text-xs text-gray-400">{authority.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{authority.zone}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[authority.category] || "bg-gray-100 text-gray-600"}`}>
                      {authority.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{authority.contact}</td>
                  <td className="px-6 py-4 text-center font-medium">{authority.assignedReports}</td>
                  <td className="px-6 py-4 text-center font-medium">{authority.resolvedReports}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${authority.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {authority.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(authority); }}
                      className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400">No authorities found</div>
          )}
        </div>
      </main>

      {/* Detail / Edit Modal */}
      {selectedAuthority && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => { setSelectedAuthority(null); setIsEditing(false); }}>
          <div className="bg-white rounded-2xl w-[440px] shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">{isEditing ? "Edit Authority" : "Authority Details"}</h2>
              <div className="flex gap-2">
                {!isEditing && (
                  <button onClick={() => handleEdit(selectedAuthority)} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs hover:bg-blue-100">Edit</button>
                )}
                <button onClick={() => { setSelectedAuthority(null); setIsEditing(false); }} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 text-gray-500">✕</button>
              </div>
            </div>

            {isEditing && editData ? (
              <div className="space-y-3">
                {[
                  { label: "Name", key: "name" },
                  { label: "Zone", key: "zone" },
                  { label: "Contact", key: "contact" },
                  { label: "Email", key: "email" },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <p className="text-xs text-gray-400 mb-1">{label}</p>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                      value={editData[key as keyof Authority] as string}
                      onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                    />
                  </div>
                ))}
                <div>
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value as "Active" | "Inactive" })}
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={handleSaveEdit} className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">Save</button>
                  <button onClick={() => setIsEditing(false)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Authority Name</p>
                  <p className="font-semibold text-gray-800">{selectedAuthority.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Zone", value: selectedAuthority.zone },
                    { label: "Category", value: selectedAuthority.category },
                    { label: "Contact", value: selectedAuthority.contact },
                    { label: "Email", value: selectedAuthority.email },
                    { label: "Assigned Reports", value: selectedAuthority.assignedReports },
                    { label: "Resolved Reports", value: selectedAuthority.resolvedReports },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">{label}</p>
                      <p className="font-medium text-gray-700 text-sm">{value}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleDelete(selectedAuthority.id)}
                  className="w-full py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 mt-2"
                >
                  Delete Authority
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Authority Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl w-[420px] shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Add New Authority</h2>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 text-gray-500">✕</button>
            </div>
            <div className="space-y-3">
              {[
                { label: "Authority Name", key: "name", placeholder: "e.g. Ward B BMC" },
                { label: "Zone", key: "zone", placeholder: "e.g. Mumbai" },
                { label: "Contact", key: "contact", placeholder: "+91 98765 43210" },
                { label: "Email", key: "email", placeholder: "authority@gov.in" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                    placeholder={placeholder}
                    value={newAuthority[key as keyof typeof newAuthority]}
                    onChange={(e) => setNewAuthority({ ...newAuthority, [key]: e.target.value })}
                  />
                </div>
              ))}
              <div>
                <p className="text-xs text-gray-400 mb-1">Category</p>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                  value={newAuthority.category}
                  onChange={(e) => setNewAuthority({ ...newAuthority, category: e.target.value })}
                >
                  {["Municipal", "Police", "Traffic", "Water"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAddAuthority}
                className="w-full py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 mt-2"
              >
                Add Authority
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}