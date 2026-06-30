"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { get, onValue, push, ref, remove, set, update } from "firebase/database";
import { auth, db } from "../firebase";

export type AdminRole = "developer" | "super_admin" | "admin";

export type AdminProfile = {
  uid: string;
  name: string;
  email: string;
  role: AdminRole;
  status: "active" | "disabled";
  created_by?: string;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
};

export type AdminLoginRecord = {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: AdminRole;
  loggedAt: string;
};

const adminProfilesPath = "admin_profiles";
const adminLoginHistoryPath = "admin_login_history";
const usersPath = "users";

const roleRanks: Record<AdminRole, number> = {
  admin: 1,
  super_admin: 2,
  developer: 3,
};

export const getAdminRoleLabel = (role: AdminRole) => {
  if (role === "developer") return "Developer";
  if (role === "super_admin") return "Super Admin";
  return "Admin";
};

export const hasRoleAtLeast = (role: AdminRole | undefined, minimumRole: AdminRole) => {
  if (!role) return false;
  return roleRanks[role] >= roleRanks[minimumRole];
};

export const getDashboardPathForRole = (role: AdminRole) => {
  if (role === "developer") return "/developer-dashboard";
  if (role === "super_admin") return "/super-admin-dashboard";
  return "/admin-dashboard";
};

export const getCreatableRolesForRole = (role?: AdminRole): AdminRole[] => {
  if (role === "developer") return ["super_admin", "admin"];
  if (role === "super_admin") return ["admin"];
  return [];
};

export const canManageAdminProfile = (actorRole: AdminRole | undefined, targetRole: AdminRole) => {
  return getCreatableRolesForRole(actorRole).includes(targetRole);
};

const normalizeRole = (role: unknown): AdminRole => {
  if (role === "developer") return "developer";
  if (role === "super_admin") return "super_admin";
  return "admin";
};

const otpSessionKey = (uid: string) => `cityvoice-admin-otp-verified-${uid}`;

export const isOtpVerifiedForSession = (uid: string) => {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(otpSessionKey(uid)) === "true";
};

export const markOtpVerifiedForSession = (uid: string) => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(otpSessionKey(uid), "true");
};

export const clearOtpVerifiedForSession = (uid?: string | null) => {
  if (typeof window === "undefined" || !uid) return;
  window.sessionStorage.removeItem(otpSessionKey(uid));
};

const getFriendlyAuthError = (error: unknown) => {
  if (!(error instanceof FirebaseError)) {
    return error instanceof Error ? error.message : "Authentication failed. Please try again.";
  }

  const messages: Record<string, string> = {
    "auth/email-already-in-use": "This email already has an admin account. Please login instead.",
    "auth/invalid-credential": "Invalid email or password.",
    "auth/user-not-found": "No admin account exists for this email.",
    "auth/wrong-password": "Invalid email or password.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/network-request-failed": "Network error while connecting to Firebase. Please try again.",
  };

  return messages[error.code] || "Authentication failed. Please try again.";
};

export const watchAuthState = (callback: (user: User | null) => void) => onAuthStateChanged(auth, callback);

export const getAdminProfile = async (uid: string) => {
  let snapshot = await get(ref(db, `${adminProfilesPath}/${uid}`));
  if (!snapshot.exists()) {
    snapshot = await get(ref(db, `${usersPath}/${uid}`));
  }
  if (!snapshot.exists()) return null;

  const profile = snapshot.val() as Partial<AdminProfile>;
  return {
    uid,
    name: profile.name || "Admin",
    email: profile.email || "",
    role: normalizeRole(profile.role),
    status: profile.status || "active",
    created_by: profile.created_by,
    createdAt: profile.createdAt || new Date().toISOString(),
    updatedAt: profile.updatedAt,
    lastLoginAt: profile.lastLoginAt,
  } satisfies AdminProfile;
};

const recordLogin = async (profile: AdminProfile) => {
  const loggedAt = new Date().toISOString();
  await update(ref(db, `${adminProfilesPath}/${profile.uid}`), { lastLoginAt: loggedAt });
  await push(ref(db, adminLoginHistoryPath), {
    uid: profile.uid,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    loggedAt,
  });
};

export const loginAdmin = async (email: string, password: string) => {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const profile = await getAdminProfile(credential.user.uid);

    if (!profile) {
      await signOut(auth);
      throw new Error("This account is not registered as a CityVoice admin.");
    }

    if (profile.status === "disabled") {
      await signOut(auth);
      throw new Error("This admin account is disabled.");
    }

    return profile;
  } catch (error) {
    throw new Error(getFriendlyAuthError(error));
  }
};

