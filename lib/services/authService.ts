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
import { get, onValue, push, ref, set, update } from "firebase/database";
import { auth, db } from "../firebase";

export type AdminRole = "super_admin" | "admin";

export type AdminProfile = {
  uid: string;
  name: string;
  email: string;
  role: AdminRole;
  status: "active" | "disabled";
  createdAt: string;
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

const normalizeRole = (role: unknown): AdminRole => (role === "super_admin" ? "super_admin" : "admin");

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
  const snapshot = await get(ref(db, `${adminProfilesPath}/${uid}`));
  if (!snapshot.exists()) return null;

  const profile = snapshot.val() as Partial<AdminProfile>;
  return {
    uid,
    name: profile.name || "Admin",
    email: profile.email || "",
    role: normalizeRole(profile.role),
    status: profile.status || "active",
    createdAt: profile.createdAt || new Date().toISOString(),
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

    await recordLogin(profile);
    return profile;
  } catch (error) {
    throw new Error(getFriendlyAuthError(error));
  }
};

export const signupAdmin = async (payload: {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
}) => {
  try {
    const credential = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
    await updateProfile(credential.user, { displayName: payload.name });

    const profile: AdminProfile = {
      uid: credential.user.uid,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      status: "active",
      createdAt: new Date().toISOString(),
    };

    await set(ref(db, `${adminProfilesPath}/${credential.user.uid}`), profile);
    await recordLogin(profile);
    return profile;
  } catch (error) {
    throw new Error(getFriendlyAuthError(error));
  }
};

export const logoutAdmin = () => signOut(auth);

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
          createdAt: profile.createdAt || "",
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
