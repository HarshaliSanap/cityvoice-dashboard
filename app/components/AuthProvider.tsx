"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import {
  getAdminProfile,
  getCreatableRolesForRole,
  getDashboardPathForRole,
  hasRoleAtLeast,
  isOtpVerifiedForSession,
  watchAuthState,
  type AdminProfile,
} from "@/lib/services/authService";

type AuthContextValue = {
  firebaseUser: User | null;
  adminProfile: AdminProfile | null;
  isLoading: boolean;
  isDeveloper: boolean;
  isSuperAdmin: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  adminProfile: null,
  isLoading: true,
  isDeveloper: false,
  isSuperAdmin: false,
});

const publicRoutes = ["/login"];

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isPublicRoute = publicRoutes.includes(pathname);
  const isOtpVerified = firebaseUser ? isOtpVerifiedForSession(firebaseUser.uid) : false;

  useEffect(() => {
    const unsubscribe = watchAuthState(async (user) => {
      setFirebaseUser(user);

      if (!user) {
        setAdminProfile(null);
        setIsLoading(false);
        if (!isPublicRoute) router.replace("/login");
        return;
      }

      const profile = await getAdminProfile(user.uid);
      const otpVerified = isOtpVerifiedForSession(user.uid);
      setAdminProfile(profile);
      setIsLoading(false);

      if (!profile && !isPublicRoute) {
        router.replace("/login");
        return;
      }

      if (profile && !otpVerified && !isPublicRoute) {
        router.replace("/login");
        return;
      }

      if (profile && otpVerified && pathname === "/") {
        router.replace(getDashboardPathForRole(profile.role));
        return;
      }

      if (profile && otpVerified && pathname === "/developer-dashboard" && profile.role !== "developer") {
        router.replace(getDashboardPathForRole(profile.role));
        return;
      }

      if (profile && otpVerified && pathname === "/super-admin-dashboard" && !hasRoleAtLeast(profile.role, "super_admin")) {
        router.replace(getDashboardPathForRole(profile.role));
        return;
      }

      if (profile && otpVerified && pathname === "/signup" && getCreatableRolesForRole(profile.role).length === 0) {
        router.replace(getDashboardPathForRole(profile.role));
        return;
      }

      if (isPublicRoute && profile && otpVerified) router.replace(getDashboardPathForRole(profile.role));
    });

    return () => unsubscribe();
  }, [isPublicRoute, pathname, router]);

  const value = useMemo(
    () => ({
      firebaseUser,
      adminProfile,
      isLoading,
      isDeveloper: adminProfile?.role === "developer",
      isSuperAdmin: hasRoleAtLeast(adminProfile?.role, "super_admin"),
    }),
    [adminProfile, firebaseUser, isLoading]
  );

  if (isLoading && !isPublicRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="rounded-2xl border border-gray-100 bg-white px-6 py-5 text-sm font-semibold text-gray-600 shadow-sm">
          Loading CityVoice admin...
        </div>
      </div>
    );
  }

  if (!isPublicRoute && (!firebaseUser || !adminProfile || !isOtpVerified)) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
