import { ref, onValue, get } from "firebase/database";
import { db } from "../firebase";

export const getStats = async () => {
  const stats = {
    users: 0,
    posts: 0,
    replies: 0,
    pending: 0
  };

  try {
    const usersSnapshot = await get(ref(db, 'users'));
    const postsSnapshot = await get(ref(db, 'posts'));
    const repliesSnapshot = await get(ref(db, 'replies'));

    if (usersSnapshot.exists()) {
      stats.users = Object.keys(usersSnapshot.val()).length;
    }
    if (postsSnapshot.exists()) {
      const postsData = postsSnapshot.val();
      stats.posts = Object.keys(postsData).length;
      // Count pending (0 replies)
      stats.pending = Object.values(postsData).filter((p: any) => !p.replies || p.replies === 0).length;
    }
    if (repliesSnapshot.exists()) {
      const data = repliesSnapshot.val();
      let total = 0;
      Object.values(data).forEach((postReplies: any) => {
        total += Object.keys(postReplies).length;
      });
      stats.replies = total;
    }
  } catch (error) {
    console.error("Error fetching stats:", error);
  }

  return stats;
};

export const subscribeToStats = (callback: (stats: any) => void) => {
  const usersRef = ref(db, 'users');
  const postsRef = ref(db, 'posts');
  const repliesRef = ref(db, 'replies');

  let stats = { users: 0, posts: 0, replies: 0, pending: 0 };

  const updateStats = () => callback({ ...stats });

  onValue(usersRef, (snapshot) => {
    stats.users = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
    updateStats();
  });

  onValue(postsRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      stats.posts = Object.keys(data).length;
      stats.pending = Object.values(data).filter((p: any) => !p.replies || p.replies === 0).length;
    } else {
      stats.posts = 0;
      stats.pending = 0;
    }
    updateStats();
  });

  onValue(repliesRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      let total = 0;
      Object.values(data).forEach((postReplies: any) => {
        total += Object.keys(postReplies).length;
      });
      stats.replies = total;
    } else {
      stats.replies = 0;
    }
    updateStats();
  });
};

export const subscribeToReplies = (callback: (replies: any) => void) => {
  const repliesRef = ref(db, 'replies');
  onValue(repliesRef, (snapshot) => {
    callback(snapshot.val() || {});
  });
};

export const subscribeToPosts = (callback: (posts: any[]) => void) => {
  const postsRef = ref(db, 'posts');

  onValue(postsRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const postsArray = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      // Sort by timestamp if available, otherwise just return the last few
      callback(postsArray.slice(-5).reverse());
    } else {
      callback([]);
    }
  });
};

export const subscribeToUsers = (callback: (users: any[]) => void) => {
  const usersRef = ref(db, 'users');

  onValue(usersRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const usersArray = Object.keys(data).map(key => ({
        id: key,
        ...data[key],
        // Generate fallback values if missing
        initial: (data[key].name || "U").charAt(0).toUpperCase(),
        color: "bg-blue-500" // Default color
      }));
      callback(usersArray);
    } else {
      callback([]);
    }
  });
};

export const getChartData = (posts: any[], users: any[]) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentYear = new Date().getFullYear();
  
  const chartData: any[] = months.map(m => ({
    month: m,
    new: 0,
    resolved: 0,
    pending: 0,
    newUsers: 0,
    activeUsers: 0
  }));

  posts.forEach(p => {
    if (p.timestamp) {
      const date = new Date(p.timestamp.split(' ')[0]);
      if (date.getFullYear() === currentYear) {
        const monthIndex = date.getMonth();
        chartData[monthIndex].new++;
        if (p.status === "Resolved" || p.replies) {
          chartData[monthIndex].resolved++;
        } else {
          chartData[monthIndex].pending++;
        }
      }
    }
  });

  users.forEach(u => {
    chartData[new Date().getMonth()].newUsers++;
    if (u.voices > 0) chartData[new Date().getMonth()].activeUsers++;
  });

  const currentMonth = new Date().getMonth();
  return chartData.slice(Math.max(0, currentMonth - 5), currentMonth + 1);
};

export const sendReply = async (postId: string, text: string, adminName: string = "Admin") => {
  try {
    const { push, update } = require("firebase/database");
    const repliesRef = ref(db, `replies/${postId}`);
    await push(repliesRef, {
      name: adminName,
      text: text,
      timestamp: new Date().toISOString(),
      uid: "admin_id" 
    });
    
    // Also update the replies count in the post itself
    const postRef = ref(db, `posts/${postId}`);
    const postSnapshot = await get(postRef);
    if (postSnapshot.exists()) {
      const currentReplies = postSnapshot.val().replies || 0;
      await update(postRef, { replies: currentReplies + 1 });
    }
    
    return true;
  } catch (error) {
    console.error("Error sending reply:", error);
    return false;
  }
};

export const subscribeToSettings = (callback: (settings: any) => void) => {
  const settingsRef = ref(db, 'admin_settings');
  onValue(settingsRef, (snapshot) => {
    const defaultSettings = {
      darkMode: false,
      realTimeUpdates: true,
      emailAlerts: true,
      desktopNotifications: false
    };
    callback(snapshot.val() || defaultSettings);
  });
};

export const updateSetting = async (key: string, value: boolean) => {
  try {
    const { update } = require("firebase/database");
    const settingsRef = ref(db, 'admin_settings');
    await update(settingsRef, { [key]: value });
    return true;
  } catch (error) {
    console.error("Error updating setting:", error);
    return false;
  }
};
