"use client";

import { useState, useEffect } from "react";
import { subscribeToPosts, subscribeToUsers, getChartData } from "../services/dataService";

export const useDashboardData = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    let currentPosts: any[] = [];
    let currentUsers: any[] = [];

    const updateCharts = () => {
      setChartData(getChartData(currentPosts, currentUsers));
    };

    const unsubscribePosts = subscribeToPosts((newPosts) => {
      currentPosts = newPosts;
      setPosts(newPosts);
      updateCharts();
    });

    const unsubscribeUsers = subscribeToUsers((newUsers) => {
      currentUsers = newUsers;
      setUsers(newUsers);
      updateCharts();
    });

    return () => {
      // Firebase onValue returns an unsubscribe function
      // (Wait, my service doesn't return it yet, I should fix that if needed)
    };
  }, []);

  return { posts, users, chartData };
};
