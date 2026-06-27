"use client";

import { useState, useEffect } from "react";
import { subscribeToPostsWithUsers, subscribeToUsers, getChartData } from "../services/dataService";

type DashboardPost = {
  id: string;
  authorBlocked?: boolean;
  authorUserId?: string;
  category?: string;
  description?: string;
  image_url?: string;
  location?: string;
  name?: string;
  replies?: number;
  status?: string;
  supports?: number;
  timestamp?: string;
  uid?: string;
};

type DashboardUser = {
  id: string;
  avatar?: string;
  blocked?: boolean;
  email?: string;
  image_url?: string;
  name?: string;
  photo?: string;
  photoURL?: string;
  profileImage?: string;
  profileImageUrl?: string;
};

type DashboardChartPoint = {
  month: string;
  new: number;
  pending: number;
  inReview: number;
  escalated: number;
  rejected: number;
  resolved: number;
  newUsers: number;
  activeUsers: number;
};

export const useDashboardData = () => {
  const [posts, setPosts] = useState<DashboardPost[]>([]);
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [chartData, setChartData] = useState<DashboardChartPoint[]>([]);

  useEffect(() => {
    let currentPosts: DashboardPost[] = [];
    let currentUsers: DashboardUser[] = [];

    const updateCharts = () => {
      setChartData(getChartData(currentPosts, currentUsers) as DashboardChartPoint[]);
    };

    const unsubscribePosts = subscribeToPostsWithUsers((newPosts) => {
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
      unsubscribePosts?.();
      unsubscribeUsers?.();
    };
  }, []);

  return { posts, reports: posts, users, chartData };
};