export const completeAdminLogin = async (profile: AdminProfile) => {
  await recordLogin(profile);
  markOtpVerifiedForSession(profile.uid);
};

export const verifyAdminOtp = async (uid: string, code: string) => {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) {
    throw new Error("Your login session expired. Please login again.");
  }

  const response = await fetch("/api/verify-admin-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, code, idToken }),
  });
  const data = (await response.json()) as { error?: string };

  if (!response.ok) {
    throw new Error(data.error || "Unable to verify OTP. Please try again.");
  }
};

export const getCurrentUserIdToken = async () => {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Your login session expired. Please login again.");
  return idToken;
};

export const signupAdmin = async (payload: {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  createdBy?: string;
}) => {
  try {
    let uid = "";

    if (auth.currentUser && payload.createdBy) {
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      if (!apiKey) throw new Error("Firebase API key is missing.");

      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: payload.email,
          password: payload.password,
          displayName: payload.name,
          returnSecureToken: false,
        }),
      });
      const data = (await response.json()) as { localId?: string; error?: { message?: string } };

      if (!response.ok || !data.localId) {
        throw new Error(data.error?.message === "EMAIL_EXISTS" ? "This email already has an admin account." : "Unable to create Firebase Auth user.");
      }

      uid = data.localId;
    } else {
      const credential = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
      await updateProfile(credential.user, { displayName: payload.name });
      uid = credential.user.uid;
    }

    const now = new Date().toISOString();

    const profile: AdminProfile = {
      uid,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      status: "active",
      created_by: payload.createdBy,
      createdAt: now,
      updatedAt: now,
    };

    await set(ref(db, `${adminProfilesPath}/${uid}`), profile);
    await set(ref(db, `${usersPath}/${uid}`), {
      id: uid,
      name: profile.name,
      email: profile.email,
      password: "managed-by-firebase-auth",
      role: profile.role,
      created_by: profile.created_by || "",
      created_at: profile.createdAt,
      updated_at: profile.updatedAt,
    });
    return profile;
  } catch (error) {
    throw new Error(getFriendlyAuthError(error));
  }
};

export const updateAdminAccount = async (
  uid: string,
  payload: {
    name: string;
    role: AdminRole;
    status: AdminProfile["status"];
  }
) => {
  const updatedAt = new Date().toISOString();
  await update(ref(db, `${adminProfilesPath}/${uid}`), {
    name: payload.name,
    role: payload.role,
    status: payload.status,
    updatedAt,
  });
  await update(ref(db, `${usersPath}/${uid}`), {
    name: payload.name,
    role: payload.role,
    status: payload.status,
    updated_at: updatedAt,
  });
};

export const deleteAdminAccount = async (uid: string) => {
  const updatedAt = new Date().toISOString();
  await update(ref(db, `${adminProfilesPath}/${uid}`), {
    status: "disabled",
    deletedAt: updatedAt,
    updatedAt,
  });
  await update(ref(db, `${usersPath}/${uid}`), {
    status: "disabled",
    deleted_at: updatedAt,
    updated_at: updatedAt,
  });
};

export const logoutAdmin = async () => {
  clearOtpVerifiedForSession(auth.currentUser?.uid);
  await signOut(auth);
};

export const subscribeToAdminProfiles = (callback: (profiles: AdminProfile[]) => void) => {
  return onValue(ref(db, adminProfilesPath), (snapshot) => {
    const data = snapshot.val() || {};
    callback(
      Object.entries(data).map(([uid, value]) => {
        const profile = value as Partial<AdminProfile>;
        return {
          uid,
          name: profile.name || "Admin",
          email: profile.email || "",
          role: normalizeRole(profile.role),
          status: profile.status || "active",
          created_by: profile.created_by,
          createdAt: profile.createdAt || "",
          updatedAt: profile.updatedAt,
          lastLoginAt: profile.lastLoginAt,
        };
      })
    );
  });
};

export const subscribeToAdminLoginHistory = (callback: (records: AdminLoginRecord[]) => void) => {
  return onValue(ref(db, adminLoginHistoryPath), (snapshot) => {
    const data = snapshot.val() || {};
    const records = Object.entries(data)
      .map(([id, value]) => {
        const record = value as Partial<AdminLoginRecord>;
        return {
          id,
          uid: record.uid || "",
          name: record.name || "Admin",
          email: record.email || "",
          role: normalizeRole(record.role),
          loggedAt: record.loggedAt || "",
        };
      })
      .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());

    callback(records);
  });
};

export const clearAdminLoginHistory = async () => {
  await remove(ref(db, adminLoginHistoryPath));
};
