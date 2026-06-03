import { ref, onValue, get, push, update, remove, runTransaction } from "firebase/database";
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
      stats.pending = Object.values(postsData).filter((p: any) => !p.status || p.status === "Pending").length;
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

  const unsubscribeUsers = onValue(usersRef, (snapshot) => {
    stats.users = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
    updateStats();
  });

  const unsubscribePosts = onValue(postsRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      stats.posts = Object.keys(data).length;
      stats.pending = Object.values(data).filter((p: any) => !p.status || p.status === "Pending").length;
    } else {
      stats.posts = 0;
      stats.pending = 0;
    }
    updateStats();
  });

  const unsubscribeReplies = onValue(repliesRef, (snapshot) => {
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

  return () => {
    unsubscribeUsers();
    unsubscribePosts();
    unsubscribeReplies();
  };
};

export const subscribeToReplies = (callback: (replies: any) => void) => {
  return onValue(ref(db, 'replies'), (snapshot) => {
    callback(snapshot.val() || {});
  });
};

export const subscribeToPosts = (callback: (posts: any[]) => void) => {
  return onValue(ref(db, 'posts'), (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const postsArray = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      callback(postsArray);
    } else {
      callback([]);
    }
  });
};

const buildUserIndexes = (users: any[]) => {
  const usersById: Record<string, any> = {};
  const usersByName: Record<string, any> = {};

  users.forEach((user) => {
    usersById[user.id] = user;
    if (user.name) usersByName[user.name] = user;
  });

  return { usersById, usersByName };
};

const enrichPostWithUser = (post: any, usersById: Record<string, any>, usersByName: Record<string, any>) => {
  const user = (post.uid && usersById[post.uid]) || (post.name && usersByName[post.name]) || null;

  return {
    ...post,
    authorBlocked: Boolean(user?.blocked),
    authorBlockedAt: user?.blockedAt || null,
    authorAddress: user?.address || null,
    authorEmail: user?.email || post.email || null,
    authorLocation: user?.address || user?.location || post.location || null,
    authorName: user?.name || post.name || "Anonymous",
    authorPhone: user?.phone || user?.phoneNumber || user?.mobile || null,
    authorPincode: user?.pincode || null,
    authorProfileStatus: user?.accountStatus || user?.status || (user?.blocked ? "blocked" : "active"),
    authorUserId: user?.id || post.uid || null,
  };
};

