import { ref, onValue, get, push, update, remove } from "firebase/database";
import { db } from "../firebase";

export const getStats = async () => {
  const stats = { users: 0, posts: 0, replies: 0, pending: 0 };
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
  onValue(ref(db, 'replies'), (snapshot) => {
    callback(snapshot.val() || {});
  });
};

export const subscribeToPosts = (callback: (posts: any[]) => void) => {
  onValue(ref(db, 'posts'), (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const postsArray = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      callback(postsArray);
    } else {
      callback([]);
    }
  });
};

export const subscribeToUsers = (callback: (users: any[]) => void) => {
  onValue(ref(db, 'users'), (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const usersArray = Object.keys(data).map(key => ({
        id: key,
        ...data[key],
        initial: (data[key].name || "U").charAt(0).toUpperCase(),
        color: "bg-blue-500"
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
      const date = new Date(p.timestamp.replace(' ', 'T'));
      if (date.getFullYear() === currentYear) {
        const monthIndex = date.getMonth();
        chartData[monthIndex].new++;
        if (p.replies > 0) {
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
    const repliesRef = ref(db, `replies/${postId}`);
    await push(repliesRef, {
      name: adminName,
      text: text,
      timestamp: new Date().toISOString(),
      uid: "admin_id" 
    });
    
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
  onValue(ref(db, 'admin_settings'), (snapshot) => {
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
    await update(ref(db, 'admin_settings'), { [key]: value });
    return true;
  } catch (error) {
    console.error("Error updating setting:", error);
    return false;
  }
};

export const subscribeToAuthorities = (callback: (authorities: any[]) => void) => {
  onValue(ref(db, 'authorities'), (snapshot) => {
    const data = snapshot.val();
    const list = data ? Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })) : [];
    callback(list);
  });
};

export const updateAuthority = async (id: string, name: string) => {
  try {
    await update(ref(db, `authorities/${id}`), { name });
    return true;
  } catch (error) {
    console.error("Error updating authority:", error);
    return false;
  }
};

export const deletePost = async (id: string) => {
  try {
    await remove(ref(db, `posts/${id}`));
    await remove(ref(db, `replies/${id}`));
    return true;
  } catch (error) {
    console.error("Error deleting post:", error);
    return false;
  }
};
