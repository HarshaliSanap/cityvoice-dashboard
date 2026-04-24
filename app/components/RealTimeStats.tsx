"use client";

import { useEffect, useState } from "react";
import { Users, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import StatsCard from "./StatsCards";
import { subscribeToStats } from "@/lib/services/dataService";

export default function RealTimeStats() {
  const [stats, setStats] = useState({
    users: 0,
    posts: 0,
    replies: 0,
    pending: 0
  });

  useEffect(() => {
    // Subscribe to real-time updates from Firebase
    subscribeToStats((newStats) => {
      setStats(newStats);
    });
  }, []);

  return (
    <div className="flex gap-4">
      <StatsCard 
        title="Total Users"      
        value={stats.users} 
        icon={Users}         
        color="bg-blue-500" 
      />
      <StatsCard 
        title="Active Reports (Posts)"   
        value={stats.posts}   
        icon={MessageSquare} 
        color="bg-orange-500" 
      />
      <StatsCard 
        title="Total Replies" 
        value={stats.replies}   
        icon={CheckCircle}   
        color="bg-green-600" 
      />
      <StatsCard 
        title="Pending Reports"  
        value={stats.pending}   
        icon={XCircle}       
        color="bg-red-400" 
      />
    </div>
  );
}