export const subscribeToUsers = (callback: (users: any[]) => void) => {
  return onValue(ref(db, 'users'), (snapshot) => {
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

export const subscribeToPostsWithUsers = (callback: (posts: any[]) => void) => {
  let latestPosts: any[] = [];
  let latestUsers: any[] = [];

  const updatePosts = () => {
    const { usersById, usersByName } = buildUserIndexes(latestUsers);
    callback(latestPosts.map((post) => enrichPostWithUser(post, usersById, usersByName)));
  };

  const unsubscribePosts = subscribeToPosts((posts) => {
    latestPosts = posts;
    updatePosts();
  });

  const unsubscribeUsers = subscribeToUsers((users) => {
    latestUsers = users;
    updatePosts();
  });

  return () => {
    unsubscribePosts?.();
    unsubscribeUsers?.();
  };
};

const normalizePostReport = (
  reportId: string,
  postId: string,
  report: any,
  usersById: Record<string, any>,
  usersByName: Record<string, any>
) => {
  const reporterId = report.uid || report.userId || report.reporterId || report.reportedByUid || report.reportedBy || null;
  const reporterName = report.name || report.reporterName || report.userName || report.reportedByName || "";
  const reporter = (reporterId && usersById[reporterId]) || (reporterName && usersByName[reporterName]) || null;
  const issue =
    report.issue ||
    report.reason ||
    report.reportIssue ||
    report.reportReason ||
    report.reportType ||
    report.type ||
    report.category ||
    report.title ||
    "Reported post";
  const otherDetails =
    report.other ||
    report.otherReason ||
    report.otherIssue ||
    report.otherText ||
    report.customReason ||
    report.customIssue ||
    report.customText ||
    report.additionalReason ||
    report.input ||
    "";
  const details =
    report.details ||
    report.description ||
    report.text ||
    report.message ||
    report.comment ||
    report.note ||
    otherDetails ||
    "";

  return {
    id: reportId,
    postId: report.postId || postId,
    issue: String(issue).toLowerCase() === "other" && otherDetails ? `Other: ${otherDetails}` : issue,
    details,
    timestamp: report.timestamp || report.createdAt || report.reportedAt || report.date || "",
    reporterBlocked: Boolean(reporter?.blocked),
    reporterEmail: reporter?.email || report.email || report.reporterEmail || "",
    reporterId: reporter?.id || reporterId || "",
    reporterName: reporter?.name || reporterName || "Anonymous",
    reporterPhone: reporter?.phone || reporter?.phoneNumber || reporter?.mobile || report.phone || "",
    reporterPincode: reporter?.pincode || report.pincode || "",
  };
};

const normalizeAccountBlockClaim = (
  claimId: string,
  claim: any,
  usersById: Record<string, any>,
  usersByName: Record<string, any>
) => {
  const userId = claim.uid || claim.userId || claim.claimedUserId || claim.accountId || claim.reporterId || "";
  const userName = claim.name || claim.userName || claim.reporterName || claim.claimedUserName || "";
  const user = (userId && usersById[userId]) || (userName && usersByName[userName]) || null;
  const reason =
    claim.reason ||
    claim.issue ||
    claim.message ||
    claim.description ||
    claim.details ||
    claim.otherReason ||
    claim.other ||
    "User claimed their account is blocked";

  return {
    id: claimId,
    type: "account_block_claim",
    title: "Account block claim",
    description: reason,
    timestamp: claim.timestamp || claim.createdAt || claim.claimedAt || claim.date || "",
    status: claim.status || "new",
    userBlocked: Boolean(user?.blocked || claim.blocked),
    userEmail: user?.email || claim.email || claim.userEmail || "",
    userId: user?.id || userId,
    userName: user?.name || userName || "Unknown user",
    userPincode: user?.pincode || claim.pincode || "",
  };
};

const flattenPostReports = (data: any) => {
  const groupedReports: Record<string, any[]> = {};

  Object.entries(data || {}).forEach(([key, value]: [string, any]) => {
    if (!value || typeof value !== "object") return;

    if (value.postId) {
      const postId = value.postId;
      groupedReports[postId] = groupedReports[postId] || [];
      groupedReports[postId].push({ id: key, postId, ...value });
      return;
    }

    groupedReports[key] = groupedReports[key] || [];
    Object.entries(value).forEach(([reportId, report]: [string, any]) => {
      if (!report || typeof report !== "object") return;
      groupedReports[key].push({ id: reportId, postId: key, ...report });
    });
  });

  return groupedReports;
};

export const subscribeToPostReportsWithUsers = (callback: (reportsByPost: Record<string, any[]>) => void) => {
  let latestUsers: any[] = [];
  let latestEmbeddedReports: Record<string, any[]> = {};
  let latestSnakeCaseReports: Record<string, any[]> = {};
  let latestCamelCaseReports: Record<string, any[]> = {};
  let latestReportPosts: Record<string, any[]> = {};
  let latestReportedPosts: Record<string, any[]> = {};

  const updateReports = () => {
    const { usersById, usersByName } = buildUserIndexes(latestUsers);
    const mergedReports: Record<string, any[]> = {};

    [latestEmbeddedReports, latestSnakeCaseReports, latestCamelCaseReports, latestReportPosts, latestReportedPosts].forEach((source) => {
      Object.entries(source).forEach(([postId, reports]) => {
        mergedReports[postId] = mergedReports[postId] || [];
        reports.forEach((report: any) => {
          const reportId = report.id || `${postId}-${mergedReports[postId].length}`;
          if (mergedReports[postId].some((item) => item.id === reportId)) return;
          mergedReports[postId].push(normalizePostReport(reportId, postId, report, usersById, usersByName));
        });
      });
    });

    Object.keys(mergedReports).forEach((postId) => {
      mergedReports[postId].sort((a, b) => {
        const aTime = new Date((a.timestamp || "").replace(" ", "T")).getTime();
        const bTime = new Date((b.timestamp || "").replace(" ", "T")).getTime();
        return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
      });
    });

    callback(mergedReports);
  };

  const unsubscribeEmbeddedPostReports = subscribeToPosts((posts) => {
    latestEmbeddedReports = {};

    posts.forEach((post: any) => {
      if (!post.reports || typeof post.reports !== "object") return;

      latestEmbeddedReports[post.id] = Object.entries(post.reports).map(([reportId, report]: [string, any]) => ({
        id: reportId,
        postId: post.id,
        ...(report && typeof report === "object" ? report : { reason: String(report || "Reported post") }),
      }));
    });

    updateReports();
  });

  const unsubscribeSnakeCaseReports = onValue(ref(db, "post_reports"), (snapshot) => {
    latestSnakeCaseReports = flattenPostReports(snapshot.val() || {});
    updateReports();
  });

  const unsubscribeCamelCaseReports = onValue(ref(db, "postReports"), (snapshot) => {
    latestCamelCaseReports = flattenPostReports(snapshot.val() || {});
    updateReports();
  });

  const unsubscribeReportPosts = onValue(ref(db, "report_posts"), (snapshot) => {
    latestReportPosts = flattenPostReports(snapshot.val() || {});
    updateReports();
  });

  const unsubscribeReportedPosts = onValue(ref(db, "reportedPosts"), (snapshot) => {
    latestReportedPosts = flattenPostReports(snapshot.val() || {});
    updateReports();
  });

  const unsubscribeUsers = subscribeToUsers((users) => {
    latestUsers = users;
    updateReports();
  });

  return () => {
    unsubscribeSnakeCaseReports?.();
    unsubscribeCamelCaseReports?.();
    unsubscribeReportPosts?.();
    unsubscribeReportedPosts?.();
    unsubscribeEmbeddedPostReports?.();
    unsubscribeUsers?.();
  };
};

const flattenAccountBlockClaims = (data: any) => {
  const claims: any[] = [];

  Object.entries(data || {}).forEach(([key, value]: [string, any]) => {
    if (!value || typeof value !== "object") return;

    if (value.uid || value.userId || value.name || value.email || value.reason || value.message || value.type) {
      claims.push({ id: value.id || key, ...value });
      return;
    }

    Object.entries(value).forEach(([claimId, claim]: [string, any]) => {
      if (!claim || typeof claim !== "object") return;
      claims.push({
        id: claim.id || claimId,
        ...claim,
        uid: claim.uid || claim.userId || key,
      });
    });
  });

  return claims;
};

export const subscribeToAccountBlockClaims = (callback: (claims: any[]) => void) => {
  let latestUsers: any[] = [];
  let latestSnakeCaseClaims: any[] = [];
  let latestCamelCaseClaims: any[] = [];
  let latestBlockClaims: any[] = [];
  let latestBlockedAccountClaims: any[] = [];
  let latestAdminNotifications: any[] = [];
  let latestAdminNotificationsCamel: any[] = [];

  const updateClaims = () => {
    const { usersById, usersByName } = buildUserIndexes(latestUsers);
    const claimsById: Record<string, any> = {};

    [
      latestSnakeCaseClaims,
      latestCamelCaseClaims,
      latestBlockClaims,
      latestBlockedAccountClaims,
      latestAdminNotifications,
      latestAdminNotificationsCamel,
    ].forEach((source) => {
      source.forEach((claim) => {
        const isAccountBlockClaim =
          source === latestAdminNotifications || source === latestAdminNotificationsCamel
            ? String(claim.type || claim.category || claim.title || "").toLowerCase().includes("block")
            : true;
        if (!isAccountBlockClaim) return;

        const claimId = claim.id || `${claim.uid || claim.userId || "claim"}-${Object.keys(claimsById).length}`;
        if (claimsById[claimId]) return;
        claimsById[claimId] = normalizeAccountBlockClaim(claimId, claim, usersById, usersByName);
      });
    });

    const sortedClaims = Object.values(claimsById).sort((a: any, b: any) => {
      const aTime = new Date((a.timestamp || "").replace(" ", "T")).getTime();
      const bTime = new Date((b.timestamp || "").replace(" ", "T")).getTime();
      return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
    });

    callback(sortedClaims);
  };

  const unsubscribeSnakeCaseClaims = onValue(ref(db, "account_block_claims"), (snapshot) => {
    latestSnakeCaseClaims = flattenAccountBlockClaims(snapshot.val() || {});
    updateClaims();
  });

  const unsubscribeCamelCaseClaims = onValue(ref(db, "accountBlockClaims"), (snapshot) => {
    latestCamelCaseClaims = flattenAccountBlockClaims(snapshot.val() || {});
    updateClaims();
  });

  const unsubscribeBlockClaims = onValue(ref(db, "blockClaims"), (snapshot) => {
    latestBlockClaims = flattenAccountBlockClaims(snapshot.val() || {});
    updateClaims();
  });

  const unsubscribeBlockedAccountClaims = onValue(ref(db, "blocked_account_claims"), (snapshot) => {
    latestBlockedAccountClaims = flattenAccountBlockClaims(snapshot.val() || {});
    updateClaims();
  });

  const unsubscribeAdminNotifications = onValue(ref(db, "admin_notifications"), (snapshot) => {
    latestAdminNotifications = flattenAccountBlockClaims(snapshot.val() || {});
    updateClaims();
  });

  const unsubscribeAdminNotificationsCamel = onValue(ref(db, "adminNotifications"), (snapshot) => {
    latestAdminNotificationsCamel = flattenAccountBlockClaims(snapshot.val() || {});
    updateClaims();
  });

  const unsubscribeUsers = subscribeToUsers((users) => {
    latestUsers = users;
    updateClaims();
  });

  return () => {
    unsubscribeSnakeCaseClaims?.();
    unsubscribeCamelCaseClaims?.();
    unsubscribeBlockClaims?.();
    unsubscribeBlockedAccountClaims?.();
    unsubscribeAdminNotifications?.();
    unsubscribeAdminNotificationsCamel?.();
    unsubscribeUsers?.();
  };
};

export const subscribeToRepliesWithUsers = (callback: (replies: any) => void) => {
  let latestReplies: any = {};
  let latestUsers: any[] = [];

  const updateReplies = () => {
    const { usersById, usersByName } = buildUserIndexes(latestUsers);
    const enrichedReplies = Object.fromEntries(
      Object.entries(latestReplies).map(([postId, postReplies]: [string, any]) => [
        postId,
        Object.fromEntries(
          Object.entries(postReplies || {}).map(([replyId, reply]: [string, any]) => {
            const user = (reply.uid && usersById[reply.uid]) || (reply.name && usersByName[reply.name]) || null;
            return [
              replyId,
              {
                ...reply,
                userBlocked: Boolean(user?.blocked),
                userBlockedAt: user?.blockedAt || null,
                replyUserId: user?.id || reply.uid || null,
              },
            ];
          })
        ),
      ])
    );

    callback(enrichedReplies);
  };

  const unsubscribeReplies = subscribeToReplies((replies) => {
    latestReplies = replies;
    updateReplies();
  });

  const unsubscribeUsers = subscribeToUsers((users) => {
    latestUsers = users;
    updateReplies();
  });

  return () => {
    unsubscribeReplies?.();
    unsubscribeUsers?.();
  };
};

export const getChartData = (posts: any[], users: any[]) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const { usersById, usersByName } = buildUserIndexes(users);
  const activeUserSets = months.map(() => new Set<string>());

  const getPostMonthIndex = (timestamp?: string) => {
    if (!timestamp) return currentMonth;

    const parsedDate = new Date(timestamp.replace(" ", "T"));
    if (Number.isNaN(parsedDate.getTime()) || parsedDate.getFullYear() !== currentYear) {
      return currentMonth;
    }

    return parsedDate.getMonth();
  };
  
  const chartData: any[] = months.map(m => ({
    month: m,
    new: 0,
    pending: 0,
    inReview: 0,
    escalated: 0,
    rejected: 0,
    resolved: 0,
    newUsers: 0,
    activeUsers: 0
  }));

  posts.forEach(p => {
    const monthIndex = getPostMonthIndex(p.timestamp);
    const status = p.status || "Pending";

    chartData[monthIndex].new++;

    if (status === "Resolved") {
      chartData[monthIndex].resolved++;
    } else if (status === "In Review") {
      chartData[monthIndex].inReview++;
    } else if (status === "Escalated to Authority") {
      chartData[monthIndex].escalated++;
    } else if (status === "Rejected") {
      chartData[monthIndex].rejected++;
    } else {
      chartData[monthIndex].pending++;
    }

    const user = (p.uid && usersById[p.uid]) || (p.name && usersByName[p.name]) || null;
    const userKey = user?.id || p.uid || p.name;

    if (userKey && !user?.blocked) {
      activeUserSets[monthIndex].add(userKey);
    }
  });

  users.forEach(u => {
    if (!u.blocked) chartData[currentMonth].newUsers++;
  });

  activeUserSets.forEach((activeUsers, index) => {
    chartData[index].activeUsers = activeUsers.size;
  });

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
  return onValue(ref(db, 'admin_settings'), (snapshot) => {
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

export const updateSettings = async (settings: Record<string, boolean | string>) => {
  try {
    await update(ref(db, 'admin_settings'), settings);
    return true;
  } catch (error) {
    console.error("Error updating settings:", error);
    return false;
  }
};

export type AuthorityRecord = {
  id: string;
  name?: string;
  email?: string;
  address?: string;
  createdAt?: string;
};

export const subscribeToAuthorities = (callback: (authorities: AuthorityRecord[]) => void) => {
  return onValue(ref(db, 'authorities'), (snapshot) => {
    const data = snapshot.val();
    const list = data
      ? Object.entries(data as Record<string, Omit<AuthorityRecord, "id">>).map(([id, val]) => ({ id, ...val }))
      : [];
    callback(list);
  });
};

export const updateAuthority = async (id: string, authority: Partial<Omit<AuthorityRecord, "id">>) => {
  try {
    await update(ref(db, `authorities/${id}`), {
      ...authority,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error("Error updating authority:", error);
    return false;
  }
};

export const deleteAuthority = async (id: string) => {
  try {
    await remove(ref(db, `authorities/${id}`));
    return true;
  } catch (error) {
    console.error("Error deleting authority:", error);
    return false;
  }
};

export const createAuthority = async (authority: {
  name: string;
  email: string;
  address: string;
}) => {
  try {
    await push(ref(db, 'authorities'), {
      ...authority,
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error("Error creating authority:", error);
    return false;
  }
};

export const updatePostStatus = async (id: string, status: string) => {
  try {
    await update(ref(db, `posts/${id}`), {
      status,
      statusUpdatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error("Error updating post status:", error);
    return false;
  }
};

export const updatePostSupport = async (id: string, shouldSupport: boolean) => {
  try {
    const result = await runTransaction(ref(db, `posts/${id}/supports`), (currentSupports) => {
      const nextSupports = (Number(currentSupports) || 0) + (shouldSupport ? 1 : -1);
      return Math.max(0, nextSupports);
    });
    await update(ref(db, `posts/${id}`), {
      supportUpdatedAt: new Date().toISOString(),
    });
    return Number(result.snapshot.val()) || 0;
  } catch (error) {
    console.error("Error updating post support:", error);
    return null;
  }
};

export const updatePostAuthorityEscalation = async (id: string, authority: AuthorityRecord) => {
  try {
    await update(ref(db, `posts/${id}`), {
      status: "Escalated to Authority",
      authorityId: authority.id,
      authorityName: authority.name || "",
      authorityEmail: authority.email || "",
      authoritySentAt: new Date().toISOString(),
      statusUpdatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error("Error updating post authority escalation:", error);
    return false;
  }
};

export const updateUserBlocked = async (id: string, blocked: boolean) => {
  try {
    const timestamp = new Date().toISOString();
    await update(ref(db, `users/${id}`), {
      blocked,
      accountStatus: blocked ? "blocked" : "active",
      status: blocked ? "blocked" : "active",
      blockedAt: blocked ? timestamp : null,
      unblockedAt: blocked ? null : timestamp,
      blockUpdatedAt: timestamp,
    });
    return true;
  } catch (error) {
    console.error("Error updating user block status:", error);
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
